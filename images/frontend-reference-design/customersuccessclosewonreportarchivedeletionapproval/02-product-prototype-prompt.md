# Product Prototype / Wireframe Prompt

Paste the low/mid-fidelity prototype prompt here.
Create a product prototype / wireframe image for the成交复盘报告归档删除审批 flow.

Context:
- Report page: `/customer-success-opportunities/[id]/close-won-report`
- Approval page: `/approvals/archive-deletions`
- Users: customer success manager, security approver

Flow:
1. User views report archive list.
2. User clicks row-level “申请删除”.
3. A confirmation state asks user to confirm high-risk archive deletion request.
4. Backend creates an approval item; object remains in storage.
5. Security approver opens归档删除审批 page, filters source “客户成功复盘”.
6. Approver views file path, applicant, reason, status, and context links.
7. Approver approves or rejects; approve applies object deletion, reject keeps file.

Wireframe requirements:
- Report page archive card:
  - Header summary
  - Archive rows with Download + Request Delete
  - Error/success text area
  - Empty/loading states
- Approval page:
  - Source filter includes customer success
  - Queue table includes source, file, status, applicant, object path
  - Detail panel includes decision note and approve/reject buttons
  - Context links include成交复盘报告 and文件存储

Avoid:
- approvals embedded in report page
- edit/close-won/follow-up forms
- deleting immediately from the UI
