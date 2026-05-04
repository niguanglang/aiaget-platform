# M63-22 报告快照与归档中心

## 目标

把 M63-21 按需生成的渠道发布复盘报告归档为快照，支持审计留痕、历史查看和后续版本对比。

本阶段不新增数据库表，复用 `platform_event.payloadJson` 保存快照。

## 新增接口

```text
GET  /channels/:channelId/release-report/snapshots
POST /channels/:channelId/release-report/snapshots
GET  /channels/:channelId/release-report/snapshots/:snapshotId
```

权限：

```text
channel:publish:view    查看快照
channel:publish:manage  归档快照
```

## 存储设计

快照事件：

```text
event_type: channel.release_report.snapshot_created
resource_type: CHANNEL
resource_id: channel_id
source_system: channel_release_report
source_id: snapshot_id
payload_json:
  snapshot_id
  report
```

`report` 为完整 `ChannelReleaseReport`，包含：

```text
summary
metrics
risks
timeline
recent_events
markdown
```

## 前端

在 `/channels` 的“渠道发布复盘与变更报告”面板中新增：

- 归档快照按钮
- 快照数量
- 快照列表
- 快照详情
- 归档时 Markdown 报告正文

## 边界

- 不新增表。
- 不执行迁移。
- 不启动容器。
- 不安装中间件。
- 当前快照不可编辑、不可删除。

后续强合规归档建议新增专用 `channel_release_report_snapshot` 表，并为表和字段补全中文注释。

## 验收标准

- 可以归档当前复盘报告。
- 可以查看快照列表。
- 可以查看快照详情和归档时报告正文。
- Control API 和 Web typecheck 通过。
