# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the Enterprise Agent Platform Agent Configuration Center.

Project context:
- Product/module: Enterprise Agent Platform Control Console
- Page/route: `/agents` list and `/agents/[id]` detail
- Target users/roles: tenant administrators and agent builders with `agent.read` and `agent.write`
- Business goal: let users create, configure, version, publish, disable, archive, soft delete, and audit tenant-scoped agents
- Existing frontend stack/design system: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn-compatible primitives, lucide-react icons, TanStack Query, React Hook Form, Zod
- Existing shell/layout: protected console with left sidebar, topbar, mobile nav, compact SaaS admin styling

Interface contract that must appear in the UI:
- API/service functions:
  - `GET /agent-categories`
  - `GET /agents`
  - `POST /agents`
  - `GET /agents/:id`
  - `PATCH /agents/:id`
  - `DELETE /agents/:id`
  - `POST /agents/:id/versions`
  - `POST /agents/:id/publish`
  - `POST /agents/:id/rollback`
  - `POST /agents/:id/disable`
  - `POST /agents/:id/archive`
- Main entities and fields:
  - Agent: name, code, description, avatar_url, category, owner, status, version, temperature, max_context_tokens, enable_stream, enable_log, created_at, updated_at
  - Version: version, status, change_note, published_at, created_at, created_by
  - Audit: action, message, operator, created_at
- Status values: DRAFT, TESTING, PENDING, PUBLISHED, DISABLED, ARCHIVED
- Actions: search, status/category/owner filter, create, edit, copy-ready placeholder, create version, publish, rollback, disable, archive, soft delete, open detail
- Required states: loading, empty, error, validation, disabled actions, success feedback, permission-denied

Design requirements:
- `/agents` must be a dense operational list: metric cards, search/filter toolbar, table columns, row actions, create/edit drawer, delete confirmation.
- `/agents/[id]` must show header actions, tabs/sections for Basic Info, Runtime Config, Bindings, Versions, Conversation Test, Audit.
- Binding sections should show placeholders for Model, Prompt, Knowledge, Tool because M04-M07 provide real resources later.
- Conversation Test should show an input panel and run trace placeholder clearly marked as M08 pending.
- Use white background, neutral borders, blue primary, clear status colors, 8px-or-less radii, no marketing hero.

Avoid:
- fake model/prompt/knowledge/tool records
- implying chat runtime is already functional
- decorative gradients, landing-page composition, unrelated modules
