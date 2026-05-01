# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 页面路由 | `apps/web/src/app/(console)/billing/page.tsx` | `/billing` | 新增控制台页面。 |
| 页面主体 | `apps/web/src/components/billing/billing-content.tsx` | `getBillingOverview()` | 新建页面组件，复用现有 Tailwind/Card 风格。 |
| 头部与窗口切换 | `Button`, `StatusBadge` | `BillingWindow` | 24h / 7d 切换，刷新 React Query。 |
| KPI 卡 | `MetricCard` | `BillingSummary` | 总成本、模型成本、步骤成本、Token、月度预测、风险密钥。 |
| 成本趋势 | `Card` + CSS bars | `BillingCostTrendPoint[]` | 不引入图表库，用响应式条形图。 |
| 供应商成本 | `Card`, table/list | `BillingProviderCostItem[]` | 展示调用、Token、成本、成功率。 |
| 模型成本 | `Card`, table/list | `BillingModelCostItem[]` | 展示模型成本排行和平均延迟。 |
| API Key 额度 | `Card`, `StatusBadge`, progress bar | `BillingApiKeyQuotaItem[]` | 高风险、预警、正常、未配置。 |
| 空/加载/错误状态 | `EmptyState`, text alert | React Query states | 处理无调用日志、无 API Key、加载失败。 |
| 导航和菜单 | `moduleSpecs`, `seed.ts`, `menu-navigation.ts` | `monitor:log:view` | 新增成本与额度入口，第一版复用监控查看权限。 |
