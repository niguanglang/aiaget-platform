# M76 通知策略审批流接入安全中心

## 目标

把 M75 预留的通知策略快照审批字段接入真实审批流。高影响通知策略变更不再直接写入 `system_setting`，而是生成待审批快照，由安全中心统一处理。

本模块只修改代码和文档，不执行数据库迁移、不启动容器、不安装中间件。

## 后端能力

新增通知策略审批接口：

```text
GET  /api/v1/system-settings/notification-policy/approvals/overview
GET  /api/v1/system-settings/notification-policy/approvals
GET  /api/v1/system-settings/notification-policy/approvals/:snapshotId
POST /api/v1/system-settings/notification-policy/approvals/:snapshotId/approve
POST /api/v1/system-settings/notification-policy/approvals/:snapshotId/reject
```

权限：

```text
查看审批：security:approval:view
处理审批：security:approval:handle
```

## 生效规则

```text
1. 低/中影响通知策略变更继续直接保存，并生成快照。
2. 高影响通知策略更新、恢复默认、回滚会先生成 PENDING 快照。
3. PENDING 快照批准后才写入 system_setting。
4. PENDING 快照拒绝后不修改 system_setting。
5. 安全中心待审批数量合并统计工具审批和通知策略审批。
```

## 前端承载

审批中心：

```text
/approvals
```

新增：

```text
1. 工具审批 / 通知策略双通道切换
2. 通知策略审批指标
3. 通知策略审批队列表格
4. 通知策略审批详情面板
5. 批准并生效 / 拒绝变更
6. 跳转设置中心查看策略上下文
```

设置中心：

```text
/settings
```

新增：

```text
1. 高影响通知策略保存后提示“已提交安全审批”
2. 高影响恢复默认提交审批
3. 高影响回滚提交审批
4. 保存、恢复默认、回滚后刷新审批中心和安全中心数据
```

安全中心：

```text
/security
```

增强：

```text
1. 高危审批模块合并统计通知策略待审批数
2. 风险信号覆盖工具调用和通知策略变更
3. 待审批指标影响安全姿态
```

## 参考设计

```text
images/frontend-reference-design/m76-notification-policy-approval/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
```

## 边界

1. M76 复用 `system_setting_snapshot` 作为通知策略审批请求，不新增通用审批表。
2. 审批备注暂存到 `approval_request_id` 的决策引用中，后续可独立扩展 reviewer/note 字段。
3. M76 只覆盖通知策略，不把全部系统设置纳入审批。
4. 未执行迁移；部署时仍由既有 M75 快照迁移提供表结构。

## 验收标准

- 高影响通知策略保存不会立即生效，而是产生待审批快照。
- 审批中心可以切换到“通知策略”通道查看待审批列表。
- 安全管理员可以批准或拒绝通知策略变更。
- 批准后系统参数生效，拒绝后保持原值。
- 安全中心待审批统计包含通知策略审批。
- Control API typecheck 通过。
- Web typecheck 通过。
