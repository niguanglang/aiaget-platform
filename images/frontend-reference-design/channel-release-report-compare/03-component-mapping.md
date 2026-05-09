# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 页面背景与标题 | `ChannelCenterBackground`、`ChannelReleaseHeader` | 路由 `/channels/release/reports` | 保持发布治理子页面的统一头部与背景 |
| 渠道选择器 | `ReleaseChannelPicker` | `getPublishChannelOverview` | 使用 `selectedChannelId` 切换报告、快照和对比上下文 |
| 报告摘要 | `Card`、`PanelTitle`、`DetailGrid`、`StatusBadge` | `getChannelReleaseReport`、`ChannelReleaseReport.summary` | 只展示关键字段，正文放在独立滚动块 |
| 创建快照 | `Button`、`ChannelActionConfirmDialog`、`ChannelAlert` | `createChannelReleaseReportSnapshot` | 使用 `canManage` 禁用控制，确认后创建并刷新报告和快照列表 |
| 风险建议 | `Card`、`StatusBadge`、`EmptyState` | `ChannelReleaseReport.risks` | 只展示标题、严重等级和建议 |
| 复盘快照列表 | `Card`、`Button`、`StatusBadge` | `listChannelReleaseReportSnapshots`、`ChannelReleaseReportSnapshotListItem` | 行内操作为查看详情、设为基准、设为对比 |
| 快照详情 | `Input`、`Button`、`DetailGrid`、`EmptyState` | `getChannelReleaseReportSnapshot`、`ChannelReleaseReportSnapshotDetail` | 展示归档报告正文和来源事件，加载与错误独立处理 |
| 版本对比 | `DetailGrid`、`DiffSection`、`StatusBadge` | `compareChannelReleaseReportSnapshots`、`ChannelReleaseReportSnapshotCompareResult` | 对比摘要和四组差异：摘要、指标、风险、时间线 |
| 权限与状态 | `useChannelOperationPermissions`、React Query state | `canView`、`canManage` | 查看接口按 `canView` 启用；创建快照按 `canManage` 控制 |
