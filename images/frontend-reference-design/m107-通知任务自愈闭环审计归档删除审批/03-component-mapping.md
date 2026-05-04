# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 安全中心通知任务卡片 | `apps/web/src/components/security/security-policy-content.tsx` / `OperationAlertNotificationTaskRecoveryAuditCard` | M105/M106 audit and archive props | 在现有自愈闭环审计归档面板下扩展删除审批区域 |
| 归档列表与申请删除 | `OperationAlertNotificationTaskRecoveryAuditArchivePanel` | `SecurityOperationAlertNotificationTaskRecoveryAuditArchiveItem`, `DELETE /archives/:archiveId` | 复用 M106 列表，新增申请删除按钮 |
| 审批统计 | 新增通知任务自愈归档审批面板内部 metric cards | `SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalOverview` | pending/approved/rejected/applied |
| 审批筛选与列表 | 新增面板内 table/filter | `SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalItem[]` | 状态、关键词、只看待审批、本地筛选 |
| 审批详情与时间线 | 新增 detail panel or reuse SLA detail pattern | `SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalDetail` | 显示 archive key、note、actor、request_id、trace_id |
| 批准/拒绝表单 | existing `Input`/`Button` | approve/reject API with `decision_note` | 操作中禁用按钮，成功后刷新审批和归档 |
| API client | `apps/web/src/lib/api-client.ts` | shared-types M107 types | 保持 request helper、trace headers 模式 |
| 后端路由 | `apps/control-api/src/security-center/security-center.controller.ts` | service methods | 路由沿用 security-center 前缀 |
| 后端事件与审批聚合 | `apps/control-api/src/security-center/security-center.service.ts` | `platform_event` | 不新增表，事件 sourceId 聚合审批 |
| 产品文档 | `docs/product/m107-...md`, `docs/product/README.md` | module spec | 说明边界、不启动容器、不迁移 |
