# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: Conversation Center at `/conversations` with detail route `/conversations/[id]`
- Users/roles: tenant operators and admins with read/write permissions
- Main task flow: select Agent, create conversation, send message, read assistant response, inspect trace, review tool calls, leave feedback
- API/service contract: list/create/get/delete conversation; send message; create feedback; runtime respond endpoint
- Data entities and fields: thread list row, message stream, run trace items, tool-call summary, reference cards, feedback form
- Actions and states: create, continue, delete, feedback submit, loading, empty, error, validation, disabled, runtime failure

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Focus on information architecture, page regions, and thread-to-detail workflow.
- Show these regions clearly:
  - page header with metrics and primary action
  - thread list filters
  - conversation table/list
  - selected conversation preview with message composer
  - detail route sections for message stream, run traces, tool calls, references, and feedback
  - create conversation drawer and delete confirmation
- Include placeholders for no Agents, no references, no tool calls, runtime failure, and no feedback yet.
- Make component boundaries obvious so a frontend engineer can map each region to existing components.
- Keep layout realistic for the current console shell and responsive behavior.

Avoid:
- decorative polishing
- invented backend fields
- unrealistic navigation or actions
