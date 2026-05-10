# Product Prototype / Wireframe Prompt

Create a low/mid-fidelity product prototype wireframe for the same real frontend page.

Project context:
- Page/route: M150 通知归档字段账本上下文 at `/security/archives`
- Users/roles: 安全管理员、租户管理员、审计员
- Main task flow: enter 归档治理 -> choose 告警通知归档 -> inspect archive file row -> see filter context chips plus field ledger summary -> request deletion -> inspect deletion approval row with the same summary
- API/service contract: `listSecurityOperationAlertNotificationArchives`, `listSecurityOperationAlertNotificationArchiveApprovals`, download URL service, delete request service
- Data entities and fields: archive file identity, object key, folder, size, last modified, notification filter source/status/keyword, `has_export_field_ledger`, exported field count, notification archive filter field count, approval requester/reviewer/status/timestamps
- Actions and states: refresh, source switch, download, request delete, permission-denied, loading rows, empty state, error banner, success notice, confirmation dialog

Prototype requirements:
- Show component boundaries: header, source switch cards, metric cards, archive table, deletion approval list, confirm dialog.
- Mark "字段账本摘要" as a compact chip group, not an expanded details panel.
- Show table columns limited to 文件、目录、大小、更新时间、操作.
- Show deletion approval row preserving the same compact field ledger context.
- Include annotation that full field details live in CSV/security event detail, not this list.

Avoid:
- polished decorative rendering, invented backend fields, nested details inside every table row, or placing approval permission assignment on this page.
