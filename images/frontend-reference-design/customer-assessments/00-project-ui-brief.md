# Project UI Brief

- Page: 客户分层与六问评估中心
- Route: /customer-assessments
- Goal: 按客户分层和六问判断沉淀客户 AI 落地准备度，帮助售前快速识别客户类型并输出建议打法
- APIs: GET/POST/PATCH/DELETE /customer-assessments
- Fields: customer_name, customer_type, decision_stage, status, industry, contact_name, readiness_score, business_goal_preview, recommended_strategy_preview, owner, created_at, updated_at; contact_info, business_goal, process_maturity, data_asset_status, management_support, budget_signal, six_question_scores, recommended_strategy, risk_summary, next_action, notes
- States: loading, empty, error, validation, disabled, permission-denied, success
- Components: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui, lucide-react, react-hook-form, zod, motion
