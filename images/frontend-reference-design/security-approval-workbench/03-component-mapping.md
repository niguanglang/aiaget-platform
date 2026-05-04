# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 页面外壳 | `apps/web/src/app/(console)/security/page.tsx` + `SecurityPolicyContent` | 控制台路由 `/security` | 复用现有安全中心，不新增路由 |
| 指标卡片 | `MetricCard`、`Card`、`StatusBadge` | `SecurityApprovalWorkbenchOverview` | 展示待审批、高风险、归档删除、已生效等聚合指标 |
| 筛选工具栏 | `Input`、原生 `select`、`Button` | `ListSecurityApprovalWorkbenchQuery` | 关键词、类型、状态、风险域筛选 |
| 审批列表 | `Card` + Tailwind 表格/列表 | `SecurityApprovalWorkbenchItem[]` | 选中行驱动右侧详情 |
| 详情面板 | `Card`、`StatusBadge`、备注 `textarea` | `SecurityApprovalWorkbenchDetail` | 展示来源、目标、原因、request/trace、时间线 |
| 审批操作 | `Button` | `reviewSecurityApprovalWorkbenchItem` | 无 `security:approval:handle` 时禁用并显示只读提示 |
| 空/错/加载 | `EmptyState`、按钮 loading 文案 | React Query 状态 | 保持中文反馈 |
