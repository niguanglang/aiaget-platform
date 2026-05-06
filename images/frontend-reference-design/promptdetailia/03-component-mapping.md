# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Shell/query/mutations | `PromptDetailContent` | `getPromptTemplate`, mutations | Shell owns data, state, and layout composition. |
| Header/actions | `PromptDetailHeader` | `PromptTemplateDetail`, copy/publish/delete handlers | Edit must link to `/prompts/${promptId}/edit`. |
| Metrics | `PromptMetricGrid` | variables, versions, tests, references | Read-only summary. |
| Content editor | `PromptContentEditorCard` | `updatePromptTemplate` content save | Detail-owned content workflow; not full form. |
| Variables | `PromptVariablesCard`, `PromptVariableFormPanel` | variable CRUD | Variable form remains drawer/panel. |
| Versions | `PromptVersionsCard` | publish/rollback APIs | Owns change note and rollback actions. |
| Metadata side card | `PromptMetadataCard` | `PromptTemplateDetail` | Read-only detail info. |
| Render/test | `PromptRenderTestCard` | `renderPromptTemplate`, `testPromptTemplate` | Shows provider/model from test result. |
| Recent tests/references/activity | `PromptHistoryCards` | test_records, agent_references, audit_records | Read-only side cards. |
| Delete confirmation | `PromptConfirmDialog` | `deletePromptTemplate` | Destructive confirmation. |
