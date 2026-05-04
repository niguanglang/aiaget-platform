from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta

try:
    from temporalio import activity, workflow
except ImportError:  # pragma: no cover - Temporal is optional until enabled.
    activity = None
    workflow = None


@dataclass
class ChannelReleaseAutomationWorkflowInput:
    channel_id: str
    workflow_id: str | None = None
    run_id: str | None = None


@dataclass
class ChannelReleaseAutomationWorkflowResult:
    channel_id: str
    status: str


if activity is not None:

    @activity.defn
    async def run_channel_release_automation_activity(
        input: ChannelReleaseAutomationWorkflowInput,
    ) -> ChannelReleaseAutomationWorkflowResult:
        from app.workflows.worker import run_control_api_channel_release_automation

        status = await run_control_api_channel_release_automation(
            input.channel_id,
            input.workflow_id,
            input.run_id,
        )
        return ChannelReleaseAutomationWorkflowResult(channel_id=input.channel_id, status=status)

else:

    async def run_channel_release_automation_activity(
        input: ChannelReleaseAutomationWorkflowInput,
    ) -> ChannelReleaseAutomationWorkflowResult:
        from app.workflows.worker import run_control_api_channel_release_automation

        status = await run_control_api_channel_release_automation(
            input.channel_id,
            input.workflow_id,
            input.run_id,
        )
        return ChannelReleaseAutomationWorkflowResult(channel_id=input.channel_id, status=status)


if workflow is not None:

    @workflow.defn
    class ChannelReleaseAutomationWorkflow:
        @workflow.run
        async def run(
            self,
            input: ChannelReleaseAutomationWorkflowInput,
        ) -> ChannelReleaseAutomationWorkflowResult:
            return await workflow.execute_activity(
                run_channel_release_automation_activity,
                input,
                start_to_close_timeout=timedelta(minutes=10),
            )

else:

    class ChannelReleaseAutomationWorkflow:
        async def run(
            self,
            input: ChannelReleaseAutomationWorkflowInput,
        ) -> ChannelReleaseAutomationWorkflowResult:
            return await run_channel_release_automation_activity(input)
