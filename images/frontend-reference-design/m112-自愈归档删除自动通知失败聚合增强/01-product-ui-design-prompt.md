# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise AI Agent platform security center page.

Project context:
- Product/module: 企业 AIAgent 平台 / 安全中心 / 通知任务失败聚合
- Page/route: M112 自愈归档删除自动通知失败聚合增强 at `/security`
- Target users/roles: 安全管理员、租户管理员、审计员
- Business goal: distinguish whether notification task failures are mainly from SLA dead-letter archive delete notifications or self-healing archive delete notifications.
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style cards/buttons/status badges.
- Existing page shell/layout: Reuse existing `/security` approval/archive operations card and notification task failure section.

Interface contract that must appear in the UI:
- New overview fields:
  - `notification_task_sla_dead_letter_failed_24h`
  - `notification_task_recovery_archive_delete_failed_24h`
- Existing fields: notification_task_runs_24h, failed, skipped, failure_rate, consecutive_failures, notification_task_recovery_suggestions.
- User actions: view task history, view delivery audit, open settings, acknowledge/ignore/resolve recovery suggestions.
- Required states: loading, no risk, SLA-only failure, self-healing-only failure, both failing, suggestions empty.

Design requirements:
- Keep a dense enterprise dashboard style.
- Add compact metrics for “SLA 失败来源” and “自愈失败来源” in the notification task failure aggregation section.
- Self-healing suggestions should include evidence text that names the dominant failure source.
- Use Chinese UI text only.
- Keep visual hierarchy clear without adding charts.

Avoid:
- separate route
- new task scheduler settings
- unsupported root-cause fields
- decorative or marketing UI
