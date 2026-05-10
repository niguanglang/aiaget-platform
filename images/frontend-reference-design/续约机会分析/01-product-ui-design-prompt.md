# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real Enterprise AI Agent Platform console page.

Project context:
- Product/module: 企业 AI Agent 平台 · 客户成功续约机会中心
- Page/route: 续约机会分析 at `/customer-success-opportunities/analytics`
- Target users/roles: 租户管理员、客户成功负责人、Agent 管理员；需要 `customer:success_opportunity:view`
- Business goal: 把已有续约机会数据从列表管理升级为可运营的商务漏斗，帮助判断机会规模、赢单转化、风险暴露、Top 机会和近期关闭节奏。
- Existing frontend stack/design system: Next.js App Router + React + TypeScript + Tailwind CSS + shadcn/ui 风格组件，lucide 图标，motion 微交互。
- Existing page shell/layout: 控制台内容区，最大宽度 7xl，中文界面，Bento Grid / Dashboard Layout，细边框、轻阴影、backdrop blur、克制渐变网格。

Interface contract that must appear in the UI:
- API/service functions: `getCustomerSuccessOpportunityAnalytics()` -> `GET /customer-success-opportunities/analytics`
- Main entities and fields: `summary.total_count`, `open_count`, `at_risk_count`, `won_count`, `lost_count`, `total_estimated_amount`, `weighted_amount`, `average_probability`, `average_score`, `conversion_rate`, `risk_rate`, `stage_funnel`, `type_breakdown`, `risk_breakdown`, `top_opportunities`, `upcoming_closes`
- Status/enums: 机会阶段 `DISCOVERY/QUALIFICATION/PROPOSAL/NEGOTIATION/WON/LOST/ARCHIVED`；类型 `RENEWAL/EXPANSION/UPSELL/CROSS_SELL/RISK_SAVE`；风险 `LOW/MEDIUM/HIGH`
- User actions: 返回机会清单、刷新分析、查看 Top 机会详情、查看即将关闭机会详情；无新增/编辑/归档动作
- Required states: loading skeleton、empty state、error message、permission denied、disabled refresh while fetching

Design requirements:
- Hero/header: 中文标题“续约机会分析”，辅助说明是客户成功机会漏斗和风险看板，右侧有“返回清单”和“刷新”按钮。
- Metrics: 使用 8 个紧凑指标卡展示总机会、打开、风险、赢单、输单、预计金额、加权金额、转化率/风险率。
- Main dashboard: 左侧大面积阶段漏斗，右侧类型分布和风险分布；使用可映射到 CSS 条形图的简洁图形，不依赖第三方图表库。
- Lower section: 两个并列列表卡片，分别是“高价值机会 Top 5”和“近期关闭机会”，每行展示机会名、客户、阶段、金额/概率、风险或预计关闭时间，并有“详情”入口。
- Keep text readable and Chinese; avoid crowded table columns.
- Make it look like a production SaaS/admin product, not a generic mockup.

Avoid:
- fake API fields not listed above
- editing forms inside analytics page
- overly bright gradients, emoji, glowing decoration, crowded metrics, huge rounded blobs
