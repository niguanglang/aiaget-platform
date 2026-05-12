# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 数据权限 | `apps/web/src/components/data-scopes/data-scope-content.tsx` | `getDataScopeOverview`、`listRoles`、`listRoleDataScopes` | 去除 M35、独立页面说明，隐藏不可用编辑链接 |
| Agent 协作 | `apps/web/src/components/agent-teams/agent-teams-content.tsx` | `getAgentTeamOverview`、`listAgentTeams` | 去除 IA 拆分文案，无权限不显示新建/编辑/删除 |
| 模型中心 | `apps/web/src/components/models/models-content.tsx` | `listModelProviders` | 顶部说明改为字段口径，无权限不显示新建 |
| 工具中心 | `apps/web/src/components/tools/tool-content.tsx` | `listTools` | 顶部说明改为字段口径，无权限不显示新建 |
| 提示词中心 | `apps/web/src/components/prompts/prompts-content.tsx` | `listPromptTemplates` | 顶部说明和确认文案去掉“进入详情页” |
| 知识库中心 | `apps/web/src/components/knowledge/knowledge-content.tsx` | `listKnowledgeBases` | 去除 M48、拆分说明，无权限不显示新建/编辑/删除 |
| 会话中心 | `apps/web/src/components/conversations/conversation-content.tsx` | `listConversations`、`listAgents` | 顶部说明改为业务字段口径 |
| 监控中心 | `apps/web/src/components/monitor/monitor-content.tsx` | `getMonitorOverview`、`listMonitorEvents` | 去除 M09/M22/M46 和迁移说明 |
| 成本中心 | `apps/web/src/components/billing/billing-content.tsx` | `getBillingOverview` | 总览文案改为数据对象口径 |
| API Key | `apps/web/src/components/api-keys/api-key-content.tsx` | API Key list/mutations | 去除 M50 和列表拆分说明 |
| 菜单中心 | `apps/web/src/components/menus/menu-content.tsx` | `getMenuTree`、`listMenus` | 无权限不显示新建、编辑、删除、启停占位按钮 |
| 文案契约测试 | `apps/web/src/components/content-quality/content-copy-p0-route-ia-contract.test.ts` | 源码字符串契约 | 防止 P0 页面回流里程碑、IA 解释和禁用新建占位 |
