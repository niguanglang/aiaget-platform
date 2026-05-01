# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: Dashboard at `/dashboard`
- Users/roles: tenant operators and admins
- Main task flow: check service health, scan metrics, review top failures, inspect rankings, decide next module to open
- API/service contract: health endpoints plus monitor overview and audit overview
- Data entities and fields: health cards, summary metrics, trend points, ranking rows, failure rows
- Actions and states: refresh, loading, degraded, empty, error

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Focus on information architecture and scan efficiency.
- Show these regions clearly:
  - page header with last updated time
  - service health cards
  - headline metrics
  - latency trend area
  - recent failures panel
  - ranking panels
- Make component boundaries obvious so a frontend engineer can map each region to current components.

Avoid:
- decorative rendering
- invented backend fields
- unrealistic navigation patterns
