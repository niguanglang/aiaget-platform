# Component Mapping

Reference images are not committed yet for M18. This implementation follows the current agent and conversation surfaces.

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Live retrieval path | `apps/control-api/src/knowledge/knowledge.service.ts` | `retrieveAgentReferences` and `knowledge_recall_log` | Reuses the existing deterministic retrieval scorer for the live conversation path. |
| Conversation request assembly | `apps/control-api/src/conversations/conversations.service.ts` | `RuntimeConversationRequest.references` | Injects retrieval results before provider or fallback generation. |
| Inline citation preview | `apps/web/src/components/agents/agent-conversation-test-panel.tsx` | assistant message `references` | Adds a compact citation block to the agent test panel. |
| Full reference panel | `apps/web/src/components/conversations/conversation-detail-content.tsx` | stored `ConversationReferenceItem[]` | Existing conversation references panel now receives real live citations. |
