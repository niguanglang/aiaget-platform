# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an Enterprise AI Agent Platform module named “技能资产中心”.

Project context:
- Product/module: 企业 AI Agent 平台 / M118 Skill Hub / 技能资产中心
- Business goal: 沉淀可复用业务技能资产，让 Agent 管理员和业务负责人复用标准化能力、SOP、输出规范、质量标准和边界规则
- This is not a prompt center: do not show prompt variables, prompt rendering, model test panels, prompt marketplace, or long prompt editors
- Page/routes: `/skills` list, `/skills/create` create form, `/skills/[id]` detail, `/skills/[id]/edit` edit form
- Target users/roles: 业务运营负责人、Agent 管理员、技能资产维护人、租户管理员、只读审计用户
- Permissions: `skill:hub:view` for read, `skill:hub:manage` for create/edit/delete/copy/publish
- Frontend stack/design system: Next.js App Router, React, TypeScript, React Query, Tailwind CSS, shadcn-style Button/Card/Input/Textarea/Select/Badge/EmptyState/MetricCard/StatusBadge/Dialog
- Existing product shell: enterprise console layout, Chinese UI text, restrained SaaS admin style, compact tables, subtle borders and shadows

Interface contract that must appear in the UI:
- API endpoints: `GET /skills`, `POST /skills`, `GET /skills/:id`, `PATCH /skills/:id`, `DELETE /skills/:id`, `POST /skills/:id/copy`, `POST /skills/:id/publish`
- Query parameters on list: `page`, `page_size`, `keyword`, `category`, `status`, `owner_id`
- Data tables: `skill`, `skill_version`, `agent_skill_binding`
- Main list type: `SkillListItem`
  - `name`, `code`, `category`, `status`, `version`, `description`, `trigger_scenario_preview`, `output_format_preview`, `owner`, `tags`, `agent_reference_count`, `updated_at`
- Main detail type: `SkillDetail`
  - list fields plus `trigger_scenario`, `input_requirements`, `execution_steps`, `output_format`, `quality_criteria`, `boundary_rules`, `versions`, `agent_references`, `audit_records`
- Version type: `SkillVersionItem`
  - `version`, `status`, `change_note`, `published_at`, `created_at`, `created_by`
- Agent reference type: `SkillAgentReferenceItem`
  - `agent_name`, `agent_code`, `agent_status`, `binding_type`, `sort_order`, `created_at`
- Status labels: `DRAFT/草稿`, `PUBLISHED/已发布`, `DISABLED/已停用`, `ARCHIVED/已归档`
- Category labels: `GENERAL/通用`, `SALES/销售`, `DESIGN/设计`, `OPERATIONS/运营`, `TRAINING/培训`, `REVIEW/评审`
- Binding labels: `PRIMARY/主能力`, `SUPPORTING/辅助能力`

Design requirements:
- Show the `/skills` list page as an asset index: header, metrics, search/filter toolbar, compact table, pagination, empty/error/loading states.
- List metrics should be realistic: 技能资产数、已发布、草稿、Agent 引用.
- List table columns must stay compact: 技能名称/编码, 分类, 状态, 版本, 触发场景预览, 输出结构预览, 标签, Agent 引用, 负责人, 更新时间, 操作.
- List row actions: 查看, 编辑, 复制, 删除. Do not put full SOP content in table cells.
- Show `/skills/[id]` detail as a structured knowledge asset page:
  - header with status, version, category, owner, tags, edit/copy/delete/publish actions
  - SOP sections: 触发场景, 输入要求, 执行步骤, 输出结构, 质量标准, 边界规则
  - 版本记录 table with publish time and change note
  - Agent 引用 table with agent name/code/status/binding type
  - 审计记录 timeline
- Show create/edit forms as route-level pages, not drawers inside the list:
  - 基础信息: 名称、编码、分类、状态、负责人、描述、标签
  - SOP 信息: 触发场景、输入要求、执行步骤、输出结构、质量标准、边界规则
  - Chinese validation messages and save/cancel actions
- Permission state: users without `skill:hub:manage` can view but see disabled write buttons with Chinese tooltips.
- Visual style: quiet enterprise admin UI, professional typography, enough whitespace, no oversized hero section, no decorative cards inside cards, no stock art.

Avoid:
- English UI labels
- prompt-center concepts such as variables, render, model test, prompt rollback, prompt template editor
- putting configuration or full SOP fields into the list page
- inventing endpoints or fields beyond the contract
- gradients/orbs/bokeh/marketing composition
