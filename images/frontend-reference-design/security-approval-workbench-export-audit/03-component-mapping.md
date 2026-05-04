# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 安全中心统一审批工作台 | `apps/web/src/components/security/security-policy-content.tsx` / `SecurityApprovalWorkbenchCard` | `/security` route shell | 复用现有区域，不新增页面 |
| 筛选栏 | `SecurityApprovalWorkbenchCard` | `ListSecurityApprovalWorkbenchQuery` | 保留关键词、类型、状态、风险域 |
| 导出当前筛选 | `SecurityApprovalWorkbenchCard` 新增按钮 | `exportSecurityApprovalWorkbenchItems` | 复用 `downloadBlob` 和 CSV 导出状态文案 |
| 审批列表 | `SecurityApprovalWorkbenchRow` | `SecurityApprovalWorkbenchItem` | 导出不改变列表结构 |
| 详情面板 | `SecurityApprovalWorkbenchDetailPanel` | `SecurityApprovalWorkbenchDetail` | 导出不改变审批处理动作 |
| 后端导出接口 | `SecurityCenterController` + `SecurityApprovalWorkbenchService` | `GET /security-center/approval-workbench/export` | 使用同一筛选 DTO，不分页导出，后端限制数量 |
| 审计事件 | `PlatformEventsService.recordEvent` | `platform_event` | 写入 `platform.security.approval_workbench.exported` |
