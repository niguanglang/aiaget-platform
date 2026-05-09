# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real Enterprise Agent Platform admin page.

Project context:
- Product/module: 企业 AI Agent 平台 / 成果资产中心
- Page/route: 成果资产列表 at `/delivery-assets`
- Target users/roles: 租户管理员、交付负责人、客户成功负责人、Agent 管理员、审计员
- Business goal: turn accepted delivery reviews into reusable operational assets such as solution templates, acceptance checklists, risk checklists, Prompt SOPs, customer cases, and report archives.
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style Button/Card/Input/Badge/Table, restrained SaaS dashboard styling.
- Existing page shell/layout: Chinese enterprise admin console with left navigation already provided by the app; page content uses max-width container, metric cards, filter toolbar, compact data table, detail pages for full content.

Interface contract that must appear in the UI:
- API/service functions: `listDeliveryAssets`, `deleteDeliveryAsset`, route to `/delivery-assets/create`, `/delivery-assets/[id]`, `/delivery-assets/[id]/edit`.
- Main fields: name, code, customer_name, asset_type, status, visibility, reuse_score, summary_preview, reuse_guidance_preview, owner, linked_resources.delivery_review, linked_resources.solution_package, tags, updated_at.
- Status values: DRAFT 草稿, REVIEWING 评审中, PUBLISHED 已发布, RETIRED 已退役, ARCHIVED 已归档.
- Asset type values: 方案模板, 验收清单, 风险清单, Prompt SOP, 客户案例, 报告归档.
- User actions: search, filter by type/status/visibility/owner/review/package, clear filters, create asset, view detail, edit, archive with confirmation.
- Required states: loading, empty, error, permission disabled, archive confirmation.

Design requirements:
- Make it look like a production enterprise SaaS admin product, not a marketing page.
- Use Bento/Dashboard layout only for summary metrics; keep the list compact and operational.
- Use subtle borders, soft shadow, backdrop blur, restrained gradient mesh/noise texture background.
- Use Chinese interface text.
- Keep the table under 8-10 visible columns and move full text to detail.
- Include natural micro-interaction cues but do not make animations visually loud.

Avoid:
- decorative 3D elements that distract from operational data
- fake fields unrelated to the contract
- overfilled table rows, long paragraphs inside table cells, emoji, large rounded decorative blobs, cheap glow effects
