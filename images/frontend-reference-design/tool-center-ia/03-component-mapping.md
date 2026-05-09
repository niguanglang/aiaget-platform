# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Console shell | `apps/web/src/app/(console)/layout.tsx` | App Router shell | Reuse existing console layout |
| Tool list page | `apps/web/src/components/tools/tool-content.tsx` | `listTools`, `ToolListItem` | Keep overview/filter/table only |
| Tool create page | `apps/web/src/components/tools/tool-create-content.tsx` | `createTool`, `CreateToolInput` | New route `/tools/create` |
| Tool edit page | `apps/web/src/components/tools/tool-edit-content.tsx` | `getTool`, `updateTool`, `UpdateToolInput` | New route `/tools/[id]/edit` |
| Tool detail page | `apps/web/src/components/tools/tool-detail-content.tsx` | `getTool`, `ToolDetail`, `testTool` | Owns full config, policy, schemas, test, logs, references |
| Tool form | `apps/web/src/components/tools/tool-form-panel.tsx` | `ToolFormValues`, create/update DTOs | Add `presentation="page"` while preserving drawer mode |
| List toolbar | `tool-content.tsx` | `listTools` query params | keyword, type, status, risk |
| List row actions | `tool-content.tsx` | `copyTool`, `enableTool`, `disableTool`, `deleteTool` | View/edit route links, copy mutation, status/delete confirmation dialogs. |
| Detail top actions | `tool-detail-content.tsx` | copy/status/delete + edit route | Edit should navigate to `/tools/[id]/edit`; status/delete mutations require confirmation. |
| Status confirmation | `tool-content.tsx`, `tool-detail-content.tsx`, `tool-confirm-dialog.tsx` | `enableTool`, `disableTool` | Explain impact on authorized Agent tool calls before mutating status. |
| Test panel | `tool-detail-content.tsx` | `testTool`, `TestToolResult` | Detail-only |
| Call logs and references | `tool-detail-content.tsx` | `ToolDetail.call_logs`, `agent_references` | Detail-only |
| Empty/error states | `EmptyState`, `Card`, `StatusBadge` | query/mutation states | Reuse current UI primitives |
