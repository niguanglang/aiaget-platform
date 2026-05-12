# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 渠道中心总览 | `apps/web/src/components/channels/channel-overview-content.tsx` | `getPublishChannelOverview`, `listChannelProviders`, `listChannelAccounts`, `listChannelPublishJobs`, `listChannelDeliveries` | 去掉“根页/完整列表”等内部结构说明，改为业务入口说明。 |
| 渠道提供方列表与编辑 | `channel-providers-content.tsx`, `channel-provider-edit-content.tsx` | `ChannelProviderItem`, provider CRUD APIs | 列表文案聚焦名称、编码、状态、平台类型、健康指标；无管理权限不显示新建/编辑入口。 |
| 账号凭据、模板、路由 | `channel-accounts-content.tsx`, `channel-templates-content.tsx`, `channel-route-rules-content.tsx` | `ChannelAccountItem`, template and route rule APIs | 保留分页、加载、删除确认等真实禁用状态；隐藏无权限的新建/编辑占位按钮。 |
| 渠道任务、投递、回复 | `channel-jobs-content.tsx`, `channel-deliveries-content.tsx`, `channel-replies-content.tsx`, `channel-operations-pages.tsx` | `ChannelPublishJobItem`, `ChannelDeliveryItem`, `ChannelReplyItem` | 统一列表说明为状态、指标、单条操作；无查看权限隐藏详情链接。 |
| 渠道投递详情与发布治理 | `channel-delivery-detail-content.tsx`, `channel-release-content.tsx`, `channel-sender-content.tsx` | delivery detail and release APIs | 详情和治理说明只描述当前业务对象，不描述页面拆分。 |
| 安全策略与事件 | `security-policies-content.tsx`, `security-events-content.tsx` | security policy/event APIs | 去掉“列表页只保留/独立详情页”，按钮按权限条件渲染。 |
| 安全归档、告警、恢复 | `security-archives-content.tsx`, `security-alerts-content.tsx`, `security-recovery-content.tsx` | archive, approval, alert, recovery APIs | 将“闭环”改为告警、处置、审计证据等业务词。 |
| 平台事件与用量 | `platform-event-usage-panel.tsx`, `platform-usage-overview-content.tsx`, `platform-usage-shared.tsx` | platform event/usage APIs | 将 `M64/M72` 改为业务标签；有 Trace 时才显示 Trace 入口。 |
| 系统设置入口 | `settings-content.tsx` | system settings APIs | 通知策略说明改为业务能力；无权限入口不显示不可点击按钮。 |
| 质量测试 | `content-copy-p1-route-ia-contract.test.ts` | Node test + source file scan | 覆盖 P1 文件的内部 IA/营销词和禁用占位导航按钮。 |
