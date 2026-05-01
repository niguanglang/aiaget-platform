# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: Agent detail at `/agents/[id]`
- Users/roles: tenant admins and operators
- Main task flow:
  - enter the agent detail page
  - send the first test message
  - view the returned assistant reply
  - continue the thread with streaming
  - inspect latest run and tool call status
  - jump to the full conversation page if deeper debugging is needed
- API/service contract:
  - `createConversation`
  - `getConversation`
  - `streamConversationMessage`
  - existing conversation stream events
- Data entities and fields:
  - conversation status
  - latest run status
  - message list
  - run steps
  - tool call summary

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Focus on information architecture and state transitions.
- Show the `会话测试` panel inside the existing right-side card area of the agent detail page.
- Make these regions explicit:
  - panel header and actions
  - empty state
  - message stream
  - run summary block
  - tool summary block
  - composer
  - error / loading / streaming state banners
- Keep the page realistic for the current console shell and agent detail composition.

Avoid:
- polished illustration
- invented new routes or forms
- modal-heavy workflow
- backend fields that do not exist in the current conversation contract
