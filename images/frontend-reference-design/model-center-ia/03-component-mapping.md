# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Console shell | `apps/web/src/app/(console)/layout.tsx` | route shell | Reuse existing shell |
| Model list page | `apps/web/src/components/models/models-content.tsx` | `listModelProviders`, `ModelProviderListItem` | Keep overview/filter/table only |
| Provider create page | `apps/web/src/components/models/model-provider-create-content.tsx` | `createModelProvider`, `CreateModelProviderInput` | New route `/models/create` |
| Provider edit page | `apps/web/src/components/models/model-provider-edit-content.tsx` | `getModelProvider`, `updateModelProvider` | New route `/models/[id]/edit` |
| Provider detail page | `apps/web/src/components/models/model-provider-detail-content.tsx` | `getModelProvider`, `ModelProviderDetail` | New route `/models/[id]` |
| Provider form | `apps/web/src/components/models/provider-form-panel.tsx` | provider DTOs | Add `presentation=\"page\"` |
| Model form | `apps/web/src/components/models/model-form-panel.tsx` | model DTOs | Keep detail-owned drawer; includes runtime options `max_output_tokens` and `api_version` for Anthropic/Azure adapters |
| Provider table actions | `apps/web/src/components/models/models-content.tsx` | provider enable/disable/delete + route links | View, edit, enable/disable, delete. Status and delete mutations require confirmation dialogs. |
| Model configs section | `model-provider-detail-content.tsx` | `ModelConfigItem`, model config API functions | Detail-owned. Shows max output tokens and API version. Model enable/disable and delete require confirmation dialogs. |
| Provider status confirmation | `models-content.tsx`, `model-provider-detail-content.tsx`, `model-provider-confirm-dialog.tsx` | `enableModelProvider`, `disableModelProvider`, `enableModelConfig`, `disableModelConfig` | Explain Agent binding and dispatch impact before mutating status. |
| API keys section | `model-provider-detail-content.tsx` | `ModelApiKeyItem`, key API functions | Detail-owned, masked-only |
| Cost rules section | `model-provider-detail-content.tsx` | `ModelCostRuleItem` | Read-only list in detail |
| Compatibility test | `model-provider-detail-content.tsx` | `testModelProvider`, `TestModelProviderResult` | Detail-owned |
| Call logs section | `model-provider-detail-content.tsx` | `ModelCallLogItem` | Detail-owned |
| Empty/error states | `EmptyState`, `StatusBadge`, `Card` | query/mutation state | Reuse current UI primitives |
