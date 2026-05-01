# Project UI Brief

- Project: Enterprise Agent Platform
- Page: M15 Agent Detail Runtime Test
- Route: `/agents/[id]`
- Feature goal: replace the agent detail conversation placeholder with a real inline test panel that reuses the conversation module
- Parent layout: protected console shell, agent detail header, binding grid, versions card, audit timeline
- Target users: tenant operators and admins with `conversation.write` or `tenant_admin`, testing agents before or after publish

## APIs and Services

- `getAgent(agentId)`
- `createConversation({ agent_id, title, message })`
- `getConversation(conversationId)`
- `streamConversationMessage(conversationId, { message })`
- existing conversation stream events:
  - `start`
  - `delta`
  - `done`
  - `error`

## Entities and Fields

- Agent detail:
  - `id`, `name`, `code`, `status`, `version`
- Conversation detail:
  - `id`, `title`, `status`, `message_count`, `updated_at`
- Messages:
  - `role`, `content`, `created_at`
- Runs:
  - `status`, `request_model`, `prompt_tokens`, `completion_tokens`, `latency_ms`, `steps`
- Tool calls:
  - `tool_name`, `tool_code`, `status`, `response_status`, `latency_ms`, `output_preview`, `error_message`

## Existing Components and Design System

- `AgentDetailContent`
- `ConversationDetailContent` as interaction reference
- `Card`, `Button`, `StatusBadge`, `EmptyState`
- Lucide icons
- Tailwind CSS responsive grid with thin borders and soft glass background

## Required States

- loading:
  - loading previously opened test thread
- empty:
  - no test thread yet for current agent
- error:
  - create thread failure
  - load thread failure
  - stream failure
- validation:
  - empty message disabled / rejected
- disabled:
  - no write permission
  - archived conversation
  - pending create or stream request
- success:
  - first message creates thread and returns assistant reply
  - follow-up messages stream in place
- permission-denied:
  - readable panel, but message composer and actions disabled

## Constraints

- Reuse the existing conversation contract instead of inventing a parallel test API.
- Keep all visible copy in Chinese.
- The panel must fit the existing `/agents/[id]` layout and not overwhelm the version panel.
- Preserve the existing conversation route as the source of truth for full history and diagnostics.
