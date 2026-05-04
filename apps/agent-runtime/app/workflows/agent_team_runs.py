from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta

try:
    from temporalio import activity, workflow
except ImportError:  # pragma: no cover - Temporal is optional until enabled.
    activity = None
    workflow = None


@dataclass
class AgentTeamRunWorkflowInput:
    run_id: str


@dataclass
class AgentTeamRunWorkflowResult:
    run_id: str
    status: str


@dataclass
class AgentTeamRunResumeSignal:
    approved: bool
    handoff_id: str | None = None
    decision_note: str | None = None
    completed_member_ids: list[str] | None = None
    previous_outputs: list[str] | None = None
    next_round_index: int | None = None


if activity is not None:

    @activity.defn
    async def run_agent_team_run_activity(run_id: str) -> AgentTeamRunWorkflowResult:
        from app.workflows.worker import run_control_api_agent_team_run

        status = await run_control_api_agent_team_run(run_id)
        return AgentTeamRunWorkflowResult(run_id=run_id, status=status)

else:

    async def run_agent_team_run_activity(run_id: str) -> AgentTeamRunWorkflowResult:
        from app.workflows.worker import run_control_api_agent_team_run

        status = await run_control_api_agent_team_run(run_id)
        return AgentTeamRunWorkflowResult(run_id=run_id, status=status)


if workflow is not None:

    @workflow.defn
    class AgentTeamRunWorkflow:
        def __init__(self) -> None:
            self.resume_signal: AgentTeamRunResumeSignal | None = None

        @workflow.signal
        async def resume_after_handoff(self, signal: AgentTeamRunResumeSignal) -> None:
            self.resume_signal = signal

        @workflow.run
        async def run(self, input: AgentTeamRunWorkflowInput) -> AgentTeamRunWorkflowResult:
            waiting_for_signal = False
            while True:
                if waiting_for_signal:
                    await workflow.wait_condition(lambda: self.resume_signal is not None)
                    signal = self.resume_signal
                    self.resume_signal = None
                    if not signal:
                        continue
                    if not signal.approved:
                        return AgentTeamRunWorkflowResult(run_id=input.run_id, status="REJECTED")

                result = await workflow.execute_activity(
                    run_agent_team_run_activity,
                    input.run_id,
                    start_to_close_timeout=timedelta(minutes=30),
                )
                if result.status != "WAITING_HUMAN":
                    return result

                waiting_for_signal = True

else:

    class AgentTeamRunWorkflow:
        def __init__(self) -> None:
            self.resume_signal: AgentTeamRunResumeSignal | None = None

        async def resume_after_handoff(self, signal: AgentTeamRunResumeSignal) -> None:
            self.resume_signal = signal

        async def run(self, input: AgentTeamRunWorkflowInput) -> AgentTeamRunWorkflowResult:
            return await run_agent_team_run_activity(input.run_id)
