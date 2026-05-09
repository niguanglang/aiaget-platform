# Product Prototype / Wireframe Prompt

Create a mid-fidelity Chinese prototype wireframe for the “客户成功续约机会中心” module.

Prototype routes:

- `/customer-success-opportunities`: list page with search, filters, metrics, compact table, pagination, row actions.
- `/customer-success-opportunities/create`: independent create page using a grouped form.
- `/customer-success-opportunities/[id]`: detail page with tabs/sections for 基础信息, 机会摘要, 客户价值, 商务策略, 决策路径, 风险摘要, 下一步动作, 关联资源, 标签备注.
- `/customer-success-opportunities/[id]/edit`: independent edit page using the same grouped form.

Wireframe rules:

- The list page must not include full commercial details.
- The detail page owns complete long-text information and linked resources.
- Create/edit form groups: 基础信息, 商务预测, 机会内容, 关联资源, 标签备注.
- Dangerous archive operation uses confirmation.
- Permission denied state disables or hides create/edit/archive actions.
