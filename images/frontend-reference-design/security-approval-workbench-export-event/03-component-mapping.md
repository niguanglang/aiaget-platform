# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 安全事件详情中心 | `apps/web/src/components/security/security-policy-content.tsx` / `SecurityEventCenterCard` | `/security` route shell | 复用现有事件中心 |
| 来源筛选 | `eventSources` 常量 | `SecurityCenterEventSource` | 新增 `APPROVAL_WORKBENCH` 中文标签“审批工作台” |
| 事件列表 | `SecurityEventCenterCard` table | `SecurityCenterEventListItem` | 平台导出事件映射成普通安全事件行 |
| 详情抽屉 | `SecurityEventDetailDrawer` | `SecurityCenterEventDetail` | 展示导出摘要和原始 JSON 面板 |
| 后端事件聚合 | `SecurityCenterService.loadSecurityEvents` | `platform_event` | 查询 `platform.security.approval_workbench.exported` |
| 后端详情查询 | `SecurityCenterService.findSecurityEvent` | `platform_event` | 支持 `platform:{eventId}` |
| 共享类型 | `packages/shared-types/src/index.ts` | `SecurityCenterEventSource` | 扩展来源和 source record type |
