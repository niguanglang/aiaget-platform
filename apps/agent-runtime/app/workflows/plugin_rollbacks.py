from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta

try:
    from temporalio import activity, workflow
except ImportError:  # pragma: no cover - Temporal is optional until enabled.
    activity = None
    workflow = None


@dataclass
class PluginRollbackWorkflowInput:
    plugin_id: str
    version_id: str
    version: str
    workflow_id: str | None = None
    run_id: str | None = None


@dataclass
class PluginRollbackWorkflowResult:
    plugin_id: str
    version_id: str
    version: str
    status: str


if activity is not None:

    @activity.defn
    async def run_plugin_rollback_activity(
        input: PluginRollbackWorkflowInput,
    ) -> PluginRollbackWorkflowResult:
        from app.workflows.worker import run_control_api_plugin_rollback

        status = await run_control_api_plugin_rollback(
            input.plugin_id,
            input.version_id,
            input.version,
            input.workflow_id,
            input.run_id,
        )
        return PluginRollbackWorkflowResult(
            plugin_id=input.plugin_id,
            version_id=input.version_id,
            version=input.version,
            status=status,
        )

else:

    async def run_plugin_rollback_activity(
        input: PluginRollbackWorkflowInput,
    ) -> PluginRollbackWorkflowResult:
        from app.workflows.worker import run_control_api_plugin_rollback

        status = await run_control_api_plugin_rollback(
            input.plugin_id,
            input.version_id,
            input.version,
            input.workflow_id,
            input.run_id,
        )
        return PluginRollbackWorkflowResult(
            plugin_id=input.plugin_id,
            version_id=input.version_id,
            version=input.version,
            status=status,
        )


if workflow is not None:

    @workflow.defn
    class PluginRollbackWorkflow:
        @workflow.run
        async def run(
            self,
            input: PluginRollbackWorkflowInput,
        ) -> PluginRollbackWorkflowResult:
            return await workflow.execute_activity(
                run_plugin_rollback_activity,
                input,
                start_to_close_timeout=timedelta(minutes=10),
            )

else:

    class PluginRollbackWorkflow:
        async def run(
            self,
            input: PluginRollbackWorkflowInput,
        ) -> PluginRollbackWorkflowResult:
            return await run_plugin_rollback_activity(input)
