# Product Prototype / Wireframe Prompt

Paste the low/mid-fidelity prototype prompt here.
Create a low- to mid-fidelity product prototype / wireframe for a real enterprise SaaS admin page.

Project context:
- Page/route: 成交复盘报告 at `/customer-success-opportunities/[id]/close-won-report`
- Users/roles: 客户成功经理、财务运营、审计员
- Main task flow:
  1. 用户进入成交复盘报告页查看只读报告。
  2. 用户点击“导出报告”下载 Markdown。
  3. 用户点击“归档留存”把当前报告写入对象存储。
  4. 页面刷新归档列表，显示最近归档文件。
  5. 用户点击“下载归档”获取短期下载链接。
- API/service contract:
  - `getCustomerSuccessOpportunityCloseWonReport`
  - `exportCustomerSuccessOpportunityCloseWonReport`
  - `createCustomerSuccessOpportunityCloseWonReportArchive`
  - `listCustomerSuccessOpportunityCloseWonReportArchives`
  - `getCustomerSuccessOpportunityCloseWonReportArchiveDownloadUrl`
- Data entities and fields:
  - 报告：客户、机会、金额、关闭时间、调账单数、客户价值、来源链路、入账追踪、复盘要点、下一步动作。
  - 归档：文件名、大小、归档路径、最后修改时间、下载有效期。
- Actions and states:
  - 顶部按钮：返回详情、调账记录、审计追踪、导出报告。
  - 归档卡按钮：生成归档、下载归档。
  - 状态：加载、错误、空、处理中、失败提示。

Prototype requirements:
- Use clear wireframe regions:
  - Header/status/action row
  - Report metric cards
  - Archive retention card with latest files list
  - Customer value and source chain grid
  - Billing trace list
  - Replay points and next actions
- Keep archive card independent from billing trace and audit links.
- Show empty archive state as a small bordered placeholder with one action.
- Show download action as row-level operation, not a global unrelated button.
- Keep all labels in Chinese.

Avoid:
- configuration forms
- full object storage management table
- opportunity edit fields
- unrelated module navigation inside the report
