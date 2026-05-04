# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise SaaS admin console page.

Project context:
- Product/module: 企业 Agent 平台 / 全渠道发布中心
- Page/route: M63-16 渠道自动推进执行器 at `/channels`
- Target users/roles: 租户管理员、渠道管理员、发布负责人、审计员
- Business goal: 基于观测门禁结论，把当前发布批次安全推进到全量，并保留演练、频率限制、权限和审计边界
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui-like cards/buttons/inputs/status badges
- Existing page shell/layout: dashboard layout, existing channel list and detail page, new bento-style panel inserted after release observation gate

Interface contract that must appear in the UI:
- API/service functions: `getChannelReleaseAutomation`, `updateChannelReleaseAutomation`, `runChannelReleaseAutomation`
- Main entities and fields: policy enabled, require_auto_promote_policy, min_interval_minutes, max_runs_per_day, dry_run, gate decision, current batch, running, last_run, today_run_count, next_allowed_at, recent_events
- Status values/enums: PROMOTED, SKIPPED, BLOCKED, DISABLED, FAILED; MANUAL, SCHEDULED
- User actions: refresh executor, save policy, run once, inspect last run, inspect recent events
- Required states: loading skeleton cards, empty last run, error alert, disabled buttons for missing permissions or interval lock, success notice after save/run

Design requirements:
- Make it look like a production enterprise AI operations console, clean, minimal, technical, high-end.
- Use a Bento Grid / Dashboard layout with four metric cards on top, a policy card on the left, execution status card on the right, and recent event feed below.
- Use subtle borders, soft shadow, backdrop blur, restrained blue/emerald/amber/red status colors.
- Show Chinese UI text only.
- Show the primary workflow clearly: configure executor policy -> observe gate conclusion -> run once -> review last run and audit events.
- Include realistic labels and values: 执行器状态, 门禁结论, 今日执行, 最近结果, 演练模式, 最小执行间隔, 每日上限, 当前批次, 下次允许, 运行 ID.
- Output should be a product UI design reference image suitable for frontend implementation.

Avoid:
- invented backend fields not listed above
- decorative charts unrelated to the executor
- exaggerated gradients, cheap glow, emoji, large rounded blobs, visual clutter
