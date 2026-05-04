# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: Enterprise AI Agent Platform / 全渠道发布中心
- Page/route: M63-11 渠道自动重试任务中心 at `/channels`
- Target users/roles: 租户管理员、渠道管理员、运维人员、审计人员
- Business goal: 展示 Channel Sender 自动重试和投递清理任务状态，让管理员可以确认后台任务是否健康，并手动触发一次自动重试扫描或清理任务
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style cards/buttons/inputs/status badges, lucide icons, React Query
- Existing page shell/layout: `/channels` already has channel overview, sender delivery center, and sender policy panel; add a new operational task panel below them without changing navigation

Interface contract that must appear in the UI:
- API/service functions:
  - `getChannelSenderTaskOverview()`
  - `runChannelSenderAutoRetry()`
  - `runChannelSenderCleanup()`
- Main entities and fields:
  - `generated_at`, `scheduler_enabled`, `running`, `last_tick_at`, `next_tick_after_seconds`
  - summary: `pending_auto_retry_count`, `expired_delivery_count`, `auto_retry_enabled_channel_count`, `failed_delivery_count`, `oldest_failed_at`
  - run result: `task`, `started_at`, `finished_at`, `scanned_count`, `retried_count`, `success_count`, `failed_count`, `skipped_count`, `deleted_count`, `error_message`
- Status values/enums: scheduler enabled/disabled, running/idle, auto_retry, cleanup, success/failure result
- User actions:
  - refresh task overview
  - trigger auto retry once
  - trigger cleanup once
- Required states: loading, empty, error, disabled, success, permission-denied

Design requirements:
- Make it look like a production SaaS/admin product, not a generic dashboard template.
- Use a clean Bento/Dashboard layout inside a single task operations panel.
- Show top metric cards for pending retry, expired records, auto retry channels, failed deliveries.
- Include a compact scheduler status strip with last tick and next tick.
- Include two action cards: one for 自动重试扫描, one for 投递记录清理.
- Include a recent result area showing counts and timestamps.
- Use subtle borders, soft shadows, glass-like white panels, restrained motion-ready spacing.
- All visible text should be Chinese.
- Keep visual language consistent with the current `/channels` page.

Avoid:
- fake fields not listed above
- oversized decorative hero sections
- excessive gradients, glow, emoji, or crowded charts
- unrelated middleware or infrastructure settings
