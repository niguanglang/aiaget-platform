from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta

try:
    from temporalio import activity, workflow
except ImportError:  # pragma: no cover - Temporal is optional until enabled.
    activity = None
    workflow = None

from app.runtime.contracts import RuntimeAgentTeamResumeSignal


@dataclass
class AgentTeamRunWorkflowInput:
    run_id: str


@dataclass
class AgentTeamRunWorkflowResult:
    run_id: str
    status: str


@dataclass
class AgentTeamRunActivityInput:
    run_id: str
    handoff_id: str | None = None
    decision_note: str | None = None
    completed_member_ids: list[str] | None = None
    previous_outputs: list[str] | None = None
    next_round_index: int | None = None


if activity is not None:

    @activity.defn
    async def run_agent_team_run_activity(input: AgentTeamRunActivityInput) -> AgentTeamRunWorkflowResult:
        from app.workflows.worker import run_control_api_agent_team_run

        status = await run_control_api_agent_team_run(
            input.run_id,
            input.handoff_id,
            input.decision_note,
            input.completed_member_ids,
            input.previous_outputs,
            input.next_round_index,
        )
        return AgentTeamRunWorkflowResult(run_id=input.run_id, status=status)

else:

    async def run_agent_team_run_activity(input: AgentTeamRunActivityInput) -> AgentTeamRunWorkflowResult:
        from app.workflows.worker import run_control_api_agent_team_run

        status = await run_control_api_agent_team_run(
            input.run_id,
            input.handoff_id,
            input.decision_note,
            input.completed_member_ids,
            input.previous_outputs,
            input.next_round_index,
        )
        return AgentTeamRunWorkflowResult(run_id=input.run_id, status=status)


if workflow is not None:

    @workflow.defn
    class AgentTeamRunWorkflow:
        def __init__(self) -> None:
            self.resume_signal: RuntimeAgentTeamResumeSignal | None = None

        @workflow.signal
        async def resume_after_handoff(self, signal: RuntimeAgentTeamResumeSignal) -> None:
            self.resume_signal = signal

        @workflow.run
        async def run(self, input: AgentTeamRunWorkflowInput) -> AgentTeamRunWorkflowResult:
            waiting_for_signal = False
            while True:
                activity_input = AgentTeamRunActivityInput(run_id=input.run_id)
                if waiting_for_signal:
                    await workflow.wait_condition(lambda: self.resume_signal is not None)
                    signal = self.resume_signal
                    self.resume_signal = None
                    if not signal:
                        continue
                    if not signal.approved:
                        return AgentTeamRunWorkflowResult(run_id=input.run_id, status="REJECTED")
                    activity_input = AgentTeamRunActivityInput(
                        run_id=input.run_id,
                        handoff_id=signal.handoff_id,
                        decision_note=signal.decision_note,
                        completed_member_ids=signal.completed_member_ids,
                        previous_outputs=signal.previous_outputs,
                        next_round_index=signal.next_round_index,
                    )

                result = await workflow.execute_activity(
                    run_agent_team_run_activity,
                    activity_input,
                    start_to_close_timeout=timedelta(minutes=30),
                )
                if result.status != "WAITING_HUMAN":
                    return result

                waiting_for_signal = True

else:

    class AgentTeamRunWorkflow:
        def __init__(self) -> None:
            self.resume_signal: RuntimeAgentTeamResumeSignal | None = None

        async def resume_after_handoff(self, signal: RuntimeAgentTeamResumeSignal) -> None:
            self.resume_signal = signal

        async def run(self, input: AgentTeamRunWorkflowInput) -> AgentTeamRunWorkflowResult:
            return await run_agent_team_run_activity(AgentTeamRunActivityInput(run_id=input.run_id))
