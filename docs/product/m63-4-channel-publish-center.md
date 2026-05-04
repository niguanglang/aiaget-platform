# M63-4 全渠道发布中心

## 目标

把 Agent 发布从单一配置扩展为可运营的渠道中心，支持 Web 组件、开放 API、企业微信、钉钉、飞书、Slack 和自定义 Webhook 的统一配置、启停、健康检查、资源授权和用量观测。

## 后端能力

- 复用并增强 `agent_publish_channel`，新增渠道名称、描述、入口地址、回调地址、密钥密文/脱敏值、最近发布时间、最近检查时间、健康状态和健康说明。
- 新增 `ChannelsModule`：
  - `GET /channels/overview`
  - `POST /channels`
  - `PATCH /channels/:channelId`
  - `POST /channels/:channelId/enable`
  - `POST /channels/:channelId/disable`
  - `POST /channels/:channelId/check`
- 保存、启用、停用、健康检查会写入 `platform_event`，并关联 `resourceType=CHANNEL`、`channelId`、`agentId`、`traceId`。
- 渠道列表按 Agent 数据范围过滤，单渠道操作接入 `DataScopeGuard` 和 `ResourceAclGuard`。
- 数据权限中心和资源授权中心已支持 `CHANNEL` 资源类型，可为具体发布渠道授权。

## 前端能力

- 新增 `/channels` 全渠道发布中心页面。
- 页面包含：
  - 渠道总览指标
  - 渠道类型/状态/健康状态筛选
  - 渠道清单
  - 渠道详情
  - 新建/编辑渠道表单
  - 启用、停用、健康检查
  - 渠道类型分布
  - 最近渠道事件
- 新增 `frontend-reference-design` 工作区：
  - `images/frontend-reference-design/m63-4-全渠道发布中心/00-project-ui-brief.md`
  - `01-product-ui-design-prompt.md`
  - `02-product-prototype-prompt.md`
  - `03-component-mapping.md`

## 数据库说明

迁移文件：

```text
apps/control-api/prisma/migrations/20260502133000_m63_channel_publish_center/migration.sql
```

新增表字段与字段注释已写入迁移和 `scripts/postgres_comments.sql`。

## 验证

已通过：

```text
pnpm --filter @aiaget/control-api typecheck
pnpm --filter @aiaget/web typecheck
```

## 后续联动

- 外部 API 和 Webhook 投递可逐步把真实调用用量写入 `platform_usage_event(resourceType=CHANNEL)`。
- 企业微信、钉钉、飞书等渠道的真实回调验签、消息适配器可继续下沉到 Tool Gateway 或 Runtime。
- 资源授权中心可对单个渠道做角色、部门、用户、租户级授权。
