# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/customer-success-opportunities/analytics/page.tsx` | Next.js console route | 新增独立分析页，不塞进列表页 |
| Analytics content | `apps/web/src/components/customer-success-opportunities/customer-success-opportunity-analytics-content.tsx` | `getCustomerSuccessOpportunityAnalytics()` | 只读看板，中文文案 |
| Background | `CustomerSuccessOpportunityBackground` | visual only | 复用 M126 氛围背景 |
| Header actions | `Button`, `Link`, lucide `ArrowLeft`, `RefreshCw` | route `/customer-success-opportunities` | 刷新时 disabled |
| Metrics | `MetricCard` | `CustomerSuccessOpportunityAnalytics.summary` | 金额用 `formatMoney`，百分比本地格式化 |
| Stage funnel | Tailwind `Card` + CSS bars + `StatusBadge` | `stage_funnel` + `customerSuccessOpportunityStageLabel` | 不引入图表库 |
| Type/risk breakdown | Tailwind `Card` + CSS bars | `type_breakdown`, `risk_breakdown` | 标签复用 status helper |
| Top opportunities | `Card`, `StatusBadge`, `Button asChild` | `top_opportunities: CustomerSuccessOpportunityListItem[]` | 行内仅查看详情 |
| Upcoming closes | `Card`, `StatusBadge`, `Button asChild` | `upcoming_closes: CustomerSuccessOpportunityListItem[]` | 展示预计关闭时间和风险 |
| Feedback states | `Card`, `EmptyState`, disabled `Button` | React Query loading/error/empty + auth permissions | 无权限时不请求接口 |
