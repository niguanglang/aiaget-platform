# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Console navigation entry | `apps/web/src/config/modules.ts`, `apps/web/src/config/navigation.ts`, menu seed `skills` | permission `skill:hub:view` | 导航名称为“技能资产”，入口路由 `/skills`，图标可使用 `Blocks` / `SquareTerminal` 兜底。 |
| Skill list route | `apps/web/src/app/(console)/skills/page.tsx`, `apps/web/src/components/skills/skills-content.tsx` | `GET /skills`, `SkillListItem`, `PaginatedResult<SkillListItem>` | 列表页只做资产检索、筛选、分页和行内轻操作，不展示完整 SOP 字段。 |
| List metrics | `MetricCard` | list result aggregate derived from `SkillListItem` | 展示技能资产、已发布、草稿、Agent 引用；不要求新增统计接口。 |
| List filters | `Input`, `Select`, existing query-state pattern | `page`, `page_size`, `keyword`, `category`, `status`, `owner_id` | 分类枚举 `GENERAL/SALES/DESIGN/OPERATIONS/TRAINING/REVIEW`，状态枚举 `DRAFT/PUBLISHED/DISABLED/ARCHIVED`。 |
| List table | `Card`, table markup, `StatusBadge`, `Badge`, `Button`, `Link` | `name`, `code`, `category`, `status`, `version`, `trigger_scenario_preview`, `output_format_preview`, `owner`, `tags`, `agent_reference_count`, `updated_at` | 操作为“查看、编辑、复制、删除”；`execution_steps`、`quality_criteria`、`boundary_rules` 不进入表格。 |
| Create route | `apps/web/src/app/(console)/skills/create/page.tsx`, `skill-create-content.tsx`, `SkillFormPanel` | `POST /skills`, `CreateSkillInput` | 路由级表单；`code` 仅新建必填并按后端正则校验；中文错误文案。 |
| Edit route | `apps/web/src/app/(console)/skills/[id]/edit/page.tsx`, `skill-edit-content.tsx`, `SkillFormPanel` | `GET /skills/:id`, `PATCH /skills/:id`, `UpdateSkillInput`, `SkillDetail` | 先加载详情再回填表单；保存后回到详情页。 |
| Skill form panel | `SkillFormPanel`, `Input`, `Textarea`, `Select`, `Badge` tag editor | `name`, `code`, `category`, `status`, `description`, `trigger_scenario`, `input_requirements`, `execution_steps`, `output_format`, `quality_criteria`, `boundary_rules`, `tags`, `owner_id` | 表单承载配置和 SOP 字段，不放到列表页。 |
| Detail route | `apps/web/src/app/(console)/skills/[id]/page.tsx`, `skill-detail-content.tsx` | `GET /skills/:id`, `SkillDetail` | 详情页负责完整资产阅读、治理和发布入口。 |
| Detail header actions | `Button`, `Link`, confirmation dialog | `POST /skills/:id/copy`, `DELETE /skills/:id`, `POST /skills/:id/publish` | 编辑跳 `/skills/[id]/edit`；删除为归档/软删除语义；发布打开变更说明弹窗。 |
| SOP detail sections | `Card`/section panels, `Textarea`-like read-only formatting | `trigger_scenario`, `input_requirements`, `execution_steps`, `output_format`, `quality_criteria`, `boundary_rules` | 使用中文标题：触发场景、输入要求、执行步骤、输出结构、质量标准、边界规则。 |
| Version records | `skill-versions-card.tsx`, table | `SkillVersionItem`, `skill_version.snapshot`, `change_note`, `published_at`, `created_by` | 发布后展示不可变版本记录；M118 不提供回滚接口，不在 UI 中放回滚按钮。 |
| Agent references | `skill-agent-references-card.tsx`, table | `SkillAgentReferenceItem`, `agent_skill_binding` | 展示 Agent 名称、编码、状态、绑定类型、排序和绑定时间；绑定维护不属于 M118 前端主流程。 |
| Audit records | timeline/list component | `SkillDetail.audit_records` | 展示创建、更新、复制、发布、删除等操作记录。 |
| Permission states | existing auth/permission helpers, disabled buttons, `EmptyState` | `skill:hub:view`, `skill:hub:manage` | 无查看权限时不请求列表；无管理权限时详情可读、写操作禁用。 |
| Feedback states | `EmptyState`, skeleton, inline alert, toast, confirmation dialog | React Query loading/error/mutation states | 覆盖加载、空态、错误、保存成功、发布成功、复制成功、删除确认。 |
