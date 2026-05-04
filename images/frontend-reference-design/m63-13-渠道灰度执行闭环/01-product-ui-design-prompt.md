# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise SaaS admin page.

Project context:
- Product/module: 企业 Agent 平台，全渠道发布中心
- Page/route: M63-13 渠道灰度执行闭环 at `/channels`
- Target users/roles: 租户管理员、渠道管理员、审计员
- Business goal: Show whether each published channel is actually enforcing rollout percentage, and expose 24h gate decisions, allow/block rate, and the latest rollout decision.
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui style primitives. Existing components include Card, Button, Input, MetricCard, StatusBadge, EmptyState.
- Existing page shell/layout: Console layout with left navigation and a dense dashboard content area. The `/channels` page already contains channel list, detail panel, sender delivery center, publish approval and rollout control.

Interface contract that must appear in the UI:
- API/service functions: getPublishChannelOverview(), getChannelPublishControl(channelId), getChannelRolloutGateOverview(channelId)
- Main entities and fields:
  - ChannelPublishControl: approval_status, rollout_enabled, rollout_percentage, rollout_status, updated_at
  - ChannelRolloutGateOverview: status, rollout_percentage, evaluated_count_24h, allowed_count_24h, blocked_count_24h, bypass_count_24h, allowed_rate_24h, last_decision
  - ChannelRolloutGateDecision: allowed, reason, bucket, rollout_percentage, source, evaluated_at
- Status values/enums:
  - rollout_status: CLOSED, GRAY, FULL
  - gate status: CLOSED, GRAY, FULL, BLOCKING
  - decision reasons: rollout_closed, rollout_full, rollout_bucket_allowed, rollout_bucket_blocked, approval_pending, channel_unavailable
- User actions: refresh gate overview, inspect latest decision, compare configured percentage vs actual allow rate
- Required states: loading, empty, error, disabled/permission read-only, success after refresh

Design requirements:
- Add a polished "灰度执行闭环" panel under the existing publish approval and rollout control area.
- Use a Bento/dashboard layout: four metric cards at top, a compact decision details panel, and a right-side execution health panel.
- Use Chinese UI labels only.
- Show realistic values such as "灰度中", "30%", "24h 放行 1,248", "拦截 312", "放行率 79.9%".
- Use subtle borders, soft shadow, backdrop blur, and restrained blue/emerald/amber/red status accents.
- Include a progress bar comparing configured rollout percentage and measured allow rate.
- Make the panel look like an operational product surface, not a marketing page.

Avoid:
- invented modules outside channel rollout
- heavy decorative gradients, cheap glow, emojis, oversized rounded blobs
- unreadable tiny text or unrelated charts
