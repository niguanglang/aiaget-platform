# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: Tool Center at `/tools` with detail route `/tools/[id]`
- Users/roles: tenant admins and tool operators with read/write permission separation
- Main task flow: search tools, inspect a tool, edit HTTP config and schemas, run a test request, review result and call logs
- API/service contract: list/create/update/delete/copy/enable/disable tool; get tool detail; run tool test
- Data entities and fields: tool list row, auth config, request headers, input/output schema, risk policy, call log row, request/response preview, agent bindings
- Actions and states: create, edit, copy, enable, disable, delete, test, loading, empty, error, validation, approval-required, permission-disabled

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Focus on information architecture, layout regions, action flow, and state visibility.
- Show these regions clearly:
  - page header with metrics and primary action
  - filter toolbar
  - tool list table
  - selected tool summary rail / quick test panel
  - detail route sections for HTTP config, schemas, auth, risk policy, agent bindings, call logs
  - drawers or modals for create/edit and delete confirmation
- Include placeholders for invalid JSON schema, approval-required test result, and empty call logs.
- Make component boundaries obvious so a frontend engineer can map each region to existing components.
- Keep layout realistic for the current console shell and responsive behavior.

Avoid:
- polished decorative rendering
- invented backend fields
- unrealistic navigation or actions
