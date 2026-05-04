# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 安全中心页面壳 | `apps/web/src/components/security/security-policy-content.tsx` | `/security` route | 继续增强 M95 归档审批卡片 |
| 审批队列 | `SlaDeadLetterAuditArchiveApprovalRow` | `SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalItem[]` | 增加选中态与查看详情 |
| 审批详情查询 | local `useQuery` in archive panel | `getSecurityOperationAlertSlaDeadLetterAuditArchiveApproval` | 选中审批后加载详情 |
| 详情摘要 | new local detail panel | `SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalDetail` | 展示文件、大小、申请人、审批人、时间 |
| 审计时间线 | new local timeline rows | `audit_timeline` | 展示申请、批准、拒绝、生效 |
| 审计/Trace 联动 | `Link` + `Button` | `request_id`、`trace_id` | 跳转 `/audit?keyword=` 和 `/monitor?keyword=` |
| 反馈状态 | `EmptyState`、border message | query loading/error | 不新增全局组件 |
