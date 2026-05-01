# Project UI Brief

- Project: Enterprise Agent Platform
- Page: M17 Real Model Execution
- Route: `/conversations/[id]`
- Feature goal: surface the shift from deterministic runtime to provider-backed real model execution across conversations, inline agent testing, and model compatibility checks
- Parent layout: protected console shell, conversation detail page, agent detail test panel, model center test panel
- Target users: tenant operators and admins who configure providers and debug agent responses

## APIs and Services

- `testModelProvider(providerId, { model_config_id, prompt })`
- `createConversation({ agent_id, title, message })`
- `sendConversationMessage(conversationId, { message })`
- `streamConversationMessage(conversationId, { message })`
- existing conversation detail and model provider detail queries

## Entities and Fields

- Conversation run:
  - `request_model`
  - `status`
  - `prompt_tokens`
  - `completion_tokens`
  - `total_tokens`
  - `latency_ms`
  - `error_message`
- Model test result:
  - `request_model`
  - `status`
  - `latency_ms`
  - `prompt_tokens`
  - `completion_tokens`
  - `total_cost`
  - `output_text`
- Model call log:
  - `trace_id`
  - `request_model`
  - `status`
  - `total_cost`

## Existing Components and Design System

- `ConversationContent`
- `ConversationDetailContent`
- `AgentConversationTestPanel`
- `ModelsContent`
- `StatusBadge`, `Card`, `MetricCard`, `Button`

## Required States

- loading:
  - provider test in progress
  - conversation stream in progress
- empty:
  - no model logs yet
  - no conversation runs yet
- error:
  - provider call failed
  - unsupported provider type
  - missing executable model configuration
- validation:
  - active provider, model, and API key required for real execution
- disabled:
  - existing permission boundaries remain
- success:
  - provider test produces real output
  - conversation run stores real request model and model call log
- fallback:
  - deterministic runtime remains available when no executable model context exists

## Constraints

- Keep UI copy in Chinese.
- Preserve existing conversation and model page layouts.
- Do not break existing deterministic fallback behavior for tenants that have no executable model setup.
