# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for a real enterprise admin page.

Project context:
- Page/route: M63-4 全渠道发布中心 at `/channels`
- Users/roles: 租户管理员、Agent 管理员、发布运维人员、安全审计人员
- Main task flow: 查看发布概览 -> 搜索/筛选渠道 -> 选择渠道查看详情 -> 新建或编辑渠道 -> 启用/停用 -> 执行健康检查 -> 查看最近事件与 24h 用量
- API/service contract: `GET /channels/overview`, `POST /channels`, `PATCH /channels/:id`, `POST /channels/:id/enable`, `POST /channels/:id/disable`, `POST /channels/:id/check`, plus `GET /agents?status=PUBLISHED` for Agent options
- Data entities and fields: channel type/name/status/health, agent summary, endpoint URL, callback URL, masked secret, config JSON, request count, success rate, last request, last published, last checked, recent event summary
- Actions and states: refresh, create, edit, enable, disable, health check, form validation, loading skeleton, empty state, API error, no permission state, disabled button state

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Layout should match a Next.js console page with left navigation already provided by shell.
- Page regions:
  1. Header command bar: title, generated time, permissions/state chips, refresh, create
  2. Summary Bento grid: total channels, active, error, 24h requests, success rate, active agents
  3. Filter toolbar: keyword, status, channel type, health status
  4. Main split: channel list/table on the left, detail inspector on the right
  5. Form panel/drawer: Agent select, channel type, name, description, endpoint, callback, secret, JSON config, status, validation message, save/cancel
  6. Bottom/right supporting panels: channel mix and recent events
- Make component boundaries obvious and label each region in Chinese.
- Include placeholder boxes for loading, empty, error, and permission-denied states.
- Keep density suitable for repeated operations; no landing-page hero.

Avoid:
- polished decorative rendering
- invented backend fields
- unrealistic navigation, unrelated analytics, or unsupported actions
