# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: Conversation detail at `/conversations/[id]`
- Users/roles: tenant operators and admins
- Main task flow: send message, watch streamed assistant reply, confirm completion into persisted history, inspect run trace
- API/service contract: conversation detail, feedback, stream message endpoint, runtime stream endpoint
- Data entities and fields: live assistant text buffer, final conversation detail, trace metadata, references, tool calls
- Actions and states: send, connecting, streaming, done, error, archived-disabled

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Focus on how the live response region fits into the existing detail page.
- Show these regions clearly:
  - message composer
  - in-progress assistant response bubble or pane
  - status line for stream start/progress/error
  - final persisted message list after completion
  - trace panel staying stable during streaming
- Make component boundaries obvious so a frontend engineer can map each region to current components.

Avoid:
- decorative rendering
- invented backend fields
- unrealistic chat animation widgets
