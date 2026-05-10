# Product UI Design Image Prompt

Paste the high-fidelity product UI prompt here.
Create a high-fidelity product UI design image for a real enterprise SaaS admin page feature.

Project context:
- Product/module: 企业 AI Agent 平台 / 客户成功续约机会中心 + 审批中心
- Page/route: 成交复盘报告 at `/customer-success-opportunities/[id]/close-won-report`, plus existing `/approvals/archive-deletions`
- Target users/roles: 客户成功经理申请删除归档；安全管理员审批高危删除。
- Business goal: 已归档的成交复盘报告不能被直接删除，必须发起删除审批，通过后对象存储才移除文件。
- Existing frontend stack/design system: Next.js App Router, React Query, TypeScript, Tailwind CSS, shadcn/ui 风格 Button/Card/StatusBadge, lucide icons.

Interface contract:
- Report page API functions:
  - `listCustomerSuccessOpportunityCloseWonReportArchives`
  - `getCustomerSuccessOpportunityCloseWonReportArchiveDownloadUrl`
  - `deleteCustomerSuccessOpportunityCloseWonReportArchive`
- Approval page API functions:
  - `listCustomerSuccessOpportunityCloseWonReportArchiveApprovals`
  - `approveCustomerSuccessOpportunityCloseWonReportArchiveApproval`
  - `rejectCustomerSuccessOpportunityCloseWonReportArchiveApproval`
- Fields:
  - 归档文件名、大小、更新时间、机会编号、对象路径、审批状态、申请人、审批人、申请时间、审批时间、审批意见。
- Actions:
  - 报告页：下载归档、申请删除、确认删除申请。
  - 审批页：按来源筛选“客户成功复盘”、查看详情、批准删除、拒绝删除。

Design requirements:
- In the report archive card, show row-level “申请删除” as a secondary danger action with confirmation copy.
- Do not make report page handle approve/reject.
- In archive deletion approval page, add a source filter entry “客户成功复盘” and show it as a peer to approval audit, security alert, self-healing, SLA dead letter, and Agent team report.
- Use Chinese labels and restrained enterprise styling.
- Keep list rows compact; full audit context belongs in the detail panel.

Avoid:
- direct delete without approval
- mixing approval forms into the report page
- object storage full management table inside the report page
- decorative visuals that obscure row actions
