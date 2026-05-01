# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: 知识库中心增强 at /knowledge
- Users/roles: 租户管理员、知识库管理员、审计员、Agent 管理员
- Main task flow: 从知识库总览查看健康状态，筛选知识库列表，进入最近文档/任务/召回记录，必要时发起重建索引或检索测试
- API/service contract: `GET /api/v1/knowledge-bases/overview`, `GET /api/v1/knowledge-bases`, `GET /api/v1/knowledge-bases/:id`, `POST /api/v1/knowledge-bases/:id/retrieval-test`
- Data entities and fields: knowledge base summary, document health, processing tasks, recall logs, vector/index readiness, status, visibility, owner
- Actions and states: search, filter, refresh, open detail, upload document, rebuild index, run retrieval test, loading, empty, error, partial data, permission-denied, success

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Focus on information architecture, page regions, user flow, and interaction states.
- Show clear labels for sections, tables, cards, filters, actions, and validation areas.
- Include empty/error/loading/permission state placeholders if relevant.
- Make component boundaries obvious so a frontend engineer can map each region to existing components.
- Keep layout realistic for the current project and route shell.

Avoid:
- polished decorative rendering
- invented backend fields
- unrealistic navigation or actions
