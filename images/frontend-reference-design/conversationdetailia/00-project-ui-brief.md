# Project UI Brief

- Page: ConversationDetailIA
- Route: /conversations/[id]
- Feature goal: 会话详情页信息架构拆分与流式会话组件重组
- Parent layout: `src/app/(console)/conversations/[id]/page.tsx` renders `ConversationDetailContent` inside the console shell.
- Target users and permissions: 普通授权用户、Agent 管理员、审计人员；写入/归档/继续会话受 `conversation:chat:manage` 或租户管理员角色控制。
- APIs/services: `getConversation`, `streamConversationMessage`, `createConversationFeedback`, `deleteConversation`.
- Entities/fields/statuses: `ConversationDetail`, `ConversationRunItem`, `ConversationStreamEvent`, messages, runs, feedback, references, tool calls.
- Existing components/design system: `Button`, `Card`, `EmptyState`, `MetricCard`, `StatusBadge`, `ConversationCenterBackground`, `conversation-status` labels and formatters.
- Required states: loading, error, archived conversation disabled textarea/send, streaming progress, stream error, feedback error, empty run trace, empty references/tool calls, destructive archive confirmation.
- IA constraint: `/conversations/[id]` is a detail and testing surface. It may own streaming and feedback workflows, but list/create concerns stay out of the detail shell.
