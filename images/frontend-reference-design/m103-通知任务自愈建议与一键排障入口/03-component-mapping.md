# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 安全中心父级页面 | `apps/web/src/components/security/security-policy-content.tsx` / `ApprovalArchiveOperationsCard` | `GET /security-center/overview` | 在现有审批与归档运营卡片内增加 M103 小节，不新增独立路由。 |
| 通知任务风险指标 | `OperationMetricTile` | `SecurityCenterOverview.approval_operations.notification_task_*` | 复用 M102 指标作为建议生成的上游证据。 |
| 自愈建议小节标题 | `StatusBadge` + Tailwind layout | `notification_task_recovery_suggestions.length` | Badge 显示 `M103` 与 `需要排障/暂无建议`。 |
| 建议卡片 | 新增局部组件 `NotificationTaskRecoverySuggestionsCard` | `SecurityOperationAlertNotificationTaskRecoverySuggestion[]` | 只做安全中心内部局部组件，避免扩散组件 API。 |
| 建议卡片内容 | `StatusBadge`、`Button asChild`、`Link` | `title`、`description`、`severity`、`reason_code`、`evidence`、action hrefs | 展示原因、证据和跳转入口，不自动修改系统设置。 |
| 空状态 | `EmptyState` | 空数组 | 文案：`暂无排障建议`，保留“查看任务历史”入口。 |
| 外部集成入口 | `Link` + `Button` | `primary_action_href=/settings?category=INTEGRATION` | 指向外部 Webhook 配置。 |
| 通知策略入口 | `Link` + `Button` | `primary_action_href=/settings?category=NOTIFICATION` | 指向自动通知/自动重试策略设置。 |
| 任务历史/审计/监控入口 | `Link` + `Button` | `/security`、`/audit`、`/monitor` | 用于核对平台事件、审计和运行链路。 |
| 设置页分类参数 | `apps/web/src/components/settings/settings-content.tsx` | `category` query string | 若当前页面未读取参数，增加最小兼容以支撑排障入口落点。 |
