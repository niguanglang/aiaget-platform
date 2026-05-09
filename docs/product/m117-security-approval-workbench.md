# M117 安全中心细分审批统一工作台

## 目标

M117 在已有工具审批、通知策略审批和多类归档删除审批基础上，把安全中心的审批能力从分散卡片升级为统一工作台。安全管理员可以在安全中心的 `/security/alerts` 页面内，按审批类型、状态、风险域和关键词查看所有待处理事项，直接打开详情、查看来源扩展信息和审计时间线，并完成通过或拒绝。

本模块不新增数据库表、不执行迁移、不启动容器、不安装中间件。

## 聚合范围

统一工作台聚合以下审批来源：

```text
1. 工具调用审批
2. 通知策略变更审批
3. 审批审计归档删除审批
4. 团队运行报告归档删除审批
5. 运营告警通知审计归档删除审批
6. SLA 死信处置审计归档删除审批
7. 通知任务自愈闭环审计归档删除审批
```

审批类型：

```text
TOOL_CALL
NOTIFICATION_POLICY
APPROVAL_AUDIT_ARCHIVE_DELETE
AGENT_TEAM_RUN_REPORT_ARCHIVE_DELETE
OPERATION_ALERT_NOTIFICATION_ARCHIVE_DELETE
SLA_DEAD_LETTER_AUDIT_ARCHIVE_DELETE
NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE
```

审批状态：

```text
PENDING   待审批
APPROVED  已批准
REJECTED  已拒绝
APPLIED   已生效
```

风险域：

```text
TOOL             工具风险
POLICY           策略风险
AUDIT_ARCHIVE    审计归档
OPERATION_ALERT  运营告警
```

## 后端接口

新增统一审批工作台接口：

```text
GET  /security-center/approval-workbench/overview
GET  /security-center/approval-workbench
GET  /security-center/approval-workbench/:approvalId
POST /security-center/approval-workbench/:approvalId/review
```

列表查询参数：

```text
page
page_size
keyword
type
status
risk_domain
```

处理审批请求：

```json
{
  "decision": "APPROVE",
  "decision_note": "审批意见"
}
```

## 后端实现

新增 `SecurityApprovalWorkbenchService`，只做聚合和转发，不复制审批状态：

```text
1. 从 tool_approval_request 聚合工具调用审批
2. 从 system_setting_snapshot 聚合通知策略审批
3. 从 approval_audit_event 聚合审批审计归档删除审批
4. 从 platform_event 聚合安全中心来源的归档删除审批
5. 详情返回 metadata 与 timeline
6. review 根据审批类型转发到原服务的 approve/reject 方法
```

转发目标：

```text
ApprovalsService.approve / reject
SystemSettingsService.approveNotificationPolicyApproval / rejectNotificationPolicyApproval
ApprovalsService.approveArchiveDeleteApproval / rejectArchiveDeleteApproval
SecurityCenterService.approveOperationAlertNotificationArchiveApproval / rejectOperationAlertNotificationArchiveApproval
SecurityOperationAlertSlaService.approveDeadLetterAuditArchiveApproval / rejectDeadLetterAuditArchiveApproval
SecurityCenterService.approveNotificationTaskRecoveryAuditArchiveApproval / rejectNotificationTaskRecoveryAuditArchiveApproval
```

## 前端页面

页面为：

```text
/security/alerts
```

安全中心根页：

```text
/security
```

只保留安全治理总览、待办/风险摘要和进入策略治理、事件追踪、告警运营、自愈恢复、归档治理的导航入口，不承载完整审批列表。

前端能力：

```text
1. 审批总数、待处理、高风险待审、归档删除待审指标
2. 关键词、审批类型、状态、风险域筛选
3. 审批队列表格
4. 右侧详情面板
5. 来源扩展信息展示
6. 审批时间线展示
7. 审批备注
8. 通过 / 拒绝操作
9. 无权限、加载、空状态、错误和成功反馈
```

已落地前端闭环：

```text
1. 审批队列支持关键词、审批类型、状态和风险域组合筛选。
2. 点击审批记录后在右侧详情面板展示基础信息、来源扩展信息和审批时间线。
3. 处理意见使用独立备注输入，不和筛选区或列表状态混放。
4. 通过 / 拒绝均使用二次确认，确认后调用统一 review 接口。
5. 处理完成后刷新统一审批概览、审批队列、详情、安全中心概览和分散审批来源数据。
6. 无处理权限时详情保持只读，仅展示权限提示。
```

## 权限

查看统一审批工作台需要：

```text
security:approval:view
```

处理审批需要：

```text
security:approval:handle
```

租户管理员角色可以绕过权限编码限制。前端在没有查看权限时不发起统一审批接口，只展示无权限状态；后端仍通过 `PermissionsGuard` 做最终校验。

## 参考设计

前端使用 `$frontend-reference-design` 工作流，参考设计资产位于：

```text
images/frontend-reference-design/security-approval-workbench/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
manifest.json
```

## 配置约束

1. 不新增 PostgreSQL、Redis、MinIO、Qdrant、OpenSearch 或 Temporal 容器。
2. 不修改外部中间件连接方式。
3. 示例配置只保留占位值，不提交真实地址、账号或密码。
4. `deploy/docker-compose.yml` 不再定义本地 PostgreSQL / Redis 服务，避免误创建本地数据库或缓存容器。

## 验收标准

1. 安全中心可展示统一审批工作台。
2. 默认筛选为待审批，支持切换全部状态。
3. 可以按审批类型和风险域筛选。
4. 选择审批记录后展示详情、来源扩展信息和时间线。
5. 有 `security:approval:handle` 权限时可以通过或拒绝审批。
6. 审批处理后刷新工作台、原审批中心、归档列表和安全中心概览。
7. 无审批查看权限时不请求审批工作台接口。
8. 前后端类型检查通过。

## 验证记录

已补充回归覆盖：

```text
1. apps/control-api/src/security-center/security-approval-workbench.service.test.ts
   - 覆盖工具审批、通知策略审批、审批审计归档删除、团队报告归档删除、运营告警通知归档删除、SLA 死信归档删除和自愈审计归档删除聚合。
   - 覆盖风险域筛选、详情时间线、review 决策转发和审批工作台导出审计事件。

2. apps/web/src/components/security/security-route-ia-contract.test.ts
   - 覆盖 /security/alerts 统一审批详情面板、来源扩展信息、时间线、通过/拒绝处理闭环、导出筛选和原审批来源缓存刷新。
```

当前验证通过：

```text
pnpm --filter @aiaget/control-api typecheck
pnpm --filter @aiaget/web typecheck
pnpm --filter @aiaget/web test:ia
pnpm --filter @aiaget/control-api exec tsx --test src/security-center/security-approval-workbench.service.test.ts
pnpm test
pnpm typecheck
python3 -m compileall apps/agent-runtime/app
git diff --check
```
