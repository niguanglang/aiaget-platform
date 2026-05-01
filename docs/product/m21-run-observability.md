# M21 Run Observability

## Scope

M21 upgrades conversation run visibility from plain step summaries into step-level observability for model, retrieval, and tool execution.

Reused contracts:

```text
GET  /api/v1/conversations/:id
POST /api/v1/conversations
POST /api/v1/conversations/:id/messages
POST /api/v1/conversations/:id/messages/stream
```

## Behavior

M21 keeps the existing run storage model but enriches `steps` inside each run:

1. Tool steps now carry tool name, response status, latency, and zero-cost markers.
2. Knowledge steps now carry retrieval mode, latency, result count, and retrieval cost placeholders.
3. Model steps now carry request model, token usage, latency, and calculated cost.
4. Conversation run summaries expose aggregated cost derived from the step payload.
5. Agent inline testing and conversation detail both surface these metrics directly in the UI.

## Architecture Notes

M21 does not add a new table. It extends the existing JSON step payload and frontend rendering only. This keeps backward compatibility with already persisted runs while making new runs much more diagnosable.
