from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from app.core.settings import settings
from app.runtime.contracts import (
    AgentTeamWorkflowResumeRequest,
    AgentTeamWorkflowStartRequest,
    ChannelReleaseAutomationWorkflowStartRequest,
    ChannelReleaseSelfHealingWorkflowStartRequest,
    HealthResponse,
    RuntimeAgentTeamRequest,
    RuntimeAgentTeamResponse,
    RuntimeConversationRequest,
    RuntimeConversationResponse,
    WorkflowStartRequest,
    WorkflowSignalResponse,
    WorkflowStartResponse,
)
from app.runtime.execution import build_runtime_response, stream_runtime_response_events
from app.runtime.helpers import apply_http_trace_context, apply_team_http_trace_context, sse_event, verify_runtime_internal_token
from app.runtime.team_execution import build_team_runtime_response
from app.workflows.worker import (
    resume_agent_team_run_workflow,
    start_agent_team_run_workflow,
    start_channel_release_automation_workflow,
    start_channel_release_self_healing_workflow,
    start_knowledge_task_workflow,
)


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


@app.post("/runtime/agent-teams/run", response_model=RuntimeAgentTeamResponse)
async def run_agent_team(request: RuntimeAgentTeamRequest, http_request: Request) -> RuntimeAgentTeamResponse:
    apply_team_http_trace_context(request, http_request)
    return await build_team_runtime_response(request)


@app.post("/runtime/conversations/respond-stream")
async def respond_stream(request: RuntimeConversationRequest, http_request: Request) -> StreamingResponse:
    apply_http_trace_context(request, http_request)

    async def event_stream():
        async for item in stream_runtime_response_events(request):
            yield sse_event(item["event"], item["data"])

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.post("/runtime/workflows/knowledge-tasks/start", response_model=WorkflowStartResponse)
async def start_knowledge_task_workflow_endpoint(
    request: WorkflowStartRequest,
    http_request: Request,
) -> WorkflowStartResponse:
    verify_runtime_internal_token(http_request)
    result = await start_knowledge_task_workflow(request.task_id)
    return WorkflowStartResponse(**result)


@app.post("/runtime/workflows/agent-team-runs/start", response_model=WorkflowStartResponse)
async def start_agent_team_run_workflow_endpoint(
    request: AgentTeamWorkflowStartRequest,
    http_request: Request,
) -> WorkflowStartResponse:
    verify_runtime_internal_token(http_request)
    result = await start_agent_team_run_workflow(request.run_id)
    return WorkflowStartResponse(**result)


@app.post("/runtime/workflows/agent-team-runs/resume", response_model=WorkflowSignalResponse)
async def resume_agent_team_run_workflow_endpoint(
    request: AgentTeamWorkflowResumeRequest,
    http_request: Request,
) -> WorkflowSignalResponse:
    verify_runtime_internal_token(http_request)
    result = await resume_agent_team_run_workflow(
        request.run_id,
        request.approved,
        request.handoff_id,
        request.decision_note,
        request.completed_member_ids,
        request.previous_outputs,
        request.next_round_index,
    )
    return WorkflowSignalResponse(**result)


@app.post("/runtime/workflows/channel-release-automation/start", response_model=WorkflowStartResponse)
async def start_channel_release_automation_workflow_endpoint(
    request: ChannelReleaseAutomationWorkflowStartRequest,
    http_request: Request,
) -> WorkflowStartResponse:
    verify_runtime_internal_token(http_request)
    result = await start_channel_release_automation_workflow(request.channel_id)
    return WorkflowStartResponse(**result)


@app.post("/runtime/workflows/channel-release-self-healing/start", response_model=WorkflowStartResponse)
async def start_channel_release_self_healing_workflow_endpoint(
    request: ChannelReleaseSelfHealingWorkflowStartRequest,
    http_request: Request,
) -> WorkflowStartResponse:
    verify_runtime_internal_token(http_request)
    result = await start_channel_release_self_healing_workflow(request.channel_id)
    return WorkflowStartResponse(**result)
