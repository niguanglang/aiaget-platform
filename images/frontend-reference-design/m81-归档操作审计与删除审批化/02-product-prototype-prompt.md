# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe for archive operation audit and deletion approval.

Routes:
- `/approval-audits`
- `/approvals`

Main task flow:
1. User opens approval audit archive list.
2. User clicks `申请删除` on an archive.
3. The archive remains in storage and a pending delete approval is created.
4. Security admin opens `/approvals`, switches to `归档删除`.
5. Admin reviews archive file, path, request reason and audit timeline.
6. Admin approves or rejects.
7. Approve deletes the object and writes applied audit event; reject keeps the object.

Wireframe requirements:
- Show `/approval-audits` archive card with action state and success/error messages.
- Show `/approvals` top tabs: 工具审批、通知策略、归档删除.
- Show archive deletion queue table.
- Show detail panel with approval timeline and decision note textarea.
- Include loading, empty, error, disabled and success states.

Avoid:
- unrelated storage upload UI, unrelated Agent execution UI, invented fields not present in the contract.
