# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise agent detail page with resource binding management.

Project context:
- Product/module: Enterprise Agent Platform, M14 Agent Resource Bindings
- Page/route: Agent detail at `/agents/[id]`
- Target users/roles: tenant admins and operators who maintain agent runtime configuration
- Business goal: bind real models, prompts, knowledge bases, and tools to a single agent without leaving the detail page
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style primitives, TanStack Query, Motion, Lucide icons
- Existing page shell/layout: protected console with left sidebar and topbar; agent detail page already has header, summary cards, versions, and audit timeline

Interface contract that must appear in the UI:
- Four binding regions inside the agent detail page:
  - `模型绑定`
  - `提示词绑定`
  - `知识库绑定`
  - `工具绑定`
- Model binding fields:
  - provider selector
  - model selector
  - bind action
  - current bindings list showing provider, model code, binding type
- Prompt binding fields:
  - prompt selector
  - prompt role selector for `SYSTEM`, `USER`, `ASSISTANT`, `TOOL`
  - bind action
  - current bindings list showing prompt code, template status, and role
- Knowledge binding fields:
  - knowledge base selector
  - weight input
  - `TopK` input
  - bind action
  - current bindings list with edit and delete actions
- Tool binding fields:
  - tool selector
  - approval checkbox
  - bind action
  - current bindings list with edit and delete actions
- Required states:
  - loading
  - empty
  - error
  - disabled without permission
  - inline edit/save/cancel state for knowledge and tool bindings

Design requirements:
- Make it look like a serious modern SaaS control surface, not a marketing mockup.
- Use Chinese labels for all visible UI copy.
- Keep the binding area as a responsive 2x2 Bento-style grid inside the detail page.
- Use thin borders, subtle glass surfaces, soft shadow, backdrop blur, and very restrained gradient mesh depth.
- Keep hierarchy clean: section icon, title, short helper text, form row, then bound items list.
- Show small operational details like binding counts, approval state, weight, and role tags.
- Use compact, production-ready spacing and controls that clearly map to existing components.
- Add subtle microinteraction cues only through hover and focus states; no flashy animation.
- Overall visual direction: minimal, technical, premium, quiet, Chinese enterprise product UI.

Avoid:
- invented backend fields or fake charts
- oversized hero layout
- emoji
- neon glow
- oversized rounded pills
- dense crowded cards
- decorative 3D elements that compete with the forms
