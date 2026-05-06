# Project UI Brief

- Project/module: AIAget 控制台安全治理 - Resource ACL 资源授权。
- Page/feature goal: 将资源 ACL 从单页聚合拆成列表、创建、编辑、模拟检查四个独立路由，降低对象级授权配置的认知负担。
- Routes and parent layout: Next.js App Router under `apps/web/src/app/(console)` using the existing console layout. Routes are `/resource-acls`, `/resource-acls/create`, `/resource-acls/[id]/edit`, and `/resource-acls/check`.
- Target users and permissions: 租户管理员和具备 `system:resource_acl:view` 的安全/平台运维可查看与模拟；具备 `system:resource_acl:manage` 或 `tenant_admin` 角色才可创建、编辑、删除、启停规则。
- API/service functions: `getResourceAclOverview`, `listResourceAcls`, `listResourceAclOptions`, `createResourceAcl`, `getResourceAcl`, `updateResourceAcl`, `deleteResourceAcl`, `checkResourceAcl`.
- Data entities and fields: `ResourceAclItem` fields include `id`, `tenant_id`, `resource_type`, `resource_id`, `resource`, `subject_type`, `subject_id`, `subject`, `permission_code`, `effect`, `status`, `conditions`, `condition_count`, `created_at`, `updated_at`. Resource/subject options expose `id`, `type`, `name`, `code`, and status metadata.
- Statuses/enums: resource types include Agent, Knowledge, Tool, Model, Conversation, Channel Account, Channel Template, Channel Route Rule, Channel Publish Batch, Channel Delivery, Channel Job. Subject types are Role, User, Department, Tenant. Effect is `ALLOW` or `DENY`; editable status is `ACTIVE` or `DISABLED`; check decision is `ALLOW`, `DENY`, or `NO_MATCH`.
- Available components and UI library: React 19, Next.js 16, Tailwind CSS, existing shadcn-style `Button`, `Card`, `EmptyState`, `MetricCard`, `StatusBadge`, `cn`, lucide icons, TanStack Query, motion/react.
- Required states and actions: list loading/empty/error, overview metrics, resource/subject/effect/status filters, row edit/delete/enable-disable/check navigation, create validation/success/error/permission disabled, edit detail loading/not-found/error and immutable resource/subject display, check validation/loading/result/no-match.
- Constraints: Chinese UI, no route-level create/edit/check menu seed entries, no create/update/check form state in the list component, no invented backend fields, no real reference image generation required for this batch.
