# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the Runtime 工作流 page at `/runtime/workflows`.

Project context:
- Users/roles: 运维人员、租户管理员、监控审计人员
- Main task flow: 打开 Runtime 工作流 -> 查看后端状态 -> 看到“最近派发失败” -> 点击事件/Trace/请求深链进入监控中心 -> 返回后按需恢复重试可恢复任务。
- API/service contract: `GET /api/v1/runtime/workflows/status` returns `RuntimeWorkflowStatusOverview.latest_failure` with optional `failure_event_id`, `failure_trace_id`, `failure_request_id`.
- Data entities and fields: backend status, workflow mode, workflow backend, latest failure error message, occurred time, event id, trace id, request id, recoverable tasks.
- Actions and states: 刷新工作流、查看最近失败事件、查看最近失败 Trace、查看最近失败请求、恢复重试、加载中、暂无恢复项、部分深链缺失。

Prototype requirements:
- Use mid-fidelity wireframe style with clear section boundaries.
- Top region: page title and refresh action.
- Main card: status badge row, latest failure alert area, then recoverable task queue.
- Latest failure alert must include three conditional link slots and mark them as outgoing routes to `/monitor/events/:id`, `/monitor/traces/:id`, and `/monitor?requestId=...`.
- Show a partial-data state where only event link and request link exist.
- Keep detail pages outside the workflow page; represent them as deep-link destinations only.

Avoid:
- full monitor detail panel embedded in the workflow page
- unrelated settings or workflow editing forms
- fake backend fields beyond the listed contract
