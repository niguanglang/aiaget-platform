# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: M95 SLA 死信审计归档删除审批 at `/security`
- Users/roles: 安全管理员、租户管理员、审计员
- Main task flow:
  1. User views SLA dead-letter audit archive list.
  2. User requests deletion for a selected archive.
  3. A deletion approval appears in the approval queue.
  4. Reviewer enters a note and approves or rejects.
  5. Approved deletion removes the object from storage and marks the approval applied.
- API/service contract:
  - `DELETE archives/:archiveId`
  - `GET archive-approvals/overview`
  - `GET archive-approvals`
  - `POST archive-approvals/:approvalId/approve`
  - `POST archive-approvals/:approvalId/reject`
- Data entities and fields:
  - id, archive_id, archive_key, archive_file_name, archive_size_bytes, status, reason, requested_by, reviewed_by, requested_at, reviewed_at
- Actions and states:
  - 申请删除、刷新审批、审批意见、批准删除、拒绝、loading、empty、success、error、disabled

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Show archive list row actions including “下载” and “申请删除”.
- Show approval panel with summary metrics and rows grouped by status.
- Make component boundaries clear for Card, Button, Input, MetricCard, StatusBadge, EmptyState.
- Keep layout realistic within the existing `/security` dashboard.

Avoid:
- permanent direct deletion
- complex modal not needed by implementation
- unrelated object storage settings
