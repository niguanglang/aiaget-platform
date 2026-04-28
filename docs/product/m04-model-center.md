# M04 Model Center

## Scope

M04 adds tenant-scoped model provider management, model configuration, masked API key handling, cost rules, rate limits, compatibility testing, and call logs.

Implemented contracts:

```text
GET    /api/v1/model-providers
POST   /api/v1/model-providers
GET    /api/v1/model-providers/:id
PATCH  /api/v1/model-providers/:id
DELETE /api/v1/model-providers/:id
POST   /api/v1/model-providers/:id/disable
POST   /api/v1/model-providers/:id/enable
POST   /api/v1/model-providers/:id/api-keys
DELETE /api/v1/model-providers/:id/api-keys/:keyId
POST   /api/v1/model-providers/:id/test
POST   /api/v1/models
PATCH  /api/v1/models/:id
DELETE /api/v1/models/:id
POST   /api/v1/models/:id/disable
POST   /api/v1/models/:id/enable
```

## Tables

```text
model_provider
model_config
model_api_key
model_cost_rule
model_call_log
```

API keys are write-only at the API boundary. The database stores encrypted key material, a hash, a prefix, and a masked display value. The frontend never receives the raw key.

## List Page Design

The `/models` page now owns provider and model workflows:

1. Metrics for providers, enabled models, selected provider calls, and selected provider cost.
2. Keyword, provider type, status, and capability filters.
3. Provider table with name/code/base URL, type, status, model count, key count, last call, updated time, and actions.
4. Provider create/edit drawer.
5. Model create/edit drawer with capabilities, context length, token pricing, rate limit, status, and default flag.
6. Provider detail panel for model configs, masked API keys, compatibility test, and call logs.
7. Soft delete confirmations.

## Architecture Notes

All APIs are tenant-scoped and protected by `model.read` or `model.write`. The first executable adapter is OpenAI Compatible. M04's compatibility test writes structured call logs and validates the provider/model/key/cost-log pipeline; later runtime work can replace the mock adapter path with real provider calls.
