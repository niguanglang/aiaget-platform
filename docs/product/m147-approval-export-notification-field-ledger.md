# M147 审批导出通知审计字段账本

## 背景

M145 已经把审批工作台 CSV 导出字段清单写入 `platform.security.approval_workbench.exported`，M146 在安全事件详情页展示字段摘要。剩余缺口是导出风险触发运营告警后，`platform.security.approval_operation_alert.notification_sent` 通知审计事件只保留告警分类、状态、渠道和 Trace，审计员无法在通知审计和 CSV 中直接确认本次导出风险涉及哪些字段。

## 范围

本里程碑补齐审批导出风险告警通知链路：

1. 审批工作台导出风险统计聚合 `exported_fields`。
2. 审批工作台导出风险统计聚合 `notification_archive_filter_fields`。
3. 审批导出运营告警通知 payload 写入字段账本。
4. 运营告警通知审计列表项暴露字段账本数组。
5. 运营告警通知审计 CSV 增加“导出字段清单”和“通知归档筛选字段”两列。

## 后端设计

`summarizeApprovalWorkbenchExportEvents` 从最近 24 小时审批工作台导出事件中聚合字段清单：

```json
{
  "exported_fields": ["审批ID", "审批类型", "通知筛选来源"],
  "notification_archive_filter_fields": ["通知筛选来源", "通知筛选状态", "通知筛选关键词"]
}
```

`buildApprovalOperationAlerts` 把字段账本挂到审批导出风险告警对象上。`deliverOperationAlertNotification` 仅在审批导出风险告警上把字段账本写入通知审计 payload，其他归档删除、SLA 死信和自愈告警保持空数组。

通知审计 CSV 新增列：

```text
导出字段清单
通知归档筛选字段
```

## 类型契约

`SecurityCenterOperationalAlert` 新增可选字段：

```ts
exported_fields?: string[];
notification_archive_filter_fields?: string[];
```

`SecurityOperationAlertNotificationItem` 新增只读数组：

```ts
exported_fields: string[];
notification_archive_filter_fields: string[];
```

## 验收标准

1. 审批导出风险告警通知 payload 包含导出字段清单。
2. 审批导出风险告警通知 payload 包含通知归档筛选字段清单。
3. 运营告警通知审计列表项返回字段账本。
4. 运营告警通知审计 CSV 包含字段账本两列。
5. 后端目标测试、事件详情测试、Control API typecheck、Web typecheck 通过。
