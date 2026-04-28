# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/prompts/page.tsx` | Console layout | Replace placeholder with real M05 list content. |
| Detail route | `apps/web/src/app/(console)/prompts/[id]/page.tsx` | `GET /prompt-templates/:id` | New detail route. |
| Metrics | `MetricCard` | prompt list aggregate | Templates, published, drafts, tests. |
| Status chips | `StatusBadge` | Prompt status/test status | Map DRAFT/PUBLISHED/DISABLED/ARCHIVED/SUCCESS/FAILED to tones. |
| Toolbar/search/filter | new `prompts-content.tsx` | `GET /prompt-templates` query params | Keyword, type, status, owner. |
| Template table | new `prompts-content.tsx` | `PromptTemplateListItem` | Name/code/type/status/version/owner/updated/actions. |
| Create/edit drawer | new `prompt-form-panel.tsx` | `CreatePromptTemplateInput`, `UpdatePromptTemplateInput` | React Hook Form + Zod. |
| Selected summary/test | new `prompts-content.tsx` | detail API + render/test APIs | Render inputs, rendered output, test result. |
| Detail editor | new `prompt-detail-content.tsx` | `PromptTemplateDetail.content` | Textarea editor with Monaco-compatible boundary. |
| Variables | `prompt-detail-content.tsx` | variable CRUD APIs | Add/edit/delete rows with validation. |
| Versions | `prompt-detail-content.tsx` | publish/rollback APIs | Immutable snapshots and rollback action. |
| Agent references | `prompt-detail-content.tsx` | derived from `agent_prompt_binding` | Shows placeholders until Agent prompt bindings are populated. |
| Backend Prisma | `apps/control-api/prisma/schema.prisma` | M05 tables | prompt_template, prompt_version, prompt_variable, prompt_test_record. |
| Backend module | `apps/control-api/src/prompts/*` | M05 APIs | Tenant scoped, RBAC guarded, render logic isolated in service. |
