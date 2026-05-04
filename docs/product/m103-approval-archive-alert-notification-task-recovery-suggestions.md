# M103 审批与归档告警通知任务自愈建议与排障入口

## 目标

在 M102 通知任务失败聚合基础上，进一步把失败原因转换成安全管理员可以直接处理的排障建议和入口。

本模块只生成建议和跳转入口，不自动修改系统设置，不安装或启动任何中间件，不新增数据库表，不执行迁移。

## 数据来源

复用现有数据：

```text
platform_event
system_setting
```

读取内容：

```text
1. 最近 24 小时通知任务执行事件
2. 最近 24 小时运营告警通知投递事件
3. 外部 Webhook 配置 external_webhook_url
4. 通知策略开关 alert_notification_auto_notify_enabled
5. 通知策略开关 alert_notification_auto_retry_enabled
```

## 后端字段

扩展：

```text
SecurityCenterOverview.approval_operations.notification_task_recovery_suggestions
```

建议字段：

```text
id
title
description
severity
reason_code
primary_action_label
primary_action_href
secondary_action_label
secondary_action_href
evidence
```

原因编码：

```text
WEBHOOK_NOT_CONFIGURED
WEBHOOK_DELIVERY_FAILED
AUTO_NOTIFY_DISABLED
AUTO_RETRY_DISABLED
CONSECUTIVE_FAILURES
HIGH_FAILURE_RATE
```

## 建议生成规则

```text
1. Webhook 未配置：任务已运行或存在投递风险，但 external_webhook_url 未配置。
2. Webhook 投递失败：投递事件存在 webhook_error 或 webhook_status >= 400。
3. 自动通知关闭：alert_notification_auto_notify_enabled 为 false。
4. 自动重试关闭：alert_notification_auto_retry_enabled 为 false。
5. 连续失败：通知任务连续失败或跳过次数 >= 2。
6. 失败率偏高：最近 24 小时任务数 >= 3 且失败率 >= 30%。
```

## 前端页面

页面：

```text
/security
```

位置：

```text
审批与归档运营 -> 通知任务失败聚合 -> 通知任务自愈建议
```

展示：

```text
1. M103 状态 Badge
2. 建议卡片
3. 风险等级
4. 原因标签
5. 证据文本
6. 主排障入口
7. 辅助排障入口
8. 健康空状态
```

入口：

```text
/settings?category=INTEGRATION
/settings?category=NOTIFICATION
/security
/monitor
/audit
```

设置中心已支持读取 `category` 查询参数，使外部集成和通知策略入口可以直接落到对应分类。

## 参考设计

```text
images/frontend-reference-design/m103-通知任务自愈建议与一键排障入口/
```

## 边界

1. M103 不新增独立页面。
2. M103 不自动修复配置。
3. M103 不新增数据库表。
4. M103 不执行数据库迁移。
5. M103 不启动任何容器或中间件。
6. M103 只把已有任务、投递、配置和策略状态投影为可操作建议。
