# M150 通知归档字段账本前端闭环

## 背景

M149 已在后端把通知审计导出字段账本上下文写入通知归档文件与归档删除审批链路。M150 负责把这份上下文在安全中心归档治理页做轻量展示，方便安全管理员确认归档是否保留字段账本。

## 范围

- 页面：`/security/archives`
- 组件：`SecurityArchivesContent`
- 数据来源：
  - `listSecurityOperationAlertNotificationArchives`
  - `listSecurityOperationAlertNotificationArchiveApprovals`
- 展示字段：
  - `has_export_field_ledger`
  - `exported_field_count`
  - `notification_archive_filter_field_count`

## 页面规则

- 归档文件列表继续只展示文件、目录、大小、更新时间和操作。
- 通知归档行增加轻量 `通知归档字段账本` 摘要。
- 删除审批行保留同样的字段账本摘要，便于审批人判断归档上下文是否完整。
- 列表页不展开完整字段数组，也不展示完整 JSON。
- 完整字段明细仍保留在 CSV、安全事件详情和后端审计上下文中。

## 验收标准

- 通知归档文件行展示：
  - `通知归档字段账本：已保留`
  - `导出字段：N 项`
  - `归档筛选字段：N 项`
- 通知归档删除审批行展示同样摘要。
- 自愈审计归档、SLA 死信归档没有这些字段时不展示字段账本摘要。
- IA 合约测试禁止在归档列表中展开 `exported_fields`、`notification_archive_filter_fields` 或完整 JSON。
