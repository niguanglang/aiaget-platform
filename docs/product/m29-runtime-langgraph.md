# M29 Runtime LangGraph Execution

## Scope

This milestone moves the conversation assistant turn from Control API-owned execution toward a Runtime-owned LangGraph execution boundary.

Control API remains responsible for authentication, tenant isolation, permission checks, conversation persistence, tool authorization, knowledge retrieval, and model call log persistence. Runtime now receives the prepared execution payload and owns the graph-shaped agent turn: context preparation, tool summary, knowledge summary, model execution, and response finalization.

This milestone does not add a PostgreSQL table or field.

## Runtime Contract

Runtime endpoint:

```text
POST /runtime/conversations/respond
POST /runtime/conversations/respond-stream
```

Control API sends:

```text
conversation_id
agent_name
agent_code
user_message
history
prompt_messages
tool_calls
references
model_config
```

`model_config` contains the OpenAI-compatible provider settings needed by Runtime to call the model directly. When no model is configured, Runtime returns a deterministic Chinese response for local development and smoke testing.

Runtime returns:

```text
status
assistant_message
request_model
prompt_tokens
completion_tokens
total_tokens
latency_ms
steps
references
tool_calls
model_call
error_message
```

`model_call` is returned to Control API so the existing `model_call_log` persistence remains centralized and tenant-scoped.

## LangGraph Nodes

Current Runtime graph:

```text
prepare_context
summarize_tools
summarize_knowledge
execute_model
finalize_response
```

Current behavior:

1. `prepare_context` records prompt and history context.
2. `summarize_tools` records already authorized tool execution summaries from Control API.
3. `summarize_knowledge` records retrieved knowledge references from the hybrid retrieval module.
4. `execute_model` calls the OpenAI-compatible provider from Runtime when `model_config` is present.
5. `finalize_response` returns a structured assistant response and run-step metadata.

The graph currently keeps tool execution and RAG retrieval in Control API-prepared inputs. Later milestones can move those into dedicated Runtime nodes without changing the conversation persistence surface.

## Control API Execution Modes

Environment variable:

```text
AGENT_RUNTIME_EXECUTION_MODE=runtime_first
```

Supported modes:

```text
runtime_first  Prefer Runtime; fall back to Control API model execution when Runtime fails and a model is configured.
runtime_only   Require Runtime execution; Runtime errors are surfaced directly.
control_first  Keep the previous Control API model execution path.
```

## Streaming

`/runtime/conversations/respond-stream` now uses the Runtime execution contract and emits:

```text
start
delta
done
```

The first implementation builds the complete Runtime response and chunks the assistant text as SSE deltas. This keeps the frontend stream contract stable while making Runtime the owner of the agent execution boundary.

## Validation

Completed checks:

```text
python3 -m py_compile apps/agent-runtime/app/main.py
pnpm --filter @aiaget/control-api typecheck
pnpm --filter @aiaget/web typecheck
pnpm lint
FastAPI TestClient POST /runtime/conversations/respond
FastAPI TestClient POST /runtime/conversations/respond-stream
```
