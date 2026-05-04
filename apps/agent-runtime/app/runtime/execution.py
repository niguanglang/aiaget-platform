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
    build_chat_url,
    build_model_messages,
    build_tool_step_summary,
    build_traceparent,
    calculate_model_cost,
    call_control_api_retrieve,
    call_control_api_tool,
    create_span_id,
    elapsed_ms,
    estimate_messages_tokens,
    estimate_tokens,
    extract_completion_text,
    extract_provider_error,
    extract_response_model,
    extract_usage,
    preview_messages,
    render_prompt_messages,
    resolve_parent_span_id,
    resolve_trace_id,
    safe_json,
    select_runtime_tool,
    with_runtime_context,
)

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
    request_summary = {
        "adapter": "OPENAI_COMPATIBLE",
        "runtime": "langgraph",
        "trace_id": trace_id,
        "traceparent": traceparent,
        "messages": preview_messages(messages),
    }

    if config.provider_type != "OPENAI_COMPATIBLE":
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
            response_summary={"adapter": "OPENAI_COMPATIBLE", "skipped": True},
            error_message="当前 Runtime 仅支持 OPENAI_COMPATIBLE 模型供应商。",
        )

    payload = {
        "model": config.model,
        "messages": messages,
        "temperature": config.temperature,
        "stream": False,
    }
    url = build_chat_url(config.base_url)
    http_request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "accept": "application/json",
            "authorization": f"Bearer {config.api_key}",
            "content-type": "application/json",
            "traceparent": traceparent,
            "x-trace-id": trace_id,
        },
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

    content = extract_completion_text(response_json)
    usage = extract_usage(response_json, messages, content)

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
            "adapter": "OPENAI_COMPATIBLE",
            "runtime": "langgraph",
            "id": response_json.get("id") if isinstance(response_json, dict) else None,
            "output_preview": content[:240],
            "output_text": content,
            "usage": response_json.get("usage") if isinstance(response_json, dict) else None,
        },
        error_message=None,
    )


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
