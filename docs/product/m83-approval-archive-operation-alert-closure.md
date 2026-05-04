# M83 审批与归档运营告警闭环

## 目标

在 M82 审批与归档运营看板基础上，把审批积压、归档存储异常、审批审计失败/告警和 Trace 覆盖不足推导成安全中心可处理的运营告警，让安全管理员可以从看板直接跳转处理。

本模块只做实时推导、前端展示和文档，不新增数据库表、不新增路由、不执行数据库迁移、不启动容器。

## 后端设计

扩展接口：

```text
GET /api/v1/security-center/overview
```

在 `approval_operations` 中新增：

```text
operational_alerts
```

告警字段：

```text
id
title
description
severity
href
metric
action_label
```

告警来源：

```text
1. 审批待办积压
2. 运行时工具审批积压
3. 高影响通知策略待审批
4. 归档删除等待审批
5. 审批审计失败或告警
6. 审批审计 Trace 覆盖不足
7. 归档存储不可用或降级
8. 有审批审计事件但没有归档文件
```

告警为实时推导，不持久化：

```text
SecurityCenterService.getOverview
  -> loadApprovalOperations
  -> buildApprovalOperationAlerts
```

## 前端设计

页面：

```text
/security
```

增强组件：

```text
ApprovalArchiveOperationsCard
```

新增区域：

```text
运营告警闭环
```

交互：

```text
1. 有告警时展示分级告警卡片
2. 每条告警展示风险等级、指标、说明和处理动作
3. 点击告警跳转到审批中心、审批审计中心或审计中心
4. 无告警时展示“审批与归档运营平稳”
```

## 参考设计

```text
images/frontend-reference-design/m83-审批与归档运营告警闭环/
```

## 边界

1. M83 不新增独立告警表。
2. M83 不接入通知投递。
3. M83 不新增审批动作，只提供处理入口。
4. M83 不启动 MinIO、Qdrant、OpenSearch 或其他容器。
5. M83 不执行数据库迁移。

## 后续演进

后续可以把这类运营告警接入统一事件底座：

```text
platform.security.approval_operation_alert.detected
platform.security.approval_operation_alert.acknowledged
platform.security.approval_operation_alert.closed
```

再接入告警通知投递、SLA、订阅人和处理记录。

## 验收标准

- `SecurityCenterOverview.approval_operations` 返回 `operational_alerts`。
- 审批积压、审计失败、Trace 缺失、归档异常可以推导成告警。
- `/security` 页面展示“运营告警闭环”区域。
- 无告警时展示中文空状态。
- 告警卡片可跳转到对应处理页面。
- Control API typecheck 通过。
- Web typecheck 通过。
