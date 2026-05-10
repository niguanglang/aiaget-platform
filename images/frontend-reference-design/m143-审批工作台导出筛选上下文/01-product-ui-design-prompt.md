# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise AI Agent Platform security approval export workflow.

Project context:
- Product/module: 企业 AI Agent 平台 / 安全中心
- Page/route: 告警与审批 at /security/alerts
- Target users/roles: 安全管理员、审计员、租户管理员
- Business goal: 用户在统一审批工作台按类型、状态、风险域和关键词筛选后，点击“导出当前筛选”，离线 CSV 能保留通知归档创建时的筛选来源、筛选状态和筛选关键词。
- Existing frontend stack/design system: Next.js + React Query + TypeScript + Tailwind CSS + shadcn/ui style components.

Interface contract:
- Existing service: `exportSecurityApprovalWorkbenchItems(params)`.
- Exported CSV adds columns: 通知筛选来源、通知筛选状态、通知筛选关键词.
- Example row context: 客户成功复盘归档删除、已发送、trace-customer.
- Existing UI controls remain: approval type filter, status filter, risk domain filter, keyword search, export current filter button.

Design requirements:
- Chinese UI only.
- Keep `/security/alerts` as an operational governance page with restrained enterprise styling.
- Show a subtle export confirmation/notice that current filter export includes notification archive filter context.
- Do not add new heavy panels, charts, or duplicate archive deletion approval list.
- Use compact helper text and existing button placement.

Avoid:
- Do not show notification audit full body, customer success opportunity detail, report content, or raw CSV preview table.
- Do not invent new permissions or settings controls.
