# Project UI Brief

- Page: m143-审批工作台导出筛选上下文
- Route: /security/alerts
- Feature goal: 统一审批工作台 CSV 导出保留通知归档筛选来源状态关键词
- Target users/permissions: 安全管理员、审计员、租户管理员；沿用统一审批工作台导出权限。
- APIs/services: `exportSecurityApprovalWorkbenchItems(params)` -> `/security-center/approval-workbench/export`，后端 `SecurityApprovalWorkbenchService.exportCsv`。
- Entities/fields/statuses: `SecurityApprovalWorkbenchItem` + 后端 `metadata.status_filter`、`metadata.alert_category_label`、`metadata.keyword`；状态中文为已发送、部分成功、已跳过、失败。
- Existing components/design system: `/security/alerts` 已有 `SecurityAlertsContent`，使用 `Button`、`MetricCard`、`StatusBadge`、`ErrorBanner`、`EmptyState`；本里程碑不新增页面控件。
- Required states: 当前筛选可导出、筛选无结果禁用或提示、导出中按钮禁用、导出失败中文提示、导出成功写入审计事件。
- Constraints: 只增强 CSV 导出内容，不把通知审计详情或客户成功报告正文塞入统一审批工作台列表。
