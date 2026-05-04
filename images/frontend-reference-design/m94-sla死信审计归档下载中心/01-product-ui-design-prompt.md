# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise AI Agent platform security center page.

Project context:
- Product/module: 企业 AI Agent 平台 / 安全中心
- Page/route: M94 SLA 死信审计归档下载中心 at `/security`
- Target users/roles: 安全管理员、租户管理员、审计员
- Business goal: save filtered SLA dead-letter disposition audit CSV files into object storage and provide an operational download center
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style `Card`, `Button`, `MetricCard`, `StatusBadge`, `EmptyState`
- Existing page shell/layout: enterprise admin dashboard with compact operational cards and table-like archive lists

Interface contract that must appear in the UI:
- API/service functions:
  - `createSecurityOperationAlertSlaDeadLetterAuditArchive`
  - `listSecurityOperationAlertSlaDeadLetterAuditArchives`
  - `getSecurityOperationAlertSlaDeadLetterAuditArchiveDownloadUrl`
- Main entities and fields:
  - archive id, key, file_name, folder, size_bytes, etag, last_modified, download_expires_in
  - summary archive_count and total_size_bytes
- User actions:
  - 生成归档、刷新归档、下载归档
- Required states:
  - loading, empty, creating archive, downloading, success message, error message, disabled buttons

Design requirements:
- Render a production-grade archive panel directly under the SLA dead-letter audit timeline.
- Header includes badges “M94” and “MinIO 归档”, Chinese title, concise description, and action buttons.
- Body uses a two-column dashboard layout: left summary metrics, right archive file table/list.
- Use subtle borders, soft shadow, clean spacing, and Chinese labels.
- Keep it operational and dense; no landing page or decorative hero.

Avoid:
- invented delete workflow or approval workflow for this milestone
- unrelated charts
- excessive gradients, emoji, strong glow, oversized rounded cards
