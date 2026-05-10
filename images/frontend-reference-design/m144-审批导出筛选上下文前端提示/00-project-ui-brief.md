# Project UI Brief

- Page: m144-审批导出筛选上下文前端提示
- Route: /security/alerts
- Feature goal: 统一审批工作台导出区域提示CSV包含通知归档筛选上下文
- Target users/permissions: 安全管理员、审计员、租户管理员；沿用 `security:approval:view`。
- APIs/services: `exportSecurityApprovalWorkbenchItems(params)`，不新增接口。
- Entities/fields/statuses: 导出结果包含通知筛选来源、状态和关键词；页面仍展示审批工作台筛选和命中数。
- Existing components/design system: `SecurityAlertsContent`、`Card`、`Button`、`MetricCard`、`StatusBadge`、`EmptyState`，Tailwind 中文后台界面。
- Required states: 当前筛选命中、无结果无法导出、正在导出、导出完成、导出失败、无权限。
- Constraints: 只调整导出说明和成功提示，不新增 CSV 预览、不改变列表字段、不展示通知审计正文或客户成功报告正文。
