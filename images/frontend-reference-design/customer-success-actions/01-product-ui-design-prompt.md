# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise SaaS admin page.

Project context:
- Product/module: 企业 Agent 平台 / 客户成功行动中心
- Page/route: `/customer-success-actions`
- Target users/roles: 租户管理员、客户成功经理、交付负责人、Agent 管理员；写操作需要 `customer:success_action:manage`，查看需要 `customer:success_action:view`
- Business goal: 把客户成功计划拆成可负责人、可截止、可跟踪、可沉淀证据的执行行动
- Existing frontend stack/design system: Next.js App Router + React + TypeScript + Tailwind CSS + shadcn 风格组件，使用 `Button`、`Card`、`Input`、`MetricCard`、`StatusBadge`、`EmptyState`
- Existing page shell/layout: 企业 SaaS 控制台，左侧导航由菜单系统驱动，页面主体为最大宽度 7xl 的 Dashboard Layout，Bento-like metrics + filter toolbar + compact table + independent detail/create/edit routes

Interface contract that must appear:
- API/service functions: `listCustomerSuccessActions`、`createCustomerSuccessAction`、`getCustomerSuccessAction`、`updateCustomerSuccessAction`、`deleteCustomerSuccessAction`
- Main list fields: 行动名称、编码、客户名称、行动类型、状态、优先级、风险等级、行动评分、行动摘要预览、下一步动作预览、负责人、客户成功计划、来源验收复盘、关联成果资产、关联方案包、截止时间、完成时间、标签
- Detail-only fields: 行动摘要、预期结果、执行记录、阻塞风险、完成证据、下一步动作、内部备注、关联资源
- Status values/enums: 类型 `MEETING`、`ASSET_REUSE`、`ROLLOUT`、`TRAINING`、`RENEWAL`、`RISK_REVIEW`、`FOLLOW_UP`；状态 `TODO`、`IN_PROGRESS`、`BLOCKED`、`DONE`、`CANCELLED`、`ARCHIVED`；优先级/风险等级 `LOW`、`MEDIUM`、`HIGH`
- User actions: 新建行动、筛选、清空筛选、查看详情、编辑、归档、分页
- Required states: loading, empty, error, validation, disabled, permission-denied

Design requirements:
- Make it look like a real production operations console, not a marketing page.
- Use compact but readable hierarchy: header badges, four metric cards, dense filter toolbar, compact data table, row actions, confirmation dialog.
- Keep list page focused on query, overview, and row actions. Do not show full execution notes, full blockers, or evidence in the table.
- Show restrained enterprise visual language: subtle borders, soft shadow, backdrop blur, clean white panels, restrained emerald/sky accents, light grid texture, no cheap glow.
- Use Chinese visible UI text.
- Make information scannable for repeated operational use.

Avoid:
- fake fields not listed above
- random charts unrelated to action execution
- oversized hero marketing layout
- unreadable tiny text or overloaded table cells
- decorative elements that cannot map to the project components
