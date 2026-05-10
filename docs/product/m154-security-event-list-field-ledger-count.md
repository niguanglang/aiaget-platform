# M154 安全事件列表字段账本计数

M153 已经让统一审批工作台 CSV 导出包含通知归档字段账本计数，并在安全事件详情页展示完整导出字段清单。M154 负责把同一条线索前移到 `/security/events` 列表页，但只展示轻量计数，避免把完整字段数组或 JSON 塞进列表。

## 范围

- 后端 `SecurityCenterEventListItem` 增加轻量字段账本计数字段。
- `SecurityCenterService.listEvents` 对审批工作台导出平台事件映射：
  - `has_export_field_ledger`
  - `exported_field_count`
  - `notification_archive_filter_field_count`
- `/security/events` 列表行显示中文 chip：
  - `字段账本：已保留`
  - `导出字段：N 项`
  - `归档筛选字段：N 项`
- 详情页继续展示完整 `exported_fields` 和 `notification_archive_filter_fields`。

## 信息架构约束

- 列表页只做查询、筛选、概览和详情跳转。
- 列表项不返回、不展示完整导出字段数组。
- 完整字段清单只进入 `/security/events/[id]` 详情页和 CSV/审计上下文。

## 验收

- 后端列表项返回字段账本计数，但不包含 `exported_fields` 或 `notification_archive_filter_fields`。
- 前端列表页源码包含字段账本计数 chip 文案。
- 前端列表页 IA 合约禁止读取完整字段数组。
- 安全事件详情页现有字段清单展示不受影响。

## 参考设计

```text
images/frontend-reference-design/m154-安全事件字段账本计数/
```
