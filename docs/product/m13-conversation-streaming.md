# M13 Conversation Streaming

## Scope

M13 upgrades conversation detail from request-response refresh to real-time streaming assistant output over the existing persisted conversation flow.

Implemented contracts:

```text
POST /runtime/conversations/respond-stream
POST /api/v1/conversations/:id/messages/stream
```

## Behavior

The streaming contract uses SSE-style events over `fetch`:

```text
start
delta
done
error
```

- `start` sends run metadata preview.
- `delta` sends incremental assistant text.
- `done` returns the final persisted `ConversationDetail`.
- `error` returns a user-facing failure message.

## UI Design

The `/conversations/[id]` page now supports:

1. Immediate append of the user message into the local message stream.
2. A temporary live assistant bubble during streaming.
3. Final replacement of temporary content with persisted messages and run trace after completion.
4. Stable trace, feedback, and reference panels while the stream is active.

## Architecture Notes

M13 does not change the database schema. The Runtime emits deterministic chunks through `respond-stream`, the Control API forwards those chunks while accumulating the final response, then persists the assistant message and run record before emitting `done`. This preserves durable history while giving the frontend live feedback.
