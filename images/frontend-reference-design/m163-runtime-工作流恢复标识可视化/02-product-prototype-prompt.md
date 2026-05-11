# Product Prototype / Wireframe Prompt

```text
Create a product prototype / wireframe image for the Runtime workflow recovery page.

Project context:
- Page/route: Runtime 工作流 at /runtime/workflows
- Users/roles: 平台运维、安全审计、各模块管理员。
- Main task flow: 打开 Runtime 工作流 -> 查看 backend status -> 查看最近失败 -> 在恢复队列中识别 task ID / Workflow ID / Workflow Run ID -> 点击恢复重试 -> 确认弹窗 -> 刷新队列。
- API/service contract: GET /runtime/workflows/status, POST /runtime/workflows/retry.
- Data fields: workflow_mode, workflow_backend, backend_status, latest_failure, task_type, task_id, workflow_task_type, workflow_id, workflow_run_id, run_id, channel_id, plugin_id, error_message, updated_at.
- Actions and states: refresh, retry, confirmation dialog, loading, empty, error, permission-disabled.

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Show clear regions: page header, backend status card, latest failure alert, recoverable task list, retry confirmation dialog.
- In each task item, reserve separate small metadata chips/rows for task ID, Workflow ID, Workflow Run ID and related resource.
- Keep the task list compact and scannable.
- Include placeholders for missing workflow identifiers.
- Use Chinese labels.

Avoid:
- full JSON payloads, complete logs, or trace detail embedded in the recovery list
- invented API actions
- unrelated monitor charts
```
