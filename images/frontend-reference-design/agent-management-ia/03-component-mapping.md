# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Agent 列表页 | `apps/web/src/components/agents/agents-content.tsx` | `listAgents`, `AgentListItem` | 删除列表下方配置覆盖和选中详情摘要。 |
| 新建页 | `apps/web/src/components/agents/agent-create-content.tsx` + `AgentFormPanel` | `createAgent`, `CreateAgentInput` | 独立路由 `/agents/create`，复用表单组件。 |
| 编辑页 | `apps/web/src/components/agents/agent-edit-content.tsx` + `AgentFormPanel` | `getAgent`, `updateAgent`, `AgentDetail` | 独立路由 `/agents/[id]/edit`，详情页编辑按钮跳转。 |
| 详情页 | `apps/web/src/components/agents/agent-detail-content.tsx` | `getAgent`, version/binding/runtime APIs | 保留完整详情、绑定、版本、测试和审计。 |
| Agent 确认弹窗 | `apps/web/src/components/agents/agent-confirm-dialog.tsx`, `agents-content.tsx`, `agent-detail-content.tsx` | lifecycle/delete/binding mutation pending state | 列表删除、详情发布/停用/归档/回滚/删除和解除资源绑定必须先确认，并统一使用共享 Agent 确认弹窗。 |
| 表单容器 | `apps/web/src/components/agents/agent-form-panel.tsx` | `AgentFormValues` | 增加 `presentation` 模式，支持抽屉和页面内表单。 |
| 动态菜单 | `apps/control-api/prisma/seed.ts`, `menu-navigation.ts` | `PERMISSION_CODES.agentAgentView` | 只给列表菜单；create/edit/detail 作为路由不进左侧菜单。 |
| 验证 | `apps/control-api/src/menus/menu-seed-contract.test.ts`, web typecheck/lint | route/file text contracts | 保证 Agent create/edit 不进入动态菜单。 |
