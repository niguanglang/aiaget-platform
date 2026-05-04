# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend module.

Project context:
- Page/route: API Key 管理中心 at `/api-keys`
- Users/roles: 租户管理员、API Key 管理员、运维人员、审计人员
- Main task flow: select time window -> review external call summary -> inspect recent call -> copy trace/request ID -> jump to monitor or audit -> review quota risk -> review denied security events
- API/service contract: `GET /api/v1/api-keys/external-observability?window=24h|7d`
- Data entities and fields:
  - summary metrics
  - recent external call list
  - API Key quota watch list
  - security denial list
  - trace and request identifiers
- Actions and states:
  - refresh
  - change time window
  - copy trace ID
  - copy request ID
  - open monitor trace
  - open audit search
  - empty/loading/error states

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Show clear module regions inside the existing API Key page:
  1. Section header with window switch and refresh action.
  2. Summary metric cards.
  3. Recent external calls table/cards.
  4. Quota watch panel.
  5. Security denials panel.
  6. Investigation shortcuts for monitor/audit/API docs.
- Make component boundaries obvious so a frontend engineer can map each region to existing components.

Avoid:
- invented streaming endpoint
- secret key display
- unrelated analytics charts
