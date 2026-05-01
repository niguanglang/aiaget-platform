# Project UI Brief

- Project: Enterprise Agent Platform
- Page: M21 Run Observability
- Route: `/conversations/[id]`
- Feature goal: expose step-level model, retrieval, and tool metrics in conversation detail and inline agent testing
- Parent layout: protected console shell, conversation detail page, agent detail inline test panel
- Target users: tenant operators and admins debugging live executions

## APIs and Services

- existing conversation detail query
- existing conversation create / continue / stream flows

## Entities and Fields

- run:
  - `request_model`
  - `latency_ms`
  - `prompt_tokens`
  - `completion_tokens`
  - `cost_total`
- step:
  - `request_model`
  - `tool_name`
  - `retrieval_mode`
  - `response_status`
  - `latency_ms`
  - `prompt_tokens`
  - `completion_tokens`
  - `cost_total`
  - `item_count`

## Existing Components and Design System

- `ConversationDetailContent`
- `AgentConversationTestPanel`
- `StatusBadge`, `Card`, `Button`

## Required States

- success:
  - steps show model, retrieval, and tool metadata
- fallback:
  - deterministic runtime still renders a consistent step shape even when model/provider context is missing

## Constraints

- Keep all visible UI copy in Chinese.
- Do not add a new run-detail route.
- Reuse the existing `steps` JSON instead of adding a separate observability table.
