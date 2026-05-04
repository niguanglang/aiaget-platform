from __future__ import annotations

import asyncio
import json
import re
import secrets
import time
import urllib.error
import urllib.request
from typing import Any

from fastapi import Request

from app.core.settings import settings

from .contracts import (
    RuntimeAgentTeamRequest,
    RuntimeConversationRequest,
    RuntimeControlApiSnapshot,
    RuntimeModelCallSummary,
    RuntimeModelConfig,
    RuntimePromptMessage,
    RuntimePromptVariable,
    RuntimeRetrievalResult,
    RuntimeToolCallSummary,
    RuntimeToolSnapshot,
)


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


def int_value(value: Any) -> int | None:
    return value if isinstance(value, int) else None


def estimate_tokens(value: str) -> int:
    return max(1, len(value.strip()) // 4)


def estimate_messages_tokens(messages: list[dict[str, str]]) -> int:
    return sum(estimate_tokens(message["content"]) for message in messages)


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


def resolve_trace_id(request: RuntimeConversationRequest) -> str:
    if request.trace_id and re.fullmatch(r"[0-9a-f]{32}", request.trace_id):
        return request.trace_id

    parsed = parse_traceparent(request.traceparent)
    return parsed["trace_id"] if parsed else create_trace_id()


def resolve_team_trace_id(request: RuntimeAgentTeamRequest) -> str:
    if request.trace_id and re.fullmatch(r"[0-9a-f]{32}", request.trace_id):
        return request.trace_id

    parsed = parse_traceparent(request.traceparent)
    return parsed["trace_id"] if parsed else create_trace_id()


def resolve_parent_span_id(request: RuntimeConversationRequest) -> str | None:
    if request.parent_span_id and re.fullmatch(r"[0-9a-f]{16}", request.parent_span_id):
        return request.parent_span_id

    parsed = parse_traceparent(request.traceparent)
    return parsed["span_id"] if parsed else None


def resolve_team_parent_span_id(request: RuntimeAgentTeamRequest) -> str | None:
    if request.parent_span_id and re.fullmatch(r"[0-9a-f]{16}", request.parent_span_id):
        return request.parent_span_id

    parsed = parse_traceparent(request.traceparent)
    return parsed["span_id"] if parsed else None


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


def apply_team_http_trace_context(request: RuntimeAgentTeamRequest, http_request: Request) -> None:
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


def with_runtime_context(request: RuntimeConversationRequest, state: dict[str, Any]) -> RuntimeConversationRequest:
    request._runtime_rendered_prompts = state.get("rendered_prompts", request.prompt_messages)
    request._runtime_references = state.get("references", request.references)
    request._runtime_tool_calls = state.get("tool_calls", request.tool_calls)
    return request


def should_trigger_tool(message: str) -> bool:
    return re.search(r"健康|health|状态|可用|检查", message.lower()) is not None


def select_runtime_tool(request: RuntimeConversationRequest) -> RuntimeToolSnapshot | None:
    if not should_trigger_tool(request.user_message):
        return None
    return request.tools[0] if request.tools else None


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
