# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: 企业 Agent 平台 / 客户成功计划中心
- Page/route: 客户成功计划中心 at `/customer-success-plans`
- Target users/roles: 租户管理员、客户成功经理、交付负责人、Agent 管理员；写操作需要 `customer:success:manage`，查看需要 `customer:success:view`
- Business goal: 把验收复盘和成果资产转成可执行的扩展推广、续约准备、资产复用和健康风险运营计划
- Existing frontend stack/design system: Next.js App Router + React + TypeScript + Tailwind CSS + shadcn 风格组件，使用 `Button`、`Card`、`Input`、`MetricCard`、`StatusBadge`、`EmptyState`
- Existing page shell/layout: 企业 SaaS 控制台，左侧导航由菜单系统驱动，页面主体为最大宽度 7xl 的 Dashboard Layout，Bento-like metrics + filter toolbar + compact table + independent detail/create/edit routes

Interface contract that must appear in the UI:
- API/service functions: `listCustomerSuccessPlans`、`createCustomerSuccessPlan`、`getCustomerSuccessPlan`、`updateCustomerSuccessPlan`、`deleteCustomerSuccessPlan`
- Main entities and fields: 计划名称、编码、客户名称、计划阶段、状态、优先级、健康度、客户成功评分、扩展范围预览、下一步动作预览、负责人、来源验收复盘、关联成果资产、关联落地方案、关键节点时间、标签
- Detail-only fields: 扩展范围、成功目标、干系人计划、资产复用计划、续约计划、风险摘要、下一步动作、内部备注、关联资源
- Status values/enums: 阶段 `DISCOVERY`、`EXPANSION_DESIGN`、`PILOT_ROLLOUT`、`RENEWAL_PREP`、`CLOSED`；状态 `DRAFT`、`ACTIVE`、`BLOCKED`、`COMPLETED`、`ARCHIVED`；优先级/健康度 `LOW`、`MEDIUM`、`HIGH`
- User actions: 新建计划、筛选、清空筛选、查看详情、编辑、归档、分页
- Required states: loading, empty, error, validation, disabled, success, permission-denied

Design requirements:
- Make it look like a production SaaS/admin product, not a generic landing page.
- Use the project's existing data fields and actions; do not invent unrelated modules.
- Show the primary workflow clearly: 从验收复盘和成果资产创建客户成功计划，在列表筛选定位，在详情页查看完整扩展和续约计划，在编辑页维护后续动作。
- Include realistic table/card/form/detail areas based on the interface contract.
- Use a coherent component system: header badges, metric cards, search/filter toolbar, compact data table, confirmation dialog, detail cards, grouped form sections.
- Keep visual language consistent with minimal, technical, clean enterprise product UI: subtle borders, soft shadow, backdrop blur, restrained green/sky accents, no cheap glow.
- Emphasize hierarchy, spacing, alignment, and operational clarity.
- Output should be a product UI design reference image suitable for frontend implementation.

Avoid:
- fake API fields not listed above
- decorative UI that cannot map to project components
- unreadable tiny text, random charts, placeholder lorem ipsum
- inconsistent actions or states
