# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 安全中心页面壳 | `apps/web/src/components/security/security-policy-content.tsx` | `/security` console route | 复用现有审批与归档运营区域，不新增独立页面 |
| SLA 通知重试查询 | `useQuery` in `SecurityPolicyContent` | `getSecurityOperationAlertSlaNotificationRetryOverview` | 与 M88/M89 查询并列 |
| 手动扫描重试 | `useMutation` + `Button` | `runSecurityOperationAlertSlaNotificationAutoRetry` | 成功后刷新 SLA 通知与重试概览 |
| 单条通知重试 | 行内 `Button` | `retrySecurityOperationAlertSlaNotification(notificationEventId)` | 仅失败/部分成功且非死信可点击 |
| 指标卡 | `MetricCard` | `SecurityOperationAlertSlaNotificationRetryOverview.summary` | 展示待重试、失败、部分成功、已重试、死信 |
| 策略面板 | `SummaryTile` + bordered panel | `overview.policy` | 展示批量、次数、退避、回看窗口和来源 |
| 可重试队列 | 新增本文件内小组件 | `overview.retryable_items` | 复用 `StatusBadge`、`formatDateTime`、中文状态 |
| 死信列表 | 新增本文件内小组件 | `overview.dead_letter_items` | 展示死信原因和最大重试次数 |
| 最近执行结果 | 新增本文件内小组件 | `overview.last_auto_retry_result` | 与 M87/M88 结果卡一致 |
| 后端控制器 | `apps/control-api/src/security-center/security-center.controller.ts` | `SecurityOperationAlertSlaService` | 增加 overview/run/single retry endpoints |
| 后端任务逻辑 | `apps/control-api/src/security-center/security-operation-alert-sla.service.ts` | `platform_event` | 不新增表，基于事件链路派生重试和死信 |
