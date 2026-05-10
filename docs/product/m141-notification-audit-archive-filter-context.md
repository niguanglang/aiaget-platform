# M141 通知审计归档筛选上下文闭环

## 背景

M140 已支持在 `/security/alerts` 通知审计区按状态、来源和关键词筛选，并按当前筛选创建对象存储归档。归档对象写入了筛选元数据，但 `/security/archives` 归档治理页和归档删除审批记录没有展示这些上下文，安全运营人员无法快速判断某个归档是否来自“客户成功复盘归档删除通知”等具体筛选范围。

## 范围

本里程碑补齐通知审计归档的筛选上下文展示和审批传递：

1. 归档文件列表展示创建归档时的筛选来源、筛选状态和筛选关键词。
2. 删除审批列表展示同一筛选上下文，方便审批人复核归档删除影响范围。
3. 删除申请、批准、拒绝和删除生效事件都保留筛选上下文。
4. 对象存储服务支持按需读取对象 metadata，普通文件列表不额外逐个读取 metadata。

## 后端设计

### 共享类型

`SecurityOperationAlertNotificationArchiveItem` 新增：

```ts
status_filter: SecurityOperationAlertNotificationStatus | null;
alert_category: string | null;
alert_category_label: string;
keyword: string | null;
```

`SecurityOperationAlertNotificationArchiveApprovalItem` 和 `SecurityOperationAlertNotificationArchiveApprovalTimelineItem` 同步新增上述字段。

### 对象存储

`StorageObjectItem` 增加可选 `metadata` 字段。

`StorageService.listTenantObjects` 增加 `includeMetadata?: boolean`，仅在归档治理列表需要读取对象 metadata 时通过 `HeadObject` 获取，避免普通文件管理列表产生额外对象请求。

### 安全中心

`listOperationAlertNotificationArchives` 读取通知审计归档对象 metadata，并映射：

```text
status -> status_filter
alert_category -> alert_category + alert_category_label
keyword -> keyword
```

`deleteOperationAlertNotificationArchive` 在创建删除审批事件时读取归档对象上下文并写入事件 payload。后续批准、拒绝和删除生效事件继续从审批详情继承上下文。

## 前端设计

`/security/archives` 保持页面职责不变：归档文件、下载、删除申请和删除审批治理。

归档文件表格不新增大量列，避免信息过载；筛选上下文以小型标签显示在文件名和对象 key 下方：

```text
筛选来源：客户成功复盘归档删除
筛选状态：已发送
筛选关键词：trace-customer
```

删除审批列表在申请人、审批人和时间字段下方展示同样的上下文条。页面不展示客户成功机会详情、报告正文或通知审计明细。

## 验收标准

1. 通知审计归档列表返回并展示 `status_filter`, `alert_category_label`, `keyword`。
2. 客户成功复盘来源显示为“客户成功复盘归档删除”。
3. 删除审批列表和审批详情时间线保留归档创建筛选上下文。
4. `/security/archives` 中文页面职责仍只承载归档治理，不混入通知审计详情或客户成功详情。
5. 后端目标测试、前端 IA 契约测试和类型检查通过。

## 前端参考设计

```text
images/frontend-reference-design/m141-通知审计归档筛选上下文闭环/
```
