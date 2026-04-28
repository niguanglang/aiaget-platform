# Product Prototype / Wireframe Prompt

Create a low- to mid-fidelity prototype / wireframe image for M03 Agent Configuration Center.

Project context:
- Page/routes: `/agents`, `/agents/[id]`
- Users/roles: tenant administrators and agent builders
- Main task flow: open list, search/filter agents, create an agent, edit runtime config, create version, publish, rollback, disable/archive, inspect audit records.
- API/service contract:
  - `GET /agent-categories`, `GET/POST /agents`, `GET/PATCH/DELETE /agents/:id`
  - `POST /agents/:id/versions`, `/publish`, `/rollback`, `/disable`, `/archive`
- Data fields:
  - List columns: name, code, status, version, default model, updated at, owner, actions
  - Form fields: name, code, description, category, owner, temperature, max_context_tokens, enable_stream, enable_log
  - Detail sections: basic info, runtime config, bindings, versions, test chat placeholder, audit
- Actions and states:
  - loading, empty, error, create/edit validation, publish disabled without version, rollback disabled without selected version, delete confirmation

Prototype requirements:
- Show `/agents` regions: title/actions, metrics, filters, table, empty state, create/edit drawer.
- Show `/agents/[id]` regions: header status/actions, basic config, runtime config, binding placeholders, versions table, test panel placeholder, audit timeline.
- Make component boundaries obvious: DataTable, MetricCard, StatusBadge, FormDrawer, ConfirmDialog, AuditTimeline, RunTracePanel placeholders.
- Keep every field tied to the API contract.

Avoid:
- fake external resource records
- full workflow editor or React Flow in M03
- invented advanced fields not in the contract
