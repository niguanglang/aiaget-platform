# M68 统一用量异常检测与告警闭环

## 目标

在 M64-M67 已有统一事件、统一用量账本、事件关系和 Rollup 汇总后，补齐基于 Rollup 的异常检测能力，让监控中心可以识别成本突增、调用量突增、错误率过高、重试率过高和无成功记录等信号。

本模块不新增表、不执行迁移、不启动容器、不安装中间件。

## 检测入口

新增接口：

```text
POST /platform-usage/anomalies/detect?window=24h|7d|30d
```

权限：

```text
monitor:log:view
```

接口读取当前租户窗口内的 `platform_usage_rollup`，按周期、主体、资源和指标分组，把最新汇总桶与历史基线对比，生成异常信号。

## 检测规则

第一版内置规则：

```text
1. COST_SPIKE：成本相对历史基线突增
2. EVENT_SPIKE：调用量相对历史基线突增
3. ERROR_RATE：错误率超过阈值并显著高于历史基线
4. RETRY_RATE：重试率超过阈值并显著高于历史基线
5. NO_SUCCESS：当前周期没有成功记录且存在错误
```

严重等级：

```text
INFO
WARN
ERROR
CRITICAL
```

## 统一事件闭环

如果检测到异常，Control API 会写入一条平台事件：

```text
event_source = platform_usage_anomaly
event_type   = platform.usage.anomaly.detected
resource     = platform_usage_rollup
status       = DEGRADED / FAILED
payload_json = 异常摘要和前 20 条异常信号
```

这样异常检测结果可以继续复用：

```text
1. 统一事件流查询
2. 事件详情 Payload 查看
3. 自动关系建链
4. 审计和监控统一口径
```

## 前端承载

继续复用：

```text
/monitor
PlatformEventUsagePanel
```

新增能力：

```text
1. full view 顶部增加“检测异常”按钮
2. 检测中按钮禁用并显示处理中状态
3. 检测成功后展示异常总数、严重、错误、警告计数
4. 异常卡片展示类型、指标、资源、当前值、基线、倍率和中文说明
5. compact 视图不展示异常检测入口，避免成本页被运维动作挤占
```

## 边界

1. M68 是按需检测，不是实时后台告警调度。
2. 检测依赖 M67 Rollup 数据质量；Rollup 不完整时异常信号可能不足。
3. 当前没有新增告警订阅、通知渠道或处理状态表。
4. 后续可以把检测入口迁移到后台任务，并接入通知、确认、关闭和升级策略。

## 验收标准

- 可通过接口检测当前窗口的用量异常。
- 检测到异常时会写入统一平台事件。
- 监控中心可以触发检测并查看异常信号卡片。
- Control API typecheck 通过。
- Web typecheck 通过。
