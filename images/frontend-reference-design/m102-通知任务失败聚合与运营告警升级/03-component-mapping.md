# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 安全中心页面壳 | `apps/web/src/components/security/security-policy-content.tsx` | `/security` route | 复用现有页面 |
| 审批与归档运营卡片 | `ApprovalArchiveOperationsCard` | `SecurityCenterOverview.approval_operations` | 增加通知任务风险指标 |
| M102 风险指标 | `OperationMetricTile` | `notification_task_*` fields | 展示执行、失败/跳过、失败率、连续失败 |
| 运营告警列表 | `OperationAlertCard` | `operational_alerts[]` | 新 alert ID 复用现有卡片和动作 |
| 告警通知 | existing `notifyOperationAlertMutation` | `POST /operation-alerts/:alertId/notify` | 无新前端动作 |
| 告警生命周期 | existing `updateOperationAlertMutation` | `POST /operation-alerts/:alertId/actions` | ACK/ESCALATE/CLOSE |
| 后端聚合 | `SecurityCenterService.loadApprovalOperations` | `platform_event` task events | 不新增表 |
| 空/健康状态 | `StatusBadge` / text | failure metrics | 无风险时展示“任务正常” |
