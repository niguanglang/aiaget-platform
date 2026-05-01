# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: M40 权限与安全闭环 at `/security`
- Users/roles: 租户管理员、安全管理员、审计员
- Main task flow: user opens Security Center, checks posture and guard chain, reviews runtime denied events, drills into policy evaluation logs, then creates or adjusts a security policy.
- API/service contract: `getSecurityCenterOverview`, `getSecurityPolicyOverview`, `listSecurityPolicies`, `listSecurityPolicyEvaluations`, `simulateSecurityPolicy`, policy CRUD and status actions.
- Data entities and fields: posture, metrics, modules, risks, recent policy evaluations, security denials, audit failures, monitor errors, policies.
- Actions and states: create, edit, delete, enable, disable, simulate, filter, open module, empty/error/loading/permission states.

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Show component boundaries clearly:
  1. header + posture score
  2. guard chain strip
  3. closure metrics cards
  4. recent denial events panel
  5. governance modules grid
  6. risk signals
  7. policy table
  8. simulator and evaluation log
- Add labels for disabled actions when user lacks write permission.
- Keep layout realistic for current console shell and responsive dashboard.
- Use Chinese section labels.

Avoid:
- polished decorative rendering
- fake backend fields beyond the listed security center extension
- unrealistic full-screen modal-first workflow
