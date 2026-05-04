# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise AI Agent platform security center page.

Project context:
- Product/module: 企业 AIAgent 平台 / 安全中心 / 通知任务自愈闭环审计
- Page/route: M113 自愈建议处理闭环失败来源分类 at `/security`
- Target users/roles: 安全管理员、租户管理员、审计员
- Business goal: when a recovery suggestion is acknowledged, ignored, or resolved, the audit trail must preserve whether the failure came from SLA dead-letter archive delete notifications, self-healing archive delete notifications, both, or legacy unknown source.
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style cards/buttons/status badges.
- Existing page shell/layout: Reuse existing `/security` approval/archive operations card and notification task center.

Interface contract that must appear in the UI:
- Suggestion cards show `failure_source`, `sla_dead_letter_failed_count`, and `recovery_archive_delete_failed_count` near existing risk/reason/status badges.
- Audit metrics show total lifecycle records plus source split: SLA source, self-healing source, mixed, unknown.
- Audit filters include action, status, reason, failure source, and keyword.
- Audit table rows show failure source badges and source counts, plus request_id / trace_id links.

Design requirements:
- Chinese UI text only.
- Dense enterprise dashboard layout with clear hierarchy.
- Use compact badges, subtle borders, soft shadows, restrained glass-like background.
- Keep the page operational and data-heavy, not decorative.
- Keep animations subtle if shown, no exaggerated glow.

Avoid:
- new routes
- new database screens
- marketing hero layout
- unsupported charts
- decorative orb-heavy visuals
