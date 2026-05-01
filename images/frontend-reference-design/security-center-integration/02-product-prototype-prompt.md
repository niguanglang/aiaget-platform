# Product Prototype / Wireframe Prompt

Paste the low/mid-fidelity prototype prompt here.
# Product Prototype / Wireframe Image Prompt

Create a mid-fidelity product prototype / wireframe image for the enterprise Agent Platform security center page.

Project context:
- Page/route: 安全中心 at `/security`.
- Users/roles: 租户管理员、安全管理员、审计员.
- Main task flow: view posture -> identify risk -> open governance module -> manage ABAC policy -> run simulation -> review evaluation log.
- API/service contract: `GET /security-center/overview`, security policy overview/list/evaluations/simulate, and links to data scopes/resource ACLs/approvals/audit/monitor.
- Data entities and fields: security score, risk level, policy counts, data scope counts, ACL counts, approval counts, audit security event counts, monitor latency/success/error counts.
- Actions and states: create policy, run simulation, open module pages, edit/toggle/delete policy, loading, empty, error, permission disabled.

Prototype requirements:
- Use a dashboard wireframe with named regions:
  1. Header and status badges.
  2. Four top metric cards.
  3. Governance Bento Grid with six module cards.
  4. Risk signals and recommended actions.
  5. Existing policy management table.
  6. Simulation panel.
  7. Evaluation log.
- Make component boundaries obvious.
- Keep labels in Chinese.
- Fit desktop layout, with clear responsive stacking hints.

Avoid:
- polished decorative rendering
- invented backend fields
- unrealistic navigation or actions
