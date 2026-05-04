# M73 通知策略配置中心

## 目标

在 M72 已提供告警通知自动重试后台任务后，把自动重试策略从环境变量升级为租户级系统设置，让运营人员可以在设置中心维护通知策略。

本模块不新增表、不执行迁移、不启动容器、不安装中间件。

## 数据承载

复用现有系统设置表：

```text
system_setting
```

新增分类：

```text
NOTIFICATION = 通知策略
```

## 默认参数

新增租户级默认设置：

```text
alert_notification_auto_retry_enabled       告警通知自动重试
alert_notification_retry_interval_ms        自动重试扫描间隔
alert_notification_retry_batch_size         单批重试数量
alert_notification_max_retry_count          最大重试次数
alert_notification_retry_backoff_seconds    重试退避秒数
alert_notification_lookback_hours           重试回看小时数
```

默认值：

```text
自动重试：开启
扫描间隔：60000 ms
单批数量：8
最大重试：3 次
退避时间：60 秒
回看窗口：24 小时
```

## 后端联动

M72 自动重试任务策略读取优先级：

```text
1. 当前租户 system_setting / NOTIFICATION / ACTIVE
2. 环境变量兜底
```

环境变量仍保留：

```text
PLATFORM_USAGE_ALERT_NOTIFICATION_TASK_ENABLED
PLATFORM_USAGE_ALERT_NOTIFICATION_TASK_INTERVAL_MS
PLATFORM_USAGE_ALERT_NOTIFICATION_TASK_BATCH_SIZE
PLATFORM_USAGE_ALERT_NOTIFICATION_TASK_MAX_RETRY_COUNT
PLATFORM_USAGE_ALERT_NOTIFICATION_TASK_BACKOFF_SECONDS
PLATFORM_USAGE_ALERT_NOTIFICATION_TASK_LOOKBACK_HOURS
```

如果租户通知策略被删除或全部停用，则回退环境变量策略。

## 前端承载

设置中心：

```text
/settings
```

新增能力：

```text
1. 参数分类新增“通知策略”
2. 复用系统参数卡片编辑自动重试开关和数字策略
3. 右侧治理说明展示该分类对监控中心自动重试任务的影响
4. 支持保存、停用、恢复默认和只读权限状态
```

监控中心：

```text
/monitor
```

新增能力：

```text
1. 自动重试任务卡片展示策略来源
2. 展示当前单批数量、最大重试、退避时间、回看窗口
3. 区分“租户系统设置”和“环境变量兜底”
```

## 边界

1. 不新增通知策略表。
2. 不做复杂 Cron 编辑器。
3. 不做通知渠道模板配置。
4. 不做按告警等级的差异化策略。
5. 后续生产化可以扩展为策略版本、审批发布和分级策略。

## 验收标准

- 设置中心可以看到“通知策略”分类。
- 通知策略默认参数会自动创建。
- 编辑通知策略后，M72 任务按租户设置读取。
- 监控中心能展示当前策略来源和关键参数。
- Control API typecheck 通过。
- Web typecheck 通过。
