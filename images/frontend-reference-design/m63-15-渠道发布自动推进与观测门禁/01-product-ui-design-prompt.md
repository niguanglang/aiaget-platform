# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise SaaS admin page.

Project context:
- Product/module: 企业 Agent 平台，全渠道发布中心
- Page/route: M63-15 渠道发布自动推进与观测门禁 at `/channels`
- Target users/roles: 租户管理员、渠道管理员、审计员
- Business goal: Evaluate whether the current channel release batch can be promoted to full rollout based on gray rollout gate metrics.
- Existing stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui style primitives. Components: Card, Button, Input, MetricCard, StatusBadge, EmptyState.

Interface contract:
- API functions:
  - getChannelReleaseGate(channelId)
  - updateChannelReleaseGate(channelId, input)
  - evaluateChannelReleaseGate(channelId)
- Main fields:
  - policy: enabled, min_evaluated_count, min_allowed_rate, max_blocked_count, auto_promote_enabled, observation_window_hours
  - evaluation: decision, reason, eligible_for_full_release, evaluated_at
  - metrics: evaluated_count, allowed_count, blocked_count, bypass_count, allowed_rate
- Status values:
  - PROMOTE_READY, OBSERVE, BLOCKED, DISABLED, NO_BATCH
- Actions:
  - save policy
  - evaluate now
  - inspect metrics and decision reason

Design requirements:
- Add an "观测门禁" panel to the existing `/channels` operations dashboard.
- Use Bento/dashboard layout:
  - top decision cards: 门禁结论, 样本量, 放行率, 拦截数
  - policy card with numeric thresholds and switches
  - evaluation detail card showing current release batch and decision reason
  - recent evaluation event strip
- Use Chinese labels only.
- Use restrained enterprise visuals: subtle border, soft shadow, clear badges, quiet colors.
- Avoid marketing hero layout; this is an operational admin surface.

Avoid:
- invented unrelated data
- heavy gradients, emojis, cheap glow
- unreadable tiny text or fake charts
