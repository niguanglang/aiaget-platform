# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Report panel shell | `ReleaseReportPanel` in `apps/web/src/components/channels/channel-content.tsx` | `ChannelReleaseReport` | Extend existing M63-21/M63-22 report panel. |
| Archive action | `Button` + `Save` icon | `createChannelReleaseReportSnapshot` | Requires `channel:publish:manage`. |
| Snapshot list | bordered row with inline `Button` controls | `ChannelReleaseReportSnapshotOverview.items` | Use a non-nested row container so “查看/设为基准/设为对比” are separate buttons. |
| Snapshot detail | `DetailRow`, `pre` | `ChannelReleaseReportSnapshotDetail` | Existing immutable Markdown preview remains. |
| Compare selector state | `StatusBadge`, small summary row | `baseSnapshotId`, `targetSnapshotId` | Highlight selected base/target in the snapshot list. |
| Compare metrics | `MetricCard` | `ChannelReleaseReportSnapshotCompareResult.summary` | Show 变更、新增、移除、严重差异. |
| Diff groups | New local `SnapshotDiffGroup` helper | `ChannelReleaseReportDiffItem[]` | Render summary, metrics, risks and timeline as grouped cards. |
| Diff row | New local `SnapshotDiffRow` helper | `ChannelReleaseReportDiffItem` | Show change type, severity, before/after values. |
| Empty/error/loading | `EmptyState`, skeleton, error banner | query states | Existing loading/error patterns. |

## Implementation Notes

- Backend comparison reads two archived snapshot payloads from existing `platform_event.payloadJson`.
- No database migration.
- No middleware/container action.
- Comparison endpoint is guarded by `channel:publish:view`, data scope and Resource ACL.
- UI text remains Chinese.
