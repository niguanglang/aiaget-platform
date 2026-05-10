# Product UI Design Image Prompt

Paste the high-fidelity product UI prompt here.
Create a high-fidelity product UI design image for a real enterprise SaaS admin page.

Project context:
- Product/module: 企业 AI Agent 平台 / 客户成功续约机会中心
- Page/route: 成交复盘报告 at `/customer-success-opportunities/[id]/close-won-report`
- Target users/roles: 客户成功经理、财务运营、审计员，具备 `customer:success_opportunity:view`
- Business goal: 在只读成交复盘报告中完成 Markdown 导出、对象存储归档留存和归档下载，形成客户成功、财务核算和审计留痕闭环。
- Existing frontend stack/design system: Next.js App Router, React Query, TypeScript, Tailwind CSS, shadcn/ui 风格 Button/Card/StatusBadge, lucide 图标。
- Existing page shell/layout: 控制台内容区，`max-w-7xl`，报告摘要区、指标卡、信息卡、列表卡，不使用营销页 hero。

Interface contract that must appear in the UI:
- API/service functions:
  - `getCustomerSuccessOpportunityCloseWonReport(opportunityId)`
  - `exportCustomerSuccessOpportunityCloseWonReport(opportunityId)`
  - `createCustomerSuccessOpportunityCloseWonReportArchive(opportunityId)`
  - `listCustomerSuccessOpportunityCloseWonReportArchives(opportunityId)`
  - `getCustomerSuccessOpportunityCloseWonReportArchiveDownloadUrl(opportunityId, archiveId)`
- Main entities and fields:
  - 报告摘要：客户、机会、预计金额、加权金额、成交金额、关闭时间、调账单数。
  - 归档项：文件名、大小、更新时间、机会编号、客户、下载有效期。
  - 报告详情：客户价值复盘、来源链路、入账追踪、复盘要点、下一步动作。
- Status values/enums: 机会阶段、机会状态、信心等级、风险等级、调账类型、调账状态。
- User actions: 返回详情、查看调账记录、查看审计追踪、导出报告、生成归档、下载归档。
- Required states: 报告加载中、报告错误、导出中、导出失败、归档中、归档失败、归档列表加载中、归档为空、下载链接失败。

Design requirements:
- Make it look like a production SaaS/admin product, not a generic template.
- Keep the top action cluster compact and clear: 返回详情、调账记录、审计追踪、导出报告、归档留存.
- Add a dedicated "归档留存" card under the main action/status area, showing storage evidence and the latest archive list.
- Use subtle borders, soft shadows, restrained glass texture, and clear hierarchy.
- Use concise Chinese labels; no emoji; no excessive glow or decorative blobs.
- 3D/gradient effects, if present, must remain atmospheric and not compete with report content.
- Preserve page responsibility: no edit forms, no成交入账表单, no follow-up action creation.

Avoid:
- invented API fields not listed above
- long full-detail tables in the header
- putting archive management into the opportunity list page
- unrelated charts, marketing hero, or oversized decorative cards
