# M63-10 渠道投递策略中心

## 目标

把 M63-9 的失败投递重试升级为可配置策略，允许每个发布渠道独立控制主动回复投递的重试边界、失败告警和记录保留策略。

## 存储设计

本模块不新增数据表，策略保存在现有发布渠道配置中：

```text
agent_publish_channel.config.sender_policy
```

策略字段：

- `auto_retry_enabled`：是否启用自动重试。第一版只保存策略，不启动后台自动重试任务。
- `manual_retry_enabled`：是否允许控制台手动重试。
- `max_retry_count`：最大重试次数，范围 0-10。
- `retry_backoff_seconds`：退避秒数，范围 1-3600。
- `retry_on_statuses`：允许重试的 HTTP 响应状态码。
- `alert_on_failure`：失败时是否进入告警策略边界。
- `retention_days`：投递记录保留天数，范围 1-365。

## 后端能力

- 新增渠道投递策略读取接口。
- 新增渠道投递策略更新接口。
- 更新策略时保留渠道原有 `config`，只覆盖 `sender_policy`。
- 手动重试失败投递前会读取当前渠道策略并校验：
  - 策略关闭手动重试时拒绝重试。
  - 当前投递重试次数达到 `max_retry_count` 时拒绝重试。
  - 失败记录存在响应码且不在 `retry_on_statuses` 时拒绝重试。
- 策略更新写入平台事件，便于审计。

## API

```text
GET /api/v1/channels/:channelId/sender-policy
PUT /api/v1/channels/:channelId/sender-policy
```

权限：

```text
channel:publish:view   查看策略
channel:publish:manage 更新策略
```

资源控制：

```text
DataScopeGuard + ResourceAclGuard
resourceType = CHANNEL
```

## 前端

在 `/channels` 的「全渠道发布中心」下新增「渠道投递策略」面板：

- 策略指标：手动重试、最大重试、退避时间、记录保留。
- 策略开关：自动重试、允许手动重试、失败告警。
- 数值配置：最大重试次数、退避秒数、记录保留天数。
- 响应码配置：英文逗号分隔的 400-599 状态码。
- 权限状态：缺少 `channel:publish:manage` 时只读。
- 加载、保存、失败、未选择渠道状态均为中文提示。

参考设计产物：

```text
images/frontend-reference-design/m63-10-渠道投递策略中心/
```

## 后续边界

- 自动重试任务应在后续工作流模块中基于 `auto_retry_enabled` 和 `retry_backoff_seconds` 接入，不在本模块启动后台调度。
- 投递记录清理任务应基于 `retention_days` 单独实现，避免控制台保存策略时直接删除审计数据。
