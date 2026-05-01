from __future__ import annotations

import asyncio
import json
import logging
import urllib.error
import urllib.request
from typing import Any

from app.core.settings import settings
from app.workflows.knowledge_tasks import KnowledgeTaskWorkflow, KnowledgeTaskWorkflowInput, run_knowledge_task_activity

try:
    from temporalio.client import Client
    from temporalio.worker import Worker
except ImportError:  # pragma: no cover - Temporal is optional until enabled.
    Client = None
    Worker = None


logger = logging.getLogger(__name__)


async def start_knowledge_task_workflow(task_id: str) -> dict[str, str]:
    workflow_id = f"knowledge-task-{task_id}"
    if not settings.temporal_enabled:
        schedule_local_fallback(task_id)
        return {
            "workflow_id": workflow_id,
            "run_id": "local-fallback",
            "status": "STARTED",
            "backend": "LOCAL_FALLBACK",
        }

    if Client is None:
        raise RuntimeError("Temporal Python SDK is not installed")

    client = await Client.connect(settings.temporal_address, namespace=settings.temporal_namespace)
    handle = await client.start_workflow(
        KnowledgeTaskWorkflow.run,
        KnowledgeTaskWorkflowInput(task_id=task_id),
        id=workflow_id,
        task_queue=settings.temporal_task_queue,
    )
    return {
        "workflow_id": workflow_id,
        "run_id": getattr(handle, "result_run_id", "") or "",
        "status": "STARTED",
        "backend": "TEMPORAL",
    }


async def run_worker() -> None:
    if not settings.temporal_enabled:
        raise RuntimeError("RUNTIME_TEMPORAL_ENABLED must be true to start the Temporal worker")
    if Client is None or Worker is None:
        raise RuntimeError("Temporal Python SDK is not installed")

    client = await Client.connect(settings.temporal_address, namespace=settings.temporal_namespace)
    worker = Worker(
        client,
        task_queue=settings.temporal_task_queue,
        workflows=[KnowledgeTaskWorkflow],
        activities=[run_knowledge_task_activity],
    )
    await worker.run()


async def run_control_api_knowledge_task(task_id: str) -> None:
    await asyncio.to_thread(post_control_api_json, "/api/v1/runtime/internal/knowledge-tasks/run", {"task_id": task_id})


def schedule_local_fallback(task_id: str) -> None:
    task = asyncio.create_task(run_control_api_knowledge_task(task_id))
    task.add_done_callback(lambda completed: log_background_task_error(task_id, completed))


def log_background_task_error(task_id: str, task: asyncio.Task[None]) -> None:
    try:
        task.result()
    except Exception as error:  # pragma: no cover - best-effort local fallback logging.
        logger.error("Local fallback knowledge task %s failed: %s", task_id, error)


def post_control_api_json(path: str, payload: dict[str, Any]) -> dict[str, Any]:
    url = f"{settings.control_api_base_url.rstrip('/')}{path}"
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "accept": "application/json",
            "content-type": "application/json",
            "x-runtime-internal-token": settings.internal_token,
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            response_body = response.read().decode("utf-8")
            parsed = json.loads(response_body) if response_body else {}
    except urllib.error.HTTPError as error:
        response_body = error.read().decode("utf-8", errors="replace")
        parsed_error = safe_json(response_body)
        raise RuntimeError(extract_error(parsed_error) or f"Control API responded with HTTP {error.code}") from error

    if not isinstance(parsed, dict):
        raise RuntimeError("Control API returned an invalid JSON object")
    return parsed


def safe_json(value: str) -> Any:
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return value


def extract_error(value: Any) -> str | None:
    if isinstance(value, dict):
        if isinstance(value.get("message"), str):
            return value["message"]
        if isinstance(value.get("detail"), str):
            return value["detail"]
    if isinstance(value, str):
        return value[:500]
    return None


if __name__ == "__main__":
    asyncio.run(run_worker())
