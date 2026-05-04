# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for an approval audit archive feature.

Project context:
- Route: `/approval-audits`
- Users: 安全管理员、审计员、租户管理员
- Main task flow: filter approval audit events -> generate archive -> archive appears in list -> download signed URL -> optionally delete old archive.
- API contract:
  - Existing list/overview/detail/export endpoints
  - New archive endpoints: create archive, list archives, get download URL, delete archive
- Entities:
  - `ApprovalAuditEventItem`
  - `ApprovalAuditOverview`
  - `ApprovalAuditArchiveItem`

Prototype requirements:
- Show existing approval audit top area with metrics and filter toolbar.
- Add an archive card/section titled `审计归档`.
- Show archive action bar with `生成归档`, `刷新归档`.
- Show table/list with file name, size, updated time, filter summary, actions download/delete.
- Show empty, loading, success, failure and delete confirmation placeholders.
- Keep component boundaries explicit for a frontend engineer.

Avoid:
- unrelated storage settings UI, unrelated object upload UI, fake unsupported metadata fields.
