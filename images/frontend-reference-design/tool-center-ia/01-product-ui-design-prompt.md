# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: 企业 Agent 平台 / 工具中心
- Page/route: 工具中心列表 at `/tools`
- Target users/roles: 租户管理员、工具管理员、Agent 管理员、安全管理员、审计员
- Business goal: 让用户在列表页完成 HTTP 工具查询、筛选、状态治理和进入详情/编辑/新增入口；完整配置、测试、日志和智能体引用必须进入详情页。
- Existing frontend stack/design system: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui-style Button/Card/Input/EmptyState/MetricCard/StatusBadge, React Query, motion/react.
- Existing page shell/layout: console shell with left navigation and top bar, content max width 7xl, clean dashboard/list layout, subtle border and soft shadow.

Interface contract that must appear in the UI:
- API/service functions: `listTools`, `copyTool`, `enableTool`, `disableTool`, `deleteTool`; route links to `/tools/create`, `/tools/[id]`, `/tools/[id]/edit`.
- Main entities and fields: `name`, `code`, `tool_type`, `method`, `url`, `status`, `risk_level`, `require_approval`, `auth_type`, `call_count_today`, `failure_count_today`, `agent_reference_count`, `last_call_at`, `updated_at`.
- Status values/enums: `ACTIVE`, `DISABLED`, `DELETED`; risk `LOW`, `MEDIUM`, `HIGH`; method `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.
- User actions: 新建工具、搜索、按类型/状态/风险筛选、清空筛选、查看详情、编辑、复制、启用/停用、删除确认。
- Required states: loading, empty, error, disabled, permission-denied, mutation pending, delete confirmation.

Design requirements:
- Make it look like a production SaaS/admin product, not a generic mockup.
- Use only the fields/actions listed above.
- Show the primary workflow clearly: filter list -> inspect concise row overview -> choose view/edit/status/copy/delete -> enter route-level create/detail/edit pages.
- Use bento metrics above the table: 工具总数、已启用、今日调用、失败率.
- Keep list rows compact and scannable; do not render JSON schemas, test panels, call logs, or full detail blocks.
- Use a coherent component system: hero/status badges, metric cards, filter toolbar, table, row actions, confirmation dialog, empty/error states.
- Style direction: 极简、科技、高级、产品感强；细边框、轻阴影、轻微玻璃质感、克制动效感。

Avoid:
- invented API fields not listed above
- complete details embedded beside the table
- quick test panel, JSON editor, call log cards, or agent binding lists on the list page
- unreadable tiny text, decorative heavy glow, overpacked tables
