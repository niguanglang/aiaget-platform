# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell/background | `ToolDetailContent`, `ToolCenterBackground` | `getTool(toolId)` | Detail route only; loading/error remain in shell. |
| Header and object actions | `ToolDetailHeader` | `ToolDetail`, `copyTool`, `enableTool`, `disableTool`, `deleteTool` | Edit links to `/tools/${toolId}/edit`; enable/disable and delete open confirmation. |
| Metrics row | `MetricCard` in `ToolDetailContent` | `ToolDetail.call_logs`, `call_count_today` | Computed in shell to keep query state local. |
| HTTP configuration | `ToolConfigCard` | `ToolDetail` | Uses `tool-status` labels and `tool-json` stringify. |
| Auth and risk policy | `ToolPolicyCard` | `ToolDetail` | Shows status, risk, auth type, approval flag. |
| JSON schema cards | `ToolSchemaCard` | `input_schema`, `output_schema` | Read-only code blocks. |
| Test workflow | `ToolTestPanel` | `testTool`, `TestToolResult` | Run gated by `canExecute` and ACTIVE status. |
| Call logs | `ToolCallLogsCard` | `ToolDetail.call_logs` | Approval request links route to `/approvals?requestId=...`. |
| References/usage | `ToolReferencesCard`, `ToolUsageCard` | `agent_references`, usage counters | Detail side information only. |
| Status/delete confirmation | `ToolConfirmDialog` | `enableTool`, `disableTool`, `deleteTool` | Status changes explain Agent call impact; destructive delete requires confirmation. |
