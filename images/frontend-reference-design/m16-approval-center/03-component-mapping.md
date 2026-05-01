# Component Mapping

Reference images are not committed yet for M16. This implementation follows the project prompt pack and the existing console shell.

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Console shell | `ConsoleShell`, `Sidebar`, `Topbar` | existing auth session and navigation | Adds approval center as a first-class console module. |
| Approval page shell | `apps/web/src/components/approvals/approval-content.tsx` | `getToolApprovalOverview`, `listToolApprovals`, `getToolApproval` | Main page orchestrates filters, selection state, metrics, and actions. |
| Metric strip | `MetricCard` | `ToolApprovalOverview` | Shows pending/approved/rejected/runtime/test counts. |
| Queue table | `approval-content.tsx` table region | `ToolApprovalListItem[]` | Dense operational queue with status and execution badges. |
| Detail panel | `ApprovalDetailPanel` in `approval-content.tsx` | `ToolApprovalDetail` | Review workspace for context, payloads, decision note, and actions. |
| Action buttons | `Button`, approve/reject mutations | `approveToolApproval`, `rejectToolApproval` | Only enabled for pending requests and users with write permission. |
| Context links | `Link` buttons in detail panel and existing tool/conversation pages | `/tools/[id]`, `/conversations/[id]` | Keeps approval flow connected to the existing operational modules. |
