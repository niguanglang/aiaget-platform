# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 页面壳 | `app/(console)/delivery-reviews/*` | Next App Router | 独立列表/新增/详情/编辑路由 |
| 指标区 | `MetricCard` | `PaginatedResult<DeliveryReviewListItem>` | 当前页派生统计 |
| 筛选工具栏 | 原生 `input/select` + `Button` | `listDeliveryReviews` query | 关键词、复盘阶段、结果、状态、满意度、负责人、方案包 |
| 主列表 | 原生 table + `StatusBadge` | `DeliveryReviewListItem` | 只展示摘要和行内操作 |
| 详情页 | `Card` 分组 | `DeliveryReviewDetail` | 承载完整验收复盘内容 |
| 表单页 | `react-hook-form` + `zod` + `Input` | `Create/UpdateDeliveryReviewInput` | 独立页面，必须绑定落地方案包 |
| 反馈状态 | `EmptyState`、错误文本、禁用按钮 | API error/loading/permission | 中文提示 |
