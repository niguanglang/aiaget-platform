# Project UI Brief

- Page: Production Readiness Center
- Route: /settings/production-readiness
- Feature goal: 生产落地中心
- Parent layout: Next.js App Router console shell under `apps/web/src/app/(console)`.
- Target users and permissions: 租户管理员、平台运维、发布负责人、安全管理员；`system:settings:view` 可查看清单，`system:settings:manage` 或租户管理员可提交人工验收说明。
- APIs/services: `GET /system-settings/production-readiness` via `getProductionReadinessOverview()`；`POST /system-settings/production-readiness/:checkId/accept` via `acceptProductionReadinessCheck()`。
- Entities/fields/statuses: `ProductionReadinessOverview`，包含 summary、categories、items、acceptance；状态为 READY / WARNING / BLOCKED / MANUAL。
- Existing components/design system: `Card`、`Button`、`MetricCard`、`StatusBadge`、`EmptyState`，Tailwind CSS，lucide-react，Motion。
- Required states: loading, error, blocked warning, manual validation, acceptance submitted, permission-denied by backend auth guard.
- Constraints: 页面只允许记录验收说明，不执行 PATCH/DELETE，不连接或创建任何 middleware/container；所有可见文字使用中文；展示证据、跳转入口和最新验收记录。
