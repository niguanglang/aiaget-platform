# Product Prototype / Wireframe Prompt

Create a low/mid-fidelity product prototype wireframe for the Enterprise AI Agent Platform “技能资产中心”.

Project context:
- Module: M118 Skill Hub / 技能资产中心
- Routes: `/skills`, `/skills/create`, `/skills/[id]`, `/skills/[id]/edit`
- Main task flow: 在列表检索技能资产 -> 打开详情理解完整 SOP -> 编辑资产 -> 发布版本快照 -> 查看版本记录和 Agent 引用
- API contract: `GET /skills`, `POST /skills`, `GET /skills/:id`, `PATCH /skills/:id`, `DELETE /skills/:id`, `POST /skills/:id/copy`, `POST /skills/:id/publish`
- Query filters: keyword, category, status, owner_id
- Data fields:
  - list: name, code, category, status, version, trigger_scenario_preview, output_format_preview, owner, tags, agent_reference_count, updated_at
  - detail/form: trigger_scenario, input_requirements, execution_steps, output_format, quality_criteria, boundary_rules
  - versions: version, status, change_note, published_at, created_by
  - references: agent_name, agent_code, agent_status, binding_type, sort_order
- Permissions: `skill:hub:view`, `skill:hub:manage`
- Responsibility boundary: the list is only for discovery and row navigation/copy/delete; detail owns full SOP content, publish workflow, version records, Agent references, and audit.

Prototype requirements:
- Use Chinese labels throughout.
- Show four route-level screens in one coherent wireframe board:
  1. `/skills` 技能资产列表
  2. `/skills/create` 新建 Skill
  3. `/skills/[id]` Skill 详情
  4. `/skills/[id]/edit` 编辑 Skill
- `/skills` list wireframe:
  - page title “技能资产中心”
  - primary button “新建 Skill”
  - metric cards: 技能资产、已发布、草稿、Agent 引用
  - filter toolbar: 关键词、分类、状态、负责人
  - table with compact columns only
  - row actions: 查看、编辑、复制、删除
  - loading skeleton, empty state, error state, no-permission state placeholders
- `/skills/[id]` detail wireframe:
  - header with name/code/status/version/category/owner/tags
  - action area: 编辑、复制、删除、发布版本
  - two-column layout: main SOP sections on the left, governance panels on the right
  - main sections: 触发场景、输入要求、执行步骤、输出结构、质量标准、边界规则
  - side panels: 版本记录、Agent 引用、审计记录
  - publish dialog with `change_note`
- `/skills/create` and `/skills/[id]/edit` form wireframe:
  - route-level form, not modal/drawer
  - Basic fields: 名称、编码、分类、状态、负责人、描述、标签
  - SOP textarea fields: 触发场景、输入要求、执行步骤、输出结构、质量标准、边界规则
  - save/cancel buttons, validation errors, disabled submit while saving
- Component boundaries should be visible: page shell, metrics, filters, table, status badges, form panel, SOP section cards, version table, reference table, audit timeline, confirmation dialog.

Avoid:
- combining list, detail, and form into a single dense page
- showing `execution_steps`, `quality_criteria`, or `boundary_rules` as full table content on `/skills`
- prompt center UI such as variable tables, render/test panels, model provider selectors, prompt rollback
- unresolved placeholder text or incomplete marker copy
