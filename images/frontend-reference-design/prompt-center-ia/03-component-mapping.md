# Component Mapping
| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Prompt list shell | `apps/web/src/components/prompts/prompts-content.tsx` | `listPromptTemplates`, `PromptTemplateListItem` | Keep list-only: metrics, filters, table, row actions |
| Create page | `prompt-create-content.tsx`, `/prompts/create/page.tsx` | `createPromptTemplate`, `listUsers`, `PromptFormValues` | Route-level form, Chinese validation/errors |
| Edit page | `prompt-edit-content.tsx`, `/prompts/[id]/edit/page.tsx` | `getPromptTemplate`, `updatePromptTemplate`, `listUsers` | Route-level metadata/content form |
| Detail shell | `prompt-detail-content.tsx`, `/prompts/[id]/page.tsx` | `getPromptTemplate`, `PromptTemplateDetail` | Own variables, versions, render/test, references, audit |
| Prompt form | `PromptFormPanel` | `CreatePromptTemplateInput`, `UpdatePromptTemplateInput` | Add `presentation='drawer' | 'page'` like provider/knowledge forms |
| Variable form | `PromptVariableFormPanel` | variable CRUD DTOs | Stay detail-owned drawer |
| Row actions | `Button`, `Link`, `StatusBadge` | copy/publish/delete APIs | View/detail/edit/copy/publish/delete only |
| Feedback states | `Card`, `EmptyState`, error boxes | React Query states | Loading/empty/error/no-permission/confirmation |
| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
