# M63-14 渠道发布流水线与发布批次

## 目标

把渠道发布审批、灰度、全量、回滚和终止串成一个可追踪的发布批次流水线，方便运营复盘和审计。

## 后端能力

- 发布批次状态复用 `agent_publish_channel.config.release_pipeline`，不新增数据库表。
- 发布事件继续写入 `platform_events`。
- 新增能力：
  - 查看当前发布流水线
  - 创建发布批次
  - 标记发布批次为全量
  - 终止发布批次
- 自动联动已有动作：
  - 更新发布控制时同步批次待审批状态
  - 发起审批、审批通过、审批拒绝、灰度更新、回滚会影响流水线步骤状态
  - 标记全量会同步 `publish_control.rollout_percentage = 100`

## API

```text
GET  /api/v1/channels/:channelId/release-pipeline
POST /api/v1/channels/:channelId/release-pipeline/start
POST /api/v1/channels/:channelId/release-pipeline/mark-full
POST /api/v1/channels/:channelId/release-pipeline/abort
```

权限：

```text
channel:publish:view    查看发布流水线
channel:publish:manage  创建发布批次
channel:publish:deploy  标记全量发布
channel:publish:disable 终止发布批次
```

## 前端

在 `/channels` 新增「渠道发布流水线与发布批次」面板：

- 指标：
  - 当前批次
  - 目标灰度
  - 最近批次
  - 流水线事件
- 流水线步骤：
  - 创建批次
  - 发起审批
  - 审批通过
  - 灰度发布
  - 全量发布
  - 回滚或终止
- 批次操作：
  - 创建批次
  - 标记全量
  - 终止批次
- 记录展示：
  - 最近发布批次
  - 最近发布事件

参考设计产物：

```text
images/frontend-reference-design/m63-14-渠道发布流水线与发布批次/
```

## 注意

- 本模块不新增数据库表，不执行迁移。
- 当前发布批次是渠道内轻量流水线，不依赖 Temporal。
- 后续可把发布批次升级为 Temporal workflow，实现审批等待、灰度观测、自动推进和失败回滚。
