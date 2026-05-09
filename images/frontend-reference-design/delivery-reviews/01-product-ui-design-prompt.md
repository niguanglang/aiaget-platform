Create a high-fidelity product UI design image for a real enterprise SaaS admin page.

Project context:
- Product/module: 企业 AIAgent 平台 / 交付验收复盘中心
- Page/route: 验收复盘 at `/delivery-reviews`
- Target users/roles: 租户管理员、交付负责人、客户成功、售前负责人
- Business goal: 承接 AI 落地方案包，记录客户验收结果、问题复盘、改进行动、扩展计划和可复用资产，形成落地运营闭环
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui-like components, lucide icons, motion
- Existing page shell/layout: console layout with left navigation, dense dashboard layout, full-width content area, cards no larger than 8px radius

Interface contract that must appear:
- APIs: listDeliveryReviews, createDeliveryReview, getDeliveryReview, updateDeliveryReview, deleteDeliveryReview
- Fields: name, code, customer_name, review_stage, result, status, satisfaction_level, acceptance_score, acceptance_summary_preview, issue_summary_preview, owner, linked solution package, reviewed_at, tags, updated_at
- Status values: DRAFT, IN_REVIEW, COMPLETED, ACTION_REQUIRED, ARCHIVED
- Result values: PASSED, PARTIAL, FAILED, DEFERRED
- Actions: 新建复盘、筛选、清空、查看详情、编辑、归档、分页
- Required states: loading, empty, error, disabled when no manage permission

Design requirements:
- Make a production-grade enterprise SaaS dashboard, not a marketing landing page.
- Use Bento Grid / Dashboard layout for top metrics and a compact data table for the list.
- Use Chinese interface text.
- Show a clear hierarchy: top summary metrics, filter toolbar, compact review table, archive confirmation panel.
- Keep gradients subtle, no cheap glow, no emoji, no decorative card nesting.
- List page must not show full delivered_scope, improvement_actions, expansion_plan, reusable_assets, or next_action.
