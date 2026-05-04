# Project UI Brief

## 页面 / 功能目标

- 页面：M63-10 渠道投递策略中心
- 路由：`/channels`
- 目标：在「全渠道发布中心」内为每个发布渠道配置主动回复投递策略，并让失败重试遵守策略约束。
- 用户：租户管理员、渠道管理员、运维人员、审计人员。

## 当前项目契约

- 前端：Next.js + React + TypeScript + Tailwind CSS，shadcn 风格组件。
- 页面入口：`apps/web/src/components/channels/channel-content.tsx`。
- 现有能力：
  - 渠道总览、渠道详情、渠道配置 JSON。
  - 主动回复投递列表、详情、手动重试。
  - React Query 数据流和 `ApiClientError` 错误提示。
- 后端：
  - `ChannelsController` / `ChannelsService`
  - `ExternalChannelSenderService`
  - 投递记录表 `channel_sender_delivery`
- 权限：
  - 查看：`channel:publish:view`
  - 管理策略：`channel:publish:manage`

## 策略数据契约

策略保存在 `agent_publish_channel.config.sender_policy`，不新增表。

字段：

- `auto_retry_enabled`: 是否允许自动重试，第一版只保存配置，不启动后台定时器。
- `manual_retry_enabled`: 是否允许控制台手动重试。
- `max_retry_count`: 最大重试次数，范围 0-10。
- `retry_backoff_seconds`: 建议退避秒数，范围 1-3600。
- `retry_on_statuses`: 允许重试的 HTTP 状态码列表。
- `alert_on_failure`: 失败时标记需要告警。
- `retention_days`: 投递记录保留天数。

新增 API：

- `GET /channels/:channelId/sender-policy`
- `PUT /channels/:channelId/sender-policy`

## 页面状态

- 加载策略、保存中、保存成功、保存失败。
- 无权限时禁用表单和保存按钮。
- 未选择渠道时显示空状态。
- 策略影响说明需要中文表达清楚。

## 设计约束

- 不新增路由，不破坏 `/channels` 现有页面。
- 保持企业 SaaS 后台风格，细边框、轻阴影、留白清晰。
- 不使用夸张动效、过度渐变或信息堆叠。
