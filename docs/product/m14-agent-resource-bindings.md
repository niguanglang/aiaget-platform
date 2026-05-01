# M14 Agent Resource Bindings

## Scope

M14 upgrades the placeholder resource panels on `/agents/:id` into real CRUD for model, prompt, knowledge, and tool bindings.

Implemented contracts:

```text
POST   /api/v1/agents/:id/bindings/models
DELETE /api/v1/agents/:id/bindings/models/:bindingId
POST   /api/v1/agents/:id/bindings/prompts
DELETE /api/v1/agents/:id/bindings/prompts/:bindingId
POST   /api/v1/agents/:id/bindings/knowledge
PATCH  /api/v1/agents/:id/bindings/knowledge/:bindingId
DELETE /api/v1/agents/:id/bindings/knowledge/:bindingId
POST   /api/v1/agents/:id/bindings/tools
PATCH  /api/v1/agents/:id/bindings/tools/:bindingId
DELETE /api/v1/agents/:id/bindings/tools/:bindingId
```

## Page Design

The `/agents/:id` page now supports:

1. Real model binding with provider-driven model selection.
2. Real prompt binding with explicit message-role mapping.
3. Real knowledge binding with editable weight and recall `TopK`.
4. Real tool binding with editable approval requirement.
5. Empty, disabled, and mutation error states inside the existing detail page.
6. Immediate page refresh through hydrated `AgentDetail` responses after every binding mutation.

## Architecture Notes

M14 does not add a new module or new tables. It activates the binding tables introduced in M03 and joins them with the resource domains delivered in M04 through M07:

- `agent_model_binding`
- `agent_prompt_binding`
- `agent_knowledge_binding`
- `agent_tool_binding`

The Control API now hydrates binding metadata during `GET /api/v1/agents/:id` and after every binding mutation, so the frontend can reuse one stable `AgentDetail` contract. All queries remain tenant-scoped and continue to enforce `agent.write` on mutations.
