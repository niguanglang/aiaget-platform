# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise AI Agent platform admin page.

Project context:
- Product/module: 企业 AI Agent 平台 / 安全中心 / 统一安全审批工作台
- Page/route: 安全中心 at `/security`
- Target users/roles: 租户管理员、安全管理员、审计员
- Business goal: 让安全管理员在统一审批工作台内快速定位“团队运行报告归档删除”审批，查看团队、运行、归档对象和审计链路，并直接通过或拒绝。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui 风格组件
- Existing page shell/layout: 管理后台 Dashboard Layout，左侧审批队列，右侧详情面板，细边框、轻阴影、紧凑信息层级

Interface contract that must appear in the UI:
- API/service functions: approval workbench overview, list, detail, review
- Main entities and fields: `type`, `status`, `risk_domain`, `risk_level`, `target_label`, `requester`, `reviewer`, `archive_key`, `archive_file_name`, `team_id`, `team_name`, `run_id`, `run_objective`, `request_id`, `trace_id`
- Status values/enums: `AGENT_TEAM_RUN_REPORT_ARCHIVE_DELETE`, `PENDING`, `APPROVED`, `REJECTED`, `APPLIED`, `AUDIT_ARCHIVE`, `CRITICAL`
- User actions: 刷新、搜索、按审批类型筛选、按状态筛选、按风险域筛选、选择审批记录、查看审计中心、查看 Trace、填写审批意见、通过、拒绝
- Required states: loading, empty, error, disabled, success, permission-denied

Design requirements:
- Use Chinese visible copy only.
- Show a production SaaS/admin product, not a marketing page.
- Emphasize the primary workflow: 筛选团队运行报告归档删除 -> 查看团队运行上下文 -> 查看归档对象 -> 审计链路跳转 -> 审批处理。
- Use compact source chips and structured detail cards; avoid crowded dense tables.
- Keep visual language minimal, technical, clean, and enterprise-grade with subtle borders and soft shadows.

Avoid:
- Fake API fields not listed above.
- Decorative-only widgets, random charts, emoji, over-glow, or unreadable text.
