# M20 Prompt Live Testing

## Scope

M20 upgrades prompt template testing from a render-only mock result into provider-backed real model execution.

Reused contracts:

```text
POST /api/v1/prompt-templates/:id/test
GET  /api/v1/prompt-templates/:id
```

## Behavior

M20 changes prompt testing in three ways:

1. Rendered prompt content is now sent to a real executable chat model when the tenant has one.
2. Prompt test records now expose the provider and request model used during the test.
3. Real prompt tests also write through the shared `model_call_log` pipeline, so prompt experiments contribute to model observability.

When no executable chat model exists, the API now returns a clear operator-facing error instead of pretending that a mock runtime test has run successfully.

## Architecture Notes

M20 does not add a new table. It reuses:

- `prompt_test_record`
- `model_call_log`
- `model_provider`
- `model_config`
- `model_api_key`

The prompt service now shares the same OpenAI-compatible execution client introduced for conversation execution, so prompt testing and conversation generation no longer drift apart.
