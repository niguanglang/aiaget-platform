# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 安全中心运营看板 | `ApprovalArchiveOperationsCard` | `SecurityCenterOverview.approval_operations` | 增加 M98 指标 |
| SLA 死信归档删除指标 | `OperationMetricTile` | new shared fields | pending/approved/rejected/applied |
| 运营告警 | `OperationAlertCard` | `operational_alerts` | 后端生成新 alert |
| 告警生命周期 | existing lifecycle buttons | operation alert APIs | 复用确认/升级/关闭/通知 |
| 后端统计 | `SecurityCenterService.loadApprovalOperations` | `platform_event` | 读取 SLA dead-letter archive delete events |
| 类型契约 | `packages/shared-types/src/index.ts` | `SecurityCenterOverview` | 增加 4 个统计字段 |
