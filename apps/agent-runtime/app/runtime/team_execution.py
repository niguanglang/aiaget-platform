from __future__ import annotations

import asyncio
import json
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from app.runtime.contracts import (
    RuntimeAgentTeamHandoffResult,
    RuntimeAgentTeamMemberRequest,
    RuntimeAgentTeamMemberResult,
    RuntimeAgentTeamRequest,
    RuntimeAgentTeamResponse,
    RuntimeAgentTeamStepResult,
    RuntimeConversationRequest,
    RuntimeConversationResponse,
    RuntimeModelCallSummary,
    RuntimeModelConfig,
    RuntimePromptMessage,
)
from app.runtime.execution import build_runtime_response, execute_openai_compatible_chat
from app.runtime.helpers import (
    build_traceparent,
    calculate_model_cost,
    create_span_id,
    elapsed_ms,
    resolve_team_parent_span_id,
    resolve_team_trace_id,
)


@dataclass
class MemberExecution:
    member: RuntimeAgentTeamMemberRequest
    result: RuntimeAgentTeamMemberResult
    step: RuntimeAgentTeamStepResult
    round_index: int = 1
    attempt: int = 1


@dataclass
class SupervisorRun:
    executions: list[MemberExecution]
    steps: list[RuntimeAgentTeamStepResult]
    handoffs: list[RuntimeAgentTeamHandoffResult]
    waiting_human: bool = False
    error_message: str | None = None


@dataclass
class SupervisorDecision:
    action: str
    next_member_id: str | None
    reason: str
    confidence: float
    source: str
    model_call: RuntimeModelCallSummary | None = None
    model_cost_total: float = 0
    fallback_reason: str | None = None


async def build_team_runtime_response(request: RuntimeAgentTeamRequest) -> RuntimeAgentTeamResponse:
    started_at = time.time()
    started_iso = utc_now()
    trace_id = resolve_team_trace_id(request)
    root_span_id = create_span_id()
    root_parent_span_id = resolve_team_parent_span_id(request)
    members = sorted(request.members, key=lambda item: (item.execution_order, item.member_id))
    steps: list[RuntimeAgentTeamStepResult] = [
        RuntimeAgentTeamStepResult(
            member_id=None,
            agent_id=None,
            step_type="PLAN",
            title="Runtime 团队任务规划",
            status="SUCCESS",
            input_summary=request.objective.strip(),
            output_summary=build_plan_summary(request, members),
            trace_id=trace_id,
            span_id=root_span_id,
            parent_span_id=root_parent_span_id,
            duration_ms=max(1, elapsed_ms(started_at)),
            started_at=started_iso,
            ended_at=utc_now(),
        )
    ]
    handoffs: list[RuntimeAgentTeamHandoffResult] = []

    if request.team.mode == "PARALLEL":
        executions = await run_parallel_members(request, members, trace_id, root_span_id)
    elif request.team.mode == "SUPERVISOR":
        supervisor_run = await run_supervisor_members(request, members, trace_id, root_span_id)
        executions = supervisor_run.executions
        handoffs = supervisor_run.handoffs
        steps.extend(supervisor_run.steps)
    else:
        executions = await run_sequential_members(request, members, trace_id, root_span_id)

    member_results = [execution.result for execution in executions]
    steps.extend(execution.step for execution in executions)
    failed_required_member = has_failed_required_member(executions)
    waiting_human = request.team.mode == "SUPERVISOR" and "supervisor_run" in locals() and supervisor_run.waiting_human
    error_message = (
        supervisor_run.error_message
        if request.team.mode == "SUPERVISOR" and "supervisor_run" in locals()
        else None
    )
    supervisor_prompt_tokens = sum(step.prompt_tokens for step in steps if step.step_type == "VERIFY")
    supervisor_completion_tokens = sum(step.completion_tokens for step in steps if step.step_type == "VERIFY")
    supervisor_total_tokens = sum(step.total_tokens for step in steps if step.step_type == "VERIFY")
    supervisor_cost_total = round(sum(step.cost_total for step in steps if step.step_type == "VERIFY"), 6)
    member_prompt_tokens = sum(item.prompt_tokens for item in member_results)
    member_completion_tokens = sum(item.completion_tokens for item in member_results)
    member_total_tokens = sum(item.total_tokens for item in member_results)
    member_cost_total = round(sum(item.cost_total for item in member_results), 6)
    summary_message = build_summary_message(request, member_results, waiting_human)
    summary_started_at = time.time()
    steps.append(
        RuntimeAgentTeamStepResult(
            member_id=None,
            agent_id=None,
            step_type="SUMMARY",
            title="Runtime 团队结果汇总",
            status="SKIPPED" if waiting_human else "FAILED" if failed_required_member else "SUCCESS",
            input_summary=f"完成 {len(member_results)} 个成员执行步骤。",
            output_summary=summary_message,
            trace_id=trace_id,
            span_id=create_span_id(),
            parent_span_id=root_span_id,
            duration_ms=max(1, elapsed_ms(summary_started_at)),
            prompt_tokens=member_prompt_tokens + supervisor_prompt_tokens,
            completion_tokens=member_completion_tokens + supervisor_completion_tokens,
            total_tokens=member_total_tokens + supervisor_total_tokens,
            cost_total=round(member_cost_total + supervisor_cost_total, 6),
            error_message=(error_message or "存在必选成员执行失败.") if failed_required_member else None,
            started_at=utc_now(),
            ended_at=utc_now(),
        )
    )

    total_tokens = member_total_tokens + supervisor_total_tokens
    total_cost = round(member_cost_total + supervisor_cost_total, 6)
    response_status = "WAITING_HUMAN" if waiting_human else "FAILED" if failed_required_member else "SUCCESS"
    return RuntimeAgentTeamResponse(
        trace_id=trace_id,
        status=response_status,
        summary=summary_message,
        total_tokens=total_tokens,
        total_cost=total_cost,
        latency_ms=max(1, elapsed_ms(started_at)),
        steps=steps,
        handoffs=handoffs,
        member_results=member_results,
        error_message=(error_message or "存在必选成员执行失败.") if failed_required_member else None,
    )


async def run_sequential_members(
    request: RuntimeAgentTeamRequest,
    members: list[RuntimeAgentTeamMemberRequest],
    trace_id: str,
    root_span_id: str,
) -> list[MemberExecution]:
    executions: list[MemberExecution] = []
    previous_outputs: list[str] = []
    for member in members:
        execution = await run_member(request, member, trace_id, root_span_id, previous_outputs)
        executions.append(execution)
        if execution.result.assistant_message:
            previous_outputs.append(f"{execution.result.agent_name}：{execution.result.assistant_message}")
    return executions


async def run_parallel_members(
    request: RuntimeAgentTeamRequest,
    members: list[RuntimeAgentTeamMemberRequest],
    trace_id: str,
    root_span_id: str,
) -> list[MemberExecution]:
    tasks = [
        run_member(
            request,
            member,
            trace_id,
            root_span_id,
            [
                "并行模式下，每个成员基于同一个团队目标独立执行；结果将在团队汇总步骤合并。",
            ],
        )
        for member in members
    ]
    return list(await asyncio.gather(*tasks))


async def run_member(
    request: RuntimeAgentTeamRequest,
    member: RuntimeAgentTeamMemberRequest,
    trace_id: str,
    root_span_id: str,
    previous_outputs: list[str],
) -> MemberExecution:
    member_started_at = time.time()
    member_started_iso = utc_now()
    member_span_id = create_span_id()
    agent_request = build_member_agent_request(
        request=request,
        member=member,
        trace_id=trace_id,
        parent_span_id=member_span_id,
        previous_outputs=previous_outputs,
    )
    response = await build_runtime_response(agent_request)
    cost_total = response_cost(response)
    agent_id = agent_request.agent.agent_id if agent_request.agent else None
    result = RuntimeAgentTeamMemberResult(
        member_id=member.member_id,
        agent_id=agent_id,
        agent_name=agent_request.agent_name,
        agent_code=agent_request.agent_code,
        status=response.status,
        assistant_message=response.assistant_message,
        request_model=response.request_model,
        prompt_tokens=response.prompt_tokens,
        completion_tokens=response.completion_tokens,
        total_tokens=response.total_tokens,
        cost_total=cost_total,
        latency_ms=response.latency_ms,
        steps=response.steps,
        references=response.references,
        tool_calls=response.tool_calls,
        model_call=response.model_call,
        error_message=response.error_message,
    )
    step = RuntimeAgentTeamStepResult(
        member_id=member.member_id,
        agent_id=agent_id,
        step_type="AGENT_RUN",
        title=f"{agent_request.agent_name} 执行 {member.role}",
        status=response_status_to_step_status(response.status),
        input_summary=member.responsibility or request.objective.strip(),
        output_summary=response.assistant_message[:1000],
        trace_id=trace_id,
        span_id=member_span_id,
        parent_span_id=root_span_id,
        duration_ms=max(1, elapsed_ms(member_started_at)),
        prompt_tokens=response.prompt_tokens,
        completion_tokens=response.completion_tokens,
        total_tokens=response.total_tokens,
        cost_total=cost_total,
        error_message=response.error_message,
        started_at=member_started_iso,
        ended_at=utc_now(),
    )
    return MemberExecution(member=member, result=result, step=step)


async def run_supervisor_members(
    request: RuntimeAgentTeamRequest,
    members: list[RuntimeAgentTeamMemberRequest],
    trace_id: str,
    root_span_id: str,
) -> SupervisorRun:
    if not members:
        return SupervisorRun(
            executions=[],
            steps=[build_supervisor_step(request, trace_id, root_span_id, 1, None, "Supervisor 未找到可调度成员。", "SKIPPED")],
            handoffs=[],
        )

    resume_context = request.resume_context
    completed_member_ids = set(resume_context.completed_member_ids if resume_context else [])
    previous_outputs = (resume_context.previous_outputs if resume_context else []).copy()
    remaining = [member for member in members if member.member_id not in completed_member_ids]
    executions: list[MemberExecution] = []
    steps: list[RuntimeAgentTeamStepResult] = []
    handoffs: list[RuntimeAgentTeamHandoffResult] = []
    max_rounds = max(1, request.team.max_rounds)
    round_index = resume_context.next_round_index if resume_context and resume_context.next_round_index > 0 else 1

    while remaining and round_index <= max_rounds:
        decision = await build_supervisor_decision(request, remaining, executions, round_index, trace_id, root_span_id)
        next_member = resolve_decision_member(decision, remaining)
        if should_accept_stop_decision(request, decision, executions):
            steps.append(
                build_supervisor_step(
                    request,
                    trace_id,
                    root_span_id,
                    round_index,
                    None,
                    format_supervisor_decision(decision, None, remaining, executions, round_index),
                    "SUCCESS",
                    decision.model_call,
                    decision.model_cost_total,
                )
            )
            break

        if should_accept_wait_human_decision(request, decision):
            steps.append(
                build_supervisor_step(
                    request,
                    trace_id,
                    root_span_id,
                    round_index,
                    None,
                    format_supervisor_decision(decision, None, remaining, executions, round_index),
                    "SKIPPED",
                    decision.model_call,
                    decision.model_cost_total,
                )
            )
            last_execution = executions[-1] if executions else None
            handoffs.append(
                RuntimeAgentTeamHandoffResult(
                    from_member_id=last_execution.member.member_id if last_execution else None,
                    to_member_id=None,
                    from_agent_id=last_execution.result.agent_id if last_execution else None,
                    to_agent_id=None,
                    reason=f"Supervisor 模型判断需要人工介入：{decision.reason}",
                    status="PENDING",
                    decision_note="等待人工审批后继续。",
                    decided_at=None,
                )
            )
            return SupervisorRun(
                executions=executions,
                steps=steps + build_handoff_steps(handoffs, trace_id, root_span_id),
                handoffs=handoffs,
                waiting_human=True,
                error_message="Supervisor 模型判断需要人工介入。",
            )

        if next_member is None:
            decision = build_runnable_fallback_decision(request, decision, remaining, executions, round_index)
            next_member = choose_next_member(remaining, executions)

        steps.append(
            build_supervisor_step(
                request,
                trace_id,
                root_span_id,
                round_index,
                next_member,
                format_supervisor_decision(decision, next_member, remaining, executions, round_index),
                "SUCCESS",
                decision.model_call,
                decision.model_cost_total,
            )
        )
        execution = await run_member(request, next_member, trace_id, root_span_id, previous_outputs)
        execution.round_index = round_index
        executions.append(execution)
        remaining = [member for member in remaining if member.member_id != next_member.member_id]

        if execution.result.assistant_message:
            previous_outputs.append(f"{execution.result.agent_name}：{execution.result.assistant_message}")

        if execution.result.status == "FAILED":
            if should_retry_member(next_member, execution):
                retry_decision = (
                    f"第 {round_index} 轮检测到 {execution.result.agent_name} 执行失败，"
                    "Supervisor 决定立即重试一次。"
                )
                steps.append(build_supervisor_step(request, trace_id, root_span_id, round_index, next_member, retry_decision, "SUCCESS"))
                retry_execution = await run_member(request, next_member, trace_id, root_span_id, previous_outputs)
                retry_execution.round_index = round_index
                retry_execution.attempt = 2
                retry_execution.step.title = f"{retry_execution.step.title}（重试）"
                executions.append(retry_execution)
                execution = retry_execution
                if retry_execution.result.assistant_message:
                    previous_outputs.append(f"{retry_execution.result.agent_name}：{retry_execution.result.assistant_message}")

            if execution.result.status == "FAILED" and next_member.required:
                waiting_required = request.team.handoff_policy == "APPROVAL_REQUIRED"
                status = "PENDING" if waiting_required else "AUTO"
                handoffs.append(
                    RuntimeAgentTeamHandoffResult(
                        from_member_id=next_member.member_id,
                        to_member_id=None,
                        from_agent_id=execution.result.agent_id,
                        to_agent_id=None,
                        reason=f"Supervisor 检测到必选成员 {execution.result.agent_name} 执行失败，需要人工介入。",
                        status=status,
                        decision_note="等待人工审批后继续。" if waiting_required else "Supervisor 自动终止后续调度。",
                        decided_at=None if waiting_required else utc_now(),
                    )
                )
                steps.append(
                    build_supervisor_step(
                        request,
                        trace_id,
                        root_span_id,
                        round_index,
                        next_member,
                        "必选成员失败，Supervisor 已暂停后续调度并等待人工介入。" if waiting_required else "必选成员失败，Supervisor 已提前结束。",
                        "SKIPPED" if waiting_required else "FAILED",
                    )
                )
                return SupervisorRun(
                    executions=executions,
                    steps=steps + build_handoff_steps(handoffs, trace_id, root_span_id),
                    handoffs=handoffs,
                    waiting_human=waiting_required,
                    error_message=f"必选成员 {execution.result.agent_name} 执行失败。",
                )

        if is_objective_satisfied(request, executions):
            steps.append(
                build_supervisor_step(
                    request,
                    trace_id,
                    root_span_id,
                    round_index,
                    next_member,
                    "Supervisor 判断当前团队输出已覆盖目标，提前结束剩余成员调度。",
                    "SUCCESS",
                )
            )
            break

        next_candidate = choose_next_member(remaining, executions) if remaining else None
        if next_candidate:
            handoffs.append(
                RuntimeAgentTeamHandoffResult(
                    from_member_id=next_member.member_id,
                    to_member_id=next_candidate.member_id,
                    from_agent_id=execution.result.agent_id,
                    to_agent_id=next_candidate.agent_request.agent.agent_id if next_candidate.agent_request.agent else None,
                    reason=f"Supervisor 第 {round_index} 轮接力：{execution.result.agent_name} 完成后交给 {next_candidate.agent_request.agent_name}。",
                    status="AUTO",
                    decision_note="Runtime Supervisor 多轮决策自动生成。",
                    decided_at=utc_now(),
                )
            )

        round_index += 1

    if remaining:
        skipped = "；".join(member.agent_request.agent_name for member in remaining)
        steps.append(
            build_supervisor_step(
                request,
                trace_id,
                root_span_id,
                round_index,
                None,
                f"已达到最大轮次 {max_rounds}，剩余成员未调度：{skipped}。",
                "SKIPPED",
            )
        )

    return SupervisorRun(
        executions=executions,
        steps=steps + build_handoff_steps(handoffs, trace_id, root_span_id),
        handoffs=handoffs,
    )


def build_member_agent_request(
    request: RuntimeAgentTeamRequest,
    member: RuntimeAgentTeamMemberRequest,
    trace_id: str,
    parent_span_id: str,
    previous_outputs: list[str],
) -> RuntimeConversationRequest:
    agent_request = member.agent_request.model_copy(deep=True)
    agent_request.request_id = request.request_id
    agent_request.trace_id = trace_id
    agent_request.parent_span_id = parent_span_id
    agent_request.traceparent = build_traceparent(trace_id, parent_span_id)
    agent_request.user_message = build_member_user_message(request, member, previous_outputs)
    return agent_request


def build_member_user_message(
    request: RuntimeAgentTeamRequest,
    member: RuntimeAgentTeamMemberRequest,
    previous_outputs: list[str],
) -> str:
    parts = [
        f"团队目标：{request.objective.strip()}",
        f"你的团队角色：{member.role}",
    ]
    if member.responsibility:
        parts.append(f"你的职责：{member.responsibility.strip()}")
    if previous_outputs:
        parts.append("上游成员输出：")
        parts.extend(previous_outputs[-5:])
    parts.append(f"请基于你的职责给出中文执行结果。原始输入：{member.agent_request.user_message.strip()}")
    return "\n".join(parts)


def build_plan_summary(
    request: RuntimeAgentTeamRequest,
    members: list[RuntimeAgentTeamMemberRequest],
) -> str:
    mode_notes = {
        "SEQUENTIAL": "按成员 execution_order 顺序执行，每个成员可读取上游成员输出。",
        "PARALLEL": "并行触发全部成员执行，每个成员基于同一目标独立处理，最后统一汇总。",
        "SUPERVISOR": "先生成 Supervisor 调度决策，再按计划顺序执行成员并自动记录接力。",
    }
    mode_note = mode_notes.get(request.team.mode, "按顺序执行成员步骤。")
    return f"已规划 {len(members)} 个成员，最大轮次 {request.team.max_rounds}，接力策略 {request.team.handoff_policy}，{mode_note}"


def build_supervisor_plan(
    request: RuntimeAgentTeamRequest,
    members: list[RuntimeAgentTeamMemberRequest],
) -> str:
    if not members:
        return "Supervisor 未找到可调度成员。"

    lines = [
        f"Supervisor 已分析目标：{request.objective.strip()}",
        "调度顺序：",
    ]
    lines.extend(
        f"{index + 1}. {member.agent_request.agent_name} 负责 {member.role}，职责：{member.responsibility or '按团队目标执行'}"
        for index, member in enumerate(members)
    )
    lines.append("执行策略：先让成员逐步产出，再由团队汇总步骤合并结论。")
    return "\n".join(lines)


def build_supervisor_step(
    request: RuntimeAgentTeamRequest,
    trace_id: str,
    root_span_id: str,
    round_index: int,
    member: RuntimeAgentTeamMemberRequest | None,
    output_summary: str,
    status: str,
    model_call: RuntimeModelCallSummary | None = None,
    cost_total: float = 0,
) -> RuntimeAgentTeamStepResult:
    started_at = time.time()
    return RuntimeAgentTeamStepResult(
        member_id=member.member_id if member else None,
        agent_id=member.agent_request.agent.agent_id if member and member.agent_request.agent else None,
        step_type="VERIFY",
        title=f"Supervisor 第 {round_index} 轮决策",
        status=status,
        input_summary=request.objective.strip(),
        output_summary=output_summary,
        trace_id=trace_id,
        span_id=create_span_id(),
        parent_span_id=root_span_id,
        duration_ms=max(1, model_call.latency_ms if model_call else elapsed_ms(started_at)),
        prompt_tokens=model_call.prompt_tokens if model_call else 0,
        completion_tokens=model_call.completion_tokens if model_call else 0,
        total_tokens=model_call.total_tokens if model_call else 0,
        cost_total=cost_total,
        error_message=model_call.error_message if model_call and model_call.status == "FAILED" else None,
        started_at=utc_now(),
        ended_at=utc_now(),
    )


async def build_supervisor_decision(
    request: RuntimeAgentTeamRequest,
    remaining: list[RuntimeAgentTeamMemberRequest],
    executions: list[MemberExecution],
    round_index: int,
    trace_id: str,
    root_span_id: str,
) -> SupervisorDecision:
    fallback_member = choose_next_member(remaining, executions)
    fallback_decision = SupervisorDecision(
        action="RUN_MEMBER",
        next_member_id=fallback_member.member_id,
        reason=build_rule_supervisor_reason(request, remaining, executions, fallback_member, round_index),
        confidence=0.55,
        source="RULE_FALLBACK",
    )
    model_config = select_supervisor_model_config(remaining, executions)
    if model_config is None:
        fallback_decision.fallback_reason = "未找到可用成员模型配置。"
        return fallback_decision

    supervisor_request = build_supervisor_model_request(
        request=request,
        remaining=remaining,
        executions=executions,
        round_index=round_index,
        model_config=model_config,
        trace_id=trace_id,
        root_span_id=root_span_id,
    )
    model_call = await asyncio.to_thread(execute_openai_compatible_chat, supervisor_request, trace_id)
    cost_total = calculate_model_cost(model_config, model_call) or 0
    if model_call.status != "SUCCESS":
        fallback_decision.model_call = model_call
        fallback_decision.model_cost_total = cost_total
        fallback_decision.fallback_reason = model_call.error_message or "Supervisor 模型调用失败。"
        return fallback_decision

    output_text = model_call.response_summary.get("output_text")
    if not isinstance(output_text, str):
        output_text = ""

    try:
        model_decision = parse_supervisor_model_decision(output_text, remaining)
    except ValueError as error:
        fallback_decision.model_call = model_call
        fallback_decision.model_cost_total = cost_total
        fallback_decision.fallback_reason = str(error)
        return fallback_decision

    model_decision.model_call = model_call
    model_decision.model_cost_total = cost_total
    return model_decision


def build_rule_supervisor_reason(
    request: RuntimeAgentTeamRequest,
    remaining: list[RuntimeAgentTeamMemberRequest],
    executions: list[MemberExecution],
    next_member: RuntimeAgentTeamMemberRequest,
    round_index: int,
) -> str:
    completed = "、".join(execution.result.agent_name for execution in executions) or "暂无"
    remaining_names = "、".join(member.agent_request.agent_name for member in remaining)
    return (
        f"第 {round_index} 轮 Supervisor 规则决策：已完成成员 {completed}；"
        f"待选成员 {remaining_names}；"
        f"本轮选择 {next_member.agent_request.agent_name} 执行 {next_member.role}。"
    )


def select_supervisor_model_config(
    remaining: list[RuntimeAgentTeamMemberRequest],
    executions: list[MemberExecution],
) -> RuntimeModelConfig | None:
    for member in remaining:
        if member.agent_request.runtime_model_config:
            return member.agent_request.runtime_model_config

    for execution in reversed(executions):
        if execution.member.agent_request.runtime_model_config:
            return execution.member.agent_request.runtime_model_config

    return None


def build_supervisor_model_request(
    request: RuntimeAgentTeamRequest,
    remaining: list[RuntimeAgentTeamMemberRequest],
    executions: list[MemberExecution],
    round_index: int,
    model_config: RuntimeModelConfig,
    trace_id: str,
    root_span_id: str,
) -> RuntimeConversationRequest:
    parent_span_id = create_span_id()
    return RuntimeConversationRequest(
        request_id=request.request_id,
        trace_id=trace_id,
        parent_span_id=parent_span_id,
        traceparent=build_traceparent(trace_id, parent_span_id),
        conversation_id=None,
        agent=None,
        agent_name="团队 Supervisor",
        agent_code="team_supervisor",
        user_message=json.dumps(
            build_supervisor_decision_payload(request, remaining, executions, round_index),
            ensure_ascii=False,
        ),
        history=[],
        prompt_messages=[
            RuntimePromptMessage(
                role="system",
                content=(
                    "你是企业 Agent 团队的 Supervisor 调度器。"
                    "你只负责选择下一步调度动作，不直接回答业务问题。"
                    "必须只输出严格 JSON，不要输出 Markdown、代码块或额外解释。"
                ),
            ),
            RuntimePromptMessage(
                role="user",
                content=(
                    "请根据团队目标、已完成结果、失败情况和剩余成员，输出下一步决策。"
                    "JSON 字段必须包含：action、next_member_id、reason、confidence。"
                    "action 只能是 RUN_MEMBER、RETRY_MEMBER、WAIT_HUMAN、STOP。"
                    "RUN_MEMBER 或 RETRY_MEMBER 时 next_member_id 必须是 remaining_members 中的 member_id。"
                    "STOP 或 WAIT_HUMAN 时 next_member_id 可以为 null。"
                    "reason 必须使用中文，confidence 是 0 到 1 的数字。"
                ),
            ),
        ],
        prompts=[],
        knowledge_bindings=[],
        tools=[],
        tool_calls=[],
        references=[],
        control_api=None,
        model_config=model_config,
    )


def build_supervisor_decision_payload(
    request: RuntimeAgentTeamRequest,
    remaining: list[RuntimeAgentTeamMemberRequest],
    executions: list[MemberExecution],
    round_index: int,
) -> dict[str, Any]:
    return {
        "objective": request.objective.strip(),
        "team": {
            "name": request.team.name,
            "code": request.team.code,
            "mode": request.team.mode,
            "max_rounds": request.team.max_rounds,
            "handoff_policy": request.team.handoff_policy,
        },
        "round_index": round_index,
        "remaining_members": [
            {
                "member_id": member.member_id,
                "agent_name": member.agent_request.agent_name,
                "agent_code": member.agent_request.agent_code,
                "role": member.role,
                "responsibility": member.responsibility,
                "execution_order": member.execution_order,
                "required": member.required,
            }
            for member in remaining
        ],
        "completed_executions": [
            {
                "member_id": execution.member.member_id,
                "agent_name": execution.result.agent_name,
                "role": execution.member.role,
                "status": execution.result.status,
                "round_index": execution.round_index,
                "attempt": execution.attempt,
                "assistant_message_preview": execution.result.assistant_message[:800],
                "error_message": execution.result.error_message,
            }
            for execution in executions[-8:]
        ],
        "decision_rules": [
            "优先保证必选成员完成。",
            "如果必选成员失败且还有审核、复核或安全角色可调度，优先交给该成员处理。",
            "如果已覆盖目标，可以 STOP。",
            "如果需要人工介入且 handoff_policy 为 APPROVAL_REQUIRED，可以 WAIT_HUMAN。",
            "不要选择 remaining_members 之外的成员。",
        ],
    }


def parse_supervisor_model_decision(
    output_text: str,
    remaining: list[RuntimeAgentTeamMemberRequest],
) -> SupervisorDecision:
    payload = extract_json_object(output_text)
    action = normalize_supervisor_action(payload.get("action"))
    next_member_id = payload.get("next_member_id")
    if next_member_id is not None and not isinstance(next_member_id, str):
        next_member_id = None

    valid_member_ids = {member.member_id for member in remaining}
    if action in {"RUN_MEMBER", "RETRY_MEMBER"}:
        if next_member_id not in valid_member_ids:
            raise ValueError("Supervisor 模型返回了无效成员 ID，已切换规则回退。")
    elif next_member_id not in valid_member_ids:
        next_member_id = None

    reason = payload.get("reason")
    if not isinstance(reason, str) or not reason.strip():
        reason = "Supervisor 模型完成调度判断。"

    confidence = payload.get("confidence")
    if not isinstance(confidence, int | float):
        confidence = 0.7
    confidence = max(0, min(1, float(confidence)))

    return SupervisorDecision(
        action=action,
        next_member_id=next_member_id,
        reason=reason.strip()[:1000],
        confidence=confidence,
        source="MODEL",
    )


def extract_json_object(output_text: str) -> dict[str, Any]:
    value = output_text.strip()
    if value.startswith("```"):
        lines = value.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        value = "\n".join(lines).strip()

    try:
        parsed = json.loads(value)
    except json.JSONDecodeError:
        start = value.find("{")
        end = value.rfind("}")
        if start < 0 or end <= start:
            raise ValueError("Supervisor 模型未返回 JSON 对象，已切换规则回退。") from None
        try:
            parsed = json.loads(value[start : end + 1])
        except json.JSONDecodeError as error:
            raise ValueError(f"Supervisor 模型 JSON 解析失败：{error.msg}，已切换规则回退。") from error

    if not isinstance(parsed, dict):
        raise ValueError("Supervisor 模型返回内容不是 JSON 对象，已切换规则回退。")
    return parsed


def normalize_supervisor_action(value: Any) -> str:
    if isinstance(value, str):
        normalized = value.strip().upper()
        if normalized in {"RUN_MEMBER", "RETRY_MEMBER", "WAIT_HUMAN", "STOP"}:
            return normalized
    return "RUN_MEMBER"


def resolve_decision_member(
    decision: SupervisorDecision,
    remaining: list[RuntimeAgentTeamMemberRequest],
) -> RuntimeAgentTeamMemberRequest | None:
    if decision.action not in {"RUN_MEMBER", "RETRY_MEMBER"}:
        return None
    if not decision.next_member_id:
        return None
    for member in remaining:
        if member.member_id == decision.next_member_id:
            return member
    return None


def should_accept_stop_decision(
    request: RuntimeAgentTeamRequest,
    decision: SupervisorDecision,
    executions: list[MemberExecution],
) -> bool:
    if decision.source != "MODEL" or decision.action != "STOP":
        return False
    if not executions:
        return False
    if has_failed_required_member(executions):
        return False
    return is_objective_satisfied(request, executions)


def should_accept_wait_human_decision(
    request: RuntimeAgentTeamRequest,
    decision: SupervisorDecision,
) -> bool:
    return (
        decision.source == "MODEL"
        and decision.action == "WAIT_HUMAN"
        and request.team.handoff_policy == "APPROVAL_REQUIRED"
    )


def build_runnable_fallback_decision(
    request: RuntimeAgentTeamRequest,
    decision: SupervisorDecision,
    remaining: list[RuntimeAgentTeamMemberRequest],
    executions: list[MemberExecution],
    round_index: int,
) -> SupervisorDecision:
    fallback_member = choose_next_member(remaining, executions)
    fallback_reason = (
        f"Supervisor 模型返回 {decision.action}，但当前不满足执行条件，已切换为确定性规则调度。"
    )
    return SupervisorDecision(
        action="RUN_MEMBER",
        next_member_id=fallback_member.member_id,
        reason=build_rule_supervisor_reason(request, remaining, executions, fallback_member, round_index),
        confidence=0.55,
        source="RULE_FALLBACK",
        model_call=decision.model_call,
        model_cost_total=decision.model_cost_total,
        fallback_reason=fallback_reason,
    )


def format_supervisor_decision(
    decision: SupervisorDecision,
    selected_member: RuntimeAgentTeamMemberRequest | None,
    remaining: list[RuntimeAgentTeamMemberRequest],
    executions: list[MemberExecution],
    round_index: int,
) -> str:
    completed = "、".join(execution.result.agent_name for execution in executions) or "暂无"
    remaining_names = "、".join(member.agent_request.agent_name for member in remaining)
    decision_source = "模型决策" if decision.source == "MODEL" else "规则回退"
    lines = [
        f"第 {round_index} 轮 Supervisor {decision_source}：已完成成员 {completed}；待选成员 {remaining_names}。",
        format_supervisor_action_line(decision, selected_member),
        f"决策理由：{decision.reason}",
    ]
    if decision.fallback_reason:
        lines.append(f"回退原因：{decision.fallback_reason}")
    if decision.model_call and decision.source != "MODEL":
        lines.append("模型调用结果不可用，本轮已使用确定性规则继续调度。")
    return "\n".join(lines)


def format_supervisor_action_line(
    decision: SupervisorDecision,
    selected_member: RuntimeAgentTeamMemberRequest | None,
) -> str:
    if selected_member:
        return (
            f"动作 {decision.action}，选择 {selected_member.agent_request.agent_name} "
            f"执行 {selected_member.role}，置信度 {decision.confidence:.2f}。"
        )
    if decision.action == "STOP":
        return f"动作 STOP，当前轮次不再调度新成员，置信度 {decision.confidence:.2f}。"
    if decision.action == "WAIT_HUMAN":
        return f"动作 WAIT_HUMAN，当前轮次进入人工介入，置信度 {decision.confidence:.2f}。"
    return f"动作 {decision.action} 未指定有效成员，置信度 {decision.confidence:.2f}。"


def choose_next_member(
    remaining: list[RuntimeAgentTeamMemberRequest],
    executions: list[MemberExecution],
) -> RuntimeAgentTeamMemberRequest:
    if not executions:
        return remaining[0]

    failed_required = [
        execution for execution in executions
        if execution.result.status == "FAILED" and execution.member.required
    ]
    if failed_required:
        for member in remaining:
            if "审核" in member.role or "复核" in member.role or "安全" in member.role:
                return member

    return remaining[0]


def should_retry_member(member: RuntimeAgentTeamMemberRequest, execution: MemberExecution) -> bool:
    if execution.attempt > 1:
        return False
    if not member.required:
        return False
    return execution.result.status == "FAILED"


def has_failed_required_member(executions: list[MemberExecution]) -> bool:
    latest_by_member: dict[str, MemberExecution] = {}
    for execution in executions:
        latest_by_member[execution.member.member_id] = execution

    return any(
        execution.result.status == "FAILED" and execution.member.required
        for execution in latest_by_member.values()
    )


def is_objective_satisfied(
    request: RuntimeAgentTeamRequest,
    executions: list[MemberExecution],
) -> bool:
    if len(executions) >= len(request.members):
        return True
    if len(executions) < 2:
        return False
    if request.team.max_rounds <= len(executions):
        return True

    successful_required = {
        execution.member.member_id
        for execution in executions
        if execution.member.required and execution.result.status == "SUCCESS"
    }
    all_required = {
        member.member_id
        for member in request.members
        if member.required
    }
    return bool(all_required) and all_required.issubset(successful_required)


def build_auto_handoffs(executions: list[MemberExecution]) -> list[RuntimeAgentTeamHandoffResult]:
    handoffs: list[RuntimeAgentTeamHandoffResult] = []
    for index, current in enumerate(executions[:-1]):
        next_execution = executions[index + 1]
        handoffs.append(
            RuntimeAgentTeamHandoffResult(
                from_member_id=current.member.member_id,
                to_member_id=next_execution.member.member_id,
                from_agent_id=current.result.agent_id,
                to_agent_id=next_execution.result.agent_id,
                reason=f"Supervisor 自动接力：{current.result.agent_name} 完成 {current.member.role} 后交给 {next_execution.result.agent_name}。",
                status="AUTO",
                decision_note="Runtime Supervisor 自动生成。",
                decided_at=utc_now(),
            )
        )
    return handoffs


def build_handoff_steps(
    handoffs: list[RuntimeAgentTeamHandoffResult],
    trace_id: str,
    root_span_id: str,
) -> list[RuntimeAgentTeamStepResult]:
    steps: list[RuntimeAgentTeamStepResult] = []
    for handoff in handoffs:
        started_at = time.time()
        steps.append(
            RuntimeAgentTeamStepResult(
                member_id=handoff.to_member_id,
                agent_id=handoff.to_agent_id,
                step_type="HANDOFF",
                title="Supervisor 自动接力",
                status="SUCCESS",
                input_summary=handoff.from_member_id,
                output_summary=handoff.reason,
                trace_id=trace_id,
                span_id=create_span_id(),
                parent_span_id=root_span_id,
                duration_ms=max(1, elapsed_ms(started_at)),
                started_at=utc_now(),
                ended_at=utc_now(),
            )
        )
    return steps


def build_summary_message(
    request: RuntimeAgentTeamRequest,
    member_results: list[RuntimeAgentTeamMemberResult],
    waiting_human: bool = False,
) -> str:
    if not member_results:
        if waiting_human:
            return f"团队 {request.team.name} 已进入人工介入，当前尚未产生可汇总的成员结果。"
        return f"团队 {request.team.name} 未产生可汇总的成员结果。"

    successful = [item for item in member_results if item.status == "SUCCESS"]
    failed = [item for item in member_results if item.status == "FAILED"]
    result_lines = [
        f"团队 {request.team.name} 已围绕目标完成 {len(member_results)} 个成员执行步骤。",
        f"执行模式 {request.team.mode}，成功 {len(successful)} 个，失败 {len(failed)} 个。",
    ]
    if waiting_human:
        result_lines.append("当前运行已暂停，等待人工介入后继续。")
    result_lines.extend(f"{item.agent_name}：{item.assistant_message[:300]}" for item in successful[:5])
    if failed:
        result_lines.append("失败成员：" + "；".join(f"{item.agent_name}：{item.error_message or '未知错误'}" for item in failed))
    return "\n".join(result_lines)


def response_cost(response: RuntimeConversationResponse) -> float:
    return round(sum(step.cost_total or 0 for step in response.steps), 6)


def response_status_to_step_status(status: str) -> str:
    return "SUCCESS" if status == "SUCCESS" else "FAILED"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()
