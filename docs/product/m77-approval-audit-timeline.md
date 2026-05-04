# M77 审批审计增强与统一时间线

## 目标

在 M76 审批中心基础上，新增统一审批审计事件表，把工具审批和通知策略审批的生命周期事件沉淀为可追溯时间线。

本模块只新增代码和迁移文件，不执行数据库迁移、不启动容器、不安装中间件。

## 新增数据表

```text
approval_audit_event
```

用途：

```text
1. 记录审批请求创建
2. 记录审批批准 / 拒绝
3. 记录通知策略审批通过后的生效事件
4. 记录工具审批通过后的执行失败事件
5. 保留操作人、备注、request_id、trace_id 和 metadata
```

## 当前接入来源

```text
TOOL_APPROVAL
NOTIFICATION_POLICY
```

后续可继续接入：

```text
CHANNEL_RELEASE
AGENT_TEAM_HANDOFF
PLUGIN_INSTALLATION
```

## 前端承载

审批中心：

```text
/approvals
```

详情面板新增：

```text
审批审计时间线
```

展示字段：

```text
事件状态
事件标题
事件类型
操作人
发生时间
备注
请求 ID
Trace ID
事件元数据
```

## 后端返回

`ToolApprovalDetail` 新增：

```text
audit_timeline
```

`SystemSettingSnapshotItem` 新增：

```text
audit_timeline
```

列表场景默认返回空数组，详情场景返回真实时间线。

## 参考设计

```text
images/frontend-reference-design/m77-approval-audit-timeline/
```

## 边界

1. M77 不回填历史审批数据，旧审批详情可能显示空时间线。
2. M77 不做独立审批审计列表页，只在审批详情里展示。
3. M77 不执行迁移，部署时由 `prisma migrate deploy` 应用。
4. 当前通知策略审批人和备注仍以审计事件为准，后续可再给 `system_setting_snapshot` 增加 reviewer 字段。

## 验收标准

- 工具审批创建时写入 `REQUEST_CREATED` 审计事件。
- 工具审批批准时写入 `APPROVED` 审计事件。
- 工具审批拒绝时写入 `REJECTED` 审计事件。
- 工具审批通过但执行失败时写入 `EXECUTION_FAILED` 审计事件。
- 通知策略待审批创建时写入 `REQUEST_CREATED` 审计事件。
- 通知策略批准时写入 `APPROVED` 和 `APPLIED` 审计事件。
- 通知策略拒绝时写入 `REJECTED` 审计事件。
- 审批详情页展示统一审计时间线。
- Control API typecheck 通过。
- Web typecheck 通过。
