# Product Prototype / Wireframe Prompt

Create a low- to mid-fidelity wireframe for the Runtime 工作流 page at `/runtime/workflows`.

Main task flow:
1. User opens Runtime 工作流 page.
2. Page loads backend status and recoverable failed workflow tasks.
3. User selects “恢复重试” on one task.
4. Confirmation dialog explains side-effect risk and asks user to confirm.
5. After success, a “最近重试结果” card appears with `workflow_backend`, `workflow_id`, and `workflow_run_id`.
6. The status query refreshes so stale recoverable tasks can disappear.

Wireframe regions:
- Header: badges, page title, short description, back-to-monitor button.
- Workflow backend card: backend status badges, refresh button, latest failure block, recoverable task list.
- Retry confirmation overlay: task id, warning copy, cancel and confirm buttons.
- Retry result card: task, backend, Workflow ID, Workflow Run ID.

Constraints:
- Do not place full logs, traces, or timeline details on this page.
- Use compact operational admin layout, not a marketing page.
- All user-facing copy should be Chinese.
