# Project UI Brief

- Project: Enterprise Agent Platform
- Page: M14 Agent Resource Bindings
- Route: `/agents/[id]`
- Feature goal: replace placeholder binding panels on agent detail with real model, prompt, knowledge, and tool binding CRUD
- Parent layout: protected console shell with sidebar, topbar, glass cards, Tailwind surfaces, and agent detail header
- Target users: tenant operators and admins who can inspect agent configuration; write actions are enabled only for `tenant_admin` or users with `agent.write`

## APIs and Services

- `getAgent(agentId)`
- `listModelProviders({ page, page_size, status: 'ACTIVE' })`
- `getModelProvider(providerId)`
- `listPromptTemplates({ page, page_size })`
- `listKnowledgeBases({ page, page_size, status: 'ACTIVE' })`
- `listTools({ page, page_size, status: 'ACTIVE' })`
- `createAgentModelBinding(agentId, { model_id, binding_type })`
- `deleteAgentModelBinding(agentId, bindingId)`
- `createAgentPromptBinding(agentId, { prompt_id, prompt_type })`
- `deleteAgentPromptBinding(agentId, bindingId)`
- `createAgentKnowledgeBinding(agentId, { knowledge_id, weight, recall_top_k })`
- `updateAgentKnowledgeBinding(agentId, bindingId, { weight, recall_top_k })`
- `deleteAgentKnowledgeBinding(agentId, bindingId)`
- `createAgentToolBinding(agentId, { tool_id, require_approval })`
- `updateAgentToolBinding(agentId, bindingId, { require_approval })`
- `deleteAgentToolBinding(agentId, bindingId)`

## Entities and Fields

- Agent detail:
  - `name`, `code`, `status`, `version`, `owner`, `temperature`, `max_context_tokens`, `enable_stream`, `enable_log`
- Model binding:
  - `model_name`, `model_code`, `provider_name`, `binding_type`, `created_at`
- Prompt binding:
  - `prompt_name`, `prompt_code`, `prompt_type`, `created_at`
- Knowledge binding:
  - `knowledge_name`, `knowledge_code`, `weight`, `recall_top_k`, `created_at`
- Tool binding:
  - `tool_name`, `tool_code`, `require_approval`, `created_at`
- Resource source filters:
  - model providers `ACTIVE`
  - provider models `ACTIVE`
  - prompt templates except `DISABLED` and `ARCHIVED`
  - knowledge bases `ACTIVE`
  - tools `ACTIVE`

## Existing Components and Design System

- Next.js App Router page inside the console shell
- React Query for query and mutation state
- `AgentDetailContent`
- `AgentBindingManager`
- `Card`, `Button`, `Input`, `StatusBadge`
- Lucide icons
- Tailwind CSS with thin borders, soft shadow, and backdrop blur

## Required States

- loading:
  - agent detail page
  - provider detail model loading
- empty:
  - each binding list empty state
  - resource dropdown with no available options
- error:
  - mutation failure surfaced through agent detail action error banner
- validation:
  - bind button disabled until required selection exists
  - weight and `TopK` numeric inputs
- disabled:
  - all write actions disabled without permission or during pending mutation
- success:
  - binding mutations return full hydrated `AgentDetail`
- permission-denied:
  - page still readable, but create/edit/delete controls are disabled

## Constraints

- All visible UI copy must be Chinese.
- Preserve existing `/agents/[id]` route, `AgentDetail` type, and API signatures.
- Do not invent new backend modules or fake resource fields.
- Keep the binding surface compact and product-like inside the current detail page, using a responsive 2x2 dashboard grid.
