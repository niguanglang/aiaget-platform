# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/conversations/page.tsx` | Console layout | Replace placeholder shell with real M08 list page. |
| Detail route | `apps/web/src/app/(console)/conversations/[id]/page.tsx` | `GET /conversations/:id` | New detail route for full trace and feedback view. |
| Background atmosphere | `conversation-center-background.tsx` | visual only | Subtle signal/message flow motif, low opacity. |
| Metrics | `MetricCard` | conversation list aggregate | Conversations, messages, active runs, feedback. |
| Status chips | `StatusBadge` | conversation/run state | Active/success to healthy, archived/failed to degraded/unavailable. |
| Toolbar/search/filter | new `conversation-content.tsx` | list query params | Keyword, Agent, status. |
| Conversation table/list | new `conversation-content.tsx` | `ConversationListItem` | Title, Agent, user, messages, last run status, last message time, actions. |
| New conversation drawer | new `conversation-form-panel.tsx` | create DTO | Select Agent + first user message. |
| Selected conversation side panel | `conversation-content.tsx` | detail + send message API | Message preview, composer, latest trace summary. |
| Detail message stream | `conversation-detail-content.tsx` | `ConversationMessageItem[]` | USER/ASSISTANT/TODO roles, references, tool-call summaries. |
| Run trace panel | `conversation-detail-content.tsx` | `ConversationRunItem[]` | Steps, model, latency, token usage, errors. |
| Feedback panel | `conversation-detail-content.tsx` | feedback API | Rating, optional comment, history list. |
| Delete confirmation | local modal pattern | delete API | Soft delete / archive confirmation. |
| Runtime responder | `apps/agent-runtime/app/main.py` | `/runtime/conversations/respond` | Deterministic structured response boundary. |
| Control API module | `apps/control-api/src/conversations/*` | M08 APIs | Tenant-scoped persistence + runtime orchestration. |
| Shared contracts | `packages/shared-types/src/index.ts` | conversation list/detail/message/run/feedback types | Preserve route and type contracts across frontend/backend. |
