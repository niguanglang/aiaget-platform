# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: 企业 Agent 平台，系统管理中的 Resource ACL 资源授权中心。
- Page/route: 资源授权 at `/resource-acls`.
- Target users/roles: 租户管理员、安全管理员、Agent 管理员、知识库管理员、工具管理员、审计员；页面查看权限是 `system:resource_acl:view`，管理权限是 `system:resource_acl:manage`.
- Business goal: 管理“具体资源对象可以被哪些用户、角色、部门或租户主体执行哪些权限动作”，支持显式允许和显式拒绝，并可以模拟检查授权结果。
- Existing frontend stack/design system: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn-style local components, React Query, motion/react, lucide icons, restrained glass-style dashboard layout.
- Existing page shell/layout: Console admin shell with left navigation and topbar; content region should use responsive dashboard/Bento layout.

Interface contract that must appear in the UI:
- API/service functions:
  - `getResourceAclOverview`
  - `listResourceAclOptions`
  - `listResourceAcls`
  - `createResourceAcl`
  - `updateResourceAcl`
  - `deleteResourceAcl`
  - `checkResourceAcl`
- Main entities and fields:
  - ACL rule: resource type, resource name/code/status, subject type, subject name/code, permission code, effect, status, condition count, created time, updated time.
  - Resource options: Agent, knowledge base, document, tool, model, conversation, audit log.
  - Subject options: user, role, department, tenant.
  - Overview: total rules, active rules, allow rules, deny rules, resource distribution, subject distribution.
- Status values/enums:
  - `ALLOW`, `DENY`
  - `ACTIVE`, `DISABLED`, `DELETED`
  - `USER`, `ROLE`, `DEPARTMENT`, `TENANT`
- User actions:
  - Filter rules by resource type, subject type, effect, status.
  - Select resource and subject.
  - Choose permission code.
  - Create or update ACL rule.
  - Disable or delete ACL rule.
  - Edit optional JSON conditions.
  - Simulate a resource permission check.
- Required states:
  - loading, empty, error, validation, disabled, success, permission-denied.

Design requirements:
- Make it look like a production enterprise SaaS/admin product, not a template.
- All visible text should be Chinese.
- Use a clear dashboard layout:
  - top header with module marker “M36” and concise purpose,
  - four metric cards,
  - left resource/subject selector,
  - center ACL rule table/list,
  - right side editor and simulation panel.
- Use subtle borders, light shadow, backdrop blur, noise-like texture feel, and a restrained gradient mesh background.
- Include a light Three.js style particle field in the header background, atmospheric only, not competing with content.
- Use compact enterprise UI density and strong information hierarchy.
- Include realistic values such as “运维排障助手”, “生产知识库”, “租户管理员”, “agent:agent:view”.
- Output should be a product UI design reference image suitable for frontend implementation.

Avoid:
- fake API fields not listed above
- English visible labels
- oversized hero sections
- excessive glow, excessive gradients, decorative blobs, large rounded pill stacks
- unreadable tiny text or random charts
