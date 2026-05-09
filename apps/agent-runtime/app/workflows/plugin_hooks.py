from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta

try:
    from temporalio import activity, workflow
except ImportError:  # pragma: no cover - Temporal is optional until enabled.
    activity = None
    workflow = None


@dataclass
class PluginHookWorkflowInput:
    event_id: str
    plugin_id: str
    hook_id: str
    workflow_id: str | None = None
    run_id: str | None = None


@dataclass
class PluginHookWorkflowResult:
    event_id: str
    plugin_id: str
    hook_id: str
    status: str


if activity is not None:

    @activity.defn
    async def run_plugin_hook_activity(
        input: PluginHookWorkflowInput,
    ) -> PluginHookWorkflowResult:
        from app.workflows.worker import run_control_api_plugin_hook

        status = await run_control_api_plugin_hook(
            input.event_id,
            input.plugin_id,
            input.hook_id,
            input.workflow_id,
            input.run_id,
        )
        return PluginHookWorkflowResult(
            event_id=input.event_id,
            plugin_id=input.plugin_id,
            hook_id=input.hook_id,
            status=status,
        )

else:

    async def run_plugin_hook_activity(
        input: PluginHookWorkflowInput,
    ) -> PluginHookWorkflowResult:
        from app.workflows.worker import run_control_api_plugin_hook

        status = await run_control_api_plugin_hook(
            input.event_id,
            input.plugin_id,
            input.hook_id,
            input.workflow_id,
            input.run_id,
        )
        return PluginHookWorkflowResult(
            event_id=input.event_id,
            plugin_id=input.plugin_id,
            hook_id=input.hook_id,
            status=status,
        )


if workflow is not None:

    @workflow.defn
    class PluginHookWorkflow:
        @workflow.run
        async def run(
            self,
            input: PluginHookWorkflowInput,
        ) -> PluginHookWorkflowResult:
            return await workflow.execute_activity(
                run_plugin_hook_activity,
                input,
                start_to_close_timeout=timedelta(minutes=10),
            )

else:

    class PluginHookWorkflow:
        async def run(
            self,
            input: PluginHookWorkflowInput,
        ) -> PluginHookWorkflowResult:
            return await run_plugin_hook_activity(input)
