# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend workflow.

Project context:
- Page/route: 告警与审批 at /security/alerts
- Users/roles: 安全管理员、审计员、租户管理员
- Main task flow: 设置统一审批筛选 -> 查看当前筛选命中数 -> 点击导出当前筛选 -> CSV 下载并写入安全审计事件 -> 离线 CSV 保留通知筛选来源、状态、关键词。
- API/service contract: `exportSecurityApprovalWorkbenchItems(params)` returns CSV from `SecurityApprovalWorkbenchService.exportCsv`.
- Data fields: 审批ID、审批类型、来源模块、状态、风险域、审批对象、申请人、时间、通知筛选来源、通知筛选状态、通知筛选关键词。

Prototype requirements:
- Low/mid-fidelity wireframe.
- Highlight existing filter toolbar and export button, not a new page.
- Show helper text near export action: 导出会包含通知归档筛选上下文。
- Include loading/exporting, empty filter result, and error state placeholders.
- Keep component boundaries mapped to existing `SecurityAlertsContent` sections.

Avoid:
- No CSV preview modal.
- No new archive approval table inside the security alerts page.
- No customer success report body or notification audit message payload.
