# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the AIAget enterprise Agent platform knowledge module.

Project context:
- Product/module: AIAget 平台，知识库中心
- Page/route: `/knowledge` list/detail split view and `/knowledge/:id` full detail page
- Target users/roles: 租户管理员、知识库管理员、只读审计/查看用户
- Business goal: show that document upload, reprocess, and rebuild-index actions are queued as background jobs while users can keep working and see progress.
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style components, lucide icons, subtle borders, soft shadows, restrained SaaS dashboard style.
- Existing page shell/layout: left console sidebar, top search/status bar, content cards with bento/dashboard layout.

Interface contract that must appear:
- Services: `uploadKnowledgeDocument`, `reprocessKnowledgeDocument`, `rebuildKnowledgeIndex`, `getKnowledgeBase`, `getKnowledgeDocument`
- Data fields: document title, source type, document status, task type, task status, processed/total items, task time, error message, vector backend Qdrant, keyword backend OpenSearch
- Status values: `PENDING`, `RUNNING`, `SUCCESS`, `FAILED`, `PROCESSING`, `READY`
- User actions: 上传文档, 重新处理, 重建索引, 运行检索测试, 查看文档详情
- Required states: active background task refresh, queued task, running task, completed task, failed task, permission-disabled buttons

Design requirements:
- Production enterprise SaaS console, Chinese UI text.
- Keep the current knowledge cards, document table, detail preview, segment card, task list, and retrieval test panel.
- Add subtle background-job affordance: a compact active task indicator, task rows with status badges and processed/total counts, and disabled action feedback.
- Use restrained motion language only conceptually; no decorative overload.
- Keep layout dense but breathable, with fine borders, soft shadows, backdrop blur, and clear hierarchy.

Avoid:
- invented task fields that do not exist in the API
- large marketing hero sections
- excessive gradients, glow, emoji, or unrelated charts
