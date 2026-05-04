# Project UI Brief

## 页面 / 功能目标

- 页面：M63-12 渠道发布审批与灰度发布
- 路由：`/channels`
- 目标：在「全渠道发布中心」中给每个发布渠道增加发布审批、灰度比例和回滚控制，让企业渠道发布具备上线前审批、逐步放量、异常回退的运营闭环。
- 用户：租户管理员、渠道管理员、安全管理员、审计人员。

## 当前项目契约

- 前端：Next.js + React + TypeScript + Tailwind CSS，shadcn 风格组件。
- 页面入口：`apps/web/src/components/channels/channel-content.tsx`。
- 数据层：React Query + `apps/web/src/lib/api-client.ts`。
- 组件：`Card`、`Button`、`Input`、`MetricCard`、`StatusBadge`、`EmptyState`，图标使用 `lucide-react`。
- 现有能力：
  - 渠道 CRUD、启用、停用、健康检查。
  - Sender 投递中心。
  - Sender 策略中心。
  - Sender 后台任务中心。
- 后端：`ChannelsController` / `ChannelsService`。

## 数据契约

不新增表。发布控制保存在：

```text
agent_publish_channel.config.publish_control
```

字段：

- `approval_required`
- `approval_status`: `NOT_REQUIRED | PENDING | APPROVED | REJECTED`
- `approval_note`
- `requested_by`
- `requested_at`
- `reviewed_by`
- `reviewed_at`
- `decision_note`
- `rollout_enabled`
- `rollout_percentage`
- `rollout_status`: `CLOSED | GRAY | FULL`
- `rollback_available`
- `last_stable_status`
- `last_stable_config`
- `last_rollback_at`
- `last_rollback_by`

## API 契约

- `GET /channels/:channelId/publish-control`
- `PUT /channels/:channelId/publish-control`
- `POST /channels/:channelId/publish-control/request-approval`
- `POST /channels/:channelId/publish-control/approve`
- `POST /channels/:channelId/publish-control/reject`
- `POST /channels/:channelId/publish-control/rollout`
- `POST /channels/:channelId/publish-control/rollback`

## 权限

- 查看：`channel:publish:view`
- 配置策略 / 发起审批 / 设置灰度 / 回滚：`channel:publish:manage`
- 审批通过：`channel:publish:deploy`
- 审批拒绝：`channel:publish:disable`

接口继续走 DataScopeGuard、ResourceAclGuard、SecurityPolicyGuard。

## 页面状态

- 未选择渠道。
- 加载发布控制。
- 审批待处理。
- 审批通过 / 已拒绝。
- 灰度关闭 / 灰度中 / 全量。
- 回滚不可用 / 可回滚。
- 权限不足时禁用操作。
- 操作成功和失败提示。

## 设计约束

- 不新增路由，作为 `/channels` 页面中的独立面板。
- 中文 UI。
- 保持企业 SaaS 后台产品感，信息清晰，不做营销化英雄区。
- 不使用夸张渐变、发光或大圆堆叠。
