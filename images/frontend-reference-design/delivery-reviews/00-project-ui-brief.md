# Project UI Brief

- 页面目标：新增交付验收复盘中心，把 `客户评估 -> 岗位场景 -> 落地方案包` 后的真实验收、问题复盘、改进行动、扩展计划和可复用资产沉淀成闭环记录。
- 路由：`/delivery-reviews`、`/delivery-reviews/create`、`/delivery-reviews/[id]`、`/delivery-reviews/[id]/edit`。
- 目标用户：租户管理员、交付负责人、客户成功、售前负责人；查看权限 `delivery:review:view`，管理权限 `delivery:review:manage`。
- API：`listDeliveryReviews`、`createDeliveryReview`、`getDeliveryReview`、`updateDeliveryReview`、`deleteDeliveryReview`，并复用 `listSolutionPackages`、`listUsers` 做表单绑定。
- 实体字段：名称、编码、客户名称、复盘阶段、验收结果、复盘状态、满意度、验收评分、已交付范围、验收结论、问题复盘、改进行动、扩展计划、可复用资产、下一步动作、复盘时间、关联方案包、负责人、标签、备注。
- 页面边界：列表只展示识别字段、状态、评分、验收结论预览、问题预览、关联方案包和行内操作；完整复盘内容放入详情页；新增/编辑使用独立页面。
- 组件：复用 Card、Button、Input、MetricCard、StatusBadge、EmptyState、React Query、react-hook-form、zod、motion 微交互。
- 视觉：企业 SaaS 后台，Tailwind 细边框、轻阴影、backdrop-blur，克制渐变背景，不使用 Emoji，不做信息过载列表。
