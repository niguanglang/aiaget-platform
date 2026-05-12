# Project UI Brief

- Page: 前端文案降噪 P1
- Routes: `/channels/*`, `/security/*`, `/monitor/platform-usage/*`, `/settings`
- Feature goal: 清理渠道中心、安全中心、平台事件与用量、系统设置页中的内部 IA 说明、里程碑标签、营销化词汇和无权限占位按钮。
- Target users: 企业后台运营、租户管理员、安全管理员、渠道运维、审计员。
- Permissions: 继续使用现有 `useChannelOperationPermissions`、`hasPermission`、安全中心权限判断；无权限时展示权限提示或隐藏动作入口，不渲染看起来可点击但实际不可用的导航按钮。
- APIs/services: 保持现有 `@/lib/api-client` 调用不变，包括渠道列表、渠道详情、安全策略、安全事件、归档、告警、平台用量和系统参数接口。
- Entities/fields/statuses: 渠道提供方、账号凭据、消息模板、路由规则、发布任务、投递记录、回复记录、安全策略、安全事件、归档审批、运营告警、恢复审计、平台事件、用量账本、系统参数。
- Existing components/design system: Next.js App Router、React、TypeScript、Tailwind CSS、lucide-react、`Button`、`Card`、`EmptyState`、`MetricCard`、`StatusBadge`、`ChannelOperationsListPage`、`ChannelFocusedHeader`、`SecurityWorkspaceHeader`、`PlatformUsageHeader`。
- Required states: loading、empty、error、success、permission-denied、readonly、pagination disabled、mutation pending、form validation disabled。
- Constraints: 不改路由、接口、类型、权限模型和数据结构；只调整可见文案、标签和无权限动作展示方式。
