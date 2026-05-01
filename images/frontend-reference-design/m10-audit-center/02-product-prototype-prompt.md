# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: Audit Center at `/audit`
- Users/roles: tenant operators and admins
- Main task flow: scan audit table, filter source/status/window, inspect a record, compare top users/modules, review recent failures
- API/service contract: audit overview, audit event list, audit event detail
- Data entities and fields: audit summary, unified event rows, event detail request metadata, rankings
- Actions and states: filter, refresh, inspect event, loading, empty, error

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Focus on information architecture and review workflow.
- Show these regions clearly:
  - page header with metrics
  - source/status/window filters
  - unified audit table
  - selected-event detail side panel
  - top users / top modules panels
  - recent failures panel
- Include placeholders for no events, no failures, and detail fetch failure.
- Make component boundaries obvious so a frontend engineer can map each region to current components.

Avoid:
- decorative rendering
- invented backend fields
- unrealistic compliance widgets
