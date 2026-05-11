# Product UI Design Image Prompt

```text
Create a high-fidelity product UI design image for a real admin page.

Project context:
- Product/module: 企业 AI Agent 平台 / 监控中心 / Runtime 工作流
- Page/route: Runtime 工作流 at /runtime/workflows
- Target users/roles: 平台运维、安全审计、知识库管理员、渠道发布管理员、多 Agent 管理员、插件管理员。
- Business goal: 在 Runtime 工作流恢复队列中展示 Workflow ID 与 Workflow Run ID，让用户能从监控中心定位失败的 Temporal / Runtime 任务并执行恢复重试。
- Existing frontend stack/design system: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui-like Card/Button/Badge primitives.
- Existing page shell/layout: MonitorCenterBackground, header with back button, WorkflowBackendCard with backend status, latest failure, recoverable task cards.

Interface contract that must appear in the UI:
- API/service functions: GET /runtime/workflows/status, POST /runtime/workflows/retry
- Main entities and fields:
  - RuntimeWorkflowStatusOverview: workflow_mode, workflow_backend, backend_status, latest_failure, recoverable_tasks
  - RuntimeWorkflowRecoverableTaskItem: task_type, task_id, workflow_task_type, status, title, workflow_id, workflow_run_id, run_id, channel_id, plugin_id, error_message, updated_at
- Status values/enums: READY, DISPATCH_FAILED, LOCAL, LOCAL_FALLBACK, TEMPORAL, knowledge_task, agent_team_run, channel_release_automation, channel_release_self_healing, plugin_rollback, plugin_hook_execution.
- User actions: refresh workflow status, recover/retry a workflow task with confirmation.
- Required states: loading, empty, error, disabled retry when permission is missing, missing workflow IDs shown as “-”.

Design requirements:
- Use Chinese text only.
- Keep the page as an operational recovery console, not a log viewer.
- Show a compact backend status header, a latest failure alert, and a recoverable task list.
- Each recoverable task row/card should include title, task type badge, task ID, Workflow ID, Workflow Run ID, related resource ID, updated time, and a “恢复重试” button.
- Use restrained enterprise SaaS styling with subtle borders, soft shadows, and clear information hierarchy.
- Do not add charts or unrelated monitoring modules.

Avoid:
- invented fields not listed above
- full trace detail panels or complete log viewers
- dense table with too many columns on mobile
- excessive gradients or decorative effects
```
