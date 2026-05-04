# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: 开放接口文档中心 at `/api-reference`
- Users/roles: enterprise developers and tenant admins
- Main task flow: create API Key -> copy endpoint -> call Agent -> read response -> troubleshoot errors -> inspect trace
- API/service contract: static docs for `POST /api/v1/external/agents/{agentId}/chat` and API Key management endpoints
- Data entities and fields: request message/title, response conversation_id, run_id, trace_id, answer, references, tool_calls, usage
- Actions and states: copy endpoint, copy curl, copy TypeScript example; static page no loading required
- Navigation contract: route `/api-reference` sits inside console shell, appears in sidebar/mobile navigation for users with `system:api_key:view`

Prototype requirements:
- Low- to mid-fidelity wireframe.
- Show clear page regions:
  1. Header/hero with endpoint and status badges.
  2. Quick start steps.
  3. Endpoint card and auth methods.
  4. Request/response schema tables.
  5. Curl and TypeScript code samples.
  6. API Key management endpoint list.
  7. Security validation chain.
  8. Error code table and troubleshooting notes.
- Component boundaries should map to `Card`, `Button`, `StatusBadge`, `MetricCard`, code blocks and simple tables.

Avoid:
- unsupported streaming endpoint
- invented API fields
- decorative rendering over documentation clarity
