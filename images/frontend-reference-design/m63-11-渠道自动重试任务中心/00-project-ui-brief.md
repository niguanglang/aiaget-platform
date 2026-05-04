# Project UI Brief

## 页面 / 功能目标

- 页面：M63-11 渠道自动重试任务中心
- 路由：`/channels`
- 目标：在「全渠道发布中心」里展示 Channel Sender 后台任务状态，并允许有权限用户手动触发一次自动重试扫描或投递记录清理。
- 用户：租户管理员、渠道管理员、运维人员、审计人员。

## 当前项目契约

- 前端：Next.js + React + TypeScript + Tailwind CSS，shadcn 风格组件。
- 页面入口：`apps/web/src/components/channels/channel-content.tsx`。
- 数据层：React Query + `apps/web/src/lib/api-client.ts`。
- 组件：`Card`、`Button`、`Input`、`MetricCard`、`StatusBadge`、`EmptyState`，图标使用 `lucide-react`。
- 现有页面能力：
  - 渠道总览、渠道详情、渠道配置。
  - Sender 投递中心。
  - M63-10 渠道投递策略中心。

## API 契约

新增接口：

- `GET /channels/sender-tasks/overview`
- `POST /channels/sender-tasks/run-auto-retry`
- `POST /channels/sender-tasks/run-cleanup`

前端 API client：

- `getChannelSenderTaskOverview()`
- `runChannelSenderAutoRetry()`
- `runChannelSenderCleanup()`

## 数据实体

`ChannelSenderTaskOverview`：

- `generated_at`
- `scheduler_enabled`
- `running`
- `last_tick_at`
- `next_tick_after_seconds`
- `summary.pending_auto_retry_count`
- `summary.expired_delivery_count`
- `summary.auto_retry_enabled_channel_count`
- `summary.failed_delivery_count`
- `summary.oldest_failed_at`
- `last_auto_retry_result`
- `last_cleanup_result`

`ChannelSenderTaskRunResult`：

- `task`
- `started_at`
- `finished_at`
- `scanned_count`
- `retried_count`
- `success_count`
- `failed_count`
- `skipped_count`
- `deleted_count`
- `error_message`

## 权限

- 查看：`channel:publish:view`
- 手动触发任务：`channel:publish:manage`

后端仍按租户隔离统计和执行任务；任务执行不绕过 M63-10 的策略边界。

## 页面状态

- loading：任务概览和按钮处理中。
- empty：没有可自动重试或可清理记录。
- error：任务概览加载失败、手动任务触发失败。
- disabled：缺少 `channel:publish:manage` 时禁用手动触发。
- success：手动触发后显示执行结果。

## 设计约束

- 不新增路由，不破坏 `/channels` 现有布局。
- 中文 UI。
- 企业 SaaS 后台风格：细边框、轻阴影、留白清晰。
- 信息不要过满，强调任务健康、待处理数量、最近执行结果和操作按钮。
