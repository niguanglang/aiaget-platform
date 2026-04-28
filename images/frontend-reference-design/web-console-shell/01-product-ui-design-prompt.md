# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an Enterprise Agent Platform Web Console foundation.

Project context:
- Product/module: Enterprise Agent Platform control console
- Page/route: Web Console Shell at `/dashboard`
- Target users/roles: tenant administrators, platform operators, and agent builders
- Business goal: provide a stable enterprise admin shell that can later host dashboard metrics, Agent CRUD, Prompt Center, Model Center, Knowledge Base, Tool Center, Conversation Center, Monitor, Audit, and Settings
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui-compatible components
- Existing page shell/layout: no existing UI yet; design must establish a left sidebar navigation, top bar, main content area, and compact dashboard entry page

Interface contract that must appear in the UI:
- API/service functions planned for M01: `GET /api/v1/health`, `GET /runtime/health`
- Main entities and fields: navigation modules only: Dashboard, Agents, Prompts, Models, Knowledge, Tools, Conversations, Monitor, Audit, Settings
- Status values/enums: health badges for Control API and Runtime: healthy, degraded, unavailable
- User actions: navigate modules, refresh health status, open user menu, open settings
- Required states: loading, empty, error, disabled, success, permission-denied where relevant

Design requirements:
- Make it look like a production SaaS/admin product, not a marketing website.
- Use a white primary background, restrained blue primary color, neutral borders, compact spacing, and dense but readable tables/cards.
- Show a left navigation with grouped enterprise platform modules and a top bar with tenant switch placeholder, environment badge, search placeholder, notifications, and user menu.
- Main content should be a dashboard shell with metric cards, service health cards, recent activity placeholder, and run status trend placeholder.
- Keep all business data as clearly marked placeholders because M00 does not implement business APIs yet.
- Ensure the shell can scale to list pages with search, filters, CRUD actions, detail pages, audit timeline, and run trace panels in later milestones.
- Output should be a product UI design reference image suitable for frontend implementation.

Avoid:
- fake business records that imply completed CRUD APIs
- decorative hero sections, gradient backgrounds, oversized marketing typography, or unrelated charts
- unreadable tiny text, lorem ipsum, or actions that cannot map to the planned platform modules
