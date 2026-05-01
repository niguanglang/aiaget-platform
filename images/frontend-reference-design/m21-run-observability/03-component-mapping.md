# Component Mapping

Reference images are not committed yet for M21. This implementation follows the existing conversation and agent test surfaces.

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Conversation run trace | `apps/web/src/components/conversations/conversation-detail-content.tsx` | `ConversationRunItem`, `ConversationRunStepItem` | Existing run card upgraded to show step-level metric chips and aggregated cost. |
| Agent inline run summary | `apps/web/src/components/agents/agent-conversation-test-panel.tsx` | latest `ConversationRunItem` | Compact view now keeps model, retrieval, and tool steps visible together. |
| Backend step payload | `apps/control-api/src/conversations/conversations.service.ts` | enriched `steps` JSON | No new table; richer step payload drives both UI surfaces. |
