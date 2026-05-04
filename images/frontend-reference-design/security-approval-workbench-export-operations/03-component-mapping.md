# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 审批与归档运营 | `apps/web/src/components/security/security-policy-content.tsx` / `SecurityOperationsCard` | `SecurityCenterOverview.approval_operations` | 复用现有运营卡片 |
| 导出治理指标 | 新增指标组 | 新增 approval operations fields | 使用 `OperationMetricTile` |
| 导出风险提示 | `SecurityOperationsCard` 内联提示 | high risk/repeated export counts | 风险时显示 amber 提示 |
| 告警闭环 | `OperationAlertCard` | `SecurityCenterOperationalAlert[]` | 复用通知、确认、升级、关闭 |
| 后端统计 | `SecurityCenterService.loadApprovalOperations` | `platform_event` | 汇总 `platform.security.approval_workbench.exported` |
| 后端告警 | `buildApprovalOperationAlerts` | new export metrics | 新增 3 类导出风险告警 |
| 共享类型 | `packages/shared-types/src/index.ts` | `SecurityCenterOverview.approval_operations` | 增加 4 个导出指标字段 |
