# M149 通知审计归档字段账本上下文

## 背景

M147/M148 已经让运营告警通知审计列表和 CSV 支持审批导出字段账本。但当审计员把通知审计导出为对象存储归档后，归档 metadata 仍只保留状态、来源和关键词筛选；后续归档列表、归档删除审批和审批时间线无法判断该 CSV 是否包含字段账本。

## 范围

本里程碑补齐通知审计归档链路：

1. 创建通知审计归档时，根据当前筛选结果统计字段账本。
2. 归档 metadata 写入是否包含字段账本。
3. 归档 metadata 写入导出字段数量。
4. 归档 metadata 写入通知归档筛选字段数量。
5. 删除归档审批事件、审批列表和审批详情时间线继承这些上下文。

## 后端设计

归档 metadata 新增：

```json
{
  "has_export_field_ledger": "true",
  "exported_field_count": "3",
  "notification_archive_filter_field_count": "3"
}
```

归档删除审批 payload 继承为布尔和数字：

```json
{
  "has_export_field_ledger": true,
  "exported_field_count": 3,
  "notification_archive_filter_field_count": 3
}
```

## 类型契约

以下类型新增字段：

```ts
has_export_field_ledger: boolean;
exported_field_count: number;
notification_archive_filter_field_count: number;
```

覆盖：

- `SecurityOperationAlertNotificationArchiveItem`
- `SecurityOperationAlertNotificationArchiveApprovalItem`
- `SecurityOperationAlertNotificationArchiveApprovalTimelineItem`

## 验收标准

1. 创建审批导出来源的通知审计归档后，归档对象返回字段账本标记。
2. 归档删除审批事件 payload 继承字段账本标记和字段数量。
3. 归档删除审批列表继承字段账本上下文。
4. 归档删除审批详情时间线继承字段账本上下文。
5. 后端目标测试和类型检查通过。
