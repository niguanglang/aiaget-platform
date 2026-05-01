# M30 OpenTelemetry Trace Propagation

## Scope

This milestone makes one OpenTelemetry-compatible trace ID flow through the browser, Control API, Runtime, model calls, knowledge recall, tool calls, conversation runs, operation logs, and monitor events.

It does not add a PostgreSQL table or field. Trace data is stored in existing JSON surfaces:

```text
operation_log.request_summary
model_call_log.trace_id
model_call_log.request_summary
knowledge_recall_log.results
tool_call_log.request_headers
conversation_run.steps
```

## Trace Contract

The Web Console creates W3C trace context headers for every API request:

```text
traceparent: 00-{trace_id}-{span_id}-01
x-trace-id: {trace_id}
x-request-id: req_...
```

Control API preserves incoming trace IDs or creates a new one when the request has no valid trace context. It returns the same trace context headers on the HTTP response.

## Propagation Path

Conversation execution path:

```text
Web Console
  -> Control API middleware
  -> conversation service
  -> knowledge recall span
  -> tool call span
  -> Runtime span
  -> Runtime LangGraph node spans
  -> provider model call span
  -> conversation_run.steps
  -> model_call_log.trace_id
  -> monitor events
```

## Monitor Behavior

Monitor event mapping now resolves trace IDs in this order:

```text
operation: operation_log.request_summary.trace_id -> request_id
model_call: model_call_log.trace_id
tool_call: tool_call_log.request_headers.traceparent/x-trace-id
knowledge_recall: knowledge_recall_log.results[].trace_id
conversation_run: first conversation_run.steps[].trace_id
conversation_step: step.trace_id
```

This allows the monitor keyword search to find all events from the same user request by a single 32-character trace ID.

## Validation

Completed checks:

```text
python3 -m py_compile apps/agent-runtime/app/main.py
pnpm --filter @aiaget/control-api typecheck
pnpm --filter @aiaget/web typecheck
pnpm lint
Runtime HTTP trace smoke test with fixed trace_id
Control API response header trace smoke test with fixed trace_id
```
