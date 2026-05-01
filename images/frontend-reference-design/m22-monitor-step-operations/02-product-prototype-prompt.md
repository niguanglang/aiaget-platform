# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: M22 Monitor Step Operations at `/monitor`
- Users/roles: tenant operators and admins with `monitor.read`
- Main task flow: choose a time window, inspect run-step health summary, narrow the unified event stream by source type or step type, select an event, read payload and error details
- API/service contract:
  - `getMonitorOverview({ window })`
  - `listMonitorEvents({ page, page_size, window, module, status, source_type, step_type, keyword })`
  - `getMonitorEvent(eventId)`
- Data entities and fields:
  - monitor summary: events, success rate, latency, p95, cost, active conversations
  - step summary: steps total, failed steps, average step latency, total tokens, total cost, model/tool/knowledge counts
  - step breakdown: step type, count, failed count, average latency, p95, tokens, cost
  - event list: trace id, module, source type, status, title, latency, tokens, cost, step type, occurred time
  - event detail: request payload, response payload, step payload, error message
- Actions and states:
  - refresh
  - search keyword
  - filter by window, module, status, source type, step type
  - clear filters
  - select event
  - loading, empty, error, success, permission-denied placeholders

Prototype requirements:
- Use low- to mid-fidelity wireframe style with clear Chinese section labels.
- Layout:
  - top title and action row
  - service health row
  - summary metric grid
  - run-step operations band
  - step breakdown card plus latency/error cards
  - rankings row
  - unified event stream table and sticky-ish detail panel
- Show component boundaries clearly so each region maps to existing React components.
- Keep the event table horizontally scrollable on desktop and stacked enough for mobile.
- Keep detail JSON areas readable and clearly separated.

Avoid:
- polished decorative rendering
- invented backend fields
- unrealistic navigation, batch actions, or write operations
