# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: M63-13 渠道灰度执行闭环 at `/channels`
- Users/roles: 租户管理员、渠道管理员、审计员
- Main task flow: user selects a publish channel, checks the configured rollout percentage, sees whether real external channel calls are being allowed or blocked, inspects the latest gate decision, then refreshes the overview.
- API/service contract:
  - getChannelPublishControl(channelId)
  - getChannelRolloutGateOverview(channelId)
- Data entities and fields:
  - rollout_enabled, rollout_percentage, rollout_status
  - evaluated_count_24h, allowed_count_24h, blocked_count_24h, bypass_count_24h, allowed_rate_24h
  - last_decision.allowed, last_decision.reason, last_decision.bucket, last_decision.source, last_decision.evaluated_at
- Actions and states:
  - refresh overview
  - loading skeleton
  - empty state when no channel selected
  - error state when API fails
  - read-only state when lacking channel:publish:view

Prototype requirements:
- Show component boundaries clearly:
  - Header: "M63-13 灰度执行闭环", status badge, refresh button
  - Metrics row: gate status, configured rollout, 24h allowed/blocked, allow rate
  - Left detail: latest decision and deterministic bucket
  - Right detail: progress bar and event source breakdown
  - Footer note: explains external API, stream, continuation and callback all pass through the same gate
- Keep layout consistent with the current `/channels` dashboard sections.
- Use low- to mid-fidelity wireframe style with Chinese labels.
- Make loading, empty, error, disabled states explicit.

Avoid:
- polished decorative rendering
- adding unsupported actions like edit policy, approve release, or create channel
- unrelated navigation or fake data fields
