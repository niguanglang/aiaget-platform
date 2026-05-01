# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real dashboard page.

Project context:
- Page/route: M23 Dashboard Step Operations at `/dashboard`
- Users/roles: tenant operators and admins
- Main task flow: open dashboard, inspect overall health, inspect run-step summary, identify high-cost or slow step types, click a step row to open monitor with filters applied
- API/service contract:
  - `getMonitorOverview({ window })`
  - `getAuditOverview({ window })`
  - drilldown route `/monitor?source_type=conversation_step&step_type=<type>`
- Data entities and fields:
  - monitor summary metrics
  - audit summary and failures
  - run-step summary: steps total, failed steps, average step latency, tokens, cost, model/tool/knowledge counts
  - run-step breakdown: step type, step count, failed count, average latency, p95, tokens, cost
- Actions and states:
  - refresh
  - window switch
  - drill down to monitor
  - loading, empty, error, disabled and success placeholders

Prototype requirements:
- Use low- to mid-fidelity wireframe style with clear Chinese section labels.
- Show page regions:
  - header with greeting, time window, refresh
  - metric tiles
  - health overview and operation trend
  - run-step operations card with summary chips and breakdown rows
  - agent ranking, error distribution, recent alerts
  - footer
- Make component boundaries obvious so it maps to existing `DashboardContent` helpers.
- Show empty state inside run-step card.
- Show drilldown affordance on step rows.

Avoid:
- invented backend fields
- visual-only widgets with no data contract
- decorative landing-page composition
