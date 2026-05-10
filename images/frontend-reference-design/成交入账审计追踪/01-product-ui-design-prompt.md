# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise AI Agent Platform audit center page.

Project context:
- Product/module: 企业 AI Agent 平台 / 审计中心
- Page/route: 审计中心 at /audit
- Target users/roles: 审计员、租户管理员、财务负责人、客户成功负责人，需要 security:audit:view
- Business goal: 让用户能从成交入账、调账单、续约机会反向追踪到统一审计事件，快速定位调账单号、机会名、客户名、链路 ID 和计费事件详情。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui 风格组件，Card、MetricCard、StatusBadge、EmptyState、Button，motion 微交互。
- Existing page shell/layout: 企业控制台内容区，顶部标题和刷新按钮，指标卡片，排行卡片，统一审计事件表格。

Interface contract that must appear in the UI:
- API/service functions: getAuditOverview({ window })、listAuditEvents({ page, page_size, window, source_type, status, keyword })
- Main entities and fields: AuditSummary login_total、operation_total、approval_audit_total、billing_event_total、security_event_total、config_change_total、success_rate；AuditEventListItem 时间、来源、状态、用户、模块、动作、链路 ID、标题、摘要、详情入口。
- Status values/enums: 来源 login 登录、operation 操作、approval_audit 审批审计、billing 计费；状态 SUCCESS 成功、DEGRADED 降级、FAILED 失败。
- User actions: 刷新数据、按窗口筛选、按来源筛选、按状态筛选、输入关键词搜索、清空筛选、查看详情。
- Required states: loading, empty, error, disabled refresh state where relevant.

Design requirements:
- Make it look like a production SaaS/admin product, not a marketing page.
- Use Chinese interface text only.
- Emphasize the new billing audit capability with a “计费事件” metric card and billing source filter, but keep the event table compact.
- Search box placeholder should communicate: 搜索用户、模块、调账单号、机会名、客户名、链路 ID。
- Use subtle borders, restrained shadow, glass-like background, clean dashboard hierarchy, no heavy glow.
- Keep table fields readable and operational; detail stays behind the 查看详情 route.

Avoid:
- fake API fields not listed above
- decorative charts that do not map to current APIs
- excessive gradients, emoji, large rounded blobs, overcrowded detail fields in the list
