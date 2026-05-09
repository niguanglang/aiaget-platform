from __future__ import annotations

import asyncio
import json
import time
import urllib.error
import urllib.request
from typing import Any

from app.runtime.contracts import (
    AgentGraphState,
    RuntimeConversationRequest,
    RuntimeConversationResponse,
    RuntimeConversationStep,
    RuntimeModelCallSummary,
)
from app.runtime.helpers import (
    build_assistant_message,
    build_anthropic_messages_url,
    build_anthropic_payload,
    build_azure_chat_url,
    build_chat_url,
    build_model_messages,
    build_tool_step_summary,
    build_traceparent,
    calculate_model_cost,
    call_control_api_retrieve,
    call_control_api_tool,
    chunk_text,
    create_span_id,
    elapsed_ms,
    estimate_messages_tokens,
    estimate_tokens,
    extract_anthropic_completion_text,
    extract_anthropic_stream_delta,
    extract_anthropic_usage,
    extract_anthropic_usage_from_stream,
    extract_completion_text,
    extract_provider_error,
    extract_response_model,
    extract_stream_delta,
    extract_usage,
    extract_usage_from_stream,
    parse_provider_sse_event,
    preview_messages,
    render_prompt_messages,
    resolve_parent_span_id,
    resolve_trace_id,
    safe_json,
    select_runtime_tool,
    with_runtime_context,
)


OPENAI_COMPATIBLE_PROVIDER_TYPES = {"OPENAI_COMPATIBLE", "DEEPSEEK", "QWEN", "MOONSHOT", "LOCAL"}
SUPPORTED_PROVIDER_TYPES = OPENAI_COMPATIBLE_PROVIDER_TYPES | {"AZURE_OPENAI", "ANTHROPIC"}
STREAM_END = object()

try:
    from langgraph.graph import END, StateGraph
except ImportError:  # pragma: no cover - local dev fallback when dependencies are not installed yet.
    END = None
    StateGraph = None


agent_graph = None


async def build_runtime_response(request: RuntimeConversationRequest) -> RuntimeConversationResponse:
    state = await run_agent_graph(request)

    return RuntimeConversationResponse(
        trace_id=state.get("trace_id", resolve_trace_id(request)),
        status=state.get("status", "SUCCESS"),
        assistant_message=state.get("assistant_message", ""),
        request_model=state.get("request_model", "langgraph-runtime-deterministic"),
        prompt_tokens=state.get("prompt_tokens", 0),
        completion_tokens=state.get("completion_tokens", 0),
        total_tokens=state.get("total_tokens", 0),
        latency_ms=state.get("latency_ms", 0),
        steps=state.get("steps", []),
        references=state.get("references", request.references),
        tool_calls=state.get("tool_calls", request.tool_calls),
        model_call=state.get("model_call"),
        error_message=state.get("error_message"),
    )


async def stream_runtime_response_events(request: RuntimeConversationRequest):
    state = await run_agent_streaming_prelude(request)
    runtime_request = with_runtime_context(request, state)
    trace_id = state["trace_id"]
    references = state.get("references", request.references)
    tool_calls = state.get("tool_calls", request.tool_calls)
    steps = state.get("steps", []).copy()

    yield {
        "event": "start",
        "data": {
            "type": "start",
            "trace_id": trace_id,
            "request_model": state.get("request_model", "langgraph-runtime-deterministic"),
            "steps": [step.model_dump(mode="json") for step in steps],
            "references": [reference.model_dump(mode="json") for reference in references],
            "tool_calls": [tool_call.model_dump(mode="json") for tool_call in tool_calls],
        },
    }

    if runtime_request.runtime_model_config:
        model_result: RuntimeModelCallSummary | None = None
        async for item in stream_model_provider_chat(runtime_request, trace_id):
            if item["type"] == "delta":
                yield {"event": "delta", "data": {"type": "delta", "delta": item["delta"]}}
            elif item["type"] == "model_call":
                model_result = item["model_call"]

        if model_result is None:
            model_result = build_deterministic_model_result(runtime_request, time.time(), trace_id)
    else:
        model_result = build_deterministic_model_result(runtime_request, time.time(), trace_id)
        output_text = model_result.response_summary.get("output_text")
        for chunk in chunk_text(output_text if isinstance(output_text, str) else ""):
            yield {"event": "delta", "data": {"type": "delta", "delta": chunk}}
            await asyncio.sleep(0.012)

    cost_total = calculate_model_cost(request.runtime_model_config, model_result)
    model_span_id = create_span_id()
    steps.append(
        RuntimeConversationStep(
            id="model",
            type="response",
            title="LangGraph 模型执行",
            status="done" if model_result.status == "SUCCESS" else "failed",
            summary="Runtime 已完成模型调用。" if model_result.status == "SUCCESS" else model_result.error_message or "模型调用失败。",
            trace_id=trace_id,
            span_id=model_span_id,
            parent_span_id=state.get("span_id"),
            request_model=model_result.request_model,
            latency_ms=model_result.latency_ms,
            prompt_tokens=model_result.prompt_tokens,
            completion_tokens=model_result.completion_tokens,
            total_tokens=model_result.total_tokens,
            cost_total=cost_total,
        )
    )

    assistant_message = model_result.response_summary.get("output_text")
    if not isinstance(assistant_message, str) or not assistant_message:
        assistant_message = (
            f"当前 Runtime 模型调用失败：{model_result.error_message}"
            if model_result.error_message
            else build_assistant_message(request)
        )

    response_span_id = create_span_id()
    steps.append(
        RuntimeConversationStep(
            id="response",
            type="response",
            title="LangGraph 响应收口",
            status="done" if model_result.status == "SUCCESS" else "skipped",
            summary="已生成结构化回复并返回运行元数据。",
            trace_id=trace_id,
            span_id=response_span_id,
            parent_span_id=state.get("span_id"),
            item_count=len(assistant_message),
        )
    )

    response = RuntimeConversationResponse(
        trace_id=trace_id,
        status=model_result.status,
        assistant_message=assistant_message,
        request_model=model_result.request_model,
        prompt_tokens=model_result.prompt_tokens,
        completion_tokens=model_result.completion_tokens,
        total_tokens=model_result.total_tokens,
        latency_ms=model_result.latency_ms,
        steps=steps,
        references=references,
        tool_calls=tool_calls,
        model_call=model_result if runtime_request.runtime_model_config else None,
        error_message=model_result.error_message,
    )

    yield {"event": "done", "data": response.model_dump(mode="json")}


async def run_agent_streaming_prelude(request: RuntimeConversationRequest) -> AgentGraphState:
    trace_id = resolve_trace_id(request)
    state: AgentGraphState = {
        "request": request,
        "steps": [],
        "trace_id": trace_id,
        "span_id": create_span_id(),
        "parent_span_id": resolve_parent_span_id(request),
    }

    for node in [load_agent_config_node, render_prompt_node, retrieve_knowledge_node, call_tools_node]:
        state.update(await node(state))
    return state


async def run_agent_graph(request: RuntimeConversationRequest) -> AgentGraphState:
    trace_id = resolve_trace_id(request)
    initial_state: AgentGraphState = {
        "request": request,
        "steps": [],
        "trace_id": trace_id,
        "span_id": create_span_id(),
        "parent_span_id": resolve_parent_span_id(request),
    }

    if StateGraph is None or END is None:
        return await run_sequential_graph(initial_state)

    graph = get_agent_graph()
    return await graph.ainvoke(initial_state)


def get_agent_graph():
    global agent_graph
    if agent_graph is not None:
        return agent_graph

    workflow = StateGraph(AgentGraphState)
    workflow.add_node("load_agent_config", load_agent_config_node)
    workflow.add_node("render_prompt", render_prompt_node)
    workflow.add_node("retrieve_knowledge", retrieve_knowledge_node)
    workflow.add_node("call_tools", call_tools_node)
    workflow.add_node("execute_model", execute_model_node)
    workflow.add_node("finalize_response", finalize_response_node)
    workflow.set_entry_point("load_agent_config")
    workflow.add_edge("load_agent_config", "render_prompt")
    workflow.add_edge("render_prompt", "retrieve_knowledge")
    workflow.add_edge("retrieve_knowledge", "call_tools")
    workflow.add_edge("call_tools", "execute_model")
    workflow.add_edge("execute_model", "finalize_response")
    workflow.add_edge("finalize_response", END)
    agent_graph = workflow.compile()
    return agent_graph


async def run_sequential_graph(state: AgentGraphState) -> AgentGraphState:
    for node in [
        load_agent_config_node,
        render_prompt_node,
        retrieve_knowledge_node,
        call_tools_node,
        execute_model_node,
        finalize_response_node,
    ]:
        state.update(await node(state))
    return state


async def load_agent_config_node(state: AgentGraphState) -> AgentGraphState:
    request = state["request"]
    steps = state.get("steps", []).copy()
    span_id = create_span_id()
    agent = request.agent
    prompt_count = len(request.prompts) if request.prompts else len(request.prompt_messages)
    steps.append(
        RuntimeConversationStep(
            id="agent-config",
            type="prompt",
            title="Runtime 加载智能体配置",
            status="done",
            summary=(
                f"已载入智能体 {request.agent_name}、{prompt_count} 条提示词、"
                f"{len(request.knowledge_bindings)} 个知识库和 {len(request.tools)} 个工具配置。"
            ),
            trace_id=state["trace_id"],
            span_id=span_id,
            parent_span_id=state.get("span_id"),
            item_count=len(request.history) + prompt_count,
        )
    )
    return {
        "steps": steps,
        "request_model": request.runtime_model_config.model if request.runtime_model_config else "langgraph-runtime-deterministic",
        "references": request.references.copy(),
        "tool_calls": request.tool_calls.copy(),
        "rendered_prompts": request.prompt_messages.copy(),
        "error_message": None if agent is None or agent.status != "DISABLED" else "智能体已停用。",
    }


async def render_prompt_node(state: AgentGraphState) -> AgentGraphState:
    request = state["request"]
    steps = state.get("steps", []).copy()
    span_id = create_span_id()
    rendered_prompts = render_prompt_messages(request)
    steps.append(
        RuntimeConversationStep(
            id="prompt",
            type="prompt",
            title="Runtime 渲染提示词",
            status="done",
            summary=f"Runtime 已渲染 {len(rendered_prompts)} 条提示词，并接入 {len(request.history)} 条会话历史。",
            trace_id=state["trace_id"],
            span_id=span_id,
            parent_span_id=state.get("span_id"),
            item_count=len(rendered_prompts),
        )
    )
    return {"steps": steps, "rendered_prompts": rendered_prompts}


async def retrieve_knowledge_node(state: AgentGraphState) -> AgentGraphState:
    request = state["request"]
    if not request.knowledge_bindings and not request.references:
        return {}

    steps = state.get("steps", []).copy()
    span_id = create_span_id()
    started_at = time.time()
    references = request.references.copy()
    retrieval_mode = "PREPARED"
    error_message: str | None = None

    if request.knowledge_bindings and request.control_api:
        try:
            retrieval = await asyncio.to_thread(call_control_api_retrieve, request, state["trace_id"], span_id)
            references = retrieval.references
            retrieval_mode = retrieval.mode
        except Exception as error:
            error_message = str(error)

    steps.append(
        RuntimeConversationStep(
            id="knowledge",
            type="knowledge",
            title="Runtime 知识检索",
            status="failed" if error_message else "done",
            summary=error_message if error_message else f"Runtime 已检索 {len(references)} 条知识引用。",
            trace_id=state["trace_id"],
            span_id=span_id,
            parent_span_id=state.get("span_id"),
            retrieval_mode=retrieval_mode,
            latency_ms=elapsed_ms(started_at),
            item_count=len(references),
        )
    )
    return {"steps": steps, "references": references}


async def call_tools_node(state: AgentGraphState) -> AgentGraphState:
    request = state["request"]
    if not request.tools and not request.tool_calls:
        return {}

    steps = state.get("steps", []).copy()
    span_id = create_span_id()
    started_at = time.time()
    tool_calls = request.tool_calls.copy()
    selected_tool = select_runtime_tool(request)
    error_message: str | None = None

    if selected_tool and request.control_api:
        try:
            tool_call = await asyncio.to_thread(call_control_api_tool, request, selected_tool, state["trace_id"], span_id)
            tool_calls = [tool_call]
        except Exception as error:
            error_message = str(error)

    first = tool_calls[0] if tool_calls else None
    status = "skipped"
    if error_message:
        status = "failed"
    elif first:
        status = "done" if first.status == "SUCCESS" else "failed" if first.status == "FAILED" else "skipped"

    steps.append(
        RuntimeConversationStep(
            id="tool",
            type="tool",
            title="Runtime 工具调用",
            status=status,
            summary=build_tool_step_summary(first, selected_tool, error_message),
            trace_id=state["trace_id"],
            span_id=span_id,
            parent_span_id=state.get("span_id"),
            tool_name=first.tool_name if first else selected_tool.tool_name if selected_tool else None,
            response_status=first.response_status if first else None,
            latency_ms=first.latency_ms if first else elapsed_ms(started_at),
            item_count=len(tool_calls),
        )
    )
    return {"steps": steps, "tool_calls": tool_calls}


async def execute_model_node(state: AgentGraphState) -> AgentGraphState:
    request = state["request"]
    started_at = time.time()
    runtime_request = with_runtime_context(request, state)

    if runtime_request.runtime_model_config:
        model_result = await asyncio.to_thread(execute_openai_compatible_chat, runtime_request, state["trace_id"])
    else:
        model_result = build_deterministic_model_result(runtime_request, started_at, state["trace_id"])

    steps = state.get("steps", []).copy()
    span_id = create_span_id()
    cost_total = calculate_model_cost(request.runtime_model_config, model_result)
    steps.append(
        RuntimeConversationStep(
            id="model",
            type="response",
            title="LangGraph 模型执行",
            status="done" if model_result.status == "SUCCESS" else "failed",
            summary="Runtime 已完成模型调用。" if model_result.status == "SUCCESS" else model_result.error_message or "模型调用失败。",
            trace_id=state["trace_id"],
            span_id=span_id,
            parent_span_id=state.get("span_id"),
            request_model=model_result.request_model,
            latency_ms=model_result.latency_ms,
            prompt_tokens=model_result.prompt_tokens,
            completion_tokens=model_result.completion_tokens,
            total_tokens=model_result.total_tokens,
            cost_total=cost_total,
        )
    )

    assistant_message = model_result.response_summary.get("output_text")
    if not isinstance(assistant_message, str) or not assistant_message:
        assistant_message = (
            f"当前 Runtime 模型调用失败：{model_result.error_message}"
            if model_result.error_message
            else build_assistant_message(request)
        )

    return {
        "status": model_result.status,
        "assistant_message": assistant_message,
        "request_model": model_result.request_model,
        "prompt_tokens": model_result.prompt_tokens,
        "completion_tokens": model_result.completion_tokens,
        "total_tokens": model_result.total_tokens,
        "latency_ms": model_result.latency_ms,
        "steps": steps,
        "model_call": model_result if runtime_request.runtime_model_config else None,
        "error_message": model_result.error_message,
    }


async def finalize_response_node(state: AgentGraphState) -> AgentGraphState:
    steps = state.get("steps", []).copy()
    assistant_message = state.get("assistant_message", "")
    span_id = create_span_id()
    steps.append(
        RuntimeConversationStep(
            id="response",
            type="response",
            title="LangGraph 响应收口",
            status="done" if state.get("status", "SUCCESS") == "SUCCESS" else "skipped",
            summary="已生成结构化回复并返回运行元数据。",
            trace_id=state["trace_id"],
            span_id=span_id,
            parent_span_id=state.get("span_id"),
            item_count=len(assistant_message),
        )
    )
    return {"steps": steps}


def execute_openai_compatible_chat(request: RuntimeConversationRequest, trace_id: str) -> RuntimeModelCallSummary:
    config = request.runtime_model_config
    if config is None:
        return build_deterministic_model_result(request, time.time(), trace_id)

    messages = build_model_messages(request)
    traceparent = build_traceparent(trace_id, create_span_id())
    started_at = time.time()
    provider_type = config.provider_type.upper()
    adapter = resolve_model_adapter(provider_type)
    request_summary = {
        "adapter": adapter,
        "runtime": "langgraph",
        "trace_id": trace_id,
        "traceparent": traceparent,
        "messages": preview_messages(messages),
    }

    if provider_type not in SUPPORTED_PROVIDER_TYPES:
        prompt_tokens = estimate_messages_tokens(messages)
        return RuntimeModelCallSummary(
            trace_id=trace_id,
            status="FAILED",
            request_model=config.model,
            prompt_tokens=prompt_tokens,
            completion_tokens=0,
            total_tokens=prompt_tokens,
            latency_ms=0,
            request_summary=request_summary,
            response_summary={"adapter": adapter, "skipped": True},
            error_message="当前 Runtime 尚未支持该模型供应商。",
        )

    payload = build_model_provider_payload(config, messages, stream=False)
    url = build_model_provider_url(config)
    http_request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=build_model_provider_headers(config, trace_id, traceparent, stream=False),
        method="POST",
    )

    try:
        with urllib.request.urlopen(http_request, timeout=60) as response:
            response_body = response.read().decode("utf-8")
            response_json = json.loads(response_body) if response_body else {}
    except urllib.error.HTTPError as error:
        latency_ms = elapsed_ms(started_at)
        response_body = error.read().decode("utf-8", errors="replace")
        response_json = safe_json(response_body)
        prompt_tokens = estimate_messages_tokens(messages)
        return RuntimeModelCallSummary(
            trace_id=trace_id,
            status="FAILED",
            request_model=config.model,
            prompt_tokens=prompt_tokens,
            completion_tokens=0,
            total_tokens=prompt_tokens,
            latency_ms=latency_ms,
            request_summary=request_summary,
            response_summary={"status": error.code, "body": response_json},
            error_message=extract_provider_error(response_json) or f"Provider responded with HTTP {error.code}",
        )
    except Exception as error:
        latency_ms = elapsed_ms(started_at)
        prompt_tokens = estimate_messages_tokens(messages)
        return RuntimeModelCallSummary(
            trace_id=trace_id,
            status="FAILED",
            request_model=config.model,
            prompt_tokens=prompt_tokens,
            completion_tokens=0,
            total_tokens=prompt_tokens,
            latency_ms=latency_ms,
            request_summary=request_summary,
            response_summary={"error": str(error)},
            error_message=str(error),
        )

    content = extract_model_provider_completion_text(provider_type, response_json)
    usage = extract_model_provider_usage(provider_type, response_json, messages, content)

    return RuntimeModelCallSummary(
        trace_id=trace_id,
        status="SUCCESS",
        request_model=extract_response_model(response_json) or config.model,
        prompt_tokens=usage["prompt_tokens"],
        completion_tokens=usage["completion_tokens"],
        total_tokens=usage["total_tokens"],
        latency_ms=elapsed_ms(started_at),
        request_summary=request_summary,
        response_summary={
            "adapter": adapter,
            "runtime": "langgraph",
            "id": response_json.get("id") if isinstance(response_json, dict) else None,
            "output_preview": content[:240],
            "output_text": content,
            "usage": response_json.get("usage") if isinstance(response_json, dict) else None,
        },
        error_message=None,
    )


async def stream_model_provider_chat(request: RuntimeConversationRequest, trace_id: str):
    iterator = iter_stream_model_provider_chat_sync(request, trace_id)
    while True:
        item = await asyncio.to_thread(next_stream_item, iterator)
        if item is STREAM_END:
            break
        yield item


def next_stream_item(iterator: Any) -> dict[str, Any] | object:
    try:
        return next(iterator)
    except StopIteration:
        return STREAM_END


def iter_stream_model_provider_chat_sync(request: RuntimeConversationRequest, trace_id: str):
    config = request.runtime_model_config
    if config is None:
        model_result = build_deterministic_model_result(request, time.time(), trace_id)
        output_text = model_result.response_summary.get("output_text")
        for chunk in chunk_text(output_text if isinstance(output_text, str) else ""):
            yield {"type": "delta", "delta": chunk}
        yield {"type": "model_call", "model_call": model_result}
        return

    provider_type = config.provider_type.upper()
    adapter = resolve_model_adapter(provider_type)
    messages = build_model_messages(request)
    traceparent = build_traceparent(trace_id, create_span_id())
    started_at = time.time()
    request_summary = {
        "adapter": adapter,
        "runtime": "langgraph",
        "trace_id": trace_id,
        "traceparent": traceparent,
        "messages": preview_messages(messages),
        "stream": True,
    }

    if provider_type not in SUPPORTED_PROVIDER_TYPES:
        prompt_tokens = estimate_messages_tokens(messages)
        model_result = RuntimeModelCallSummary(
            trace_id=trace_id,
            status="FAILED",
            request_model=config.model,
            prompt_tokens=prompt_tokens,
            completion_tokens=0,
            total_tokens=prompt_tokens,
            latency_ms=0,
            request_summary=request_summary,
            response_summary={"adapter": adapter, "skipped": True, "streamed": True},
            error_message="当前 Runtime 尚未支持该模型供应商。",
        )
        yield {"type": "model_call", "model_call": model_result}
        return

    payload = build_model_provider_payload(config, messages, stream=True)
    http_request = urllib.request.Request(
        build_model_provider_url(config),
        data=json.dumps(payload).encode("utf-8"),
        headers=build_model_provider_headers(config, trace_id, traceparent, stream=True),
        method="POST",
    )

    try:
        response = urllib.request.urlopen(http_request, timeout=60)
    except urllib.error.HTTPError as error:
        latency_ms = elapsed_ms(started_at)
        response_body = error.read().decode("utf-8", errors="replace")
        response_json = safe_json(response_body)
        prompt_tokens = estimate_messages_tokens(messages)
        model_result = RuntimeModelCallSummary(
            trace_id=trace_id,
            status="FAILED",
            request_model=config.model,
            prompt_tokens=prompt_tokens,
            completion_tokens=0,
            total_tokens=prompt_tokens,
            latency_ms=latency_ms,
            request_summary=request_summary,
            response_summary={"status": error.code, "body": response_json, "streamed": True},
            error_message=extract_provider_error(response_json) or f"Provider responded with HTTP {error.code}",
        )
        yield {"type": "model_call", "model_call": model_result}
        return
    except Exception as error:
        latency_ms = elapsed_ms(started_at)
        prompt_tokens = estimate_messages_tokens(messages)
        model_result = RuntimeModelCallSummary(
            trace_id=trace_id,
            status="FAILED",
            request_model=config.model,
            prompt_tokens=prompt_tokens,
            completion_tokens=0,
            total_tokens=prompt_tokens,
            latency_ms=latency_ms,
            request_summary=request_summary,
            response_summary={"error": str(error), "streamed": True},
            error_message=str(error),
        )
        yield {"type": "model_call", "model_call": model_result}
        return

    output_text = ""
    response_model: str | None = None
    usage: dict[str, int] | None = None

    try:
        for parsed in iter_provider_sse_payloads(response):
            if parsed == "[DONE]":
                continue
            if parsed is None:
                continue

            delta = extract_model_provider_stream_delta(provider_type, parsed)
            if delta:
                output_text += delta
                yield {"type": "delta", "delta": delta}

            response_model = extract_response_model(parsed) or response_model
            next_usage = extract_model_provider_stream_usage(provider_type, parsed)
            if next_usage:
                usage = next_usage
    finally:
        close_response = getattr(response, "close", None)
        if callable(close_response):
            close_response()

    resolved_usage = usage or extract_model_provider_usage(provider_type, {}, messages, output_text)
    model_result = RuntimeModelCallSummary(
        trace_id=trace_id,
        status="SUCCESS",
        request_model=response_model or config.model,
        prompt_tokens=resolved_usage["prompt_tokens"],
        completion_tokens=resolved_usage["completion_tokens"],
        total_tokens=resolved_usage["total_tokens"],
        latency_ms=elapsed_ms(started_at),
        request_summary=request_summary,
        response_summary={
            "adapter": adapter,
            "runtime": "langgraph",
            "output_preview": output_text[:240],
            "output_text": output_text,
            "streamed": True,
        },
        error_message=None,
    )
    yield {"type": "model_call", "model_call": model_result}


def iter_provider_sse_payloads(response: Any):
    raw_event_lines: list[str] = []
    while True:
        raw_line = response.readline()
        if raw_line == b"" or raw_line == "":
            if raw_event_lines:
                yield parse_provider_sse_event("\n".join(raw_event_lines))
            break

        line = raw_line.decode("utf-8", errors="replace") if isinstance(raw_line, bytes) else str(raw_line)
        line = line.rstrip("\r\n")
        if line == "":
            if raw_event_lines:
                yield parse_provider_sse_event("\n".join(raw_event_lines))
                raw_event_lines = []
            continue
        raw_event_lines.append(line)


def extract_model_provider_stream_delta(provider_type: str, payload: Any) -> str:
    if provider_type.upper() == "ANTHROPIC":
        return extract_anthropic_stream_delta(payload)
    return extract_stream_delta(payload)


def extract_model_provider_stream_usage(provider_type: str, payload: Any) -> dict[str, int] | None:
    if provider_type.upper() == "ANTHROPIC":
        return extract_anthropic_usage_from_stream(payload)
    return extract_usage_from_stream(payload)


def resolve_model_adapter(provider_type: str) -> str:
    if provider_type == "AZURE_OPENAI":
        return "AZURE_OPENAI"
    if provider_type == "ANTHROPIC":
        return "ANTHROPIC"
    return "OPENAI_COMPATIBLE"


def build_model_provider_payload(
    config: RuntimeModelConfig,
    messages: list[dict[str, str]],
    stream: bool,
) -> dict[str, Any]:
    provider_type = config.provider_type.upper()
    if provider_type == "ANTHROPIC":
        return build_anthropic_payload(config, messages, stream)

    return {
        "model": config.model,
        "messages": messages,
        "temperature": config.temperature,
        "stream": stream,
        **({"stream_options": {"include_usage": True}} if stream else {}),
    }


def build_model_provider_url(config: RuntimeModelConfig) -> str:
    provider_type = config.provider_type.upper()
    if provider_type == "AZURE_OPENAI":
        return build_azure_chat_url(config.base_url, config.api_version or "2024-06-01")
    if provider_type == "ANTHROPIC":
        return build_anthropic_messages_url(config.base_url)
    return build_chat_url(config.base_url)


def build_model_provider_headers(
    config: RuntimeModelConfig,
    trace_id: str,
    traceparent: str,
    stream: bool,
) -> dict[str, str]:
    provider_type = config.provider_type.upper()
    headers = {
        "accept": "text/event-stream" if stream else "application/json",
        "content-type": "application/json",
        "traceparent": traceparent,
        "x-trace-id": trace_id,
    }
    if provider_type == "AZURE_OPENAI":
        headers["api-key"] = config.api_key
    elif provider_type == "ANTHROPIC":
        headers["x-api-key"] = config.api_key
        headers["anthropic-version"] = "2023-06-01"
    else:
        headers["authorization"] = f"Bearer {config.api_key}"
    return headers


def extract_model_provider_completion_text(provider_type: str, payload: Any) -> str:
    if provider_type.upper() == "ANTHROPIC":
        return extract_anthropic_completion_text(payload)
    return extract_completion_text(payload)


def extract_model_provider_usage(
    provider_type: str,
    payload: Any,
    messages: list[dict[str, str]],
    output_text: str,
) -> dict[str, int]:
    if provider_type.upper() == "ANTHROPIC":
        return extract_anthropic_usage(payload, messages, output_text)
    return extract_usage(payload, messages, output_text)


def build_deterministic_model_result(request: RuntimeConversationRequest, started_at: float, trace_id: str) -> RuntimeModelCallSummary:
    assistant_message = build_assistant_message(request)
    rendered_prompts = request._runtime_rendered_prompts if request._runtime_rendered_prompts is not None else request.prompt_messages
    references = request._runtime_references if request._runtime_references is not None else request.references
    tool_calls = request._runtime_tool_calls if request._runtime_tool_calls is not None else request.tool_calls
    prompt_tokens = (
        estimate_tokens(request.user_message)
        + sum(estimate_tokens(message.content) for message in request.history)
        + sum(estimate_tokens(message.content) for message in rendered_prompts)
        + sum(estimate_tokens(reference.snippet) for reference in references)
        + sum(estimate_tokens(tool_call.output_preview or tool_call.error_message or "") for tool_call in tool_calls)
    )
    completion_tokens = estimate_tokens(assistant_message)

    return RuntimeModelCallSummary(
        trace_id=trace_id,
        status="SUCCESS",
        request_model="langgraph-runtime-deterministic",
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=prompt_tokens + completion_tokens,
        latency_ms=max(1, elapsed_ms(started_at)),
        request_summary={
            "adapter": "DETERMINISTIC",
            "runtime": "langgraph",
            "history_count": len(request.history),
            "prompt_count": len(rendered_prompts),
        },
        response_summary={
            "adapter": "DETERMINISTIC",
            "runtime": "langgraph",
            "output_preview": assistant_message[:240],
            "output_text": assistant_message,
        },
        error_message=None,
    )
