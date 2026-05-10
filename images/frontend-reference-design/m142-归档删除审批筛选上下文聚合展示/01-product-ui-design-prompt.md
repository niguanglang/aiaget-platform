# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise AI Agent Platform approval page.

Project context:
- Product/module: 企业 AI Agent 平台 / 审批中心
- Page/route: 归档删除审批 at /approvals/archive-deletions
- Target users/roles: 安全管理员、审计员、租户管理员
- Business goal: 审批人能在统一归档删除队列里快速识别归档来源、申请人、审批状态和通知审计归档创建时的筛选上下文，避免误删来自客户成功复盘归档删除通知的审计归档。
- Existing frontend stack/design system: Next.js + React Query + TypeScript + Tailwind CSS + shadcn/ui style primitives
- Existing page shell/layout: `ApprovalPageShell`，顶部说明和刷新按钮，指标卡片，左侧/主区域审批表格，右侧或下方详情面板，中文界面。

Interface contract that must appear in the UI:
- API/service functions: `listSecurityOperationAlertNotificationArchiveApprovals`、`listApprovalAuditArchiveApprovals`、`listSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovals`、`listSecurityOperationAlertSlaDeadLetterAuditArchiveApprovals`、`listAgentTeamRunReportArchiveApprovals`、`listCustomerSuccessOpportunityCloseWonReportArchiveApprovals`、对应 approve/reject mutation、`getSecurityApprovalWorkbenchItem` detail。
- Main entities and fields: 文件名、归档对象 key、归档大小、审批状态、申请原因、申请人、审批人、申请时间、审批时间、筛选来源、筛选状态、筛选关键词。
- Status values/enums: 审批状态待审核/已通过/已拒绝/已生效；通知状态已发送/部分成功/已跳过/失败；来源包括审批审计归档、安全告警归档、自愈恢复审计、SLA 死信审计、Agent 团队报告、客户成功复盘。
- User actions: 来源筛选、刷新、选择一条审批、查看上下文入口、批准、拒绝、返回审批中心。
- Required states: loading, empty, error, disabled action when no permission, mutation error notice.

Design requirements:
- Chinese UI only.
- Make it look like a production SaaS/admin product, not a generic marketing dashboard.
- Show the primary workflow clearly: 从归档删除审批列表选择记录，查看详情中的归档上下文和筛选来源，然后执行批准或拒绝。
- Use compact chips below filename and in detail summary for `筛选来源：客户成功复盘归档删除`、`筛选状态：已发送`、`筛选关键词：trace-customer`.
- Keep list columns focused: 来源、文件、状态、申请人、时间、操作；不要把完整业务详情放入表格。
- Use restrained borders, subtle backgrounds, clear spacing, and readable dense enterprise layout.

Avoid:
- 不展示客户成功机会详情、报告正文、通知审计全文或大段日志。
- 不增加随机图表、营销式 hero、大面积装饰渐变或无合同字段。
- 不把审批配置、通知策略配置或用户授权塞进这个页面。
