# M122 交付验收复盘中心

## 目标

M122 在 M119 客户评估、M120 岗位场景、M121 落地方案包基础上，补齐“交付验收与复盘”的落地闭环。验收复盘用于记录客户验收结果、问题复盘、改进行动、扩展计划和可复用资产，让企业 AI Agent 项目从方案设计走到持续运营。

## 功能范围

1. 新增 `delivery_review` 表，强关联 `solution_package`。
2. 提供验收复盘列表、详情、新建、编辑、归档接口。
3. 列表页只展示客户、阶段、结果、状态、满意度、评分、验收结论预览、问题预览和关联方案包。
4. 详情页展示完整已交付范围、验收结论、问题复盘、改进行动、扩展计划、可复用资产和下一步动作。
5. 新增/编辑使用独立表单页，避免把复杂复盘内容塞进列表页。
6. 接入 RBAC、Data Scope、Resource ACL 和 SecurityPolicyGuard。
7. Seed 提供华中设计院试点验收复盘样板，并给管理员角色写入默认资源授权。

## 权限

```text
delivery:review:view    查看验收复盘
delivery:review:manage  新建、编辑、归档验收复盘
```

## 路由

```text
GET    /delivery-reviews
POST   /delivery-reviews
GET    /delivery-reviews/:id
PATCH  /delivery-reviews/:id
DELETE /delivery-reviews/:id
```

前端：

```text
/delivery-reviews
/delivery-reviews/create
/delivery-reviews/[id]
/delivery-reviews/[id]/edit
```

## 页面职责

列表页：

- 搜索、筛选、概览、分页、进入详情或编辑。
- 不展示完整 `delivered_scope`、`improvement_actions`、`expansion_plan`、`reusable_assets`、`next_action` 等详情字段。

详情页：

- 承载完整验收复盘内容。
- 展示关联方案包、负责人、标签和备注。

表单页：

- 维护完整复盘内容。
- 必须绑定落地方案包，可选择负责人。

## 验收

1. 后端服务测试覆盖评分推导、列表摘要、详情关联方案包和跨租户绑定拒绝。
2. 前端 IA 测试覆盖独立路由、列表不塞详情、详情承载完整复盘内容、表单复用。
3. 新增表和字段均有中文注释，后续新增字段延续同一规则。
