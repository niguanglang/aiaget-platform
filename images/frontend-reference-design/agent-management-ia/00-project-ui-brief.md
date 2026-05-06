# Project UI Brief

- Page: Agent Management IA
- Routes: `/agents`, `/agents/create`, `/agents/[id]`, `/agents/[id]/edit`
- Feature goal: 将 Agent 列表页从“列表 + 摘要详情 + 表单”混合页面调整为清晰的列表入口，新增/编辑进入独立路由，详情页继续承载完整信息、资源绑定、版本、调试和审计。
- Target users/roles: 租户管理员、Agent 管理员、普通查看用户；写入操作受 `tenant_admin` 或 `agent:agent:manage` 控制，查看受 `agent:agent:view`。
- APIs/services: `listAgents`, `listAgentCategories`, `listUsers`, `createAgent`, `getAgent`, `updateAgent`, `deleteAgent`, `createAgentVersion`, `publishAgent`, `rollbackAgent`, `disableAgent`, `archiveAgent`, Agent 绑定相关服务和会话测试服务。
- Entities/fields/statuses: `AgentListItem` 列表字段包含 `id`, `name`, `code`, `description`, `status`, `version`, `category`, `owner`, `default_model`, `updated_at`; `AgentDetail` 承载 `temperature`, `max_context_tokens`, `enable_stream`, `enable_log`, `versions`, `bindings`, `audit_logs`; 状态为 `DRAFT`, `TESTING`, `PENDING`, `PUBLISHED`, `DISABLED`, `ARCHIVED`。
- Existing components/design system: Next.js App Router, React Query, Tailwind, shadcn-style `Button`, `MetricCard`, `StatusBadge`, `AgentFormPanel`, `AgentBindingManager`, `AgentConversationTestPanel`, lucide icons。
- Required states: loading, empty, error, validation, disabled, success, permission-denied
- Constraints: 不改后端接口；保留 `/agents` 和 `/agents/[id]`；新增 route-level create/edit 页面；列表页不展示完整详情和配置说明；中文 UI 文案。
