Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: 设置中心 at `/settings`
- Users/roles: 租户管理员、运维管理员、API Key 管理人员
- Main task flow: enter settings -> review external endpoint -> configure API Key name, expiry, scope, Agent whitelist, IP allowlist, minute limit, daily quota, stream permission -> create key -> show plaintext once -> list key usage and delete when needed
- API/service contract: `GET /api-keys`, `POST /api-keys`, `DELETE /api-keys/:id`, `GET /agents?status=PUBLISHED`, external endpoint `/external/agents/{agentId}/chat`
- Data entities and fields: name, masked_key, status, scopes, allowed_agent_ids, ip_allowlist, rate_limit_per_minute, daily_quota, used_count_today, allow_stream, expires_at, last_used_at
- Actions and states: create, copy endpoint, delete, loading, empty, validation error, API error, success with one-time plaintext, permission disabled state

Prototype requirements:
- Use low- to mid-fidelity enterprise admin wireframe style.
- Focus on information architecture, page regions, user flow, and interaction states.
- Show clear labels for sections: external endpoint, create key form, security constraints, issued keys list, one-time secret success state.
- Include empty/error/loading/permission state placeholders.
- Make component boundaries obvious so a frontend engineer can map each region to existing components.
- Keep layout realistic for the current settings route shell and responsive card layout.

Avoid:
- polished decorative rendering
- invented backend fields
- unrealistic navigation or actions
