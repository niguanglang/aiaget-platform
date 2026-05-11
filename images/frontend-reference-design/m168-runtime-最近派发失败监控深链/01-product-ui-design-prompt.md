# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: 企业 AI Agent 平台 / 监控中心 / Runtime 工作流
- Page/route: Runtime 工作流 at `/runtime/workflows`
- Target users/roles: 运维人员、租户管理员、监控审计人员；页面读取需要 `monitor:log:view`
- Business goal: 用户在“最近派发失败”摘要中看到派发失败原因后，可以直接跳转到失败事件、Trace 或请求筛选页继续排障。
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui style components, compact enterprise dashboard cards.
- Existing page shell/layout: console layout; Runtime 工作流页包含工作流后端状态卡、最近派发失败摘要、可恢复任务列表和恢复确认弹窗。

Interface contract that must appear in the UI:
- API/service functions: `GET /api/v1/runtime/workflows/status`
- Main entities and fields: `RuntimeWorkflowStatusOverview.workflow_mode`, `workflow_backend`, `backend_status`, `latest_failure`; `RuntimeWorkflowFailureItem.task_type`, `task_id`, `error_message`, `occurred_at`, `failure_event_id`, `failure_trace_id`, `failure_request_id`
- Status values/enums: `READY`, `DISPATCH_FAILED`, local / temporal_first / temporal workflow mode labels
- User actions: 刷新工作流、查看最近失败事件、查看最近失败 Trace、查看最近失败请求、恢复重试
- Required states: loading, empty, partial links, disabled retry, success result after retry, permission-denied handled by the existing page boundary

Design requirements:
- Use a compact Chinese enterprise SaaS dashboard style.
- Show the existing “工作流后端” card with subtle border, soft shadow, clear status badges and restrained spacing.
- The “最近派发失败” block should look like an alert summary, with concise error text, occurred time, and three small outline buttons: “查看最近失败事件”, “查看最近失败 Trace”, “查看最近失败请求”.
- Keep monitor links as outgoing deep links; do not show event payload, full Trace timeline, or log body inside the card.
- Below the alert, show the existing recoverable task list as a separate operational area so the failure summary and retry queue remain visually distinct.
- Use clean hierarchy, stable button sizes, Chinese labels, no decorative overuse.

Avoid:
- fake metrics, unrelated charts, generic observability screenshots
- full raw JSON/log details embedded in the workflow page
- excessive gradients, glow effects, or overloaded table columns
