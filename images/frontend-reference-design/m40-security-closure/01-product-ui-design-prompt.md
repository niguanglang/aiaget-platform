# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: 企业 Agent 平台安全中心
- Page/route: M40 权限与安全闭环 at `/security`
- Target users/roles: 租户管理员、安全管理员、审计员
- Business goal: show whether runtime permissions are truly closed-loop across RBAC, DataScope, Resource ACL, SecurityPolicyGuard, audit failures, and monitor errors.
- Existing frontend stack/design system: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn-style local components, lucide-react icons, motion/react micro-interactions.
- Existing page shell/layout: left navigation + topbar console shell, inner dashboard content with cards, metrics, filters, tables, and side panels.

Interface contract that must appear in the UI:
- API/service functions: `getSecurityCenterOverview`, `getSecurityPolicyOverview`, `listSecurityPolicies`, `listSecurityPolicyEvaluations`, `simulateSecurityPolicy`, policy CRUD and status actions.
- Main entities and fields: posture score, guard chain, active policies, deny policies, resource ACL deny count, pending approvals, security events in 24h, failed monitor events in 24h, configured data scope roles, custom data scopes, list data scope filters, ACL condition checks, recent policy denials, recent audit failures, recent monitor errors.
- Status values/enums: LOW, MEDIUM, HIGH risk; ACTIVE, DISABLED, DELETED policy; ALLOW, DENY, NO_MATCH decision.
- User actions: create policy, edit policy, enable/disable policy, delete policy, run simulation, filter policies, inspect recent denial, navigate to Data Scope, Resource ACL, Audit, Monitor, Approval pages.
- Required states: loading, empty, error, disabled when user lacks `security:rule:manage`, success refresh after mutation, permission-denied action state.

Design requirements:
- Make it look like a production SaaS/admin product, not a generic mockup.
- Use a Bento Grid dashboard layout above the existing strategy workspace.
- First viewport should clearly show security posture, guard chain, closure metrics, and recent runtime denial events.
- Include a compact “权限闭环链路” strip with JWT -> Permission -> DataScope -> ResourceAcl -> SecurityPolicy -> Business.
- Include a “最近拒绝事件” panel with trace id, path, guard source, policy or ACL code, status code, and timestamp.
- Keep visual language minimal, technical, premium, clean, with subtle borders, soft shadow, restrained backdrop blur, and no decorative clutter.
- Use Chinese UI labels.

Avoid:
- invented navigation or unsupported actions
- unrelated charts
- unreadable tiny text
- oversized hero layout
- exaggerated gradients, glowing effects, emoji, or dense overloaded tables
