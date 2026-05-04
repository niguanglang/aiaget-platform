# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Report panel shell | `ReleaseReportPanel` | `ChannelReleaseReport` | Extend existing M63-21 panel. |
| Archive action | `Button` + `Save` icon | `createChannelReleaseReportSnapshot` | Requires `channel:publish:manage`. |
| Snapshot list | bordered button rows | `ChannelReleaseReportSnapshotOverview.items` | Select snapshot ID. |
| Snapshot detail | `DetailRow`, `pre` | `ChannelReleaseReportSnapshotDetail` | Show immutable Markdown. |
| Empty/error/loading | `EmptyState`, skeleton, error banner | query/mutation states | Existing patterns. |

## Implementation Notes

- Snapshot storage uses existing `platform_event.payloadJson`.
- No database migration.
- No middleware/container action.
- Snapshot payload contains the full `ChannelReleaseReport`.
