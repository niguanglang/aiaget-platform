# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 页面壳 | `app/(console)/solution-packages/*` | Next App Router | 独立列表/新增/详情/编辑路由 |
| 指标区 | `MetricCard` | `PaginatedResult<SolutionPackageListItem>` | 当前页派生统计 |
| 筛选工具栏 | 原生 `input/select` + `Button` | `listSolutionPackages` query | 关键词、客户类型、阶段、状态、优先级、负责人 |
| 主列表 | 原生 table + `StatusBadge` | `SolutionPackageListItem` | 只展示摘要和行内操作 |
| 详情页 | `Card` 分组 | `SolutionPackageDetail` | 承载完整交付内容 |
| 表单页 | `react-hook-form` + `zod` + `Input` | `Create/UpdateSolutionPackageInput` | 独立页面，绑定客户评估和岗位场景 |
| 反馈状态 | `EmptyState`、错误文本、禁用按钮 | API error/loading/permission | 中文提示 |
