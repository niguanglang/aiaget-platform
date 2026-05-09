Create a high-fidelity product UI design image for a real enterprise SaaS admin page.

Project context:
- Product/module: 企业 AIAgent 平台 / AI 落地方案包中心
- Page/route: 落地方案包 at `/solution-packages`
- Target users/roles: 租户管理员、售前负责人、交付负责人、Agent 管理员
- Business goal: 把客户六问评估和岗位场景编排转成可交付、可验收、可复盘的 AI 落地方案包
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui-like components, lucide icons, motion
- Existing page shell/layout: console layout with left navigation, dense dashboard layout, full-width content area, cards no larger than 8px radius

Interface contract that must appear:
- APIs: listSolutionPackages, createSolutionPackage, getSolutionPackage, updateSolutionPackage, deleteSolutionPackage
- Fields: name, code, customer_name, industry, customer_type, package_stage, status, priority, package_score, executive_summary_preview, roadmap_preview, roi_preview, owner, linked customer assessment, linked role scenario, tags, updated_at
- Status values: DRAFT, REVIEWING, APPROVED, DELIVERING, CLOSED, ARCHIVED
- Actions: 新建方案包、筛选、清空、查看详情、编辑、归档、分页
- Required states: loading, empty, error, disabled when no manage permission

Design requirements:
- Make a production-grade enterprise SaaS dashboard, not a marketing landing page.
- Use Bento Grid / Dashboard layout for top metrics and a compact data table for the list.
- Use Chinese interface text.
- Show a clear hierarchy: top summary metrics, filter toolbar, compact solution package table, delete confirmation panel.
- Keep gradients subtle, no cheap glow, no emoji, no decorative card nesting.
