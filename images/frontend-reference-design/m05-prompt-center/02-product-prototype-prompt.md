# Product Prototype / Wireframe Prompt

Create a low- to mid-fidelity product prototype / wireframe image for the M05 Prompt Center page.

Project context:
- Routes: `/prompts` list and `/prompts/[id]` detail.
- Users/roles: tenant admins/operators; read permission for viewing, write permission for create/edit/publish/rollback/test.
- Main task flow: scan metrics, filter templates, create/edit a template, define variables, render with inputs, publish immutable version, rollback a version, inspect agent references and test history.
- API/service contract:
  - `GET/POST/PATCH/DELETE /api/v1/prompt-templates`
  - `POST /api/v1/prompt-templates/:id/copy|publish|rollback|render|test`
  - `POST/PATCH/DELETE /api/v1/prompt-templates/:id/variables`
- Data entities and fields:
  - Template: name, code, type, status, version, content, owner, updated at.
  - Variable: name, type, default value, required, description.
  - Version: version, status, change note, published at, creator.
  - Test: inputs, rendered content, status, latency, error.
  - References: agent name/code and prompt binding type.
- Actions and states: create/edit/copy/publish/rollback/delete/test, variable CRUD, loading/empty/error/validation/permission-disabled states.

Prototype requirements:
- Show list page regions: header, metric cards, filter toolbar, template table, right selected-template summary/test panel.
- Show detail page regions: header actions, basic info, editor panel, variables table/form, versions table, render/test panel, agent references, audit/activity.
- Make component boundaries clear for mapping to existing React components and API contracts.
- Keep layout realistic for a responsive enterprise console.
- Avoid polished decoration, invented fields, random charts, or non-product visual filler.
