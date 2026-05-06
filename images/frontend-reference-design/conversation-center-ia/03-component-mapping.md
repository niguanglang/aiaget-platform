# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Console shell | `apps/web/src/app/(console)/layout.tsx` | App Router shell | Reuse existing console layout |
| Conversation list page | `apps/web/src/components/conversations/conversation-content.tsx` | `listConversations`, `ConversationListItem` | Keep overview/filter/table only |
| Conversation create page | `apps/web/src/components/conversations/conversation-create-content.tsx` | `createConversation`, `listAgents`, `CreateConversationInput` | New route `/conversations/create` |
| Conversation detail page | `apps/web/src/components/conversations/conversation-detail-content.tsx` | `getConversation`, `streamConversationMessage`, `createConversationFeedback` | Owns message stream, run trace, feedback, references, tool calls |
| Conversation form | `apps/web/src/components/conversations/conversation-form-panel.tsx` | `ConversationFormValues` | Add `presentation="page"` while preserving drawer mode |
| List toolbar | `conversation-content.tsx` | `listConversations` query params + `listAgents` | keyword, agent, status |
| List row actions | `conversation-content.tsx` | `deleteConversation` + route links | View detail, archive confirmation |
| Empty/error states | `EmptyState`, `Card`, `StatusBadge` | query/mutation states | Reuse current UI primitives |
