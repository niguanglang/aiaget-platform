# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise AI Agent platform admin page.

Project context:
- Product/module: 企业 AI Agent 平台 / 安全中心 / 安全事件详情中心
- Page/route: 安全中心 at `/security`
- Target users/roles: 租户管理员、安全管理员、审计员
- Business goal: 审计员可以在安全事件中心筛选“审批工作台”，查看统一安全审批工作台导出事件，确认导出数量、筛选范围、操作人、request_id 和 trace_id。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui 风格组件
- Existing page shell/layout: 管理后台 Dashboard Layout，安全事件卡片包含筛选栏、事件表格和右侧/抽屉详情

Interface contract that must appear in the UI:
- API/service functions: security center events list, security center event detail
- Main entities and fields: `source`, `title`, `reason`, `resource_type`, `resource_id`, `action`, `request_id`, `trace_id`, `occurred_at`, `severity`, `request_summary.exported_count`, `request_summary.filter`
- Source values: `DATA_SCOPE`, `RESOURCE_ACL`, `SECURITY_POLICY`, `OPERATION`, `APPROVAL_WORKBENCH`
- User actions: 按来源筛选、关键词搜索、只看可追踪、打开详情、复制 request_id、复制 trace_id、跳转运行监控
- Required states: loading, empty, error, missing trace, detail loading

Design requirements:
- Use Chinese visible copy only.
- Show a production SaaS/admin product, not a marketing page.
- Emphasize the primary workflow: 选择“审批工作台”来源 -> 查看导出事件列表 -> 打开详情 -> 查看导出筛选 JSON 和链路追踪。
- Keep the event table compact and readable; detail drawer should show export summary before raw JSON panels.
- Use subtle borders, restrained status badges, soft shadow, and clean enterprise layout.

Avoid:
- Fake API fields not listed above.
- New route, unrelated charts, decorative-only widgets, emoji, over-glow, or unreadable text.
