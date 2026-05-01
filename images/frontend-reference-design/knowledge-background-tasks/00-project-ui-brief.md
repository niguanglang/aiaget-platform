# Project UI Brief

- Page: Knowledge Background Tasks
- Route: `/knowledge` and `/knowledge/:id`
- Feature goal: 文档上传、重新处理、重建索引改为后台任务后，页面能展示 `PENDING/RUNNING/SUCCESS/FAILED` 任务状态，并在任务运行期间轻量刷新详情，为后续 Temporal 执行器迁移保留用户感知一致性。
- Target users and permissions: 租户管理员和具备 `knowledge.write` 权限的用户可以上传、重新处理、重建索引；具备 `knowledge.read` 权限的用户可查看状态。
- APIs/services: `uploadKnowledgeDocument`, `reprocessKnowledgeDocument`, `rebuildKnowledgeIndex`, `getKnowledgeBase`, `getKnowledgeDocument`, `listKnowledgeBases` from `apps/web/src/lib/api-client.ts`.
- Entities/fields/statuses: `KnowledgeBaseDetail.tasks`, `KnowledgeDocumentListItem.status`, `KnowledgeTaskItem.task_type`, `KnowledgeTaskItem.status`, `processed_items`, `total_items`, `started_at`, `ended_at`, `error_message`; statuses include `PENDING`, `RUNNING`, `SUCCESS`, `FAILED`, `PROCESSING`, `READY`.
- Existing components/design system: Next.js App Router, React Query, Tailwind CSS, shadcn-style `Button`, `Card`, `Input`, modal panels, `StatusBadge`, knowledge status label helpers, existing sidebar/topbar console shell.
- Required states: loading, empty task list, failed task error text, disabled actions while mutations are pending, permission-disabled write actions, success/completed task rows, automatic refresh only while work is active.
