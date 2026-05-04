# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 安全中心页面壳 | `apps/web/src/components/security/security-policy-content.tsx` | `/security` route | 放在 M92 审计时间线卡片内增强 |
| 审计查询 | React Query in `SecurityPolicyContent` | `listSecurityOperationAlertSlaDeadLetterAudits` | query key 已包含 keyword/action/status/page |
| 导出按钮 | `Button` + `Download` icon | `exportSecurityOperationAlertSlaDeadLetterAudits` | 按当前筛选导出 CSV |
| 导出反馈 | inline alert div | local `exportState` | 中文成功/失败提示 |
| 筛选栏 | `Input` + native `select` + `Button` | query params | 保持 M92 字段 |
| 时间线行 | `OperationAlertSlaDeadLetterAuditRow` | `SecurityOperationAlertSlaDeadLetterAuditItem` | 新增审计中心和 Trace 链接 |
| 审计中心联动 | `Link` | `/audit?keyword=<request_id>` | 使用请求 ID 定位统一审计 |
| Trace 联动 | `Link` | `/monitor?keyword=<trace_id>` | 复用监控中心关键词参数 |
| 后端导出 | `SecurityOperationAlertSlaService.exportDeadLetterAudits` | `GET dead-letter-audits/export` | 同步 CSV，不新增表 |
| 控制器 | `SecurityCenterController` | `@Res()` CSV response | 设置 `text/csv; charset=utf-8` |
