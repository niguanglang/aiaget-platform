# Project UI Brief

- Page: 监控中心的工作流后端卡片
- Route: `/monitor`
- Feature goal: 在已有监控页中展示可恢复的 Runtime workflow 失败项，并支持知识库任务、渠道自动推进、渠道发布自愈三类任务恢复重试。
- Target users and permissions: 监控/运维人员；状态接口需要 `monitor:log:view`，重试接口继续走已有 Runtime workflow retry 权限入口。
- APIs/services: `GET /runtime/workflows/status` 返回 `RuntimeWorkflowStatusOverview`；`POST /runtime/workflows/retry` 接收 `{ task_type: RuntimeWorkflowTaskType, task_id: string }`。
- Entities/fields/statuses: `RuntimeWorkflowRecoverableTaskItem.task_type` 支持 `knowledge_task`、`channel_release_automation`、`channel_release_self_healing`；核心字段为 `task_id`、`workflow_task_type`、`status`、`title`、`knowledge_base_id`、`document_id`、`channel_id`、`error_message`、`updated_at`。
- Existing components/design system: Next.js App Router 页面下的 `apps/web/src/components/monitor/monitor-content.tsx`；使用 React Query、Tailwind、shadcn 风格 `Card`/`Button`/`EmptyState`/`StatusBadge`，中文文案。
- Required states: loading、empty、failure message、per-task retry disabled/spinning、refresh。
- Constraints: 不新增页面，不改布局框架，只让现有任务卡片按任务类型显示中文标签，并把 retry mutation 传入实际 `task_type`。
