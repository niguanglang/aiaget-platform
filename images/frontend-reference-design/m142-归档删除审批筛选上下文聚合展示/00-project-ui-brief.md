# Project UI Brief

- Page: m142-归档删除审批筛选上下文聚合展示
- Route: /approvals/archive-deletions
- Feature goal: 聚合归档删除审批展示通知审计归档筛选来源、状态和关键词
- Target users/permissions: 安全管理员、审计员、租户管理员；审批操作沿用审批中心权限，普通只读用户只能查看队列和详情。
- APIs/services: `listSecurityOperationAlertNotificationArchiveApprovals`、`getSecurityApprovalWorkbenchItem`、`listApprovalAuditArchiveApprovals`、`listSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovals`、`listSecurityOperationAlertSlaDeadLetterAuditArchiveApprovals`、`listAgentTeamRunReportArchiveApprovals`、`listCustomerSuccessOpportunityCloseWonReportArchiveApprovals` 以及对应 approve/reject 服务。
- Entities/fields/statuses: 聚合实体 `ArchiveApprovalItem`；核心字段为归档文件名、对象 key、大小、审批状态、申请人、审批人、申请时间、审批时间；通知归档筛选上下文字段为 `status_filter`、`alert_category`、`alert_category_label`、`keyword`；状态标签为已发送、部分成功、已跳过、失败。
- Existing components/design system: Next.js App Router + React Query + TypeScript + Tailwind；复用 `ApprovalPageShell`、`Card`、`Button`、`MetricCard`、`StatusBadge`、`DecisionActions`、`ApprovalAuditTimeline`、`ErrorBanner`、`EmptyState`。
- Required states: 加载中、空队列、接口错误、选中审批详情、审批中按钮禁用、审批失败提示、无权限处理时禁用审批动作。
- IA constraints: `/approvals/archive-deletions` 只承担归档删除审批聚合队列和详情，不展示通知审计全文、客户成功机会详情或报告正文；筛选上下文以紧凑标签展示，不能变成额外宽表格列。
