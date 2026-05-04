# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 安全中心页面壳 | `apps/web/src/components/security/security-policy-content.tsx` | `/security` route | 放在 M93 审计时间线卡片下方 |
| 归档查询 | React Query in `SecurityPolicyContent` | `listSecurityOperationAlertSlaDeadLetterAuditArchives` | 页面加载后展示归档列表 |
| 生成归档 | `Button` + `Archive` icon | `createSecurityOperationAlertSlaDeadLetterAuditArchive` | 使用当前 keyword/action/status |
| 下载归档 | `Button` + `Download` icon | `getSecurityOperationAlertSlaDeadLetterAuditArchiveDownloadUrl` | `window.open(result.url)` |
| 归档汇总 | local `ArchiveMetric` equivalent | `archive_count`, `total_size_bytes` | 可复用本文件新增小组件 |
| 归档列表 | table/list in Card | `SecurityOperationAlertSlaDeadLetterAuditArchiveItem` | 文件名、目录、大小、更新时间、对象路径、操作 |
| 后端归档 | `SecurityOperationAlertSlaService.createDeadLetterAuditArchive` | StorageService putTenantObject | 前缀 `audit-archives/security-sla-dead-letter-audits` |
| 后端下载 URL | `SecurityOperationAlertSlaService.getDeadLetterAuditArchiveDownloadUrl` | StorageService getTenantObjectDownloadUrl | 300 秒短链 |
| 控制器 | `SecurityCenterController` | archives endpoints | 沿用 `security:rule:view` |
