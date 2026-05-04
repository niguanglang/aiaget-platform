# M95 审批与归档告警 SLA 死信审计归档删除审批化

## 目标

M95 将 M94 的 SLA 死信处置审计归档删除改成审批闭环。安全管理员不直接删除对象存储文件，而是先提交删除申请；审批通过后由后端删除归档对象，拒绝则保留归档文件，并把申请、审批、拒绝、生效事件写入平台事件审计。

## 后端接口

新增归档删除审批接口：

```text
DELETE /api/v1/security-center/operation-alert-sla/dead-letter-audits/archives/:archiveId
GET    /api/v1/security-center/operation-alert-sla/dead-letter-audits/archive-approvals/overview
GET    /api/v1/security-center/operation-alert-sla/dead-letter-audits/archive-approvals
GET    /api/v1/security-center/operation-alert-sla/dead-letter-audits/archive-approvals/:approvalId
POST   /api/v1/security-center/operation-alert-sla/dead-letter-audits/archive-approvals/:approvalId/approve
POST   /api/v1/security-center/operation-alert-sla/dead-letter-audits/archive-approvals/:approvalId/reject
```

审批事件写入 `platform_event`，事件类型包括：

```text
platform.security.approval_operation_alert_sla.dead_letter_audit_archive.delete_requested
platform.security.approval_operation_alert_sla.dead_letter_audit_archive.delete_approved
platform.security.approval_operation_alert_sla.dead_letter_audit_archive.delete_rejected
platform.security.approval_operation_alert_sla.dead_letter_audit_archive.delete_applied
```

## 前端

安全中心 `/security` 的“SLA 死信审计归档下载”面板新增：

```text
1. 每个归档文件的“申请删除”动作
2. 删除前二次确认
3. 删除审批概览：待审批、已批准、已拒绝、已生效
4. 审批意见输入
5. 删除审批队列
6. 待审批项批准删除 / 拒绝
7. 审批完成后刷新审批列表和归档列表
```

## 设计资产

```text
images/frontend-reference-design/m95-sla死信审计归档删除审批/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
```

## 权限

沿用当前安全中心接口权限：

```text
security:rule:view
```

后续如果需要更严格分权，可拆成：

```text
security:archive:delete_request
security:archive:delete_approve
```

## 边界

1. 本阶段不新增数据库表。
2. 本阶段不执行数据库迁移。
3. 本阶段不启动容器、不安装中间件、不触碰外部服务。
4. 删除审批基于 `platform_event` 聚合，保留后续迁移到独立审批表或工作流的边界。

## 验收标准

- 点击归档“申请删除”不会直接删除文件，只会生成待审批记录。
- 删除审批概览能显示待审批、已批准、已拒绝、已生效数量。
- 待审批记录可以填写审批意见并批准或拒绝。
- 批准后后端删除对象存储归档文件，并写入生效事件。
- 拒绝后归档文件保留，并写入拒绝事件。
- Control API typecheck 通过。
- Web typecheck 通过。
