# M03 Agent Configuration Center

## Scope

M03 adds tenant-scoped Agent configuration with list, create, edit, detail, version snapshot, publish, rollback, disable, archive, soft delete, and agent audit records.

Implemented contracts:

```text
GET    /api/v1/agent-categories
GET    /api/v1/agents
POST   /api/v1/agents
GET    /api/v1/agents/:id
PATCH  /api/v1/agents/:id
DELETE /api/v1/agents/:id
POST   /api/v1/agents/:id/versions
POST   /api/v1/agents/:id/publish
POST   /api/v1/agents/:id/rollback
POST   /api/v1/agents/:id/disable
POST   /api/v1/agents/:id/archive
```

## Tables

```text
agent_category
agent
agent_version
agent_model_binding
agent_prompt_binding
agent_knowledge_binding
agent_tool_binding
agent_publish_channel
agent_audit_log
```

Binding tables are reserved in M03. Real model, prompt, knowledge, and tool resource selection is deferred to M04-M07.

## List Page Design

The `/agents` page owns tenant Agent CRUD:

1. Metrics for total, published, draft, and disabled agents.
2. Keyword, status, category, and owner filters.
3. Table fields: agent name/code/description, status, category, version, default model, owner, updated time, actions.
4. Create/edit drawer fields: name, code, description, avatar URL, category, owner, status on edit, temperature, max context tokens, stream responses, run logs.
5. Soft delete confirmation.
6. Summary detail panel with link to the full detail route.

## Detail Page Design

The `/agents/:id` page exposes configuration and lifecycle operations:

1. Header actions for edit, create version, publish, disable, archive, and delete.
2. Basic information and runtime configuration sections.
3. Publish readiness summary.
4. Model, prompt, knowledge, and tool binding placeholders.
5. Version table with rollback action.
6. Conversation test placeholder for M08.
7. Agent audit timeline.

## Architecture Notes

All backend queries are scoped by `tenant_id`. Read APIs require `agent.read`; mutations require `agent.write`. Deletes are soft deletes. Version creation stores an immutable JSON snapshot of the current Agent profile and runtime defaults before publish.
