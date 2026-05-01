from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta

try:
    from temporalio import activity, workflow
except ImportError:  # pragma: no cover - local smoke tests can run without Temporal installed.
    activity = None
    workflow = None


@dataclass
class KnowledgeTaskWorkflowInput:
    task_id: str


@dataclass
class KnowledgeTaskWorkflowResult:
    task_id: str
    status: str


if activity is not None:

    @activity.defn
    async def run_knowledge_task_activity(task_id: str) -> KnowledgeTaskWorkflowResult:
        from app.workflows.worker import run_control_api_knowledge_task

        await run_control_api_knowledge_task(task_id)
        return KnowledgeTaskWorkflowResult(task_id=task_id, status="SUCCESS")

else:

    async def run_knowledge_task_activity(task_id: str) -> KnowledgeTaskWorkflowResult:
        from app.workflows.worker import run_control_api_knowledge_task

        await run_control_api_knowledge_task(task_id)
        return KnowledgeTaskWorkflowResult(task_id=task_id, status="SUCCESS")


if workflow is not None:

    @workflow.defn
    class KnowledgeTaskWorkflow:
        @workflow.run
        async def run(self, input: KnowledgeTaskWorkflowInput) -> KnowledgeTaskWorkflowResult:
            return await workflow.execute_activity(
                run_knowledge_task_activity,
                input.task_id,
                start_to_close_timeout=timedelta(minutes=30),
            )

else:

    class KnowledgeTaskWorkflow:
        async def run(self, input: KnowledgeTaskWorkflowInput) -> KnowledgeTaskWorkflowResult:
            return await run_knowledge_task_activity(input.task_id)
