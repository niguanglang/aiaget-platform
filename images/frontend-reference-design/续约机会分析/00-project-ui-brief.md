# Project UI Brief

- Page: 续约机会分析
- Route: /customer-success-opportunities/analytics
- Feature goal: 客户成功续约机会看板与漏斗分析
- Parent layout: `apps/web/src/app/(console)` 控制台布局，保持现有左侧导航和内容区宽度。
- Target users and permissions: 租户管理员、客户成功负责人、Agent 管理员；读取权限为 `customer:success_opportunity:view`，无权限时不请求分析接口并展示中文无权限状态。
- APIs/services: 新增 `getCustomerSuccessOpportunityAnalytics()`，后端接口为 `GET /customer-success-opportunities/analytics`；复用 `CustomerSuccessOpportunityAnalytics`、`CustomerSuccessOpportunityListItem` 等共享类型。
- Entities/fields/statuses: 续约机会字段包括机会名称、客户、类型、阶段、状态、风险等级、机会评分、预计金额、概率、加权金额、预计关闭时间、负责人和来源关系；枚举来自现有 `CustomerSuccessOpportunityType/Stage/Status/RiskLevel`。
- Existing components/design system: Next.js App Router、React、TypeScript、Tailwind CSS、shadcn/ui 风格的 `Button`、`Card`、`MetricCard`、`EmptyState`、`StatusBadge`，动效使用 `motion/react`，图标使用 `lucide-react`。
- Required states: loading、empty、error、disabled、permission-denied；分析页只读，不承载新增/编辑/归档动作。
- Page responsibility: 独立分析页负责总览、漏斗、分布、Top 机会和即将关闭机会；CRUD 列表 `/customer-success-opportunities` 保持紧凑清单和筛选，不嵌入完整分析图表。
- Visual direction: 企业级 SaaS 后台，Bento Grid / Dashboard Layout，细边框、轻阴影、克制渐变网格和玻璃质感；所有页面文字使用中文。
