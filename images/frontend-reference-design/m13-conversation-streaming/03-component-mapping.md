# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Detail route shell | `apps/web/src/components/conversations/conversation-detail-content.tsx` | conversation detail API | Keep existing route and panels. |
| Stream request helper | `apps/web/src/lib/api-client.ts` | `POST /conversations/:id/messages/stream` | Parse SSE-style events over fetch. |
| Live assistant bubble | `conversation-detail-content.tsx` | `start` / `delta` / `done` events | Shows incremental text and progress state. |
| Final message persistence | `conversation-detail-content.tsx` | final `ConversationDetail` from `done` event | Replace temporary stream state with persisted conversation. |
| Runtime stream endpoint | `apps/agent-runtime/app/main.py` | `POST /runtime/conversations/respond-stream` | Deterministic chunk emission. |
| Control API stream endpoint | `apps/control-api/src/conversations/*` | `POST /conversations/:id/messages/stream` | Forwards deltas and persists final run/message. |
