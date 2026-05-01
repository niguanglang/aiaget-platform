# Component Mapping

Reference images are not committed yet for M14. This implementation follows the prompt pack and the existing `/agents/[id]` page shell, and the final generated PNG assets should be stored in this same workspace later.

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Console shell | `ConsoleShell`, `Sidebar`, `Topbar` | existing auth session and console navigation | Keep the binding UI inside the current protected detail route without changing navigation or layout contracts. |
| Agent detail header and summary | `apps/web/src/components/agents/agent-detail-content.tsx` | `getAgent`, `AgentDetail` | Existing header, status badges, summary cards, versions, and audit timeline remain unchanged around the new binding surface. |
| Binding grid shell | `apps/web/src/components/agents/agent-binding-manager.tsx` | `AgentDetail.bindings` | Real binding manager replaces the old placeholder binding cards on the agent detail page. |
| Model binding card | `AgentBindingManager`, `Card`, `Button`, `StatusBadge` | `listModelProviders`, `getModelProvider`, `createAgentModelBinding`, `deleteAgentModelBinding`, `AgentModelBindingItem` | Provider selector drives the model selector; list shows provider, model code, and binding type. |
| Prompt binding card | `AgentBindingManager`, `Card`, `Button`, `StatusBadge` | `listPromptTemplates`, `createAgentPromptBinding`, `deleteAgentPromptBinding`, `AgentPromptBindingItem` | Prompt role values map directly to `SYSTEM`, `USER`, `ASSISTANT`, `TOOL` while displaying Chinese labels. |
| Knowledge binding card | `AgentBindingManager`, `Input`, `Button`, `StatusBadge` | `listKnowledgeBases`, `createAgentKnowledgeBinding`, `updateAgentKnowledgeBinding`, `deleteAgentKnowledgeBinding`, `AgentKnowledgeBindingItem` | Uses numeric inputs for `weight` and `recall_top_k`, plus inline save/cancel for edit mode. |
| Tool binding card | `AgentBindingManager`, native checkbox wrapper, `Button`, `StatusBadge` | `listTools`, `createAgentToolBinding`, `updateAgentToolBinding`, `deleteAgentToolBinding`, `AgentToolBindingItem` | Approval requirement is the only editable field after binding. |
| Feedback and permission state | `AgentDetailContent` action error banner, disabled `Button` states in `AgentBindingManager` | `ApiClientError`, `currentUser.roles`, `currentUser.permissions` | Read-only users can view bindings but cannot create, edit, or delete. |
| Backend hydration | `apps/control-api/src/agents/agents.service.ts` | model/prompt/knowledge/tool join lookups plus `AgentDetail` mapping | Every mutation returns a freshly hydrated `AgentDetail` so the frontend can replace the local query result without extra polling. |
