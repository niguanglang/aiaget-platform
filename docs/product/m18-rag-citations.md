# M18 RAG Citations

## Scope

M18 upgrades knowledge bindings from passive configuration into active retrieval injection and citation persistence during conversation execution.

Reused contracts:

```text
POST /api/v1/knowledge-bases/:id/retrieval-test
POST /api/v1/conversations
POST /api/v1/conversations/:id/messages
POST /api/v1/conversations/:id/messages/stream
```

## Behavior

M18 adds a real retrieval path before assistant generation:

1. Conversation execution checks the current agent's active knowledge bindings.
2. The system scores bound knowledge segments against the current user message.
3. Matched results are stored back into `knowledge_recall_log`.
4. Top references are injected into the runtime request and persisted into the assistant message `references` field.
5. Inline agent testing and conversation detail both surface those citations directly in the UI.

## Architecture Notes

M18 does not add a new table. It activates existing structures:

- `agent_knowledge_binding`
- `knowledge_segment`
- `knowledge_recall_log`
- `conversation_message.references`

The retrieval scorer still uses the repository's deterministic keyword strategy, but now it participates in the live conversation path instead of only the standalone retrieval tester.
