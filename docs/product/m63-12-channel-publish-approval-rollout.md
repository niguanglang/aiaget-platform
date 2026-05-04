# M63-12 渠道发布审批与灰度发布

## 目标

把全渠道发布从简单启停升级为可控发布流程：渠道发布前可启用审批门禁，审批通过后按灰度比例开放流量，并保留最近稳定配置用于快速回滚。

## 后端能力

- 发布控制数据复用 `agent_publish_channel.config.publish_control`，不新增数据库表。
- 新增渠道发布控制接口：
  - 查看审批与灰度状态
  - 保存审批策略和审批说明
  - 发起发布审批
  - 通过发布审批
  - 拒绝发布审批
  - 更新灰度比例
  - 回滚到最近稳定配置
- 所有发布控制动作写入平台事件：
  - `channel.publish_control.updated`
  - `channel.publish_control.approval_requested`
  - `channel.publish_control.approved`
  - `channel.publish_control.rejected`
  - `channel.publish_control.rollout_updated`
  - `channel.publish_control.rollback`
- 稳定配置快照会排除 `publish_control` 自身，避免回滚数据递归膨胀。

## API

```text
GET  /api/v1/channels/:channelId/publish-control
PUT  /api/v1/channels/:channelId/publish-control
POST /api/v1/channels/:channelId/publish-control/request-approval
POST /api/v1/channels/:channelId/publish-control/approve
POST /api/v1/channels/:channelId/publish-control/reject
POST /api/v1/channels/:channelId/publish-control/rollout
POST /api/v1/channels/:channelId/publish-control/rollback
```

权限：

```text
channel:publish:view    查看发布控制
channel:publish:manage  保存控制、发起审批、调整灰度、回滚
channel:publish:deploy  通过审批
channel:publish:disable 拒绝审批
```

接口同时经过 DataScopeGuard、ResourceAclGuard 和 SecurityPolicyGuard。

## 前端

在 `/channels` 新增「渠道发布审批与灰度发布」面板：

- 指标：
  - 审批策略
  - 审批状态
  - 灰度比例
  - 回滚状态
- 审批控制：
  - 启用发布审批
  - 保存审批说明
  - 发起审批
  - 通过审批
  - 拒绝审批
- 灰度控制：
  - 启用灰度
  - 设置 0-100 灰度比例
  - 保存灰度
  - 全量发布
  - 关闭灰度
- 回滚控制：
  - 查看稳定状态
  - 查看最近回滚时间
  - 填写决策或回滚说明
  - 回滚到稳定配置

参考设计产物：

```text
images/frontend-reference-design/m63-12-渠道发布审批与灰度发布/
```

## 注意

- 本模块不新增数据库表，不执行迁移。
- 当前审批为渠道内轻量发布审批状态，不依赖独立审批中心表。
- 后续可以把 `publish_control` 与安全审批中心、Temporal 发布工作流和渠道路由网关联动。
