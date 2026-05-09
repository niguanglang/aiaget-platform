# M123 成果资产中心

## 目标

M123 在 M119 客户评估、M120 岗位场景、M121 落地方案包、M122 验收复盘基础上，补齐“成果沉淀与复用”的运营闭环。成果资产用于把已验收项目中的方案模板、验收清单、风险清单、Prompt SOP、客户案例和报告归档沉淀为可复用资产。

## 功能范围

1. 新增 `delivery_asset` 表，强关联 `delivery_review`，可关联 `solution_package`、`skill`、`agent`、`knowledge_base`。
2. 提供成果资产列表、详情、新建、编辑、归档接口。
3. 列表页只展示客户、资产类型、状态、可见范围、复用评分、摘要预览、复用指引预览和来源关系。
4. 详情页展示完整资产摘要、业务价值、复用指引、来源上下文、风险说明、下一步动作和关联资源。
5. 新增/编辑使用独立表单页，避免把复杂资产内容塞进列表页。
6. 接入 RBAC、Data Scope、Resource ACL 和 SecurityPolicyGuard。
7. Seed 提供华中设计院售前方案验收资产包样板，并给管理员角色写入默认资源授权。

## 权限

```text
delivery:asset:view    查看成果资产
delivery:asset:manage  新建、编辑、归档成果资产
```

## 路由

```text
GET    /delivery-assets
POST   /delivery-assets
GET    /delivery-assets/:id
PATCH  /delivery-assets/:id
DELETE /delivery-assets/:id
```

前端：

```text
/delivery-assets
/delivery-assets/create
/delivery-assets/[id]
/delivery-assets/[id]/edit
```

## 页面职责

列表页：

- 搜索、筛选、概览、分页、进入详情或编辑。
- 不展示完整 `business_value`、`source_context`、`risk_notes`、`next_action` 等详情字段。

详情页：

- 承载完整成果资产内容。
- 展示关联复盘、关联方案包、Skill、Agent、知识库、负责人、标签和备注。

表单页：

- 维护完整资产内容。
- 必须绑定来源验收复盘，可选择方案包、Skill、Agent、知识库和负责人。

## 验收

1. 后端服务测试覆盖复用评分推导、列表摘要、详情关联资源和跨租户绑定拒绝。
2. 前端 IA 测试覆盖独立路由、列表不塞详情、详情承载完整资产内容、表单复用。
3. 新增表和字段均有中文注释，后续新增字段延续同一规则。
