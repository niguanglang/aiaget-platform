# Product Prototype / Wireframe Prompt

Create a low- to mid-fidelity product prototype / wireframe for the real frontend page `/channels`.

Project context:
- Page/route: 全渠道发布中心 at `/channels`
- Users/roles: 租户管理员、渠道发布管理员、安全审计人员
- Main task flow: 管理员进入渠道中心 -> 筛选/搜索渠道 -> 选择企业 IM 或 Webhook 渠道 -> 查看统一平台回调地址 -> 检查渠道健康 -> 编辑渠道配置或启停渠道。
- API/service contract: `GET /channels/overview`, `POST /channels`, `PATCH /channels/:channelId`, `POST /channels/:channelId/enable|disable|check`, `POST /external/channels/:channelId/callback`, `GET /external/channels/:channelId/callback`.
- Data entities and fields: channel summary metrics, channel list item, selected channel detail, platform callback URL, call/stream endpoint, status/health badges, masked secret, config JSON, recent events.
- Actions and states: refresh, create, edit, enable, disable, health check, loading, empty, error, validation, disabled by permission, success notice.

Prototype requirements:
- Use a clear admin dashboard wireframe, not decorative rendering.
- Show the page divided into:
  - top title/toolbar and badges
  - metrics strip
  - left channel list with search and filters
  - right selected-channel detail
  - compact "企业 IM 回调适配" section inside the detail panel
  - channel type distribution and recent events below/right
- The callback adapter section must show:
  - supported/unsupported state
  - platform callback URL
  - signature/secret state
  - inbound message -> Agent response flow label
- Keep component boundaries obvious and map them to existing `Card`, `Button`, `Input`, `StatusBadge`, `EmptyState`, and existing detail rows.
- Use Chinese labels.

Avoid:
- invented backend fields
- unrelated charts
- complex onboarding instructions
- unrealistic navigation changes
