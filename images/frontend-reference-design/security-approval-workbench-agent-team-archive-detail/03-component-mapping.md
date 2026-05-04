# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 安全中心统一审批工作台 | `apps/web/src/components/security/security-policy-content.tsx` / `SecurityApprovalWorkbenchCard` | `/security` route shell | 复用现有区域，不新增页面 |
| 筛选栏 | `SecurityApprovalWorkbenchCard` | `ListSecurityApprovalWorkbenchQuery` | 保留类型/状态/风险域/关键词，后端增强关键词覆盖 metadata |
| 审批列表 | `SecurityApprovalWorkbenchRow` | `SecurityApprovalWorkbenchItem` | 团队归档删除显示 `AGENT_TEAM_RUN_REPORT_ARCHIVE_DELETE` |
| 详情基础信息 | `SecurityApprovalWorkbenchDetailPanel` | `SecurityApprovalWorkbenchDetail` | 复用 SummaryTile |
| 团队运行上下文 | 新增 `SecurityApprovalAgentTeamArchiveContext` | `metadata.team_id/team_name/run_id/run_objective` | 仅团队归档删除时重点展示，历史数据从 archive_key 反推 |
| 归档对象信息 | 新增 `SecurityApprovalArchiveObjectPanel` | `metadata.archive_key/archive_file_name/archive_size_bytes` | 复用 SummaryTile 和中文标签 |
| 审计时间线 | `SecurityApprovalTimelineItem` | `SecurityApprovalWorkbenchTimelineItem` | 保留 request_id / trace_id |
| 后端聚合 | `security-approval-workbench.service.ts` | `archiveMetadata`, `filterItems` | 增强团队/运行字段兼容与关键词匹配 |
