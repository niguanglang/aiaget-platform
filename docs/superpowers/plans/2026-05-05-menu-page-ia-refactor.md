# Menu and Page Information Architecture Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize the console menu, page boundaries, and action placement so list pages stay focused, detail/config pages carry complex information, and P0 modules stop mixing unrelated business objects.

**Architecture:** Keep existing business APIs and routes working while introducing clearer route groups and redirects. First align menu seed/fallback navigation and permission semantics, then move role-menu authorization out of Menu Center, then split the heaviest pages into smaller route-level modules by reusing existing component sections rather than deleting functionality.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, local shadcn-style UI components, NestJS, Prisma, PostgreSQL.

---

## Execution Boundaries

- Do not delete existing business features.
- Preserve old public console routes with redirects or compatibility wrappers.
- Do not start middleware, containers, or external services.
- Use Chinese UI text.
- Any frontend page implementation must follow `$frontend-reference-design`.
- Use TDD for behavior changes: write the narrow failing test first, watch it fail, implement, then verify.

## File Map

- `apps/control-api/prisma/seed.ts`: default dynamic menu tree and permission codes.
- `apps/control-api/src/menus/menus.controller.ts`: Menu Center API surface.
- `apps/control-api/src/menus/menus.service.ts`: menu tree/list/detail/delete and role-menu binding logic.
- `apps/control-api/src/auth/auth.service.ts`: authorized menu tree returned to the console shell.
- `apps/web/src/config/modules.ts`: fallback module catalog when no dynamic menus are available.
- `apps/web/src/config/navigation.ts`: fallback nav generation.
- `apps/web/src/components/layout/menu-navigation.ts`: dynamic menu to sidebar navigation mapping.
- `apps/web/src/app/(console)/**/page.tsx`: console routes.
- `apps/web/src/components/menus/menu-content.tsx`: Menu Center page.
- `apps/web/src/components/menus/menu-form-panel.tsx`: Menu Center drawer form.
- `apps/web/src/components/roles/role-permission-content.tsx`: Role Center page and future menu authorization owner.
- `apps/web/src/components/channels/channel-content.tsx`: current overgrown channel page.
- `apps/web/src/components/security/security-policy-content.tsx`: current overgrown security page.
- `apps/web/src/components/settings/settings-content.tsx`: current mixed settings page.

## Task 1: P0-1 Align Dynamic Menu, Fallback Navigation, and Permissions

**Files:**
- Modify: `packages/shared-types/src/index.ts`
- Modify: `apps/control-api/prisma/seed.ts`
- Modify: `apps/web/src/config/modules.ts`
- Modify: `apps/web/src/config/navigation.ts`
- Modify: `apps/web/src/components/layout/menu-navigation.ts`
- Add test: `apps/control-api/src/menus/menu-seed-contract.test.ts`

- [ ] **Step 1: Write failing seed contract test**

Create `apps/control-api/src/menus/menu-seed-contract.test.ts` with assertions that:

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const seedText = readFileSync(join(process.cwd(), 'prisma/seed.ts'), 'utf8');

test('default menu seed includes approval audit and billing uses billing permission', () => {
  assert.match(seedText, /code: 'approval_audits'/);
  assert.match(seedText, /path: '\\/approval-audits'/);
  assert.match(seedText, /code: 'billing'[\s\S]*permissionCode: PERMISSION_CODES\.billingCenterView/);
});
```

- [ ] **Step 2: Run test and verify it fails**

Run:

```bash
pnpm --filter @aiaget/control-api exec tsx --test src/menus/menu-seed-contract.test.ts
```

Expected: FAIL because `approval_audits` is not in seed or `billing` does not use `billingCenterView`.

- [ ] **Step 3: Update shared permission and seed contracts**

In `packages/shared-types/src/index.ts`, keep existing `billingCenterView`.

In `apps/control-api/prisma/seed.ts`:

```ts
{ code: 'billing', name: '成本与额度', type: 'MENU', path: '/billing', component: 'billing/page', icon: 'Coins', permissionCode: PERMISSION_CODES.billingCenterView, sortOrder: 85 },
{ code: 'approval_audits', parentCode: 'security_center', name: '审批审计', type: 'MENU', path: '/approval-audits', component: 'approval-audits/page', icon: 'ScrollText', permissionCode: PERMISSION_CODES.securityApprovalView, sortOrder: 25 },
```

- [ ] **Step 4: Update fallback navigation grouping labels only**

Keep `moduleSpecs` route compatibility, but adjust names/descriptions where needed:

```ts
approval_audits: dynamic seed must match fallback key
billing: permission must remain 'billing:center:view'
menus: keep href '/menus' for compatibility in this task
```

- [ ] **Step 5: Run menu test**

Run:

```bash
pnpm --filter @aiaget/control-api exec tsx --test src/menus/menu-seed-contract.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run typecheck**

Run:

```bash
pnpm --filter @aiaget/shared-types build
pnpm --filter @aiaget/control-api typecheck
pnpm --filter @aiaget/web typecheck
```

Expected: all commands exit 0.

- [ ] **Step 7: Commit**

```bash
git add packages/shared-types/src/index.ts apps/control-api/prisma/seed.ts apps/web/src/config/modules.ts apps/web/src/config/navigation.ts apps/web/src/components/layout/menu-navigation.ts apps/control-api/src/menus/menu-seed-contract.test.ts
git commit -m "feat: align console menu contract"
```

## Task 2: P0-2 Make Menu Center Own Menu Definitions Only

**Files:**
- Modify: `apps/control-api/src/menus/menus.controller.ts`
- Modify: `apps/control-api/src/menus/menus.service.ts`
- Modify: `apps/web/src/components/menus/menu-content.tsx`
- Modify: `apps/web/src/components/menus/menu-form-panel.tsx`
- Modify: `apps/web/src/components/roles/role-permission-content.tsx`
- Add test: `apps/control-api/src/menus/menu-deletion-contract.test.ts`

- [ ] **Step 1: Write failing deletion dependency test**

Create `apps/control-api/src/menus/menu-deletion-contract.test.ts` that constructs `MenusService` with stub Prisma and verifies `remove()` rejects when role bindings exist.

Expected test behavior:

```ts
await assert.rejects(
  () => service.remove(user, 'menu-1'),
  /解除角色绑定|role/i,
);
```

- [ ] **Step 2: Run test and verify it fails**

```bash
pnpm --filter @aiaget/control-api exec tsx --test src/menus/menu-deletion-contract.test.ts
```

Expected: FAIL because current remove soft-deletes role bindings instead of blocking.

- [ ] **Step 3: Change delete behavior**

In `MenusService.remove()`:

- keep child-node block
- add active `roleMenu.count`
- add active `pluginMenuBinding.count`
- if any dependency exists, throw `BadRequestException` with a Chinese message listing counts
- do not soft-delete role bindings during menu delete

- [ ] **Step 4: Move role-menu authorization out of Menu Center UI**

In `apps/web/src/components/menus/menu-content.tsx`:

- remove role list query and role binding save UI
- remove `角色授权` row action
- keep read-only `role_count` in detail if useful
- keep menu tree, filters, node detail, create/edit drawer, enable/disable/delete

In `apps/web/src/components/roles/role-permission-content.tsx`:

- add menu authorization tab/section using existing `listMenuRoleBindings`, `getMenuTree`, and `updateMenuRoleBinding`
- primary owner for assigning menus becomes role page

- [ ] **Step 5: Expand menu drawer fields within current schema**

In `MenuFormPanel` keep current fields, but regroup into:

```text
基础信息
路由信息
显示控制
权限控制
高级配置说明
```

Do not add DB fields in this task.

- [ ] **Step 6: Run tests and typecheck**

```bash
pnpm --filter @aiaget/control-api exec tsx --test src/menus/menu-deletion-contract.test.ts
pnpm --filter @aiaget/control-api typecheck
pnpm --filter @aiaget/web typecheck
```

- [ ] **Step 7: Commit**

```bash
git add apps/control-api/src/menus apps/web/src/components/menus apps/web/src/components/roles
git commit -m "feat: separate menu definitions from role authorization"
```

## Task 3: P0-3 Split Channel Operations Into Route-Level Pages

**Files:**
- Modify: `apps/web/src/components/channels/channel-content.tsx`
- Create: `apps/web/src/components/channels/channel-publish-content.tsx`
- Create: `apps/web/src/components/channels/channel-accounts-content.tsx`
- Create: `apps/web/src/components/channels/channel-templates-content.tsx`
- Create: `apps/web/src/components/channels/channel-route-rules-content.tsx`
- Create: `apps/web/src/components/channels/channel-jobs-content.tsx`
- Create: `apps/web/src/components/channels/channel-deliveries-content.tsx`
- Create: `apps/web/src/app/(console)/channels/publish/page.tsx`
- Create: `apps/web/src/app/(console)/channels/accounts/page.tsx`
- Create: `apps/web/src/app/(console)/channels/templates/page.tsx`
- Create: `apps/web/src/app/(console)/channels/route-rules/page.tsx`
- Create: `apps/web/src/app/(console)/channels/jobs/page.tsx`
- Create: `apps/web/src/app/(console)/channels/deliveries/page.tsx`
- Modify: `apps/web/src/app/(console)/channels/page.tsx`

- [ ] **Step 1: Use `$frontend-reference-design`**

Create image workspace:

```bash
python3 /home/openclaw/.codex/skills/frontend-reference-design/scripts/init_image_workspace.py --root . --page "Channel Operations IA" --route "/channels" --feature "Split channel publish, accounts, templates, route rules, jobs, deliveries"
```

Fill brief, prompt, prototype, component mapping files before coding.

- [ ] **Step 2: Create route wrappers**

Each new `page.tsx` imports the matching content component and renders it.

- [ ] **Step 3: Extract existing sections without changing APIs**

Move existing provider/account/template/route/job/delivery section renderers from `channel-content.tsx` into the new content files. Keep the existing API functions from `apps/web/src/lib/api-client.ts`.

- [ ] **Step 4: Keep `/channels` compatible**

Make `/channels` render `ChannelPublishContent` or redirect to `/channels/publish`.

- [ ] **Step 5: Run frontend verification**

```bash
pnpm --filter @aiaget/web typecheck
pnpm --filter @aiaget/web lint
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/channels apps/web/src/app/(console)/channels images/frontend-reference-design/channel-operations-ia
git commit -m "feat: split channel operations pages"
```

## Task 4: P0-4 Split Security Center Into Policy, Event, and Operations Pages

**Files:**
- Modify: `apps/web/src/components/security/security-policy-content.tsx`
- Create: `apps/web/src/components/security/security-policies-content.tsx`
- Create: `apps/web/src/components/security/security-events-content.tsx`
- Create: `apps/web/src/components/security/security-alerts-content.tsx`
- Create: `apps/web/src/components/security/security-recovery-content.tsx`
- Create: `apps/web/src/app/(console)/security/policies/page.tsx`
- Create: `apps/web/src/app/(console)/security/events/page.tsx`
- Create: `apps/web/src/app/(console)/security/alerts/page.tsx`
- Create: `apps/web/src/app/(console)/security/recovery/page.tsx`
- Modify: `apps/web/src/app/(console)/security/page.tsx`

- [ ] **Step 1: Use `$frontend-reference-design`**

Create workspace:

```bash
python3 /home/openclaw/.codex/skills/frontend-reference-design/scripts/init_image_workspace.py --root . --page "Security Center IA" --route "/security" --feature "Split security policies, events, alerts, and recovery operations"
```

- [ ] **Step 2: Convert `/security` into a governance overview**

Keep high-level metrics and navigation cards only.

- [ ] **Step 3: Move policy list/simulation into `/security/policies`**

Policy CRUD, simulation, and evaluation logs belong here.

- [ ] **Step 4: Move event and alert operations**

Security event stream goes to `/security/events`; alert notification/SLA/dead-letter/recovery operations go to `/security/alerts` and `/security/recovery`.

- [ ] **Step 5: Run frontend verification**

```bash
pnpm --filter @aiaget/web typecheck
pnpm --filter @aiaget/web lint
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/security apps/web/src/app/(console)/security images/frontend-reference-design/security-center-ia
git commit -m "feat: split security center pages"
```

## Task 5: P0-5 Make Settings a Configuration Entry, Not a Mixed Admin Page

**Files:**
- Modify: `apps/web/src/components/settings/settings-content.tsx`
- Modify: `apps/web/src/config/modules.ts`
- Create: `apps/web/src/app/(console)/system/settings/page.tsx`
- Optionally create redirects for old `/settings`

- [ ] **Step 1: Use `$frontend-reference-design`**

Create workspace:

```bash
python3 /home/openclaw/.codex/skills/frontend-reference-design/scripts/init_image_workspace.py --root . --page "System Settings IA" --route "/system/settings" --feature "Configuration entry page without duplicating user role api key management"
```

- [ ] **Step 2: Replace mixed settings lists**

`SettingsContent` should show configuration cards linking to:

```text
/system/tenants or /tenants
/system/users or /users
/system/roles or /roles
/api-keys
/security/policies
/storage/settings
```

It should not render embedded user, role, or API key management lists.

- [ ] **Step 3: Run frontend verification**

```bash
pnpm --filter @aiaget/web typecheck
pnpm --filter @aiaget/web lint
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/settings apps/web/src/config/modules.ts apps/web/src/app/(console)/system images/frontend-reference-design/system-settings-ia
git commit -m "feat: simplify system settings entry"
```

## Final Verification

- [ ] Run all tests:

```bash
pnpm test
```

- [ ] Run typechecks:

```bash
pnpm typecheck
```

- [ ] Run diff whitespace check:

```bash
git diff --check
```

- [ ] Push:

```bash
git push origin master
```

