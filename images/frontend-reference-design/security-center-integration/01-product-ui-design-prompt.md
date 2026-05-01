# Product UI Design Image Prompt

Paste the high-fidelity product UI prompt here.
# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise SaaS admin page.

Project context:
- Product/module: 企业 Agent 平台，安全中心整合页。
- Page/route: 安全中心 at `/security`.
- Target users/roles: 租户管理员、安全管理员、审计员。
- Business goal: unify ABAC security policies, RBAC-adjacent data scopes, resource ACL, high-risk tool approvals, audit, and monitor signals in one operational security console.
- Existing frontend stack/design system: Next.js App Router, React Query, TypeScript, Tailwind CSS, shadcn-like components, Card/Button/Input/MetricCard/StatusBadge, restrained Motion animations.
- Existing page shell/layout: console layout with left navigation and topbar; page content max width, responsive dashboard layout.

Interface contract that must appear in the UI:
- API/service functions: `getSecurityCenterOverview`, `getSecurityPolicyOverview`, `listSecurityPolicies`, `listSecurityPolicyEvaluations`, `simulateSecurityPolicy`.
- Main entities and fields: security score, policy total/active/deny/allow, data scope configured roles/custom scopes, resource ACL allow/deny/active counts, approval pending/runtime pending, audit login/operation/security events/config changes/success rate, monitor success rate/latency/error count.
- Status values/enums: `ACTIVE`, `DISABLED`, `DENY`, `ALLOW`, `PENDING`, `APPROVED`, `REJECTED`, `SUCCESS`, `FAILED`, `DEGRADED`.
- User actions: create security policy, open data scopes, open resource ACLs, open approvals, open audit, open monitor, run ABAC simulation, edit/enable/disable/delete policy.
- Required states: loading, empty, error, validation, disabled, success, permission-denied.

Design requirements:
- Make it look like a real production security operations page, not a generic template.
- Use a Bento Grid / dashboard layout with clear hierarchy and adequate whitespace.
- Use thin borders, subtle shadows, backdrop blur, and restrained gradient mesh/noise texture.
- Show the primary workflow clearly: observe security posture, jump to governance module, tune policies, simulate access, inspect recent evaluation logs.
- Include realistic operational panels: security posture metrics, governance module cards, risk signal list, ABAC policy table, simulation panel, evaluation log.
- Keep UI text in Chinese.
- Use restrained enterprise visual style: minimal, technical, polished, product-grade.

Avoid:
- fake modules not listed above
- decorative glow or oversized rounded blobs
- unreadable tiny text or dense information overload
- unrelated charts that cannot map to project data
