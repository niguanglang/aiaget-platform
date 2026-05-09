# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Prompt list shell | `apps/web/src/components/prompts/prompts-content.tsx` | `listPromptTemplates`, `listUsers`, `PromptTemplateListItem` | Keep list-only: metrics, filters, table, pagination, row actions. No publish, rollback, render, or test workflows. |
| List row actions | `Button`, `Link`, `StatusBadge` | `copyPromptTemplate`, `deletePromptTemplate` | Row-level actions are 查看、编辑、复制、删除. 发布 belongs to detail/version area. |
| Create page | `prompt-create-content.tsx`, `/prompts/create/page.tsx` | `createPromptTemplate`, `listUsers`, `PromptFormValues` | Route-level form with Chinese validation and cancel/save actions. |
| Edit page | `prompt-edit-content.tsx`, `/prompts/[id]/edit/page.tsx` | `getPromptTemplate`, `updatePromptTemplate`, `listUsers` | Route-level metadata/content form. |
| Detail shell | `prompt-detail-content.tsx`, `/prompts/[id]/page.tsx` | `getPromptTemplate`, `PromptTemplateDetail` | Owns variables, versions, render/test, references, audit, and detail-level mutation feedback. |
| Version workflow | `prompt-versions-card.tsx`, `prompt-detail-header.tsx` | `publishPromptTemplate`, `rollbackPromptTemplate`, `PromptVersionItem` | Publish with change note and rollback live in detail. |
| Prompt form | `PromptFormPanel` | `CreatePromptTemplateInput`, `UpdatePromptTemplateInput` | Used by create/edit route-level pages. |
| Variable form | `PromptVariableFormPanel` | variable CRUD DTOs | Detail-owned drawer. |
| Feedback states | `Card`, `EmptyState`, error boxes | React Query states | Loading, empty, error, no-permission, confirmation. |
