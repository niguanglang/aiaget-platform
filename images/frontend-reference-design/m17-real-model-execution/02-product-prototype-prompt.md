# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend surfaces.

Project context:
- Route focus: `/conversations/[id]`
- Related surfaces: agent inline test panel and model center test panel
- Main task flow:
  - run a real provider compatibility test
  - open or continue a conversation
  - observe stream updates
  - inspect the real request model and run status
  - understand whether the flow used real execution or deterministic fallback
- API/service contract:
  - provider test
  - conversation create
  - conversation continue
  - conversation stream

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Show the conversation detail page with explicit regions for:
  - message stream
  - latest run summary
  - model name and token counts
  - error banner / fallback cue
- Show supporting notes for the agent test panel and model test output regions.
- Keep layouts realistic for the existing console shell.
