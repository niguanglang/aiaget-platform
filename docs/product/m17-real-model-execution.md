# M17 Real Model Execution

## Scope

M17 upgrades conversation generation and model compatibility testing from deterministic mock output to provider-backed real model execution for `OPENAI_COMPATIBLE` providers.

Reused contracts:

```text
POST /api/v1/model-providers/:id/test
POST /api/v1/conversations
POST /api/v1/conversations/:id/messages
POST /api/v1/conversations/:id/messages/stream
```

## Behavior

M17 adds a provider-backed execution path while preserving the existing deterministic runtime as fallback:

1. Model center compatibility tests now call the configured provider endpoint with the active API key instead of writing a mock-only call log.
2. Conversation create, continue, and stream flows resolve the agent-bound model first.
3. If no executable model binding or no active API key is available, the system falls back to the old deterministic runtime path so existing tenant data does not hard-fail.
4. If a real provider is configured but the provider call fails, the conversation stores a failed run plus a readable assistant error message instead of silently falling back.
5. Successful provider-backed runs write real `model_call_log` rows with token usage, latency, and calculated cost.

## Architecture Notes

M17 does not add a new table. The main implementation changes are:

- shared OpenAI-compatible client for real provider execution
- shared model secret decryption utility
- model center test path upgraded from mock to real call
- conversation service upgraded to prefer real model execution and keep the old runtime path as fallback

Streaming still uses the existing frontend SSE contract. For provider-backed chat, the Control API accumulates real provider deltas and then persists the final conversation detail through the same M13 event shape.
