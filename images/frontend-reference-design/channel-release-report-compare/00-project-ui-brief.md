# Project UI Brief

- Page: Channel Release Report Compare
- Route: `/channels/release/reports`
- Feature goal: 渠道发布复盘快照详情与版本对比。页面保留发布治理子路由边界，不新增独立路由。
- Target users and permissions: 渠道运营、发布负责人、审计人员。查看动作使用 `canView`，创建复盘快照使用 `canManage` 并要求二次确认。
- APIs/services: `getPublishChannelOverview`、`getChannelReleaseReport`、`listChannelReleaseReportSnapshots`、`createChannelReleaseReportSnapshot`、`getChannelReleaseReportSnapshot`、`compareChannelReleaseReportSnapshots`。
- Entities/fields/statuses: `ChannelReleaseReport`、`ChannelReleaseReportSnapshotListItem`、`ChannelReleaseReportSnapshotDetail`、`ChannelReleaseReportSnapshotCompareResult`；核心状态包括 `health_status`、`publish_status`、`incident_level`、diff `kind` 和 `severity`。
- Existing components/design system: `ChannelReleaseHeader`、`ReleaseChannelPicker`、`PanelTitle`、`DetailGrid`、`ChannelActionConfirmDialog`、`Card`、`Button`、`Input`、`StatusBadge`、`EmptyState`，样式使用 Tailwind 与现有 shadcn 风格组件。
- Required states: loading, empty, error, validation, disabled, success, permission-denied。
- UI constraints: 所有页面文案为中文；列表只承载快照概览和单条操作；详情、正文和版本差异放入独立面板；不引入新中间件、容器或路由。
