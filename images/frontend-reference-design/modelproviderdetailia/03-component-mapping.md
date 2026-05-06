# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell/background | `model-provider-detail-content.tsx`, `ModelCenterBackground`, `Card` | Next route `/models/[id]` | Keep query/mutation/state in shell; move UI sections to focused components. |
| Provider header | `model-provider-detail-header.tsx` | `ModelProviderDetail`, `enableModelProvider`, `disableModelProvider` | Back to `/models`, edit link `/models/${provider.id}/edit`, no supplier delete action here. |
| Metrics | `MetricCard` in detail shell | `model_count`, `enabled_model_count`, `api_key_count`, `last_call_at` | Keep concise overview. |
| Model config card | `model-config-card.tsx`, `ModelFormPanel` | `ModelConfigItem`, model config CRUD/status APIs | Card displays config list and row actions; create/edit form remains drawer. |
| API key card | `model-api-key-card.tsx` | `ModelApiKeyItem`, `createModelApiKey`, `deleteModelApiKey` | Uses password input for write-only key; displays `masked_key`, never raw key. |
| Compatibility test card | `model-provider-test-card.tsx` | `TestModelProviderResult`, `testModelProvider` | Runs default/first model test and shows trace, tokens, latency, output/error. |
| Cost/log card | `model-cost-log-card.tsx` | `ModelCostRuleItem`, `ModelCallLogItem` | Cost rules and call logs remain read-only detail tables. |
| Confirmation | `model-provider-confirm-dialog.tsx` | `deleteModelConfig` | For model config deletion only in this detail page. |
| Loading/error states | `model-provider-detail-content.tsx` | `getModelProvider` | Use existing card error/loading style and Chinese text. |
