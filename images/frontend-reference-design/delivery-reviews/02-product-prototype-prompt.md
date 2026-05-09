Create a product prototype / wireframe image for the 交付验收复盘中心 page.

Page/route: `/delivery-reviews`
Users/roles: 租户管理员、交付负责人、客户成功、售前负责人
Main task flow: 搜索筛选验收复盘 -> 查看紧凑列表 -> 进入详情页查看已交付范围、验收结论、问题复盘、改进行动、扩展计划、可复用资产和关联方案包 -> 新建或编辑复盘
API/service contract: listDeliveryReviews, getDeliveryReview, createDeliveryReview, updateDeliveryReview, deleteDeliveryReview
Data entities and fields: customer_name, review_stage, result, status, satisfaction_level, acceptance_score, acceptance_summary_preview, issue_summary_preview, linked solution_package
Actions and states: 新建、详情、编辑、归档、清空筛选、分页、加载、空状态、错误、无权限禁用

Prototype requirements:
- Low- to mid-fidelity wireframe, focus on information architecture and page boundaries.
- Separate list page, detail page, create page, edit page.
- List page must not include full delivered_scope, improvement_actions, expansion_plan, reusable_assets, or next_action.
- Detail page uses grouped sections for 已交付范围、验收结论、问题复盘、改进行动、扩展计划、可复用资产、下一步动作、关联方案包、标签备注。
- Create/edit page uses a structured form with sections, not a small modal.
