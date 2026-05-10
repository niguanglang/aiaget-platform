# Product Prototype / Wireframe Prompt

Create a low/mid-fidelity product prototype for the `/security/alerts` approval workbench export notice.

Project context:
- Page/route: 告警与审批 at /security/alerts
- Users/roles: 安全管理员、审计员、租户管理员
- Main task flow: 设置审批筛选 -> 阅读当前筛选命中和导出说明 -> 点击导出当前筛选 -> 看到导出完成提示。
- API/service contract: `exportSecurityApprovalWorkbenchItems(params)` unchanged.
- Required copy: 导出会包含通知归档筛选上下文；CSV 已包含通知筛选来源、状态和关键词。

Prototype requirements:
- Show only the existing approval workbench filter area, count helper line, export button, success/error notices.
- Highlight that this is a copy/feedback enhancement, not a new workflow.
- Include empty result and exporting disabled states.
- Use clear component boundaries mapped to `SecurityAlertsContent`.

Avoid:
- No CSV preview.
- No new table columns.
- No customer success or notification audit content body.
