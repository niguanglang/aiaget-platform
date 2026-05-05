# Product Prototype / Wireframe Prompt

Create a low- to mid-fidelity product prototype / wireframe image for the existing monitor page workflow recovery card.

Project context:
- Page/route: 监控中心 at `/monitor`
- Users/roles: 运维人员、平台管理员、审计员
- Main task flow: view Runtime workflow backend health, inspect latest failure, choose a recoverable failed task, retry it, then refresh data.
- API/service contract: `GET /runtime/workflows/status`; `POST /runtime/workflows/retry` with `{ task_type, task_id }`
- Data entities and fields: `RuntimeWorkflowStatusOverview.latest_failure`, `recoverable_tasks[]`, `RuntimeWorkflowTaskType`
- Actions and states: refresh, retry, loading, empty, failed, pending retry

Prototype requirements:
- Show one existing card region named 工作流后端.
- Top row contains backend status badges and 刷新工作流 button.
- Optional latest failure alert appears below status.
- Recoverable task list contains three item examples: 知识库任务, 渠道自动推进, 渠道发布自愈.
- Each task row shows title, task type badge, error message, task id/channel id metadata, updated time, and 恢复重试 button.
- Empty state says there are no recoverable workflow tasks.
- Component boundaries should map directly to existing `WorkflowBackendCard`, `StatusBadge`, `EmptyState`, and `Button`.

Avoid:
- polished decoration, unrelated navigation changes, new pages, or fields not present in the API.
