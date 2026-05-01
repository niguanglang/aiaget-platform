# Project UI Brief

- Project: Enterprise Agent Platform
- Page: M20 Prompt Live Testing
- Route: `/prompts/[id]`
- Feature goal: turn prompt testing into a real provider-backed model execution workflow with visible model metadata
- Parent layout: protected console shell, prompt detail page, prompt center side detail card
- Target users: tenant operators and admins iterating on prompts against real model behavior

## APIs and Services

- `renderPromptTemplate`
- `testPromptTemplate`
- prompt detail query

## Entities and Fields

- test result:
  - `status`
  - `model_provider_name`
  - `request_model`
  - `latency_ms`
  - `output_text`
  - `error_message`
- test record:
  - same metadata persisted into history

## Existing Components and Design System

- `PromptDetailContent`
- prompt center selected detail card
- `StatusBadge`, `Card`, `Button`

## Required States

- success:
  - real model output returned
  - provider/model metadata displayed
- failure:
  - missing executable model
  - provider call failure
- fallback:
  - no fake success message when execution did not actually happen

## Constraints

- Keep all visible UI copy in Chinese.
- Reuse the existing prompt test route instead of creating a parallel debug API.
- Surface model metadata without redesigning the prompt pages.
