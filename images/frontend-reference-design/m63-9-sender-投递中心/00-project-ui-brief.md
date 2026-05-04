# Project UI Brief

## 页面 / 功能目标

- 页面：M63-9 Sender 投递中心
- 路由：`/channels`
- 目标：在现有「全渠道发布中心」内补齐主动回复投递的可观测、可审计、可重试闭环。
- 用户：租户管理员、渠道管理员、审计人员、运维人员。

## 当前项目契约

- 前端：Next.js App Router + React + TypeScript + Tailwind CSS，组件风格接近 shadcn/ui。
- 页面入口：`apps/web/src/app/(console)/channels/page.tsx` 渲染 `ChannelContent`。
- 现有组件：`Card`、`Button`、`Input`、`MetricCard`、`StatusBadge`、`EmptyState`、lucide icons、`motion/react`。
- 现有页面结构：顶部状态与操作区、Bento 指标、渠道列表、右侧渠道详情、渠道 Mix、最近事件。
- API client：`apps/web/src/lib/api-client.ts`。
- 后端模块：`ChannelsController` / `ChannelsService`、`ExternalChannelSenderService`、`PlatformEventsService`。

## 新增 API 契约

- `GET /channels/sender-deliveries`
  - 查询字段：`channel_id`、`status`、`provider`。
  - 返回：`ListChannelSenderDeliveriesResult`。
- `GET /channels/sender-deliveries/:deliveryId`
  - 返回：`ChannelSenderDeliveryDetail`。
- `POST /channels/sender-deliveries/:deliveryId/retry`
  - 仅允许重试 `FAILED` 投递。
  - 返回：`RetryChannelSenderDeliveryResult`。

## 数据实体

- `ChannelSenderDeliveryListItem`
  - `delivery_id`、`parent_delivery_id`
  - `channel_id`、`channel_name`、`channel_type`
  - `agent_id`、`agent_name`
  - `provider`、`target`
  - `status`：`PENDING`、`SUCCESS`、`FAILED`、`SKIPPED`、`RETRYING`
  - `response_status`、`latency_ms`、`retry_count`
  - `conversation_id`、`run_id`、`trace_id`
  - `external_conversation_id`、`external_message_id`
  - `error_message`、`delivered_at`、`created_at`
- `ChannelSenderDeliveryDetail`
  - 继承列表字段
  - `request_body`、`request_headers`、`response_body`、`updated_at`

## 权限与状态

- 查看：`channel:publish:view`
- 重试：`channel:publish:manage`
- 页面必须处理：加载、空数据、失败、成功提示、无权限禁用、重试按钮禁用、详情未选择。

## 设计约束

- 保留现有 `/channels` 页面信息架构，不新增孤立路由。
- 中文界面文案。
- 企业 SaaS 后台质感：细边框、轻阴影、玻璃感、克制动效。
- 用 Bento / Dashboard layout 承载指标、列表和详情。
- 不显示未脱敏密钥、Authorization、完整 token URL。
