# M16 Approval Center

## Scope

M16 upgrades the old `APPROVAL_REQUIRED` placeholder into a real tool approval workflow, covering both direct tool tests and runtime-triggered tool calls.

Implemented contracts:

```text
GET  /api/v1/tool-approvals/overview
GET  /api/v1/tool-approvals
GET  /api/v1/tool-approvals/:id
POST /api/v1/tool-approvals/:id/approve
POST /api/v1/tool-approvals/:id/reject
```

## Tables

```text
tool_approval_request
```

The approval table links back to `tool_call_log` and optionally captures `agent_id` and `conversation_id`, so approval decisions can feed the tool center and the conversation workflow at the same time.

## Page Design

The `/approvals` page now supports:

1. Approval overview metrics for pending, approved, rejected, runtime, and test queues.
2. Unified approval queue filters by keyword, approval status, and trigger source.
3. Detail inspection for the original request method, URL, headers, body, and latest response payload.
4. Context links back to the related tool and conversation when available.
5. Approve-and-execute flow for pending requests.
6. Reject flow with reviewer notes.

## Architecture Notes

M16 keeps tool execution, approval decision, and conversation write-back separate but connected:

- `ToolsService` now creates real `tool_approval_request` rows for high-risk tools that require approval.
- Direct tool tests and runtime-triggered calls both reuse the same approval object.
- Approving a runtime request executes the stored HTTP request and appends a follow-up assistant message plus a new run trace into the related conversation.
- Rejecting a runtime request also appends a deterministic assistant follow-up so the conversation history stays operationally complete.
