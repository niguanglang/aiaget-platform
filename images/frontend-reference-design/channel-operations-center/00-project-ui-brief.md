# Project UI Brief

- Project/module: AIAget Web 控制台渠道中心
- Page/route: `/channels`，Next.js App Router 页面 `apps/web/src/app/(console)/channels/page.tsx` 渲染 `ChannelContent`
- Target users/permissions: 租户管理员或具备 `channel:publish:view` 可查看；`channel:publish:manage` 可管理渠道配置与策略；`channel:publish:deploy` 可执行发布推进；`channel:publish:disable` 可停用、拒绝或中止
- Current API/services: `getPublishChannelOverview`、`upsertPublishChannel`、`updatePublishChannel`、`enablePublishChannel`、`disablePublishChannel`、`checkPublishChannel`、`listChannelSenderDeliveries`、`getChannelSenderDelivery`、`retryChannelSenderDelivery`、sender policy/task、publish control、rollout gate、release pipeline/report/gate/automation/self-healing
- New target API/services: `listChannelProviders` -> `/channels/providers`；`listChannelAccounts` -> `/channels/accounts`；`listChannelTemplates` -> `/channels/templates`；`listChannelRouteRules` -> `/channels/route-rules`；`listChannelPublishJobs` -> `/channels/publish-jobs`；`listChannelDeliveries` -> `/channels/deliveries`；`listChannelReplies` -> `/channels/replies`
- Current data entities: `PublishChannelOverview`、`PublishChannelListItem`、`ChannelSenderDeliveryListItem/Detail`、`ChannelSenderPolicy`、`ChannelPublishControl`、`ChannelReleasePipeline`、`ChannelReleaseReport` 等
- New provisional entities: provider、account、template、route rule、publish job、delivery、reply；前端先使用最小兼容字段并保留 `metadata/raw` 兜底，等待后端共享类型固化
- Existing components/design system: React 19、Next 16、TanStack Query、Tailwind、`Card`、`Button`、`Input`、`MetricCard`、`StatusBadge`、`EmptyState`、lucide icons、中文控制台密集布局
- Required states/actions: 加载、空态、接口错误、权限禁用、刷新、关键词筛选、类型/状态筛选、卡片统计、列表选择、详情面板、与现有发布渠道上下文联动
- Constraints: 保持中文文案和 shadcn/Tailwind 风格；不改后端与共享类型；新增接口命名按目标 endpoint；不能破坏现有发布页工作流；新增模块先以运营只读入口为主，避免伪造创建/编辑契约
