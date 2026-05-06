# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell/background | `ConversationDetailContent`, `ConversationCenterBackground` | `getConversation(conversationId)` | Shell owns query, mutations, layout, loading/error. |
| Streaming state | `useConversationStream` | `streamConversationMessage`, `ConversationStreamEvent` | Hook owns optimistic messages, delta/error/done event handling. |
| Header and archive action | `ConversationDetailHeader` | `ConversationDetail`, latest run | Archive opens confirmation; no list/create logic. |
| Metrics row | `MetricCard` in shell | `message_count`, `runs`, `feedback`, latest run | Computed in shell. |
| Message stream | `ConversationMessageStreamCard` | `ConversationDetail.messages` | Reply disabled if no permission or archived. |
| Run trace | `ConversationRunTraceCard` | `ConversationRunItem[]` | Includes step meta rows. |
| Feedback | `ConversationFeedbackCard` | `createConversationFeedback`, `feedback` | Submit binds latest run id in shell mutation. |
| References/tools | `ConversationReferenceToolsCard` | assistant message references/tool_calls | Approval request link routes to `/approvals?requestId=...`. |
| Archive confirmation | `ConversationConfirmDialog` | `deleteConversation` | Destructive archive requires confirmation. |
