# Project UI Brief

- Page: ToolDetailIA
- Route: /tools/[id]
- Feature goal: 工具详情页信息架构拆分与详情卡片重组
- Parent layout: `src/app/(console)/tools/[id]/page.tsx` renders `ToolDetailContent` inside the console shell.
- Target users and permissions: 租户管理员、工具管理员、Agent 管理员；写操作受 `tool:definition:manage` 控制，测试执行受 `tool:call:execute` 控制。
- APIs/services: `getTool`, `copyTool`, `enableTool`, `disableTool`, `deleteTool`, `testTool`.
- Entities/fields/statuses: `ToolDetail`, `TestToolResult`, `tool.status`, `tool.risk_level`, `tool.auth_type`, `tool.call_logs`, `tool.agent_references`.
- Existing components/design system: `Button`, `Card`, `EmptyState`, `MetricCard`, `StatusBadge`, `ToolCenterBackground`, `tool-status` formatters, `tool-json` helpers.
- Required states: loading, error, permission-disabled actions, disabled inactive test button, validation error for JSON input, empty call logs, approval request link, status confirmation, destructive delete confirmation.
- IA constraint: `/tools/[id]` is a detail page. It may show complete current object information and related logs, but edit remains routed to `/tools/[id]/edit`; create/list concerns stay out of the detail component.
- Safety constraint: enable/disable must open an impact confirmation before mutating because it changes whether authorized Agents can call the tool.
