# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/runtime/workflows/page.tsx` and `RuntimeWorkflowsContent` | console route | Reuse existing route; no menu changes |
| Background and header | `MonitorCenterBackground`, `StatusBadge`, `Button` | static route content | Keep Chinese labels and return action |
| Backend status card | `WorkflowBackendCard` in `monitor-shared-panels.tsx` | `RuntimeWorkflowStatusOverview` | Existing card remains owner of status, latest failure and recoverable tasks |
| Retry confirmation | `WorkflowRetryConfirmDialog` in `runtime-workflows-content.tsx` | `RuntimeWorkflowTaskType`, task id | Existing explicit confirmation before mutation |
| Retry result card | `WorkflowRetryResultCard` in `runtime-workflows-content.tsx` | `RuntimeWorkflowRetryResult` | New compact success state showing dispatch identifiers |
| API client | `retryRuntimeWorkflowTask` in `runtime-workflows-content.tsx` | `POST /runtime/workflows/retry` | Return typed `RuntimeWorkflowRetryResult` |
| Permission state | `canRetryWorkflowTask` | user permissions and role | Keep disabled retry buttons for unauthorized users |
