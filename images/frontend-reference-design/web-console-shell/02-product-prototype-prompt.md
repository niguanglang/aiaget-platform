# Product Prototype / Wireframe Prompt

Create a low- to mid-fidelity product prototype / wireframe image for the Enterprise Agent Platform Web Console foundation.

Project context:
- Page/route: Web Console Shell at `/dashboard`
- Users/roles: tenant administrators, platform operators, and agent builders
- Main task flow: user enters the console, sees platform navigation, checks Control API and Runtime health, then navigates to future modules
- API/service contract planned for M01: `GET /api/v1/health`, `GET /runtime/health`
- Data entities and fields: navigation modules only: Dashboard, Agents, Prompts, Models, Knowledge, Tools, Conversations, Monitor, Audit, Settings; health fields: `status`, `service`, `timestamp`, `version`
- Actions and states: navigate, refresh health, open user/settings menus, loading health state, error health state, permission-denied route placeholder

Prototype requirements:
- Show a persistent left sidebar, top bar, dashboard content region, and footer/status region if useful.
- Label major regions clearly: navigation, tenant/environment area, global search, health summary, dashboard metrics placeholder, activity placeholder, trend placeholder.
- Include placeholders for loading, empty, error, and permission-denied states that later pages can reuse.
- Show how future list pages should fit into the shell: title row, primary action, metrics, filters, data table, detail drawer/dialog.
- Make component boundaries obvious so implementation can map each region to layout and reusable components.

Avoid:
- polished decorative rendering
- invented backend fields beyond health and navigation contracts
- unrealistic navigation or actions for M00
