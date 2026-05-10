# M140 客户成功复盘通知审计来源筛选

## 背景

M139 已经把客户成功复盘归档删除审批告警纳入通知任务和自愈失败来源。但通知发出后，安全运营人员还需要在 `/security/alerts` 的通知审计区按该来源筛选、导出和归档，否则客户成功复盘来源容易与团队报告、SLA 或未知来源混在一起。

## 范围

- 通知审计列表返回中文来源标签 `alert_category_label`。
- 通知审计来源筛选支持 `CUSTOMER_SUCCESS_CLOSE_WON_REPORT_ARCHIVE_DELETE`。
- 通知审计 CSV 导出使用中文来源标签。
- `/security/alerts` 通知审计区增加来源筛选、当前筛选导出和创建审计归档。
- 客户成功复盘来源显示为“客户成功复盘归档删除通知”。
- 不新增表结构、不执行迁移、不新增中间件、不启动容器。

## 后端契约

`SecurityOperationAlertNotificationItem` 新增：

```text
alert_category_label
```

来源标签映射：

```text
CUSTOMER_SUCCESS_CLOSE_WON_REPORT_ARCHIVE_DELETE -> 客户成功复盘归档删除
AGENT_TEAM_REPORT_ARCHIVE_DELETE -> 团队报告归档删除
SLA_DEAD_LETTER_ARCHIVE_DELETE -> SLA 死信归档删除
NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE -> 自愈审计归档删除
NOTIFICATION_TASK_MIXED_FAILURE_SOURCE -> 多来源通知任务失败
```

接口保持不变：

```text
GET  /api/v1/security-center/operation-alert-notifications
GET  /api/v1/security-center/operation-alert-notifications/export
POST /api/v1/security-center/operation-alert-notifications/archives
```

查询条件继续复用：

```text
status
alert_category
keyword
```

## 前端页面

页面：

```text
/security/alerts
```

通知审计区新增：

```text
1. 来源筛选下拉框
2. 客户成功复盘归档删除通知选项
3. 导出通知审计按钮
4. 创建审计归档按钮
5. 当前筛选命中数量提示
6. 通知行展示中文来源标签
```

页面职责保持不变：

- `/security/alerts` 只负责告警运营、统一审批工作台、通知审计和 SLA 风险。
- 客户成功机会详情、成交复盘报告正文仍在客户成功模块。
- 归档文件下载和删除审批仍在 `/security/archives` 与统一审批工作台闭环。

## 参考设计

```text
images/frontend-reference-design/m140-客户成功复盘通知审计来源筛选/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
```

## 验收

- 通知审计可按 `CUSTOMER_SUCCESS_CLOSE_WON_REPORT_ARCHIVE_DELETE` 筛选。
- 通知审计列表返回并展示“客户成功复盘归档删除”。
- 通知审计 CSV 包含中文来源标签。
- 前端通知审计可导出当前筛选。
- 前端通知审计可按当前筛选创建对象存储归档。
- 共享类型构建、后端专项测试、前端 IA 契约、前后端 typecheck 通过。
