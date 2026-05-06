# Product Prototype / Wireframe Prompt

Create a low-fidelity wireframe for the department organization module, focused on information architecture and route separation.

Routes to show as separate screens or linked states:
- `/departments`
- `/departments/create`
- `/departments/[id]`
- `/departments/[id]/edit`

Prototype requirements:
- The list page contains only overview metrics, search/filter toolbar, organization tree, table, and row actions
- The create page contains a standalone department form with parent selection, leader selection, code, name, description, sort order, and status
- The detail page contains read-only summary, hierarchy context, leader, members, timestamps, and action buttons
- The edit page reuses the same form structure as create, but populated with existing values
- Show loading, empty, validation, and permission-restricted states where relevant

Wireframe style:
- Boxy layout, minimal decoration, clear section boundaries, readable hierarchy
- Emphasize component placement and route-level separation rather than visual polish
- Chinese field labels and action labels
