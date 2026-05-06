# Product UI Design Image Prompt

```text
Create a high-fidelity product UI design image for a real enterprise knowledge base management page.

Product context:
- Product/module: 企业 Agent 平台 / 知识库中心
- Page/route: 知识库管理 at /knowledge
- Target users/roles: 租户管理员、知识库管理员、Agent 管理员、审计员、普通查看用户
- Business goal: 让知识库列表、知识库详情、创建、编辑、文档上传、重建索引、召回测试职责清晰分离
- Existing frontend stack/design system: Next.js App Router + React + TypeScript + Tailwind CSS + shadcn/ui 风格组件 + motion/react
- Existing page shell/layout: console 后台布局，左侧导航 + 顶部栏，内容区为响应式 dashboard/admin layout

Interface contract that must appear in the UI:
- API/service functions: listKnowledgeBases, getKnowledgeOverview, createKnowledgeBase, getKnowledgeBase, updateKnowledgeBase, deleteKnowledgeBase, uploadKnowledgeDocument, getKnowledgeDocument, deleteKnowledgeDocument, reprocessKnowledgeDocument, runKnowledgeRetrievalTest, rebuildKnowledgeIndex, listUsers
- Main entities and fields:
  - 知识库名称、编码、可见范围、状态、负责人、文档数、切片数、失败任务数、召回次数、智能体引用数、更新时间
  - 文档标题、来源类型、文件名、大小、存储路径、状态、切片数、词元数、错误信息、上传人
  - 切片内容、关键词、向量后端、关键词后端、索引状态
  - 任务类型、处理进度、开始/结束时间、错误信息
  - 召回检索问题、检索模式、TopK、结果数、延迟、结果内容
- Status values/enums: ACTIVE, DISABLED, ARCHIVED, PRIVATE, TENANT, PUBLIC, TEXT, MARKDOWN, HTML, FAQ, VECTOR, KEYWORD, HYBRID, PROCESSING, READY, FAILED, RUNNING, SUCCESS
- User actions:
  - 搜索、筛选、清空筛选
  - 新建知识库、打开详情、编辑、删除
  - 上传文档、重新处理文档、重建索引、运行检索测试
  - 查看文档、切片、任务、召回日志、智能体引用
- Required states: loading, empty, error, validation, disabled, success, permission-denied, background-processing

Design requirements:
- Make it look like a production SaaS/admin product, not a generic mockup.
- Use a clear two-level information architecture: list page for overview/table, detail page for full knowledge bundle.
- Show the knowledge base list page as a dense but controlled table with compact metrics and a small toolbar.
- Show the detail page as a richer panel with documents, segments, tasks, recall logs, and retrieval testing.
- Include clear empty states for no knowledge bases, no documents, no segments, and no retrieval results.
- Use a coherent component system: toolbar, filter row, metric cards, data table, detail cards, action buttons, status badges, confirmation dialogs.
- Keep visual language consistent with the current project design system: subtle border, soft shadow, backdrop-blur, restrained gradient mesh, minimal glass effect, Chinese copy.
- Emphasize hierarchy, spacing, alignment, and operational clarity.
- Output should be a product UI design reference image suitable for frontend implementation.

Avoid:
- fake API fields not listed above
- decorative UI that cannot map to project components
- unreadable tiny text, random charts, placeholder lorem ipsum
- putting document/task/recall details into the list page
- mixing create/edit forms into the list page
```
