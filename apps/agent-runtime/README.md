# Agent Runtime

FastAPI runtime service for agent execution, RAG context, tool calls, model calls, and streaming responses.

The Runtime execution-downshift milestone makes Runtime the owner of the assistant turn. Control API now sends tenant-scoped agent, prompt, knowledge, tool, and model configuration snapshots; Runtime decides how to render prompts, retrieve knowledge, trigger tools, call the model, and return structured run steps.

Current endpoints:

```text
GET  /runtime/health
POST /runtime/conversations/respond
POST /runtime/conversations/respond-stream
POST /runtime/workflows/knowledge-tasks/start
```

Runtime can call the Control API internal execution adapters when it needs to reuse tenant-scoped services:

```text
POST /api/v1/runtime/internal/knowledge/retrieve
POST /api/v1/runtime/internal/tools/call
POST /api/v1/runtime/internal/knowledge-tasks/run
```

Those adapter calls require `RUNTIME_INTERNAL_TOKEN` and preserve trace headers. Control API still owns authentication context reconstruction, resource binding checks, knowledge recall logging, tool approval/log persistence, model call log persistence, conversation persistence, and security/audit boundaries.

If `langgraph` is not installed in a local development environment, Runtime falls back to the same sequential node order so local smoke tests can still run. Production Runtime should install `requirements.txt`.

## Temporal workflow boundary

Knowledge document processing can be dispatched through the Runtime workflow endpoint. By default `RUNTIME_TEMPORAL_ENABLED=false`, so the endpoint schedules a local Runtime fallback task and calls the Control API internal knowledge-task adapter in the background. When Temporal is explicitly enabled, the endpoint starts a Temporal workflow and a separate worker executes the activity.

Runtime environment:

```text
RUNTIME_CORS_ORIGIN=http://localhost:3000
RUNTIME_CONTROL_API_BASE_URL=http://127.0.0.1:3001
RUNTIME_INTERNAL_TOKEN=change-me-runtime-internal-token
RUNTIME_TEMPORAL_ENABLED=false
RUNTIME_TEMPORAL_ADDRESS=127.0.0.1:7233
RUNTIME_TEMPORAL_NAMESPACE=default
RUNTIME_TEMPORAL_TASK_QUEUE=aiaget-knowledge-tasks
```

Worker command when Temporal is available:

```text
RUNTIME_TEMPORAL_ENABLED=true python -m app.workflows.worker
```
