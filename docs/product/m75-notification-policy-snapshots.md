# M75 通知策略版本快照与回滚审批预留

## 目标

在 M74 通知策略影响预览和审计摘要基础上，增加通知策略版本快照、受控回滚和审批字段预留，让通知策略变更具备可追溯、可恢复、可扩展到安全审批的闭环。

本模块只新增代码和迁移文件，不执行数据库迁移、不启动容器、不安装中间件。

## 新增数据表

```text
system_setting_snapshot
```

用途：

```text
1. 保存系统设置变更前后的值
2. 保存变更动作：UPDATE / RESET / ROLLBACK
3. 保存版本号
4. 保存影响等级和影响摘要
5. 预留审批状态与审批请求 ID
6. 记录回滚来源和回滚次数
```

M75 只对 `NOTIFICATION` 分类写入快照。

## 快照动作

```text
UPDATE    保存通知策略
RESET     恢复默认通知策略
ROLLBACK  回滚到某个历史快照的变更前值
```

## 审批预留

审批状态：

```text
NOT_REQUIRED
RESERVED
PENDING
APPROVED
REJECTED
```

M75 不接完整审批流。高影响通知策略变更会标记为：

```text
RESERVED
```

后续可以接入安全中心审批，把 `approval_request_id` 关联到审批请求。

## 后端接口

新增：

```text
GET  /api/v1/system-settings/notification-policy/snapshots
POST /api/v1/system-settings/notification-policy/snapshots/:snapshotId/rollback
```

权限：

```text
查看快照：system:settings:view
执行回滚：system:settings:manage
```

回滚逻辑：

```text
1. 校验快照属于当前租户
2. 校验快照属于通知策略
3. 将当前设置回滚到该快照 previous_value / previous_status
4. 生成新的 ROLLBACK 快照
5. 增加来源快照 rollback_count
6. 返回更新后的 SystemSettingItem
```

## 前端承载

设置中心：

```text
/settings
```

通知策略分类右侧配置治理面板新增：

```text
1. 版本快照摘要
2. 最近快照列表
3. 快照动作标识
4. 审批预留状态
5. 变更前后状态和值
6. 回滚按钮
7. 回滚确认弹窗
```

保存、恢复默认、回滚成功后刷新：

```text
system-settings
system-settings-overview
notification-policy-audit
notification-policy-snapshots
```

## 参考设计

```text
images/frontend-reference-design/m75-notification-policy-snapshots/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
```

## 边界

1. M75 不执行迁移，需要部署时由 `prisma migrate deploy` 应用。
2. M75 不做完整审批流，只预留审批字段和 UI 状态。
3. M75 不做全局系统设置版本中心，只在通知策略分类显示。
4. M75 回滚到快照的“变更前值”，用于撤销该次变更。

## 验收标准

- 通知策略保存后会生成 UPDATE 快照。
- 通知策略恢复默认后会生成 RESET 快照。
- 设置中心通知策略分类可以查看最近版本快照。
- 有管理权限的用户可以确认回滚快照。
- 回滚会生成 ROLLBACK 快照并刷新设置、审计和快照列表。
- 快照表与字段有注释。
- Control API typecheck 通过。
- Web typecheck 通过。
