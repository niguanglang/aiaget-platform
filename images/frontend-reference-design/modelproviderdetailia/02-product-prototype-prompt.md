# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the enterprise AI Agent Platform model provider detail page.

Project context:
- Page/route: 模型供应商详情 at `/models/[id]`
- Users/roles: 模型管理员 can configure, read-only users see disabled actions
- Main task flow: open provider detail from list -> inspect provider state and metrics -> maintain model configs -> add masked API key -> run compatibility test -> review cost rules and call logs -> edit provider base information through `/models/[id]/edit`
- API/service contract: getModelProvider, provider enable/disable, model config CRUD/status, API key create/delete, provider test call
- Data entities and fields: provider summary, model cards/table, masked API key list, test result panel, cost rule table, call log table
- Actions and states: loading, error, empty states for models/api keys/cost/logs, disabled actions without permission, delete confirmation for model config

Prototype requirements:
- Show a top header with back, title, badges, provider description, edit and enable/disable buttons.
- Show four metric cards below the header.
- Main grid: left large card for model config management, right column with separate API key card and compatibility test card.
- Bottom full-width card for cost rules and call logs with table regions.
- Include modal/drawer placeholders for model create/edit and delete confirmation.
- Clearly label component boundaries so the implementation can map each region to a separate React component.

Avoid:
- left menu redesign
- external model marketplace content
- provider edit form inside detail
