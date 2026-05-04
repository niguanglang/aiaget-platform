# M98 审批与归档告警 SLA 死信审计归档删除审批运营闭环

## 目标

M98 将 M95-M97 的 SLA 死信审计归档删除审批接入安全中心“审批与归档运营”看板。平台可以在统一看板里展示 SLA 死信归档删除审批的待审、批准、拒绝和删除生效情况，并在待审积压或拒绝偏多时生成运营告警。

## 后端

增强 `GET /api/v1/security-center/overview` 返回的 `approval_operations`：

```text
sla_dead_letter_archive_delete_pending
sla_dead_letter_archive_delete_approved
sla_dead_letter_archive_delete_rejected
sla_dead_letter_archive_delete_applied
```

数据来源：

```text
platform.security.approval_operation_alert_sla.dead_letter_audit_archive.delete_requested
platform.security.approval_operation_alert_sla.dead_letter_audit_archive.delete_approved
platform.security.approval_operation_alert_sla.dead_letter_audit_archive.delete_rejected
platform.security.approval_operation_alert_sla.dead_letter_audit_archive.delete_applied
```

新增运营告警：

```text
1. SLA 死信归档删除等待审批
2. SLA 死信归档删除拒绝偏多
```

## 前端

安全中心 `/security` 的“审批与归档运营”看板新增：

```text
1. SLA 死信删除待审
2. SLA 死信已批准
3. SLA 死信已拒绝
4. SLA 死信闭环率
```

运营待办总数纳入：

```text
工具审批待办
通知策略待办
审批审计归档删除待办
SLA 死信审计归档删除待办
```

## 设计资产

```text
images/frontend-reference-design/m98-sla死信审计归档删除审批运营闭环/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
```

## 权限

沿用安全中心总览权限：

```text
security:rule:view
```

## 边界

1. 本阶段不新增数据库表。
2. 本阶段不执行数据库迁移。
3. 本阶段不启动容器、不安装中间件、不触碰外部服务。
4. 统计基于 `platform_event` 聚合，后续可迁移为专用运营聚合表。

## 验收标准

- 安全中心总览返回 SLA 死信归档删除审批 4 个统计值。
- 运营待办总数包含 SLA 死信归档删除待审。
- 前端审批与归档运营看板展示 M98 指标。
- 待审积压时可以产生运营告警。
- 拒绝偏多时可以产生运营告警。
- Control API typecheck 通过。
- Web typecheck 通过。
