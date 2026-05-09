# M118 Skill Hub 技能资产中心

## 目标

M118 建设企业 AIAgent 平台的“技能资产中心 Skill Hub”，用于沉淀可复用业务技能资产。Skill 不是提示词模板，而是面向业务工作的能力说明和执行规范，覆盖触发场景、输入要求、执行步骤、输出结构、质量标准和边界规则，便于 Agent 配置、团队协作和后续业务场景复用。

## 范围

本模块包含：

```text
1. 租户隔离的技能资产 CRUD。
2. 技能分类、状态、负责人、标签和关键词检索。
3. 技能详情中的完整 SOP 字段展示。
4. 技能复制，用于基于现有资产派生新资产。
5. 技能发布，生成不可变版本快照。
6. 版本记录展示。
7. Agent 引用展示，用于说明哪些 Agent 将该 Skill 作为主能力或辅助能力。
8. 权限码 skill:hub:view 与 skill:hub:manage。
9. 前端信息架构参考：列表、详情、创建表单、编辑表单分离。
```

## 非范围

本模块不做：

```text
1. 提示词变量、提示词渲染、模型测试、Prompt 回滚，这些属于 M05/M20 提示词中心能力。
2. Skill Marketplace 或跨租户共享市场。
3. Agent 技能绑定维护入口；M118 只展示 Agent 引用，绑定维护归 Agent 配置或后续资产编排能力。
4. 成果沉淀、模板实例化、岗位场景编排的完整闭环。
5. Runtime 执行引擎改造。
6. 新增中间件、容器或数据库运行命令。
```

## 数据表

```text
skill
skill_version
agent_skill_binding
```

`skill` 是技能资产主表：

```text
id
tenant_id
owner_id
name
code
category
status
version
description
trigger_scenario
input_requirements
execution_steps
output_format
quality_criteria
boundary_rules
tags
created_at
updated_at
deleted_at
created_by
updated_by
```

`category` 枚举：

```text
GENERAL
SALES
DESIGN
OPERATIONS
TRAINING
REVIEW
```

`status` 枚举：

```text
DRAFT
PUBLISHED
DISABLED
ARCHIVED
```

`skill_version` 记录发布快照：

```text
id
tenant_id
skill_id
version
status
snapshot
change_note
published_at
created_at
updated_at
deleted_at
created_by
updated_by
```

`agent_skill_binding` 记录 Agent 与 Skill 的引用关系：

```text
id
tenant_id
agent_id
skill_id
binding_type
sort_order
created_at
updated_at
deleted_at
created_by
updated_by
```

`binding_type` 枚举：

```text
PRIMARY
SUPPORTING
```

## 接口

后端已新增 Skill Hub 控制器，逻辑接口如下：

```text
GET    /skills
POST   /skills
GET    /skills/:id
PATCH  /skills/:id
DELETE /skills/:id
POST   /skills/:id/copy
POST   /skills/:id/publish
```

列表查询参数：

```text
page
page_size
keyword
category
status
owner_id
```

创建请求字段：

```text
name
code
category
description
trigger_scenario
input_requirements
execution_steps
output_format
quality_criteria
boundary_rules
tags
owner_id
```

更新请求字段：

```text
name
category
status
description
trigger_scenario
input_requirements
execution_steps
output_format
quality_criteria
boundary_rules
tags
owner_id
```

发布请求字段：

```json
{
  "change_note": "本次发布说明"
}
```

响应类型使用共享类型：

```text
SkillListItem
SkillDetail
SkillVersionItem
SkillAgentReferenceItem
CreateSkillInput
UpdateSkillInput
PublishSkillInput
```

## 前端页面

计划路由：

```text
/skills
/skills/create
/skills/[id]
/skills/[id]/edit
```

`/skills` 列表页只展示核心字段：

```text
名称 / 编码
分类
状态
版本
触发场景预览
输出结构预览
负责人
标签
Agent 引用数
更新时间
操作
```

列表页支持：

```text
1. 关键词、分类、状态、负责人筛选。
2. 分页。
3. 新建 Skill。
4. 查看详情。
5. 编辑。
6. 复制。
7. 删除二次确认。
8. 加载、空态、错误、无权限状态。
```

列表页不展示完整 `input_requirements`、`execution_steps`、`quality_criteria`、`boundary_rules`，也不承载发布变更说明、版本快照或 Agent 引用明细。

`/skills/[id]` 详情页承载：

```text
1. 基础信息：名称、编码、分类、状态、版本、负责人、描述、标签。
2. SOP 字段：触发场景、输入要求、执行步骤、输出结构、质量标准、边界规则。
3. 版本记录：版本号、状态、变更说明、发布时间、发布人。
4. Agent 引用：Agent 名称、编码、状态、绑定类型、排序和创建时间。
5. 审计记录。
6. 发布版本弹窗，填写 change_note 后调用 POST /skills/:id/publish。
```

`/skills/create` 与 `/skills/[id]/edit` 使用路由级表单，不使用列表页抽屉承载配置：

```text
基础信息：名称、编码、分类、状态、负责人、描述、标签
SOP 信息：触发场景、输入要求、执行步骤、输出结构、质量标准、边界规则
操作：保存、取消、保存中禁用、中文校验错误
```

## 权限

```text
skill:hub:view    查看技能资产列表和详情
skill:hub:manage  新建、编辑、复制、发布、删除技能资产
```

前端行为：

```text
1. 无 skill:hub:view 时不请求 Skill Hub 列表和详情接口，展示无权限状态。
2. 有 skill:hub:view 但无 skill:hub:manage 时，详情可读，写按钮禁用。
3. 删除、发布等高影响操作使用二次确认或弹窗。
```

后端行为：

```text
1. GET 接口使用 skill:hub:view。
2. POST、PATCH、DELETE、copy、publish 使用 skill:hub:manage。
3. 所有查询按 tenant_id 隔离。
4. 删除使用归档/软删除语义。
```

## 与后续中心的关系

成果中心：

```text
成果中心沉淀“执行后的产物”，例如方案、报告、复盘、交付物。Skill Hub 沉淀“如何稳定地产出成果”的业务技能和 SOP。成果可以反向标注来源 Skill，但不替代 Skill。
```

模板中心：

```text
模板中心管理可实例化的表单、文档或任务结构。Skill Hub 管理业务能力和执行规范。模板可以作为 Skill 的输入要求或输出结构的一部分被引用，但 M118 不实现模板实例化。
```

岗位场景：

```text
岗位场景会把岗位目标、业务流程、Agent、工具、知识库、模板和 Skill 组合成端到端工作包。Skill Hub 提供可复用能力资产，是岗位场景编排的能力来源之一。
```

提示词中心：

```text
提示词中心关注模型输入文本、变量、版本、渲染和测试。Skill Hub 关注业务技能、SOP、质量和边界。一个 Skill 后续可以关联一个或多个提示词，但 M118 不把 Skill 简化为提示词模板。
```

## 参考设计

前端参考设计资产位于：

```text
images/frontend-reference-design/skill-hub/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
manifest.json
```

## 验收命令

文档与参考设计验收：

```text
test -f docs/product/m118-skill-hub.md
test -f images/frontend-reference-design/skill-hub/00-project-ui-brief.md
test -f images/frontend-reference-design/skill-hub/01-product-ui-design-prompt.md
test -f images/frontend-reference-design/skill-hub/02-product-prototype-prompt.md
test -f images/frontend-reference-design/skill-hub/03-component-mapping.md
rg -n "M118 Skill Hub|技能资产中心|skill:hub:view|skill:hub:manage" docs/product/m118-skill-hub.md docs/product/README.md images/frontend-reference-design/skill-hub
rg -n "待补充|占位|未定" docs/product/m118-skill-hub.md images/frontend-reference-design/skill-hub/*.md
```

后端合同验收：

```text
pnpm --filter @aiaget/control-api typecheck
pnpm --filter @aiaget/control-api exec tsx --test src/skills/skills.service.test.ts
```

前端 IA 合同验收：

```text
pnpm --filter @aiaget/web test:ia
```

这些命令只用于验收当前 M118 合同和文档，不要求启动容器、中间件或数据库。
