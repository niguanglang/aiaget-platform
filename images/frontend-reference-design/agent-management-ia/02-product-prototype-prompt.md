# Product Prototype / Wireframe Prompt

Create a mid-fidelity product prototype / wireframe image for the Agent 管理 module.

Project context:
- Routes: `/agents`, `/agents/create`, `/agents/[id]`, `/agents/[id]/edit`
- Users/roles: 租户管理员、Agent 管理员、只读查看用户
- Main task flow: 从列表筛选 Agent -> 查看详情 -> 编辑配置，或从列表新建 Agent
- API/service contract: `listAgents`, `listAgentCategories`, `listUsers`, `createAgent`, `getAgent`, `updateAgent`, `deleteAgent`
- Data entities and fields: Agent 名称、编码、描述、状态、分类、负责人、温度、最大上下文、流式响应、运行日志

Prototype requirements:
- `/agents` wireframe: header, metrics, filter toolbar, compact table, empty/loading/error placeholders, delete confirm dialog.
- `/agents/create` and `/agents/[id]/edit` wireframe: independent form page using grouped fields: 基础信息、归属信息、运行默认值、保存操作栏。
- `/agents/[id]` wireframe: full detail page with sections for 基础信息、资源绑定、版本、会话测试、审计时间线。
- Button placement: top-level create on list header; row-level view/edit/delete; form page save/cancel; detail page publish/disable/archive/delete.
- Make component boundaries clear for frontend implementation.

Avoid: 在列表页展示完整详情字段；在菜单里暴露 detail/edit 路由；使用不存在的后端字段。
