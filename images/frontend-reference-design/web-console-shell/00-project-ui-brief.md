# Project UI Brief

- Page: Web Console Shell
- Route: /dashboard
- Feature goal: Enterprise Agent Platform control console foundation
- Target users and permissions: enterprise tenant administrators, platform operators, and agent builders. M00 does not implement auth yet; M01 will add route protection and M02 will bind permissions to RBAC.
- APIs/services: planned health contracts only for M00/M01: `GET /api/v1/health` from Control Plane and `GET /runtime/health` from Agent Runtime. No business CRUD API is implemented in M00.
- Entities/fields/statuses: platform module navigation items only: Dashboard, Agents, Prompts, Models, Knowledge, Tools, Conversations, Monitor, Audit, Settings. Health status fields planned for M01: `status`, `service`, `timestamp`, `version`.
- Existing components/design system: repository is currently empty. M00 will scaffold Next.js, React, TypeScript, Tailwind CSS, and a shadcn/ui-compatible folder structure. Reusable components will be introduced from M01 onward.
- Required states: app shell should reserve patterns for loading, empty, error, disabled, success, and permission-denied states. M00 only creates the project foundation; concrete states are implemented with pages from M01 onward.
- Constraints: enterprise SaaS/admin product, left navigation plus top bar, compact operational density, white background, blue primary color, no marketing landing page as the primary product experience.
