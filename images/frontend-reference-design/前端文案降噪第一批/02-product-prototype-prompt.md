# Product Prototype / Wireframe Prompt

Create a low/mid-fidelity wireframe for copy-cleaned enterprise admin pages.

Project context:
- Page group: root entry, login, dashboard, menu center, role center, user center, audit center, approval center, security overview.
- Main task flow: user opens a module -> scans title/metrics/table/filter -> acts through buttons or row actions.
- API/service contract: no new APIs; preserve existing list, overview, refresh and route navigation behavior.
- Data fields: current metrics, table columns, filters and status badges from the existing pages.

Prototype requirements:
- Show page header with title, one short data-scope subtitle at most, and primary actions.
- Show metric cards with short helpers.
- Show table/card sections with concise section subtitle or no subtitle.
- Show empty states with short operational copy.
- Mark removed areas: marketing paragraph, IA explanation, “this page is responsible for...” text, migration notices.

Avoid:
- long prose blocks,
- onboarding explanations,
- feature marketing,
- copy that explains internal page architecture,
- text that makes the admin UI look generated.
