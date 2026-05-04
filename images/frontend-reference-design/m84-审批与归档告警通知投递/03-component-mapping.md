# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Security page shell | `apps/web/src/components/security/security-policy-content.tsx` | `/security` route | Reuse existing page |
| Overview query | `getSecurityCenterOverview()` | `SecurityCenterOverview` | Existing data source |
| Notify action | `notifySecurityOperationAlert()` | new POST endpoint | Add api-client method |
| Backend controller | `SecurityCenterController` | `POST /operation-alerts/:alertId/notify` | Secured by `security:rule:view` |
| Backend service | `SecurityCenterService.notifyOperationAlert` | `platform_event` | Record event and optional Webhook |
| Shared result types | `packages/shared-types/src/index.ts` | notification result/input | Reuse channel/status names |
| Alert card | `OperationAlertCard` | `SecurityCenterOperationalAlert` | Add notify button and result state |
| Product docs | `docs/product/m84-approval-archive-alert-notification.md` | milestone acceptance | Link from README |
