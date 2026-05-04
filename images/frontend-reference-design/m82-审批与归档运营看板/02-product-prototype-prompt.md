# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe for a security center approval and archive operations card.

Route:
- `/security`

Main task flow:
1. Security admin opens security center.
2. Reviews global posture.
3. Reviews `审批与归档运营` card.
4. Sees pending tool/policy/archive approvals and audit/archive stats.
5. Uses quick links to handle approvals or inspect approval audit events.

Wireframe requirements:
- Show existing security posture region.
- Add a clearly bounded `审批与归档运营` Bento card below or beside the module grid.
- Show metric rows/cards for pending approvals, audit events and archive storage.
- Show quick actions.
- Show normal/loading/unavailable placeholders.

Avoid:
- new routes, unrelated storage upload UI, invented fields not in the backend contract.
