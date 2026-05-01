# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: Monitor Center at `/monitor`
- Users/roles: tenant operators and admins
- Main task flow: review service health, scan event table, filter by module/status/time, inspect an event, compare rankings
- API/service contract: monitor overview, monitor event list, monitor event detail
- Data entities and fields: summary metrics, health cards, event rows, event detail payloads, ranking panels
- Actions and states: filter, refresh, inspect event, loading, empty, error, service unavailable

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Focus on information architecture and operational workflows.
- Show these regions clearly:
  - page header with metrics
  - health cards
  - filter toolbar
  - unified event table
  - selected-event detail side panel
  - ranking panels for agents, models, tools, and knowledge recalls
  - error panel / no-data states
- Include placeholders for unavailable runtime health, empty event list, and event detail fetch failure.
- Make component boundaries obvious so a frontend engineer can map each region to current components.

Avoid:
- decorative rendering
- invented backend fields
- unrealistic analytics widgets
