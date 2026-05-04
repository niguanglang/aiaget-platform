# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the enterprise AI Agent Platform approval audit archive center.

Project context:
- Product/module: 企业 AI Agent 平台，审批审计归档与下载中心
- Page/route: `/approval-audits`
- Target users/roles: 安全管理员、审计员、租户管理员
- Business goal: generate approval audit CSV archives into MinIO, list archived files, download signed links, delete obsolete archives, and keep the workflow connected to audit governance.
- Frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-like local components, TanStack Query, Motion.
- Existing page shell/layout: console dashboard page with metrics, rankings, filter toolbar, table, detail side panel.

Interface contract that must appear in the UI:
- Existing approval audit metrics: 审计事件、成功事件、失败事件、告警事件、Trace 覆盖.
- Existing filters: keyword, window, source type, event type, event status, trace-only.
- New archive controls: `生成归档`, `刷新归档`, `下载`, `删除`.
- Archive panel fields: 文件名、大小、更新时间、归档范围、筛选摘要、对象路径.
- Archive states: no archive empty state, loading state, creation success, creation failure, delete confirmation.
- Detail panel remains: event metadata, open approval, view Trace.

Design requirements:
- Chinese UI labels only.
- Enterprise SaaS dashboard style, clean and operational.
- Use subtle borders, soft shadows, backdrop blur, restrained product polish.
- The archive panel should feel like a real compliance/audit feature, not a generic file list.
- Keep layout dense but readable: the archive list can live under metrics or next to source rankings as a Bento card.

Avoid:
- overdone gradients, fake glowing, emoji, decorative clutter, unrelated fields, marketing hero layout.
