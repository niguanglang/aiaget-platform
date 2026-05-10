# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 成交入账卡片 | `apps/web/src/components/customer-success-opportunities/customer-success-opportunity-detail-content.tsx` | `CustomerSuccessOpportunityDetail` | 详情页对象级操作，不放入列表页或分析页 |
| 成交金额/说明表单 | inline detail card controls using existing Tailwind input styles | `CloseWonCustomerSuccessOpportunityInput` | 简单双字段，用卡片内表单即可，不建独立编辑页 |
| 确认弹窗 | existing `Card` overlay pattern from follow-up action card | `closeWonCustomerSuccessOpportunity` mutation | 高影响操作必须二次确认 |
| 已入账状态 | `StatusBadge`, billing adjustment labels if reused | `BillingAdjustmentItem` in result/detail | 展示摘要和跳转，不嵌入调账列表 |
| API client | `apps/web/src/lib/api-client.ts` | `POST /customer-success-opportunities/:id/close-won-adjustment` | 成功后刷新机会、机会列表、机会分析、billing overview |
