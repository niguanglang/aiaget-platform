# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: M63-15 渠道发布自动推进与观测门禁 at `/channels`
- Users/roles: 租户管理员、渠道管理员、审计员
- Main task flow: select a channel, view current release batch, inspect gate decision, adjust thresholds, run manual evaluation, then decide whether to mark full rollout in the release pipeline.
- API contract:
  - getChannelReleaseGate(channelId)
  - updateChannelReleaseGate(channelId, input)
  - evaluateChannelReleaseGate(channelId)
- Data fields:
  - enabled, min_evaluated_count, min_allowed_rate, max_blocked_count, auto_promote_enabled, observation_window_hours
  - decision, reason, eligible_for_full_release, metrics, evaluated_at
- States:
  - loading, empty/no batch, error, disabled/read-only, success

Prototype requirements:
- Show component regions:
  - Header: M63-15 badge, decision badge, refresh/evaluate buttons
  - Metrics row
  - Policy threshold form
  - Evaluation detail and reason
  - Recent event/trace summary
- Keep layout consistent with current channel dashboard panels.
- Use Chinese labels and realistic operator wording.

Avoid:
- unrelated release automation
- unsupported actions such as actually auto-clicking full release without user confirmation
