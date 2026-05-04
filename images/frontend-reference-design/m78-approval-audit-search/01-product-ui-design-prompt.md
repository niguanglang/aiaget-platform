# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an Enterprise AI Agent Platform approval audit search page.

Project context:
- Product/module: 企业 AI Agent 平台 / 审批审计
- Page/route: 审批审计 at `/approval-audits`
- Users/roles: 安全管理员、租户管理员、审计员
- Business goal: 全局检索工具审批和通知策略审批的审计事件，支持按来源、事件类型、状态、Trace、关键词快速定位审批链路。
- Existing frontend stack: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui style components.
- Existing page shell: SaaS 控制台左侧导航，内容区为指标卡、筛选区、事件表格和右侧详情面板。

Interface contract:
- Metrics: 审计事件、成功事件、失败事件、告警事件、Trace 覆盖
- Filters: 关键词、窗口、来源、事件类型、状态、只看 Trace
- Table columns: 时间、来源、事件、状态、操作人、Trace ID、请求 ID、备注摘要
- Detail panel fields: 事件 ID、来源、来源记录、事件类型、状态、标题、备注、操作人、请求 ID、Trace ID、发生时间、metadata JSON

Design requirements:
- Real production admin interface, not a generic marketing page.
- Use Chinese labels only.
- Use clean dashboard layout with subtle borders, soft shadows, and restrained glass texture.
- Right-side detail panel should make Trace and request ID easy to copy/inspect.
- Metadata JSON should appear in a dark preview block.
- Motion should be subtle: table row reveal, hover feedback, smooth transitions.

Avoid:
- fake chart-heavy dashboard
- unrelated approval fields
- excessive gradients or decorative glow
