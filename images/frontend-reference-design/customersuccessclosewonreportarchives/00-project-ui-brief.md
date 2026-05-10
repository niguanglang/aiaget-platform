# Project UI Brief

- Page: CustomerSuccessCloseWonReportArchives
- Route: /customer-success-opportunities/[id]/close-won-report
- Feature goal: 成交复盘报告归档留存
- Target users/permissions: 客户成功经理、财务运营、审计员；需要 `customer:success_opportunity:view`，后端仍经过 DataScopeGuard 和 ResourceAclGuard。
- APIs/services:
  - `getCustomerSuccessOpportunityCloseWonReport(opportunityId)`
  - `exportCustomerSuccessOpportunityCloseWonReport(opportunityId)`
  - `createCustomerSuccessOpportunityCloseWonReportArchive(opportunityId)`
  - `listCustomerSuccessOpportunityCloseWonReportArchives(opportunityId)`
  - `getCustomerSuccessOpportunityCloseWonReportArchiveDownloadUrl(opportunityId, archiveId)`
- Entities/fields/statuses:
  - 报告：客户、机会、预计金额、加权金额、成交金额、关闭时间、调账单数、客户价值复盘、来源链路、入账追踪、复盘要点、下一步动作。
  - 归档项：`id`、`file_name`、`folder`、`size_bytes`、`last_modified`、`download_expires_in`、`opportunity_id`、`opportunity_code`、`customer_name`。
- Existing components/design system: Next.js App Router，React Query，Tailwind CSS，shadcn 风格 `Button`、`Card`、`StatusBadge`，lucide 图标，现有客户成功背景组件。
- Required states: 报告加载中、报告错误、导出中、导出错误、归档中、归档错误、归档列表加载中、归档空状态、下载链接失败。
- Page boundary constraints: 归档能力只在成交复盘报告页出现；续约机会列表页和分析页不得导入归档接口；不在报告页承载编辑、成交入账、创建跟进行动等变更流程。
