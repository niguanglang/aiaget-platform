# Product Prototype / Wireframe Prompt

```text
Create a low- to mid-fidelity product prototype / wireframe for the same enterprise knowledge base management page.

Project context:
- Page/routes: 知识库管理 at /knowledge, /knowledge/activity, /knowledge/health, /knowledge/[id], /knowledge/[id]/documents, /knowledge/[id]/upload, /knowledge/[id]/retrieval
- Users/roles: 租户管理员、知识库管理员、Agent 管理员、审计员、普通查看用户
- Main task flow:
  1. 在列表页搜索和筛选知识库
  2. 从列表页进入处理活动或能力健康查看活动流和后端能力状态
  3. 打开知识库详情查看基础信息、指标、智能体引用和操作入口
  4. 从详情页进入文档管理、上传文档、检索测试、编辑
  5. 在独立创建页完成新建知识库
  6. 在独立编辑页修改基础信息
- API/service contract: listKnowledgeBases, getKnowledgeOverview, createKnowledgeBase, getKnowledgeBase, updateKnowledgeBase, deleteKnowledgeBase, uploadKnowledgeDocument, getKnowledgeDocument, deleteKnowledgeDocument, reprocessKnowledgeDocument, runKnowledgeRetrievalTest, rebuildKnowledgeIndex, listUsers
- Data entities and fields:
  - knowledge base list fields: name, code, visibility, status, owner, document_count, segment_count, failed_task_count, recall_count, agent_reference_count, updated_at
  - detail fields: documents, segments, tasks, recall_logs, agent_references
  - document fields: title, source_type, file_name, file_size, storage_path, status, segment_count, token_count, error_message
  - retrieval test fields: query, mode, top_k, results, latency_ms
- Actions and states:
  - list/search/filter/clear filters
  - create/edit/delete
  - open detail
  - upload document
  - reprocess document
  - rebuild index
  - run retrieval test
  - loading, empty, error, validation, disabled, success, permission-denied, background-processing

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Focus on information architecture, page regions, user flow, and interaction states.
- Show the list page as a toolbar + filter strip + table + row actions.
- Show the activity page as recent documents, recent tasks, and recent recall log timelines.
- Show the health page as MinIO/Qdrant/OpenSearch/vector fallback/backend task capability cards.
- Show the base detail page as a main content area with base info, metrics, agent references, and entry cards only.
- Show the document management page as document list + selected document preview + segments + processing tasks.
- Show the upload page as a standalone form page.
- Show the retrieval page as retrieval form + result panel + recall logs.
- Show create and edit as separate pages or full-page forms, not as embedded list content.
- Make component boundaries obvious so a frontend engineer can map each region to existing components.
- Keep layout realistic for the current project and route shell.

Avoid:
- polished decorative rendering
- invented backend fields
- unrealistic navigation or actions
- placing many detail sections inside the list page
- placing activity logs or backend implementation status inside the list page
- placing document table, upload form or retrieval form inside the base detail summary page
```
