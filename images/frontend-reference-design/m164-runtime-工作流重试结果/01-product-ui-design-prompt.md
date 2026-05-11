# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the Runtime 工作流 page at `/runtime/workflows`.

Project context:
- Product/module: 企业 AI Agent 平台 / 监控中心 / Runtime 工作流
- Target users/roles: 租户管理员、知识库管理员、渠道发布管理员、多 Agent 团队管理员、插件管理员、审计员
- Business goal: 运维人员在恢复失败工作流后，立即看到新派发的工作流后端、Workflow ID 和 Workflow Run ID，便于继续追踪 Temporal 或本地降级实例。
- Existing stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style Card/Button/StatusBadge.
- Existing page shell/layout: 控制台内容区，最大宽度容器，顶部标题和返回按钮，下方状态卡片与结果卡片。

Interface contract that must appear:
- API/service functions: `GET /runtime/workflows/status`, `POST /runtime/workflows/retry`.
- Main entities and fields: `RuntimeWorkflowStatusOverview.workflow_backend`, `backend_status`, `recoverable_tasks`; `RuntimeWorkflowRecoverableTaskItem.task_type`, `task_id`, `workflow_id`, `workflow_run_id`; `RuntimeWorkflowRetryResult.workflow_backend`, `workflow_id`, `workflow_run_id`, `message`.
- User actions: 刷新工作流、恢复重试、确认重试、取消。
- Required states: 加载、空状态、错误、重试中禁用、无权限禁用、重试成功。

Design requirements:
- Use a production SaaS/admin visual language with compact cards, subtle borders, soft shadows, and clear information hierarchy.
- The success state should be a restrained “最近重试结果” card below the workflow backend card, showing task, workflow backend, Workflow ID, Workflow Run ID.
- Keep the recoverable task list focused; do not add full trace detail or logs to this page.
- All visible text must be Chinese except technical field names Workflow ID / Workflow Run ID.

Avoid:
- invented workflow fields
- large charts or decorative hero sections
- exaggerated gradients, glowing effects, emoji, or overloaded tables
