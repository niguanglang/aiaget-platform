# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 页面头部 | `apps/web/src/components/settings/production-readiness-content.tsx` + `Button` + `StatusBadge` | `ProductionReadinessOverview.generated_at` | 刷新清单，提示验收记录不会执行中间件操作 |
| 顶部指标 | `MetricCard` | `ProductionReadinessOverview.summary` | 检查项、已就绪、人工验收、阻塞项、落地分 |
| 左侧分组锚点 | `Card` + anchor list | `ProductionReadinessCategoryOverview` | 环境配置、外部服务、第三方联调、发布验收、风险项 |
| 检查项列表 | `ReadinessItemCard` local component | `ProductionReadinessCheckItem` | 展示状态、风险、负责人、证据、跳转和最新验收记录 |
| 验收提交 | `Input` + `Button` in `ReadinessItemCard` | `acceptProductionReadinessCheck()` | `system:settings:manage` 或租户管理员可提交验收说明，写入审批审计事件 |
| 错误状态 | `EmptyState` | React Query error state | 提示检查权限和控制服务 |
| API client | `apps/web/src/lib/api-client.ts` | `GET /system-settings/production-readiness` + `POST /system-settings/production-readiness/:checkId/accept` | 查询清单，提交人工验收证据 |
| 后端聚合 | `SystemSettingsService.getProductionReadinessOverview` + `acceptProductionReadinessCheck` | Prisma counts + env presence + `approvalAuditEvent` | 不主动连接第三方服务，不执行脚本；验收记录复用审批审计事件 |
