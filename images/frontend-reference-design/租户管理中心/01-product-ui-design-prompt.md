# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: 企业 Agent 平台 / 租户管理中心
- Page/route: 租户管理中心 at `/tenants`
- Target users/roles: 租户管理员、平台运维管理员；查看权限 `system:tenant:view`，管理权限 `system:tenant:manage`
- Business goal: 管理当前租户资料和启停状态，明确租户上下文边界，为后续多租户 SaaS 管控预留入口。
- Existing frontend stack/design system: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui style components, React Query, React Hook Form, Zod, motion, lucide icons.
- Existing page shell/layout: Console shell with sidebar/topbar. Use focused admin layout with tenant profile card, status governance, tenant list and edit drawer.

Interface contract that must appear in the UI:
- API/service functions: `listTenants`, `getTenant`, `updateTenant`
- Main entities and fields: tenant id, code, name, status, created_at, updated_at
- Status values/enums: `ACTIVE`, `DISABLED`, `DELETED`
- User actions: refresh, search/filter, select tenant, edit current tenant name/status
- Required states: loading, empty, error, validation, disabled, success, permission-denied

Design requirements:
- Modern enterprise SaaS admin product.
- Use Chinese UI copy.
- Clearly state that current backend is scoped to the current tenant.
- Use cards, subtle borders, soft shadows, clean hierarchy.
- Show tenant profile, status, context notes, edit form and audit-friendly timestamps.

Avoid:
- cross-tenant controls not supported by backend
- delete/create tenant actions
- decorative charts without data
- emojis, excessive gradients, cheap glow
