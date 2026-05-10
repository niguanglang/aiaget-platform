# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise AI Agent Platform page.

Project context:
- Product/module: 企业 AI Agent 平台 / 客户成功续约机会中心
- Page/route: 续约机会成交复盘报告 at /customer-success-opportunities/[id]/close-won-report
- Target users/roles: 客户成功负责人、财务运营、租户管理员、审计员，需要 customer:success_opportunity:view
- Business goal: 在续约机会赢单并完成成交入账后，生成一页只读复盘报告，连接客户价值、商务策略、来源交付资产、调账入账和审计追踪，帮助团队复盘“为什么成交、如何复用、下一步如何运营”。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui 风格组件，Card、Button、StatusBadge，中文界面。
- Existing page shell/layout: 企业后台内容区，顶部返回和操作入口，Bento/Dashboard 布局，细边框、轻阴影、干净信息层级。

Interface contract that must appear in the UI:
- API/service functions: getCustomerSuccessOpportunityCloseWonReport(opportunityId)
- Main entities and fields: opportunity.name/customer_name/stage/status/owner，summary.estimated_amount/close_amount/weighted_amount/closed_at/adjustment_count，billing_trace.adjustment_no/status/signed_amount/effective_at/reason，source_chain.customer_success_plan/customer_success_action/delivery_review/delivery_asset/solution_package，value_review.customer_value/commercial_strategy/decision_path/risk_summary，replay_points，next_actions。
- Status values/enums: opportunity WON/OPEN/AT_RISK/LOST, billing adjustment APPLIED/PENDING/APPROVED/VOIDED。
- User actions: 返回机会详情、查看调账记录、审计追踪。
- Required states: loading, error, partial data when no billing trace.

Design requirements:
- Use Chinese interface text only.
- Keep it as a report/detail page, not an editable form.
- Show summary metrics first, then value review, source chain, billing trace, replay points and next actions.
- Use clear operational hierarchy and enough whitespace; no full raw payload JSON.
- Keep visual language restrained and production-like.

Avoid:
- adding mutation buttons, edit forms, or inline billing approval actions
- mixing the report into the opportunity list page
- decorative charts unsupported by current API fields
