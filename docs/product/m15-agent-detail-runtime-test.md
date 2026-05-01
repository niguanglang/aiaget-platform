# M15 Agent Detail Runtime Test

## Scope

M15 replaces the placeholder conversation card on `/agents/:id` with a real inline testing surface that reuses the existing conversation contracts.

Reused contracts:

```text
POST /api/v1/conversations
GET  /api/v1/conversations/:id
POST /api/v1/conversations/:id/messages/stream
```

## Page Design

The `/agents/:id` page now supports:

1. Creating a dedicated test thread from the current agent detail page.
2. Reusing that thread for follow-up messages with streamed assistant output.
3. Viewing the inline message stream without leaving the agent detail route.
4. Inspecting the latest run summary with latency, token usage, and recent steps.
5. Surfacing the latest tool call summary, including approval-required placeholder states.
6. Jumping into the full conversation detail page for deeper debugging and feedback.

## Architecture Notes

M15 does not introduce a new database table or a parallel test API. The panel stores the latest test conversation ID in browser local storage per agent, loads the real `ConversationDetail`, and reuses the existing M13 streaming flow for follow-up turns. The first message still uses `POST /api/v1/conversations`, while subsequent messages stream through `POST /api/v1/conversations/:id/messages/stream`.
