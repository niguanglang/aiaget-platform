# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise SaaS/admin page.

Project context:
- Product/module: Enterprise Agent Platform, M05 Prompt Center.
- Page/route: Prompt Center at `/prompts` with detail route `/prompts/[id]`.
- Target users/roles: tenant admins/operators with `prompt.read`; template mutations require `prompt.write`.
- Business goal: manage prompt templates, variables, immutable versions, render tests, model tests, rollback, and agent usage references.
- Existing frontend stack/design system: Next.js App Router, React, TypeScript, Tailwind CSS, TanStack Query, React Hook Form, Zod, lucide icons, shadcn-style Button/Card/Input/StatusBadge/MetricCard/EmptyState, Motion micro-interactions.
- Existing page shell/layout: protected console with left navigation and topbar; content uses max-width dashboard layout.

Interface contract that must appear in the UI:
- API/service functions: list/create/update/delete/copy/publish/rollback prompt templates, create/update/delete variables, render prompt, test prompt, read versions, read test records, read agent references.
- Main entities and fields:
  - Template: name, code, type, status, version, description, content, owner, created/updated time.
  - Variable: name, variable type, default value, required flag, description, sort order.
  - Version: version number, status, change note, published time, creator.
  - Test: input variables JSON, rendered content, model test status, latency, error message.
  - Agent references: agent id/name/code and binding type.
- Status values/enums: DRAFT, PUBLISHED, DISABLED, ARCHIVED; prompt types SYSTEM, USER, ASSISTANT, TOOL; test statuses SUCCESS, FAILED.
- User actions: search, filter by type/status/creator, create/edit/copy/publish/rollback/delete/test, add/edit/delete variables, open detail.
- Required states: loading, empty, error, validation, disabled, success, permission-denied.

Design requirements:
- Use a production dashboard/Bento layout: metrics, filters, template table, selected template detail/test panel, variable/version/log sections.
- The prompt editor area should look like a clean professional code editor panel, but map to a textarea if Monaco is not installed.
- Use thin borders, soft shadow, subtle glass panels with backdrop blur, light noise/grid texture, and restrained gradient mesh depth.
- Use Motion-ready visual behavior: calm stagger reveal, row hover, active row, smooth drawer transition.
- Keep the design minimal, advanced, clean, product-grade, and information-first.
- Avoid invented backend fields, emoji, overdone gradients, fake analytics charts, unreadable tiny text, or decorative shapes that cannot map to components.
