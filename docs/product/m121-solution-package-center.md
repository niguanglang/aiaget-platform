# M121 AI 落地方案包中心

## 目标

M121 在 M119 客户分层评估与 M120 岗位场景编排基础上，补齐“从判断到交付”的方案包能力。方案包用于把客户类型、六问准备度、岗位场景、交付路线图、验收计划、ROI 摘要和商务推进策略沉淀为可复用、可审核、可交付的资产。

## 功能范围

1. 新增 `solution_package` 表，关联客户评估与岗位场景。
2. 提供方案包列表、详情、新建、编辑、归档接口。
3. 列表页只展示客户、阶段、状态、评分、摘要预览、路线图预览、ROI 预览和关联资源。
4. 详情页展示完整方案摘要、业务目标、落地范围、场景蓝图、交付路线图、验收计划、ROI、风险缓释、商务推进和下一里程碑。
5. 新增/编辑使用独立表单页，避免把复杂交付内容塞进列表页。
6. 接入 RBAC、Data Scope、Resource ACL 和 SecurityPolicyGuard。
7. Seed 提供华中设计院试点方案包样板，并给管理员角色写入默认资源授权。

## 权限

```text
solution:package:view    查看落地方案包
solution:package:manage  新建、编辑、归档落地方案包
```

## 路由

```text
GET    /solution-packages
POST   /solution-packages
GET    /solution-packages/:id
PATCH  /solution-packages/:id
DELETE /solution-packages/:id
```

前端：

```text
/solution-packages
/solution-packages/create
/solution-packages/[id]
/solution-packages/[id]/edit
```

## 页面职责

列表页：

- 搜索、筛选、概览、分页、进入详情或编辑。
- 不展示完整 `acceptance_plan`、`risk_mitigation`、`commercial_strategy` 等详情字段。

详情页：

- 承载完整交付内容和关联资源。
- 展示客户评估与岗位场景绑定摘要。

表单页：

- 维护完整方案内容。
- 绑定负责人、客户评估和岗位场景。

## 验收

1. 后端服务测试覆盖评分推导、列表摘要、详情关联资源和跨租户绑定拒绝。
2. 前端 IA 测试覆盖独立路由、列表不塞详情、详情承载完整交付内容、表单复用。
3. 新增表和字段均有中文注释，后续新增字段延续同一规则。
