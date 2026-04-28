# Product Prototype / Wireframe Prompt

Create a low- to mid-fidelity product prototype / wireframe image for the M04 Model Center page at `/models`.

Project context:
- Users/roles: tenant admins/operators; read permission for viewing, write permission for mutations.
- Main task flow: open Model Center, scan metrics, filter providers/models, create or edit an OpenAI Compatible provider, add a masked API key, create a model config, run a call test, inspect call logs.
- API/service contract:
  - `GET/POST/PATCH/DELETE /api/v1/model-providers`
  - `POST /api/v1/model-providers/:id/enable|disable|test`
  - `POST/DELETE /api/v1/model-providers/:id/api-keys`
  - `POST/PATCH/DELETE /api/v1/models`
  - `POST /api/v1/models/:id/enable|disable`
- Data entities and fields:
  - Provider fields: name, code, provider type, base URL, status, default flag, description, updated at.
  - Model fields: name, model, capabilities, context length, input/output price, rate limit, status, default flag.
  - Key fields: name, prefix, masked key, status, last used, created at.
  - Test fields: provider/model, prompt, latency, tokens, status, error.
- Actions and states: search/filter, create/edit drawers, delete confirmation, disabled actions without `model.write`, loading rows, empty state, validation errors, success/error test results.

Prototype requirements:
- Use a realistic dashboard layout: top page header, metrics strip, filter toolbar, provider/model tables, detail side panel, test/log sections.
- Label component boundaries clearly: metrics, filters, provider list, model list, detail, keys, cost/rate limit, test panel, logs.
- Show the create/edit provider drawer with fields and validation locations.
- Show masked key management and call logs as detail sub-sections.
- Keep information architecture readable and implementable with existing components.
- Avoid polished decoration, invented backend fields, or unrealistic navigation.
