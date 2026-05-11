# Project UI Brief

- Page/feature goal: 生产落地中心在发布验收清单中展示可观测性 Trace 质量证据提示，让发布负责人不用离开验收上下文也能知道需要补齐 Trace 覆盖率、孤立事件、错误链路和慢链路证据。
- Route and parent layout: `/settings/production-readiness`，运行在现有 console shell 下；页面主体由 `ProductionReadinessContent` 渲染，保持已有左右分组导航加检查项卡片布局。
- Target users and permissions: 租户管理员或拥有 `system:settings:manage` 的用户可提交人工验收；其他有查看权限的用户可阅读检查项和证据提示。
- API endpoints or service functions: 前端继续使用 `getProductionReadinessOverview()` 读取 `/system-settings/production-readiness`，使用 `acceptProductionReadinessCheck(checkId, { note })` 提交人工验收。
- Data entities and fields: `ProductionReadinessCheckItem`，新增可选 `evidence_summary` 和 `observability_signal`；状态仍为 `READY`、`WARNING`、`BLOCKED`、`MANUAL`；新增的发布验收项为 `observability-trace-quality`。
- Available components and UI library: React/Next.js，`Card`、`Button`、`Input`、`MetricCard`、`StatusBadge`、`EmptyState`、lucide-react 图标；不新增全局组件。
- Required states and actions: 加载、错误、无人工验收记录、无提交权限、提交中、提交成功后刷新；观测证据是只读提示，不调用监控 API。
- Constraints: 不启动 Collector，不创建中间件，不改页面信息架构；只在现有检查项卡片中增加中文可观测性证据区，并提供 `/monitor/observability` 深链。
