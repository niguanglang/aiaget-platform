# M88 审批与归档告警 SLA 与超时升级

## 目标

在 M87 自动重试任务基础上，补齐审批与归档运营告警的 SLA 视图和超时升级能力。安全管理员可以在安全中心看到每条派生告警的触发时间、到期时间、临近超时、已超时和自动升级状态。

本模块不新增数据库表、不执行数据库迁移、不启动容器、不安装中间件。

## 后端接口

新增 SLA 概览：

```text
GET /api/v1/security-center/operation-alert-sla/overview
```

新增手动扫描升级：

```text
POST /api/v1/security-center/operation-alert-sla/run-escalation
```

## SLA 策略

优先读取租户系统设置：

```text
operation_alert_sla_enabled
operation_alert_sla_scan_interval_ms
operation_alert_sla_due_minutes
operation_alert_sla_warning_minutes
operation_alert_sla_auto_escalate_enabled
operation_alert_sla_lookback_hours
```

没有租户设置时使用环境变量兜底：

```text
SECURITY_OPERATION_ALERT_SLA_ENABLED
SECURITY_OPERATION_ALERT_SLA_TASK_INTERVAL_MS
SECURITY_OPERATION_ALERT_SLA_DUE_MINUTES
SECURITY_OPERATION_ALERT_SLA_WARNING_MINUTES
SECURITY_OPERATION_ALERT_SLA_AUTO_ESCALATE_ENABLED
SECURITY_OPERATION_ALERT_SLA_LOOKBACK_HOURS
```

## 派生逻辑

SLA 明细基于当前安全中心派生告警生成：

```text
1. triggered_at 来自最早待办、最早风险审计或归档检测时间
2. due_at = triggered_at + due_minutes
3. warning_at = due_at - warning_minutes
4. CLOSED 告警进入已关闭
5. 超过 due_at 且未关闭的告警进入已超时
6. 超过 warning_at 但未到期的告警进入临近超时
```

## 自动升级

手动或后台任务扫描：

```text
1. 只处理 OVERDUE 告警
2. 已关闭或已升级告警跳过
3. 通过 platform_event 写入 escalated 生命周期事件
4. payload 标记 auto_escalated = true
5. 任务结果写入 platform_event
```

事件类型：

```text
platform.security.approval_operation_alert_sla.manual_escalation_scan
platform.security.approval_operation_alert_sla.auto_escalation_finished
platform.security.approval_operation_alert.escalated
```

## 前端页面

页面：

```text
/security
```

增强区域：

```text
审批与归档运营 -> 告警 SLA 与超时升级
```

展示：

```text
1. SLA 内数量
2. 临近超时数量
3. 已超时数量
4. 自动升级数量
5. SLA 策略
6. SLA 明细
7. 最近 SLA 扫描结果
```

操作：

```text
刷新 SLA
立即扫描升级
```

## 参考设计

```text
images/frontend-reference-design/m88-审批与归档告警sla与超时升级/
```

## 边界

1. M88 不新增独立页面。
2. M88 不新增数据库表。
3. M88 不执行数据库迁移。
4. M88 不启动任何容器或中间件。
5. M88 先使用 `platform_event` 派生 SLA 与自动升级状态。

## 后续演进

后续可以继续做：

```text
1. SLA 策略审批影响预览
2. 告警订阅人与值班人排班
3. SLA 超时通知投递
4. Temporal durable SLA workflow
5. 独立告警表和告警处理记录表
```

## 验收标准

- 可以查看审批与归档告警 SLA 概览。
- 可以看到每条告警的到期时间和 SLA 状态。
- 可以手动触发一次超时扫描升级。
- 超时升级写入 `platform_event` 并反映到现有告警生命周期。
- `/security` 展示 SLA 与超时升级区域。
- Control API typecheck 通过。
- Web typecheck 通过。
