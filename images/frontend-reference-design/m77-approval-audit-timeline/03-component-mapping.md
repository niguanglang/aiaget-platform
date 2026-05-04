# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/components/approvals/approval-content.tsx` | route `/approvals` | Reuse current page |
| Lane switch | Existing segmented buttons in `ApprovalContent` | local `approvalType` state | 工具审批 / 通知策略 |
| Queue table | Existing tool and notification tables | `ToolApprovalListItem`, `SystemSettingSnapshotItem` | Keep M76 columns |
| Detail facts | `ApprovalDetailPanel`, `NotificationPolicyApprovalDetailPanel` | `ToolApprovalDetail`, `SystemSettingSnapshotItem` | Add audit section |
| Audit timeline | New `ApprovalAuditTimeline` component in same file | `ApprovalAuditEventItem[]` | Shared for both lanes |
| Metadata preview | Existing `PreviewCard` | event `metadata` | Reuse JSON rendering |
| Actions | Existing approve/reject buttons | review APIs | Record audit events server-side |
| Feedback states | Existing loading/empty/error blocks | React Query state | Add empty timeline state |
