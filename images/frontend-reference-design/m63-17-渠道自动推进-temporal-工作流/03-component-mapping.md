# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/channels/page.tsx` | Console layout | Existing route. |
| Automation panel | `apps/web/src/components/channels/channel-content.tsx` | `ReleaseAutomationPanel` | Extend M63-16 panel. |
| Workflow fields | `ChannelReleaseAutomationOverview` | `workflow_mode`, `workflow_backend` | Optional fields for M63-17. |
| Last run fields | `ChannelReleaseAutomationRunResult` | `workflow_id`, `workflow_backend` | Stored in channel config. |
| Runtime workflow endpoint | `apps/agent-runtime/app/main.py` | `/runtime/workflows/channel-release-automation/start` | Internal token required. |
| Worker activity | `apps/agent-runtime/app/workflows/channel_release_automation.py` | Control API internal callback | No business logic copied into Runtime. |
| Control API dispatcher | `channel-release-automation-workflow.service.ts` | `local/temporal_first/temporal` | Mirrors M42 pattern. |
| Feedback states | Existing notices/errors | React Query mutation status | Existing behavior preserved. |
