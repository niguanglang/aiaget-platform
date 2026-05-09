# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: Agent detail at `/agents/[id]`
- Users/roles: tenant admins and operators
- Main task flow: inspect current agent, bind one resource, review existing bindings, edit knowledge/tool config, remove obsolete bindings
- API/service contract: agent detail query plus binding create/update/delete APIs for models, prompts, knowledge, and tools
- Data entities and fields:
  - model binding: provider, model, binding type
  - prompt binding: prompt, role
  - knowledge binding: knowledge base, weight, `TopK`
  - tool binding: tool, require approval
- Actions and states:
  - create binding
  - delete binding
  - edit knowledge settings
  - edit tool approval setting
  - loading
  - empty
  - error
  - disabled by permission
  - delete confirmation before removing any binding

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Focus on information architecture and operational workflow, not decorative rendering.
- Show the binding surface as four cards in a responsive grid under the agent summary area.
- Each card should contain:
  - title and helper text
  - compact form row
  - current bindings list
  - inline action area for edit/save/cancel where relevant
- Make it obvious where error banners and disabled controls appear.
- Show a shared confirmation dialog pattern for removing model, prompt, knowledge, or tool bindings.
- Keep the page realistic for a console product with sidebar and topbar context.
- Use Chinese section labels so a frontend engineer can directly map wireframe regions to the final implementation.

Avoid:
- polished illustration
- invented backend entities
- unrealistic dialog-heavy workflows
- extra modules that do not exist on the real route
