# Agent Runtime

FastAPI runtime service for agent execution, RAG context, tool calls, model calls, and streaming responses.

The Runtime execution-downshift milestone makes Runtime the owner of the assistant turn. Control API now sends tenant-scoped agent, prompt, knowledge, tool, and model configuration snapshots; Runtime decides how to render prompts, retrieve knowledge, trigger tools, call the model, and return structured run steps.

Current endpoints:

```text
GET  /runtime/health
POST /runtime/conversations/respond
POST /runtime/conversations/respond-stream
POST /runtime/workflows/knowledge-tasks/start
POST /runtime/workflows/channel-release-automation/start
POST /runtime/workflows/channel-release-self-healing/start
```

Runtime can call the Control API internal execution adapters when it needs to reuse tenant-scoped services:

```text
POST /api/v1/runtime/internal/knowledge/retrieve
POST /api/v1/runtime/internal/tools/call
POST /api/v1/runtime/internal/knowledge-tasks/run
POST /api/v1/runtime/internal/channel-release-automation/run
POST /api/v1/runtime/internal/channel-release-self-healing/run
```

Those adapter calls require `RUNTIME_INTERNAL_TOKEN` and preserve trace headers. Control API still owns authentication context reconstruction, resource binding checks, knowledge recall logging, tool approval/log persistence, model call log persistence, conversation persistence, and security/audit boundaries.

If `langgraph` is not installed in a local development environment, Runtime falls back to the same sequential node order so local smoke tests can still run. Production Runtime should install `requirements.txt`.

## Temporal workflow boundary

Knowledge document processing, channel release automation, and channel release self-healing can be dispatched through Runtime workflow endpoints. By default `RUNTIME_TEMPORAL_ENABLED=false`, so the endpoint schedules a local Runtime fallback task and calls the matching Control API internal adapter in the background. When Temporal is explicitly enabled, the endpoint starts a Temporal workflow and a separate worker executes the activity.

Runtime environment:

```text
RUNTIME_CORS_ORIGIN=http://localhost:3000
RUNTIME_CONTROL_API_BASE_URL=http://localhost:3001
RUNTIME_INTERNAL_TOKEN=change-me-runtime-internal-token
RUNTIME_TEMPORAL_ENABLED=false
RUNTIME_TEMPORAL_ADDRESS=localhost:7233
RUNTIME_TEMPORAL_NAMESPACE=default
RUNTIME_TEMPORAL_TASK_QUEUE=aiaget-knowledge-tasks
```

Worker command when Temporal is available:

```text
RUNTIME_TEMPORAL_ENABLED=true python -m app.workflows.worker
```

## Runtime module layout

M53 splits the previous single-file Runtime implementation into a stable productization boundary:

```text
app/main.py                  FastAPI HTTP routes and SSE response shell
app/runtime/contracts.py     Request/response snapshots and graph state models
app/runtime/execution.py     LangGraph execution graph, fallback sequence, model execution
app/runtime/helpers.py       Prompt rendering, trace helpers, Control API adapters, SSE helpers
app/workflows/               Temporal/local workflow dispatch boundary
```

The public Runtime endpoints and SSE event contract are unchanged by this split. Control API can continue calling the same `/runtime/conversations/respond`, `/runtime/conversations/respond-stream`, and `/runtime/workflows/knowledge-tasks/start` endpoints.

## Model adapters and streaming

Runtime model execution now normalizes these provider types:

```text
OPENAI_COMPATIBLE
DEEPSEEK
QWEN
MOONSHOT
LOCAL
AZURE_OPENAI
ANTHROPIC
```

`DEEPSEEK`, `QWEN`, `MOONSHOT`, and `LOCAL` use the OpenAI-compatible `/chat/completions` protocol. `AZURE_OPENAI` uses an Azure deployment URL with the `api-key` header and `api-version=2024-06-01`. `ANTHROPIC` uses `/messages`, `x-api-key`, and `anthropic-version=2023-06-01`, with system prompts folded into Anthropic's top-level `system` field.

`POST /runtime/conversations/respond-stream` now reads provider SSE incrementally and forwards provider deltas as Runtime `delta` events before the provider stream finishes. If no model config is supplied, Runtime keeps the deterministic local fallback and chunks the generated message for compatibility.
