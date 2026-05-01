# M08 Conversation Center

## Scope

M08 adds tenant-scoped conversation threads with persisted messages, deterministic runtime responses, run traces, tool-call summaries, and operator feedback.

Implemented contracts:

```text
GET    /api/v1/conversations
POST   /api/v1/conversations
GET    /api/v1/conversations/:id
DELETE /api/v1/conversations/:id
POST   /api/v1/conversations/:id/messages
POST   /api/v1/conversations/:id/feedback
POST   /runtime/conversations/respond
```

## Tables

```text
conversation
conversation_message
conversation_run
conversation_feedback
```

Tool call summaries are derived from existing M07 tool execution and persisted inside conversation messages and run steps. The first M08 implementation keeps knowledge references optional and focuses on the chat/run/feedback chain.

## List Page Design

The `/conversations` page now owns conversation discovery and fast continuation:

1. Metrics for conversations, messages, active threads, and feedback.
2. Keyword, Agent, and status filters.
3. Conversation table with title, Agent, user, status, message count, last run status, last message time, and actions.
4. New conversation drawer with published Agent selection and first user message.
5. Selected conversation side panel for recent messages, reply composer, and open-detail action.
6. Archive action with soft-delete semantics.

## Detail Page Design

The `/conversations/[id]` page supports full conversation inspection:

1. Header summary with Agent, status, latest run status, and archive action.
2. Message stream for user and assistant turns.
3. Runtime run trace cards with step summaries, model label, latency, and token counts.
4. Reference and tool-call summary panel.
5. Feedback form and feedback history list.
6. Continue-message composer for ongoing threads.

## Architecture Notes

All APIs are tenant-scoped and protected by `conversation.read` or `conversation.write`. The Runtime endpoint uses a deterministic responder in M08, returning structured reply text, run steps, token estimates, and optional tool-call summaries. A lightweight heuristic triggers bound health-check tools when the user asks about health or status, so M08 demonstrates end-to-end runtime plus tool orchestration without requiring a full LLM stack. Live token streaming and richer citation retrieval are intentionally deferred to later milestones.
