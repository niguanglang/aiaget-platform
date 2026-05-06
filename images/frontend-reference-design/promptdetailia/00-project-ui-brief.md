# Project UI Brief

- Page: PromptDetailIA
- Route: /prompts/[id]
- Feature goal: 提示词详情页信息架构拆分与编辑路由边界收敛
- Parent layout: `src/app/(console)/prompts/[id]/page.tsx` renders `PromptDetailContent`; `/prompts/[id]/edit` renders `PromptEditContent`.
- Target users and permissions: 提示词管理员、Agent 管理员、租户管理员；写入受 `prompt:template:manage` 控制。
- APIs/services: detail `getPromptTemplate`; content/version/variable/test workflows use `updatePromptTemplate`, `publishPromptTemplate`, `rollbackPromptTemplate`, `copyPromptTemplate`, `deletePromptTemplate`, `createPromptVariable`, `updatePromptVariable`, `deletePromptVariable`, `renderPromptTemplate`, `testPromptTemplate`.
- Entities/fields/statuses: `PromptTemplateDetail`, variables, versions, test_records, agent_references, audit_records, `RenderPromptResult`, `TestPromptResult`.
- Existing components/design system: `Button`, `Card`, `EmptyState`, `StatusBadge`, `PromptVariableFormPanel`, `prompt-status` labels.
- Required states: loading, error, permission-disabled actions, empty variables, empty versions, render/test JSON validation errors, test result, recent test empty state, delete confirmation.
- IA constraint: `/prompts/[id]` is detail and operational workflow page. Basic metadata/body form editing must navigate to `/prompts/[id]/edit`; detail may still own inline content save, variable CRUD, publish/rollback, render/test, references and activity.
