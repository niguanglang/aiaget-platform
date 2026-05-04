# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise AI Agent platform admin console.

Project context:
- Product/module: 企业 Agent 平台 / 全渠道发布中心
- Page/route: M63-18 渠道发布回滚与失败自愈 at `/channels`
- Target users/roles: 租户管理员、发布负责人、渠道管理员、审计员
- Business goal: detect failure after channel full release, recommend rollback, optionally run dry-run or real rollback, and record audit events
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui-like Card/Button/MetricCard/StatusBadge/EmptyState
- Existing page shell/layout: existing channel dashboard, new panel after release automation executor

Interface contract that must appear in the UI:
- API/service functions: `getChannelReleaseSelfHealing`, `updateChannelReleaseSelfHealing`, `runChannelReleaseSelfHealing`
- Main fields: policy enabled, dry_run, auto_rollback_enabled, max_error_requests, min_allowed_rate, observation_window_hours, cooldown_minutes, evaluation decision, rollback recommended, rollback available, metrics, last run, recent events
- Status values: HEALTHY, OBSERVE, ROLLBACK_RECOMMENDED, ROLLED_BACK, SKIPPED, DISABLED, FAILED
- User actions: refresh, save policy, run once
- Required states: loading skeletons, empty last run, error alert, disabled buttons for permissions or cooldown, success notice after save/run

Design requirements:
- Chinese UI text only.
- Use a production SaaS dashboard look: subtle borders, soft shadows, backdrop blur, restrained status colors.
- Layout: four metric cards, left policy card, right evaluation/run detail, bottom recent events feed.
- Emphasize safety: dry-run badge, rollback availability, cooldown, clear reason text.
- Avoid fake fields, decorative charts, cheap glow, emoji, and visual clutter.
