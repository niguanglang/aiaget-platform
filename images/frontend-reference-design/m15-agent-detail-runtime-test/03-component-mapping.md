# Component Mapping

Reference images are not committed yet for M15. This implementation follows the project prompt pack and the existing `/agents/[id]` detail shell.

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Console shell | `ConsoleShell`, `Sidebar`, `Topbar` | existing auth session and navigation | No route or layout changes. |
| Agent detail host page | `apps/web/src/components/agents/agent-detail-content.tsx` | `getAgent`, `AgentDetail` | Replaces the old conversation placeholder card with a real testing panel. |
| Inline test panel | `apps/web/src/components/agents/agent-conversation-test-panel.tsx` | `createConversation`, `getConversation`, `streamConversationMessage`, `ConversationDetail` | New component responsible for local thread persistence, inline testing, and latest run visibility. |
| Status strip | `StatusBadge`, conversation status helpers | `ConversationDetail.status`, `ConversationRunItem.status` | Reuses existing conversation status labels and tones. |
| Message stream | local message list UI in `agent-conversation-test-panel.tsx` | `ConversationMessageItem[]` | Compact version of the full conversation detail stream for agent debugging. |
| Run summary | local latest-run summary UI in `agent-conversation-test-panel.tsx` | `ConversationRunItem` | Shows only the latest run and top steps to fit the agent detail layout. |
| Tool summary | local tool summary UI in `agent-conversation-test-panel.tsx` | `ConversationToolCallItem[]` | Surfaces approval-required states without inventing a new approval API. |
| Empty / error / permission states | `EmptyState`, disabled `Button`, inline banners | React Query, `ApiClientError`, auth permission checks | Keeps the panel readable when no test thread exists or the user cannot write. |
