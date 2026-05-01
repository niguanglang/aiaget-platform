# Component Mapping

Reference images are not committed yet for M17. This implementation follows the project prompt pack and the existing conversation/model surfaces.

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Conversation list header tags | `apps/web/src/components/conversations/conversation-content.tsx` | existing conversation queries | Updated milestone signal and copy to reflect real model execution. |
| Conversation run model label | `apps/web/src/components/conversations/conversation-detail-content.tsx` | `ConversationRunItem.request_model` | Keeps the existing run card layout but now highlights the real request model returned by execution. |
| Agent inline test description | `apps/web/src/components/agents/agent-conversation-test-panel.tsx` | existing inline conversation test flow | Clarifies real-model-first execution with deterministic fallback. |
| Model center header copy | `apps/web/src/components/models/models-content.tsx` | `testModelProvider`, model provider detail | Signals that provider tests are now real calls instead of mock-only checks. |
| Backend execution path | `apps/control-api/src/conversations/conversations.service.ts`, `apps/control-api/src/models/models.service.ts` | conversation and model APIs | Real provider-backed execution is implemented behind existing routes, so frontend contracts stay stable. |
