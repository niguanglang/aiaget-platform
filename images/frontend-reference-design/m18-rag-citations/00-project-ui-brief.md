# Project UI Brief

- Project: Enterprise Agent Platform
- Page: M18 RAG Citations
- Route: `/agents/[id]`
- Feature goal: surface real knowledge retrieval injection and citation persistence inside inline agent testing and conversation detail
- Parent layout: protected console shell, agent detail page, conversation detail page, knowledge center retrieval tester
- Target users: tenant operators and admins validating whether a knowledge base is actually participating in generation

## APIs and Services

- existing knowledge retrieval tester
- `createConversation`
- `sendConversationMessage`
- `streamConversationMessage`
- live retrieval through `KnowledgeService.retrieveAgentReferences(...)`

## Entities and Fields

- knowledge binding:
  - `weight`
  - `recall_top_k`
- conversation references:
  - `title`
  - `snippet`
  - `score`
  - `source_type`
- run steps:
  - retrieval step summary
- recall log:
  - `query`
  - `result_count`

## Existing Components and Design System

- `AgentConversationTestPanel`
- `ConversationDetailContent`
- `StatusBadge`, `Card`, `Button`
- existing reference panel on conversation detail

## Required States

- loading:
  - conversation test thread
- empty:
  - no citations for current run
- success:
  - citations appear in assistant message references
  - recall log count increases
- fallback:
  - agent without knowledge bindings continues to work without citation blocks

## Constraints

- Keep all visible UI copy in Chinese.
- Reuse the existing conversation message `references` contract.
- Avoid adding a separate citation page; references must remain embedded in the agent and conversation workflows.
