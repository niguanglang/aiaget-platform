# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend milestone.

Project context:
- Product/module: Enterprise Agent Platform Web Console M01 foundation
- Page/route: authenticated dashboard at `/dashboard`, with a related login screen at `/login`
- Target users/roles: tenant administrators, platform operators, and agent builders
- Business goal: let an enterprise user sign in with a demo session, enter a protected console, scan platform modules, and verify Control Plane and Agent Runtime health from one dashboard
- Existing frontend stack/design system: Next.js App Router, React, TypeScript, Tailwind CSS 4, shadcn/ui-compatible components, lucide-react icons
- Existing page shell/layout: M00 has root layout, a simple Button, `/`, `/dashboard`, and `/api-reference`; M01 must introduce the production console shell

Interface contract that must appear in the UI:
- API/service functions:
  - `GET /api/v1/health`
  - `GET /api/v1/runtime/health`
- Main entities and fields:
  - `HealthResponse`: `service`, `status`, `timestamp`, `version`
  - nav modules: Dashboard, Agents, Prompts, Models, Knowledge, Tools, Conversations, Monitor, Audit, Settings
  - demo session: tenant name, user name, user email, access token stored locally
- Status values/enums: `healthy`, `degraded`, `unavailable`; module statuses `planned`, `ready`, `mock`
- User actions: demo login, logout, navigate modules, refresh health, open settings, inspect module placeholder pages
- Required states: login validation, route loading, health loading, health error, unavailable runtime, disabled future primary actions, empty table state

Design requirements:
- Make it look like a production enterprise SaaS/admin console rather than a landing page.
- Use a persistent left sidebar with clear module icons and concise labels; active route must be obvious.
- Use a compact top bar with tenant/environment selector placeholder, global search placeholder, health indicator, and user menu/logout.
- Dashboard content must include health cards for Control API and Agent Runtime, four metric cards with mock labels clearly marked as previews, a simple trend skeleton, a recent activity empty state, and a "next milestone" implementation panel.
- Future module pages should have a consistent page shell: title, description, primary action, metric strip, filters/search, data table skeleton, empty state, and detail panel placeholder.
- Keep visual style white, neutral borders, restrained blue primary, clear green/yellow/red status signals, 8px-or-less radii, compact spacing, and readable text.
- Output should be a product UI reference image suitable for frontend implementation.

Avoid:
- fake production data that implies business APIs are completed
- unrelated modules, decorative hero sections, gradient-orb backgrounds, marketing copy, unreadable tiny text
- direct frontend-to-database or frontend-to-vector-store interactions
