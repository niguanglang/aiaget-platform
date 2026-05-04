# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 安全中心页面壳 | `apps/web/src/components/security/security-policy-content.tsx` | `/security` route | 放在 M91 死信处置卡片下方 |
| 审计查询 | React Query in `SecurityPolicyContent` | `listSecurityOperationAlertSlaDeadLetterAudits` | query key 包含 keyword/action/status/page |
| 筛选栏 | `Input` + native `select` + `Button` | query params | 中文占位和重置 |
| 时间线 | new local component | `SecurityOperationAlertSlaDeadLetterAuditItem` | 使用 `StatusBadge`、`formatDateTime` |
| 分页 | existing `Button` pattern | `PaginatedResult` | 上一页/下一页 |
| 后端 DTO | new `ListSecurityOperationAlertSlaDeadLetterAuditsDto` | class-validator | page/page_size/keyword/action/status |
| 后端服务 | `SecurityOperationAlertSlaService` | `platform_event` | 查询 `dead_letter_action` 事件 |
| 控制器 | `SecurityCenterController` | `GET dead-letter-audits` | 只读接口 |
