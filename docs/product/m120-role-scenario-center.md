# M120 岗位场景编排中心

M120 新增“岗位场景编排中心”，用于把企业 AI 落地中的岗位目标、业务痛点、流程步骤、Agent、Skill、知识库、工具、提示词、样板成果、验收标准和 ROI 指标组合成可复用的场景包。

## 范围

已完成：

1. 新增 `role_scenario` 数据表，所有表与字段均带中文注释。
2. 新增权限码 `scenario:package:view` 与 `scenario:package:manage`。
3. 接入 Data Scope 与 Resource ACL，资源类型为 `ROLE_SCENARIO`。
4. 新增控制面接口：
   - `GET /role-scenarios`
   - `POST /role-scenarios`
   - `GET /role-scenarios/:id`
   - `PATCH /role-scenarios/:id`
   - `DELETE /role-scenarios/:id`
5. 新增前端页面：
   - `/role-scenarios`
   - `/role-scenarios/create`
   - `/role-scenarios/[id]`
   - `/role-scenarios/[id]/edit`
6. 列表页只展示摘要、筛选、指标和行内操作。
7. 详情页展示完整业务痛点、流程编排、样板成果、验收标准、ROI 和关联资产。
8. 新增/编辑页使用独立多段表单，不塞入列表页。
9. 默认菜单挂在 Agent 中心下，名称为“岗位场景”。

## 数据设计

`role_scenario` 核心字段：

- `tenant_id`：租户隔离。
- `owner_id`：负责人。
- `agent_id`：绑定 Agent。
- `skill_id`：绑定 Skill。
- `knowledge_id`：绑定知识库。
- `tool_id`：绑定工具。
- `prompt_id`：绑定提示词模板。
- `name`、`code`：场景包识别信息。
- `role_name`、`department_name`：目标岗位与适用部门。
- `scenario_type`：场景类型。
- `status`：生命周期状态。
- `priority`：落地优先级。
- `pain_point`、`business_goal`、`workflow_summary`：业务问题、目标和流程。
- `expected_outcome`、`sample_deliverable`、`acceptance_criteria`：成果和验收。
- `roi_metric`、`impact_score`：价值衡量。
- `tags`、`notes`：分类和备注。

## 页面职责

列表页：

- 查询、筛选、指标概览、分页、行内查看、编辑、归档。
- 不展示完整样板成果、验收标准和 ROI 说明。

详情页：

- 承载完整场景包信息和关联资产详情。
- 详情页顶部提供返回、编辑、归档。

新增/编辑页：

- 维护基础信息、落地内容、关联资产和补充信息。
- 支持负责人、Agent、Skill、知识库、工具、提示词选择。

## 权限与安全

- 查看：`scenario:package:view`
- 管理：`scenario:package:manage`
- 列表接入 Data Scope。
- 详情、编辑、归档接入 Data Scope Guard 与 ResourceAclGuard。
- 后端创建/更新时校验绑定资源必须属于当前租户，防止跨租户引用。

## 验收

1. 后端服务测试覆盖价值评分、列表摘要和跨租户资源绑定拦截。
2. 前端 IA 契约测试覆盖列表/详情/新增/编辑路由分离。
3. 参考设计资产保存在 `images/frontend-reference-design/role-scenarios/`。
