# M05 Prompt Center

## Scope

M05 adds tenant-scoped prompt template management with variables, immutable published versions, rollback, render checks, test records, and agent reference visibility.

Implemented contracts:

```text
GET    /api/v1/prompt-templates
POST   /api/v1/prompt-templates
GET    /api/v1/prompt-templates/:id
PATCH  /api/v1/prompt-templates/:id
DELETE /api/v1/prompt-templates/:id
POST   /api/v1/prompt-templates/:id/copy
POST   /api/v1/prompt-templates/:id/publish
POST   /api/v1/prompt-templates/:id/rollback
POST   /api/v1/prompt-templates/:id/render
POST   /api/v1/prompt-templates/:id/test
POST   /api/v1/prompt-templates/:id/variables
PATCH  /api/v1/prompt-templates/:id/variables/:variableId
DELETE /api/v1/prompt-templates/:id/variables/:variableId
```

## Tables

```text
prompt_template
prompt_version
prompt_variable
prompt_test_record
```

Agent references are derived from existing `agent_prompt_binding` rows, so M05 can show where a prompt is used without duplicating binding data.

## List Page Design

The `/prompts` page now owns prompt discovery and fast operations:

1. Metrics for templates, published prompts, drafts, and tests.
2. Keyword, type, status, and owner filters.
3. Template table with name/code/content preview, type, status, version, variable count, test count, updated time, and actions.
4. Prompt create/edit drawer with content editor textarea, type, status, owner, and description.
5. Selected prompt side panel for summary, JSON render inputs, render output, and prompt test result.
6. Copy, publish, soft delete, and detail route actions.

## Detail Page Design

The `/prompts/[id]` page supports complete template operation:

1. Header actions for edit, copy, publish, and delete.
2. Monaco-compatible textarea editor boundary for prompt content.
3. Variable CRUD with name, type, default value, required flag, description, and sort order.
4. Render and test panel using JSON object inputs.
5. Version table with immutable snapshots and rollback action.
6. Agent reference list, recent test records, and activity summary.

## Architecture Notes

All APIs are tenant-scoped and protected by `prompt.read` or `prompt.write`. Publish creates a `prompt_version` snapshot containing content and variables. Rollback restores the snapshot into the editable template and returns it to draft state. Render supports both `{{name}}` and `{name}` placeholders. Test records currently validate rendering and persist structured results; real runtime model execution is intentionally left for M08.
