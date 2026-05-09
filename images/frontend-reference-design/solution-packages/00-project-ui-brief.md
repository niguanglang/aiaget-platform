# Project UI Brief

- 页面目标：新增 AI 落地方案包中心，用于把客户分层评估和岗位场景编排转成可交付的方案包。
- 路由：`/solution-packages`、`/solution-packages/create`、`/solution-packages/[id]`、`/solution-packages/[id]/edit`。
- 目标用户：租户管理员、售前/交付负责人、Agent 管理员；查看权限 `solution:package:view`，管理权限 `solution:package:manage`。
- API：`listSolutionPackages`、`createSolutionPackage`、`getSolutionPackage`、`updateSolutionPackage`、`deleteSolutionPackage`。
- 实体字段：客户名称、行业、客户类型、方案阶段、状态、优先级、方案评分、方案摘要、业务目标、范围摘要、场景蓝图、交付路线图、验收计划、ROI 摘要、风险缓释、商务推进、下一里程碑、关联客户评估、关联岗位场景。
- 页面边界：列表只展示识别字段、状态、评分、摘要预览、关联资源和行内操作；完整交付内容放入详情页；新增/编辑使用独立页面。
- 组件：复用 Card、Button、Input、MetricCard、StatusBadge、EmptyState、React Query、react-hook-form、zod、motion 微交互。
- 视觉：企业 SaaS 后台，Tailwind 细边框、轻阴影、backdrop-blur，克制渐变和背景网格。
