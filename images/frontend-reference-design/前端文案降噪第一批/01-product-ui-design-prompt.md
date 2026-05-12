# Product UI Design Image Prompt

Create a high-fidelity product UI design reference for an enterprise admin console after copy cleanup.

Project context:
- Product/module: AIAget 企业智能体后台
- Page/route: high-frequency console entry pages, primary reference `/dashboard`
- Target users: 平台管理员、租户管理员、安全管理员、审计员
- Business goal: Make pages feel like an operational backend, not a product marketing page or AI-generated feature explanation.
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui-style Button/Card/Input, lucide-react icons.
- Existing page shell/layout: collapsible left navigation, topbar, breadcrumb/tabs, dense dashboard/list/detail pages.

Interface contract:
- Keep current API calls, tables, metrics, filters, permissions, loading/error/empty states.
- Do not add new business modules.
- Visible copy should be concise Chinese operational labels.
- Page header example: title `系统概览`, subtitle `当前账号：管理员`.
- List header example: title `角色清单`, subtitle `名称、状态、用户数和授权数量。`
- Empty state example: `当前筛选无结果。`

Design requirements:
- Minimal enterprise admin UI.
- Text should be short, factual, and scan-friendly.
- No marketing paragraphs, no “用于/帮助/打造/统一管理/闭环/沉淀” style copy.
- Keep data hierarchy clear through metrics, tables, filters, and actions rather than explanatory prose.

Avoid:
- product landing page language,
- long help text in page headers,
- IA refactor explanations visible to users,
- decorative marketing sections,
- fake dashboard data unrelated to the current project.
