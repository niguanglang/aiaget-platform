# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 审批页壳 | `apps/web/src/components/approvals/approval-content.tsx` | route `/approvals` | 复用现有审批中心 |
| 类型切换 | 新增 segmented buttons | local state `approvalType` | 工具审批 / 通知策略 |
| 工具审批 | 现有表格和 `ApprovalDetailPanel` | Tool approval APIs | 保持原行为 |
| 通知策略审批队列 | 新增 `NotificationPolicyApprovalQueue` | `listNotificationPolicyApprovalRequests` | 仅显示快照审批 |
| 通知策略审批详情 | 新增 `NotificationPolicyApprovalDetailPanel` | `SystemSettingSnapshotItem` | 展示前后值、影响和审批动作 |
| 批准/拒绝动作 | 复用 `Button` + textarea | `approveNotificationPolicyApproval`, `rejectNotificationPolicyApproval` | 权限 `security:approval:handle` |
| 状态标识 | `StatusBadge` | approval_status / impact_level / action | 中文标签 |
| 设置中心联动 | `Link` 到 `/settings` | route | 审批完成后刷新 settings 相关 query |
