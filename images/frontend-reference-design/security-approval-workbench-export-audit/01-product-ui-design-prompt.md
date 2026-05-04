# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise AI Agent platform admin page.

Project context:
- Product/module: 企业 AI Agent 平台 / 安全中心 / 统一安全审批工作台
- Page/route: 安全中心 at `/security`
- Target users/roles: 租户管理员、安全管理员、审计员
- Business goal: 安全管理员按类型、状态、风险域和关键词筛选审批事项后，可以一键导出当前范围为 CSV，并在导出后看到明确的中文状态反馈；审计员可以通过 request_id / trace_id 追踪导出行为。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui 风格组件
- Existing page shell/layout: 管理后台 Dashboard Layout，统一审批工作台位于安全中心内部；上方指标，中部筛选和操作栏，下方左侧审批列表，右侧详情面板

Interface contract that must appear in the UI:
- API/service functions: approval workbench overview, list, export, detail, review
- Main entities and fields: `keyword`, `type`, `status`, `risk_domain`, `total`, `status`, `risk_level`, `target_label`, `requester`, `requested_at`, `request_id`, `trace_id`
- Status values/enums: `PENDING`, `APPROVED`, `REJECTED`, `APPLIED`
- User actions: 刷新、搜索、按审批类型筛选、按状态筛选、按风险域筛选、导出当前筛选、选择审批记录、查看审计中心、查看 Trace、审批通过、审批拒绝
- Required states: 导出中、导出成功、导出失败、无权限、空状态、加载中、按钮禁用

Design requirements:
- Use Chinese visible copy only.
- Show a production SaaS/admin product, not a marketing page.
- Emphasize the primary workflow: 设置筛选条件 -> 查看命中数量 -> 导出当前筛选 -> 通过审计链路追踪导出。
- The export action should be visually secondary but discoverable, near refresh/filter controls.
- Use compact badges, subtle border, soft shadow, restrained glass-like panels.

Avoid:
- Fake API fields not listed above.
- Decorative-only widgets, random charts, emoji, over-glow, or unreadable text.
