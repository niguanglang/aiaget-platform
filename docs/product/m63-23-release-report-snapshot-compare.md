# M63-23 报告版本对比与审计差异中心

## 目标

在 M63-22 报告快照归档能力之上，支持选择两个已归档的渠道发布复盘报告快照，并生成审计差异结果。

本阶段不新增数据库表，继续复用 `platform_event.payloadJson` 中保存的快照报告。

## 新增接口

```text
GET /channels/:channelId/release-report/snapshots/:baseSnapshotId/compare/:targetSnapshotId
```

权限：

```text
channel:publish:view
```

接口仍经过：

```text
DataScopeGuard
ResourceAclGuard
```

## 对比范围

对比两个快照中的 `ChannelReleaseReport`：

```text
summary      风险等级、健康状态、发布状态、审批状态、灰度状态、回滚点、复盘结论
metrics      指标名称、指标值和说明
risks        风险标题、等级、描述和建议
timeline     发布相关事件的新增和移除
```

接口只返回真实变化项，不返回 `UNCHANGED` 项。

## 前端

在 `/channels` 的“渠道发布复盘与变更报告”面板中增强快照区域：

- 快照行支持“查看”
- 快照行支持“设为基准”
- 快照行支持“设为对比”
- 新增“报告版本对比”面板
- 展示变更、新增、移除、严重差异统计
- 按摘要、指标、风险建议、时间线分组展示差异

## 边界

- 不新增表。
- 不执行迁移。
- 不启动容器。
- 不安装中间件。
- 不支持快照编辑、删除、导出。
- 不新增独立页面，嵌入现有渠道发布中心。

## 验收标准

- 可以选择两个不同快照进行对比。
- 相同快照会被前端阻止对比，后端也会拒绝。
- 差异统计与分组差异列表可以正常展示。
- 快照详情查看能力不受影响。
- Control API 和 Web typecheck 通过。
