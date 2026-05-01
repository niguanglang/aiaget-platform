import asyncio
import json
import re
import secrets
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from typing import Any, Literal, TypedDict

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, ConfigDict, Field, PrivateAttr

from app.core.settings import settings
from app.workflows.worker import start_knowledge_task_workflow

try:
    from langgraph.graph import END, StateGraph
except ImportError:  # pragma: no cover - local dev fallback when dependencies are not installed yet.
    END = None
    StateGraph = None


class HealthResponse(BaseModel):
    service: str
    status: Literal["healthy", "degraded", "unavailable"]
    timestamp: str
    version: str


class WorkflowStartRequest(BaseModel):
    task_id: str


class WorkflowStartResponse(BaseModel):
    workflow_id: str
    run_id: str
    status: Literal["STARTED"]
    backend: Literal["TEMPORAL", "LOCAL_FALLBACK"]


class RuntimeConversationMessage(BaseModel):
    role: Literal["USER", "ASSISTANT", "SYSTEM", "TOOL"]
    content: str


class RuntimePromptMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str


class RuntimeModelConfig(BaseModel):
    provider_type: str
    base_url: str
    api_key: str
    model: str
    temperature: float = 0.7
    input_price: float = 0
    output_price: float = 0


class RuntimeAgentSnapshot(BaseModel):
    tenant_id: str
    user_id: str
    agent_id: str
    name: str
    code: str
    status: str = "DRAFT"
    version: int = 0
    temperature: float = 0.7
    max_context_tokens: int = 4096
    enable_stream: bool = True
    enable_log: bool = True


class RuntimePromptVariable(BaseModel):
    name: str
    default_value: str | None = None


class RuntimePromptSnapshot(BaseModel):
    binding_id: str
    prompt_id: str
    prompt_type: str
    role: Literal["system", "user", "assistant"] = "system"
    template_name: str
    template_code: str
    template_type: str
    content: str
    variables: list[RuntimePromptVariable] = Field(default_factory=list)


class RuntimeKnowledgeBindingSnapshot(BaseModel):
    binding_id: str
    knowledge_id: str
    knowledge_name: str
    knowledge_code: str
    weight: int = 100
    recall_top_k: int = 5


class RuntimeToolSnapshot(BaseModel):
    binding_id: str
    tool_id: str
    tool_name: str
    tool_code: str
    tool_type: str = "HTTP"
    method: str = "POST"
    risk_level: str = "LOW"
    require_approval: bool = False
    binding_require_approval: bool = False


class RuntimeControlApiSnapshot(BaseModel):
    base_url: str
    internal_token: str


class RuntimeToolCallSummary(BaseModel):
    tool_id: str | None = None
    tool_name: str
    tool_code: str
    status: Literal["SUCCESS", "FAILED", "APPROVAL_REQUIRED", "REJECTED"]
    approval_request_id: str | None = None
    latency_ms: int
    response_status: int | None = None
    output_preview: str | None = None
    error_message: str | None = None


class RuntimeReferenceHint(BaseModel):
    id: str
    title: str
    snippet: str
    score: float | None = None
    source_type: str | None = None


class RuntimeRetrievalResult(BaseModel):
    references: list[RuntimeReferenceHint] = Field(default_factory=list)
    mode: str = "HYBRID"
    latency_ms: int = 0
    cost_total: float = 0


class RuntimeConversationRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    _runtime_rendered_prompts: list[RuntimePromptMessage] | None = PrivateAttr(default=None)
    _runtime_references: list[RuntimeReferenceHint] | None = PrivateAttr(default=None)
    _runtime_tool_calls: list[RuntimeToolCallSummary] | None = PrivateAttr(default=None)

    request_id: str | None = None
    trace_id: str | None = None
    parent_span_id: str | None = None
    traceparent: str | None = None
    conversation_id: str | None = None
    agent: RuntimeAgentSnapshot | None = None
    agent_name: str
    agent_code: str
    user_message: str
    history: list[RuntimeConversationMessage] = Field(default_factory=list)
    prompt_messages: list[RuntimePromptMessage] = Field(default_factory=list)
    prompts: list[RuntimePromptSnapshot] = Field(default_factory=list)
    knowledge_bindings: list[RuntimeKnowledgeBindingSnapshot] = Field(default_factory=list)
    tools: list[RuntimeToolSnapshot] = Field(default_factory=list)
    tool_calls: list[RuntimeToolCallSummary] = Field(default_factory=list)
    references: list[RuntimeReferenceHint] = Field(default_factory=list)
    control_api: RuntimeControlApiSnapshot | None = None
    runtime_model_config: RuntimeModelConfig | None = Field(default=None, alias="model_config")


class RuntimeConversationStep(BaseModel):
    id: str
    type: Literal["prompt", "tool", "knowledge", "response"]
    title: str
    status: Literal["done", "failed", "skipped"]
    summary: str
    trace_id: str | None = None
    span_id: str | None = None
    parent_span_id: str | None = None
    request_model: str | None = None
    tool_name: str | None = None
    retrieval_mode: str | None = None
    response_status: int | None = None
    latency_ms: int | None = None
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    total_tokens: int | None = None
    cost_total: float | None = None
    item_count: int | None = None


class RuntimeModelCallSummary(BaseModel):
    trace_id: str
    status: Literal["SUCCESS", "FAILED"]
    request_model: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    latency_ms: int
    request_summary: dict[str, Any]
    response_summary: dict[str, Any]
    error_message: str | None = None


class RuntimeConversationResponse(BaseModel):
    trace_id: str
    status: Literal["SUCCESS", "FAILED"] = "SUCCESS"
    assistant_message: str
    request_model: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    latency_ms: int
    steps: list[RuntimeConversationStep]
    references: list[RuntimeReferenceHint]
    tool_calls: list[RuntimeToolCallSummary]
    model_call: RuntimeModelCallSummary | None = None
    error_message: str | None = None


class AgentGraphState(TypedDict, total=False):
    request: RuntimeConversationRequest
    steps: list[RuntimeConversationStep]
    trace_id: str
    span_id: str
    parent_span_id: str | None
    status: Literal["SUCCESS", "FAILED"]
    assistant_message: str
    request_model: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    latency_ms: int
    model_call: RuntimeModelCallSummary | None
    error_message: str | None
    rendered_prompts: list[RuntimePromptMessage]
    references: list[RuntimeReferenceHint]
    tool_calls: list[RuntimeToolCallSummary]


app = FastAPI(
    title="Enterprise Agent Platform Runtime",
    description="LangGraph-based agent execution runtime for model calls, RAG context, tools, and streaming.",
    version=settings.version,
    docs_url="/runtime/docs",
    openapi_url="/runtime/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origin.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent_graph = None


@app.get("/runtime/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(
        service="agent-runtime",
        status="healthy",
        timestamp=datetime.now(timezone.utc).isoformat(),
        version=settings.version,
    )


@app.post("/runtime/conversations/respond", response_model=RuntimeConversationResponse)
async def respond(request: RuntimeConversationRequest, http_request: Request) -> RuntimeConversationResponse:
    apply_http_trace_context(request, http_request)
    return await build_runtime_response(request)


@app.post("/runtime/conversations/respond-stream")
async def respond_stream(request: RuntimeConversationRequest, http_request: Request) -> StreamingResponse:
    apply_http_trace_context(request, http_request)
    response = await build_runtime_response(request)

    async def event_stream():
        yield sse_event(
            "start",
            {
                "type": "start",
                "trace_id": response.trace_id,
                "request_model": response.request_model,
                "steps": [step.model_dump(mode="json") for step in response.steps],
                "references": [reference.model_dump(mode="json") for reference in response.references],
                "tool_calls": [tool_call.model_dump(mode="json") for tool_call in response.tool_calls],
            },
        )

        for chunk in chunk_text(response.assistant_message):
            yield sse_event("delta", {"type": "delta", "delta": chunk})
            await asyncio.sleep(0.012)

        yield sse_event(
            "done",
            {
                **response.model_dump(mode="json"),
            },
        )

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.post("/runtime/workflows/knowledge-tasks/start", response_model=WorkflowStartResponse)
async def start_knowledge_task_workflow_endpoint(request: WorkflowStartRequest, http_request: Request) -> WorkflowStartResponse:
    verify_runtime_internal_token(http_request)
    result = await start_knowledge_task_workflow(request.task_id)
    return WorkflowStartResponse(**result)


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
        "request_model": request.runtime_model_config.model
        if request.runtime_model_config
        else "langgraph-runtime-deterministic",
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
            summary=(
                error_message
                if error_message
                else f"Runtime 已检索 {len(references)} 条知识引用。"
            ),
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


def build_model_messages(request: RuntimeConversationRequest) -> list[dict[str, str]]:
    rendered_prompts = request._runtime_rendered_prompts
    references = request._runtime_references if request._runtime_references is not None else request.references
    tool_calls = request._runtime_tool_calls if request._runtime_tool_calls is not None else request.tool_calls
    messages: list[dict[str, str]] = [
        {
            "role": "system",
            "content": f"你是企业智能体 {request.agent_name}（{request.agent_code}）。请始终用中文回答，并保持专业、准确、简洁。",
        }
    ]
    messages.extend(message.model_dump(mode="json") for message in (rendered_prompts or request.prompt_messages))
    messages.extend(
        {
            "role": normalize_chat_role(message.role),
            "content": message.content,
        }
        for message in request.history
    )
    if not request.history or request.history[-1].role != "USER" or request.history[-1].content != request.user_message:
        messages.append(
            {
                "role": "user",
                "content": request.user_message,
            }
        )

    if tool_calls:
        messages.append(
            {
                "role": "system",
                "content": "最近工具调用摘要："
                + "；".join(
                    f"{tool_call.tool_name} {tool_call.status} {tool_call.output_preview or tool_call.error_message or ''}".strip()
                    for tool_call in tool_calls
                ),
            }
        )

    if references:
        messages.append(
            {
                "role": "system",
                "content": "参考上下文："
                + "；".join(f"《{reference.title}》{reference.snippet}" for reference in references),
            }
        )

    return messages


def render_prompt_messages(request: RuntimeConversationRequest) -> list[RuntimePromptMessage]:
    if request.prompts:
        return [
            RuntimePromptMessage(
                role=prompt.role,
                content=render_prompt_content(prompt.content, prompt.variables, request),
            )
            for prompt in request.prompts
        ]

    return request.prompt_messages.copy()


def render_prompt_content(
    content: str,
    variables: list[RuntimePromptVariable],
    request: RuntimeConversationRequest,
) -> str:
    values: dict[str, str] = {
        "agent_name": request.agent_name,
        "agent_code": request.agent_code,
        "user_message": request.user_message,
    }
    if request.agent:
        values.update(
            {
                "tenant_id": request.agent.tenant_id,
                "user_id": request.agent.user_id,
                "agent_id": request.agent.agent_id,
            }
        )
    for variable in variables:
        values.setdefault(variable.name, variable.default_value or "")

    rendered = content
    for key, value in values.items():
        rendered = rendered.replace("{{" + key + "}}", value).replace("{" + key + "}", value)
    return rendered


def with_runtime_context(request: RuntimeConversationRequest, state: AgentGraphState) -> RuntimeConversationRequest:
    request._runtime_rendered_prompts = state.get("rendered_prompts", request.prompt_messages)
    request._runtime_references = state.get("references", request.references)
    request._runtime_tool_calls = state.get("tool_calls", request.tool_calls)
    return request


def select_runtime_tool(request: RuntimeConversationRequest) -> RuntimeToolSnapshot | None:
    if not should_trigger_tool(request.user_message):
        return None
    return request.tools[0] if request.tools else None


def should_trigger_tool(message: str) -> bool:
    return re.search(r"健康|health|状态|可用|检查", message.lower()) is not None


def build_tool_step_summary(
    tool_call: RuntimeToolCallSummary | None,
    selected_tool: RuntimeToolSnapshot | None,
    error_message: str | None,
) -> str:
    if error_message:
        return error_message
    if tool_call:
        if tool_call.status == "SUCCESS":
            return f"工具 {tool_call.tool_name} 调用成功。"
        return f"工具 {tool_call.tool_name} 返回 {tool_call.status}。"
    if selected_tool:
        return f"工具 {selected_tool.tool_name} 已匹配，但当前未产生调用结果。"
    return "当前消息未触发工具调用。"


def call_control_api_retrieve(
    request: RuntimeConversationRequest,
    trace_id: str,
    parent_span_id: str,
) -> RuntimeRetrievalResult:
    if not request.agent or not request.control_api:
        return RuntimeRetrievalResult(references=request.references, mode="PREPARED")

    response = post_control_api_json(
        request.control_api,
        "/api/v1/runtime/internal/knowledge/retrieve",
        {
            "tenant_id": request.agent.tenant_id,
            "user_id": request.agent.user_id,
            "agent_id": request.agent.agent_id,
            "query": request.user_message,
            "request_id": request.request_id,
            "trace_id": trace_id,
            "parent_span_id": parent_span_id,
            "traceparent": build_traceparent(trace_id, parent_span_id),
        },
    )
    return RuntimeRetrievalResult(**response)


def call_control_api_tool(
    request: RuntimeConversationRequest,
    tool: RuntimeToolSnapshot,
    trace_id: str,
    parent_span_id: str,
) -> RuntimeToolCallSummary:
    if not request.agent or not request.control_api:
        raise RuntimeError("缺少 Control API 内部调用配置。")

    response = post_control_api_json(
        request.control_api,
        "/api/v1/runtime/internal/tools/call",
        {
            "tenant_id": request.agent.tenant_id,
            "user_id": request.agent.user_id,
            "agent_id": request.agent.agent_id,
            "conversation_id": request.conversation_id,
            "tool_id": tool.tool_id,
            "input": {},
            "request_id": request.request_id,
            "trace_id": trace_id,
            "parent_span_id": parent_span_id,
            "traceparent": build_traceparent(trace_id, parent_span_id),
        },
    )
    return RuntimeToolCallSummary(**response)


def post_control_api_json(
    control_api: RuntimeControlApiSnapshot,
    path: str,
    payload: dict[str, Any],
) -> dict[str, Any]:
    url = f"{control_api.base_url.rstrip('/')}{path}"
    http_request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "accept": "application/json",
            "content-type": "application/json",
            "x-runtime-internal-token": control_api.internal_token,
            "x-request-id": str(payload.get("request_id") or ""),
            "x-trace-id": str(payload.get("trace_id") or ""),
            "traceparent": str(payload.get("traceparent") or ""),
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(http_request, timeout=60) as response:
            response_body = response.read().decode("utf-8")
            response_json = json.loads(response_body) if response_body else {}
    except urllib.error.HTTPError as error:
        response_body = error.read().decode("utf-8", errors="replace")
        response_json = safe_json(response_body)
        raise RuntimeError(extract_provider_error(response_json) or f"Control API responded with HTTP {error.code}") from error

    if not isinstance(response_json, dict):
        raise RuntimeError("Control API returned an invalid JSON object")
    return response_json


def sse_event(event_name: str, payload: dict) -> str:
    return f"event: {event_name}\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"


def chunk_text(value: str) -> list[str]:
    words = value.split(" ")
    if len(words) <= 1:
        return [value[index : index + 24] for index in range(0, len(value), 24)] or [value]

    chunks: list[str] = []
    current = ""
    for word in words:
        next_value = f"{current} {word}".strip()
        if len(next_value) > 18 and current:
            chunks.append(f"{current} ")
            current = word
        else:
            current = next_value

    if current:
        chunks.append(current)

    return chunks


def build_assistant_message(request: RuntimeConversationRequest) -> str:
    references = request._runtime_references if request._runtime_references is not None else request.references
    tool_calls = request._runtime_tool_calls if request._runtime_tool_calls is not None else request.tool_calls
    parts = [
        f"我是 {request.agent_name}，已收到你的问题：{request.user_message.strip()}。",
        "当前为 LangGraph Runtime 执行链路，回复由 Runtime 图节点完成配置加载、提示词渲染、知识检索、工具调用、模型执行和响应收口。",
    ]

    if tool_calls:
        latest_tool = tool_calls[0]
        if latest_tool.status == "SUCCESS":
            parts.append(
                f"我已经调用工具 {latest_tool.tool_name}，返回状态为 HTTP {latest_tool.response_status or 200}。"
            )
        elif latest_tool.status == "APPROVAL_REQUIRED":
            parts.append(
                f"工具 {latest_tool.tool_name} 属于高风险并要求审批，已创建审批请求并等待人工处理。"
            )
        elif latest_tool.status == "REJECTED":
            parts.append(
                f"工具 {latest_tool.tool_name} 的调用申请已被拒绝：{latest_tool.error_message or '未提供审批备注'}。"
            )
        else:
            parts.append(
                f"工具 {latest_tool.tool_name} 调用失败：{latest_tool.error_message or '未知错误'}。"
            )

    if references:
        parts.append(
            f"我参考了 {len(references)} 条上下文线索，首条为《{references[0].title}》。"
        )

    parts.append("当前 Control API 只保留鉴权、配置快照、内部适配和结果持久化边界。")

    return " ".join(parts)


def build_chat_url(base_url: str) -> str:
    return f"{base_url.rstrip('/')}/chat/completions"


def preview_messages(messages: list[dict[str, str]]) -> list[dict[str, str]]:
    return [
        {
            "role": message["role"],
            "content_preview": message["content"][:240],
        }
        for message in messages
    ]


def normalize_chat_role(role: str) -> str:
    if role == "ASSISTANT":
        return "assistant"
    if role == "USER":
        return "user"
    return "system"


def safe_json(value: str) -> Any:
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return value


def extract_completion_text(payload: Any) -> str:
    if not isinstance(payload, dict):
        return ""

    choices = payload.get("choices")
    if not isinstance(choices, list) or len(choices) == 0:
        return ""

    message = choices[0].get("message") if isinstance(choices[0], dict) else None
    return message.get("content", "") if isinstance(message, dict) else ""


def extract_response_model(payload: Any) -> str | None:
    return payload.get("model") if isinstance(payload, dict) and isinstance(payload.get("model"), str) else None


def extract_usage(payload: Any, messages: list[dict[str, str]], output_text: str) -> dict[str, int]:
    if isinstance(payload, dict) and isinstance(payload.get("usage"), dict):
        usage = payload["usage"]
        prompt_tokens = int_value(usage.get("prompt_tokens")) or estimate_messages_tokens(messages)
        completion_tokens = int_value(usage.get("completion_tokens")) or estimate_tokens(output_text)
        total_tokens = int_value(usage.get("total_tokens")) or prompt_tokens + completion_tokens
        return {
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": total_tokens,
        }

    prompt_tokens = estimate_messages_tokens(messages)
    completion_tokens = estimate_tokens(output_text)
    return {
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "total_tokens": prompt_tokens + completion_tokens,
    }


def extract_provider_error(payload: Any) -> str | None:
    if isinstance(payload, dict):
        error = payload.get("error")
        if isinstance(error, dict) and isinstance(error.get("message"), str):
            return error["message"]
        if isinstance(payload.get("message"), str):
            return payload["message"]
    if isinstance(payload, str):
        return payload[:500]
    return None


def int_value(value: Any) -> int | None:
    return value if isinstance(value, int) else None


def estimate_tokens(value: str) -> int:
    return max(1, len(value.strip()) // 4)


def estimate_messages_tokens(messages: list[dict[str, str]]) -> int:
    return sum(estimate_tokens(message["content"]) for message in messages)


def calculate_model_cost(config: RuntimeModelConfig | None, model_call: RuntimeModelCallSummary) -> float | None:
    if config is None:
        return None

    input_cost = (model_call.prompt_tokens / 1000) * config.input_price
    output_cost = (model_call.completion_tokens / 1000) * config.output_price
    return round(input_cost + output_cost, 6)


def elapsed_ms(started_at: float) -> int:
    return int((time.time() - started_at) * 1000)


def create_trace_id() -> str:
    trace_id = secrets.token_hex(16)
    return create_trace_id() if trace_id == "00000000000000000000000000000000" else trace_id


def create_span_id() -> str:
    span_id = secrets.token_hex(8)
    return create_span_id() if span_id == "0000000000000000" else span_id


def build_traceparent(trace_id: str, span_id: str) -> str:
    return f"00-{trace_id}-{span_id}-01"


def resolve_trace_id(request: RuntimeConversationRequest) -> str:
    if request.trace_id and re.fullmatch(r"[0-9a-f]{32}", request.trace_id):
        return request.trace_id

    parsed = parse_traceparent(request.traceparent)
    return parsed["trace_id"] if parsed else create_trace_id()


def resolve_parent_span_id(request: RuntimeConversationRequest) -> str | None:
    if request.parent_span_id and re.fullmatch(r"[0-9a-f]{16}", request.parent_span_id):
        return request.parent_span_id

    parsed = parse_traceparent(request.traceparent)
    return parsed["span_id"] if parsed else None


def parse_traceparent(value: str | None) -> dict[str, str] | None:
    if not value:
        return None

    match = re.fullmatch(r"00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})", value.strip().lower())
    if not match:
        return None

    return {
        "trace_id": match.group(1),
        "span_id": match.group(2),
        "trace_flags": match.group(3),
    }


def apply_http_trace_context(request: RuntimeConversationRequest, http_request: Request) -> None:
    header_traceparent = http_request.headers.get("traceparent")
    header_trace_id = http_request.headers.get("x-trace-id")
    parsed = parse_traceparent(header_traceparent)

    if not request.trace_id:
        if parsed:
            request.trace_id = parsed["trace_id"]
        elif header_trace_id and re.fullmatch(r"[0-9a-f]{32}", header_trace_id):
            request.trace_id = header_trace_id

    if not request.parent_span_id and parsed:
        request.parent_span_id = parsed["span_id"]

    if not request.traceparent and header_traceparent:
        request.traceparent = header_traceparent


def verify_runtime_internal_token(http_request: Request) -> None:
    token = http_request.headers.get("x-runtime-internal-token")
    if not token or token != settings.internal_token:
        from fastapi import HTTPException

        raise HTTPException(status_code=401, detail="Invalid runtime internal token")
