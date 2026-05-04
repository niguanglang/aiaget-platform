# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: M94 SLA 死信审计归档下载中心 at `/security`
- Users/roles: 安全管理员、租户管理员、审计员
- Main task flow:
  1. User filters SLA dead-letter disposition audit timeline.
  2. User clicks “生成归档” to save current filtered CSV to object storage.
  3. User reviews archive summary and archive list.
  4. User clicks “下载” to open a short-lived download URL.
- API/service contract:
  - `POST /api/v1/security-center/operation-alert-sla/dead-letter-audits/archives`
  - `GET /api/v1/security-center/operation-alert-sla/dead-letter-audits/archives`
  - `GET /api/v1/security-center/operation-alert-sla/dead-letter-audits/archives/:archiveId/download-url`
- Data entities and fields:
  - id, key, file_name, folder, size_bytes, etag, last_modified, download_expires_in
  - summary archive_count, total_size_bytes
- Actions and states:
  - 生成归档、刷新归档、下载、loading、empty、success、error、disabled

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Show clear regions: archive panel header, action buttons, feedback banners, metric column, file list/table.
- Make component boundaries obvious for `Card`, `Button`, `MetricCard`, `StatusBadge`, `EmptyState`.
- Keep it within the existing `/security` dashboard and connected to the M93 audit timeline above.

Avoid:
- delete approval flow
- unrelated storage settings
- invented object metadata fields
