# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same M01 console foundation.

Project context:
- Page/routes: `/login`, `/dashboard`, `/agents`, `/prompts`, `/models`, `/knowledge`, `/tools`, `/conversations`, `/monitor`, `/audit`, `/settings`
- Users/roles: tenant administrators, platform operators, and agent builders
- Main task flow: user opens `/login`, creates a demo session, is redirected to `/dashboard`, sees service health, navigates to a module page, and sees the consistent list/detail placeholder layout
- API/service contract:
  - `GET /api/v1/health`
  - `GET /api/v1/runtime/health`
  - direct runtime verification: `GET /runtime/health`
- Data entities and fields:
  - health: `service`, `status`, `timestamp`, `version`
  - navigation item: `title`, `href`, `icon`, `description`, `permission`
  - demo user: `name`, `email`, `tenant`
- Actions and states:
  - login submit, logout, navigation, refresh health
  - loading, empty, error, validation, disabled future action, permission placeholder

Prototype requirements:
- Use low- to mid-fidelity wireframe style and focus on information architecture.
- Show the login screen structure: product mark, tenant/user fields or demo credentials area, submit button, validation message area.
- Show the authenticated shell: sidebar, top bar, content header, route title, active nav, user/tenant area.
- Show dashboard regions: service health cards, metric cards, trend skeleton, recent activity empty state, implementation checklist panel.
- Show generic module page regions: metric strip, search/filter toolbar, table columns, disabled create button, empty state, detail placeholder.
- Make loading, error, and empty states explicit so engineers can implement them consistently.

Avoid:
- polished decorative rendering
- invented backend fields beyond health, session, and navigation contracts
- fake completed CRUD workflows
