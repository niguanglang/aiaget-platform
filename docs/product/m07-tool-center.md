# M07 Tool Center

## Scope

M07 adds tenant-scoped HTTP tool management with request/response schema definitions, auth config, risk policy, live test execution, call logs, and Agent reference visibility.

Implemented contracts:

```text
GET    /api/v1/tools
POST   /api/v1/tools
GET    /api/v1/tools/:id
PATCH  /api/v1/tools/:id
DELETE /api/v1/tools/:id
POST   /api/v1/tools/:id/copy
POST   /api/v1/tools/:id/disable
POST   /api/v1/tools/:id/enable
POST   /api/v1/tools/:id/test
```

## Tables

```text
tool
tool_call_log
```

Agent references are derived from existing `agent_tool_binding` rows, so M07 can show which Agents consume a tool without duplicating binding data.

## List Page Design

The `/tools` page now owns tool discovery and fast operations:

1. Metrics for tools, enabled tools, today call count, and failure rate.
2. Keyword, type, status, and risk filters.
3. Tool table with name/code, method, URL, risk, status, today call count, Agent binding count, updated time, and actions.
4. Tool create/edit drawer with HTTP config, auth config, request headers, and input/output schema textareas.
5. Selected tool side panel for summary, quick JSON test input, latest test result, and full detail route action.
6. Copy, enable/disable, soft delete, and detail route actions.

## Detail Page Design

The `/tools/[id]` page supports complete tool operation:

1. Header actions for edit, copy, enable/disable, and delete.
2. HTTP config panel with method, URL, timeout, and default headers.
3. Auth and risk policy panel with auth type, auth config, risk level, and approval requirement.
4. Input/output schema inspectors using formatted JSON blocks.
5. Live test panel with JSON input, approval placeholder handling, request/response preview, and result summary.
6. Latest call logs with status, HTTP code, latency, operator, and error details.
7. Agent reference list and usage summary.

## Architecture Notes

All APIs are tenant-scoped and protected by canonical permissions. Tool configuration uses `tool:definition:view` and `tool:definition:manage`; tool execution uses `tool:call:execute`.

M43 moved the execution kernel into `ToolGatewayService`. Tool tests, Runtime tool calls, and approval execution now share the same request preparation, schema validation, approval, rate-limit, retry, HTTP execution, response truncation, and call-log persistence boundary.
