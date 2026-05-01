# M09 Monitor Center

## Scope

M09 adds tenant-scoped monitor views that aggregate service health, operation logs, model calls, tool calls, recall logs, and conversation runs into one operational console.

Implemented contracts:

```text
GET /api/v1/monitor/overview
GET /api/v1/monitor/events
GET /api/v1/monitor/events/:eventId
```

## Sources

M09 does not add new storage tables. It aggregates existing runtime data from:

```text
operation_log
model_call_log
tool_call_log
knowledge_recall_log
conversation_run
```

## Page Design

The `/monitor` page now supports real operational review:

1. Control service and runtime health cards.
2. Summary metrics for total events, success rate, latency, cost, and active conversations.
3. Latency trend view across the selected time window.
4. Error sample panel for recent failures.
5. Rankings for agents, models, tools, and knowledge recalls.
6. Unified event table with module, status, latency, tokens, cost, and occurred time.
7. Selected-event detail side panel with request/response payloads and step details.

## Architecture Notes

All APIs are tenant-scoped and protected by `monitor.read`. The first M09 implementation uses synthetic event IDs and derived trace IDs from existing logs rather than an external tracing backend. Health data is fetched directly from the current control process and configured runtime endpoint. This milestone focuses on operational observability, not distributed tracing fidelity.
