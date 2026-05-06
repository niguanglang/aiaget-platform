# Product Prototype / Wireframe Prompt
Create a product prototype / wireframe image for the Enterprise Agent Platform Prompt Center split.

Project context:
- Page/routes: `/prompts` list, `/prompts/create` create form, `/prompts/[id]` detail, `/prompts/[id]/edit` edit form
- Users/roles: tenant admin, prompt admin, agent admin, readonly auditor
- Main task flow: find a prompt in the list -> open detail -> edit content/variables -> render/test -> publish version -> review test records and Agent references
- API/service contract: listPromptTemplates, getPromptTemplate, createPromptTemplate, updatePromptTemplate, deletePromptTemplate, copyPromptTemplate, publishPromptTemplate, rollbackPromptTemplate, renderPromptTemplate, testPromptTemplate, variable CRUD, listUsers
- Data fields: prompt name/code/type/status/version/preview/owner/counts/updated_at; detail content/variables/versions/test_records/agent_references/audit_records

Prototype requirements:
- Low to mid fidelity wireframe style with clear Chinese section labels.
- Show list page as:
  - header and metrics
  - search/filter toolbar
  - table with limited fields
  - row actions
  - empty/error/loading placeholders
- Show detail page as:
  - header actions
  - metrics
  - left main editor/variables/versions
  - right metadata/render-test/recent tests/references/audit
- Show create/edit page as route-level form, not a drawer inside the list.
- Clearly mark unsupported/low-frequency operations under detail or "more" areas.
- Make component boundaries obvious for implementation with Tailwind and shadcn-style components.

Avoid:
- polished-only visuals without interaction states
- adding unrelated prompt marketplace/plugin concepts
- combining detail, form, and list into one page
Paste the low/mid-fidelity prototype prompt here.
