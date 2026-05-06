# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page route | `apps/web/src/app/(console)/security/archives/page.tsx` | `SecurityArchivesContent` | New static menu-level child route. |
| Page shell | `SecurityPolicyBackground`, `SecurityWorkspaceHeader`, `RefreshButton` | auth permissions | Match existing security pages. |
| Source tabs | local segmented buttons | archive source enum | Three sources only: notification, recovery, sla. |
| Metrics | `MetricCard` | archive list summary + approval overview | Derive from active source. |
| Archive list | `Card`, `Button`, `StatusBadge`, `EmptyState` | list archive APIs | Compact list only. |
| Delete confirmation | local `ConfirmDialog` style card | delete archive APIs | Delete submits approval, not immediate hard delete. |
| Approval queue | `Card`, `StatusBadge`, `Button` | list approval APIs + approval overview APIs | Keep detailed timeline out for later detail route. |
| Menu seed | `apps/control-api/prisma/seed.ts` | `PERMISSION_CODES.securityApprovalView` | Add `security_archives`. |
| Contract tests | `security-route-ia-contract.test.ts`, `menu-seed-contract.test.ts` | route/menu IA | RED before implementation. |
