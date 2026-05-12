# Menu IA Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize the console menu into natural multi-level business domains, exposing existing static subpages as menu entries without adding empty pages or putting dynamic create/edit/detail routes into the sidebar.

**Architecture:** The authoritative menu tree is seeded from `apps/control-api/prisma/seed.ts` and returned by the auth/current-user menu API. The frontend maps authorized menu nodes to sidebar/mobile navigation through `apps/web/src/components/layout/menu-navigation.ts`, so implementation keeps route files and business APIs unchanged while changing menu taxonomy, icon mapping, and IA contract tests.

**Tech Stack:** NestJS control API seed + Node test contracts, Next.js App Router, React, Tailwind CSS, lucide-react icons.

---

## File Structure

- Modify `apps/control-api/prisma/seed.ts`: reorganize `defaultMenus`, add static menu items for existing subpages, keep dynamic create/edit/detail pages out of menu seed.
- Modify `apps/control-api/src/menus/*menu-ia-contract.test.ts`: update IA tests that currently require subpages to stay out of the menu.
- Modify `apps/control-api/src/menus/menu-seed-contract.test.ts`: assert new business-domain roots and important static children.
- Modify `apps/web/src/components/layout/menu-navigation.ts`: add icon imports and `codeIconMap` entries for new menu codes.
- Modify `apps/web/src/components/layout/sidebar.tsx`: improve nested sidebar behavior for deeper menus without capping levels.
- Modify `apps/web/src/components/layout/mobile-nav.tsx`: avoid flattening every deep menu item into one horizontal strip.
- Optional modify `apps/web/src/config/navigation.ts` and `apps/web/src/config/modules.ts`: only if fallback navigation needs to mirror the same high-level domains.

---

## Task 1: Backend Menu Seed Restructure

**Files:**
- Modify: `apps/control-api/prisma/seed.ts`
- Test: `apps/control-api/src/menus/menu-seed-contract.test.ts`

- [ ] **Step 1: Write failing contract tests**

Add assertions to `menu-seed-contract.test.ts` requiring these new root directories:

```ts
assert.match(seedText, /code: 'agent_platform'[\s\S]*name: 'Agent 平台'[\s\S]*type: 'DIRECTORY'/);
assert.match(seedText, /code: 'customer_delivery'[\s\S]*name: '客户落地运营'[\s\S]*type: 'DIRECTORY'/);
assert.match(seedText, /code: 'channel_operations'[\s\S]*name: '渠道运营'[\s\S]*type: 'DIRECTORY'/);
assert.match(seedText, /code: 'external_access'[\s\S]*name: '外部接入'[\s\S]*type: 'DIRECTORY'/);
assert.match(seedText, /code: 'observability_center'[\s\S]*name: '监控与可观测性'[\s\S]*type: 'DIRECTORY'/);
```

Add assertions for static subpages:

```ts
assert.match(seedText, /code: 'knowledge_activity'[\s\S]*path: '\/knowledge\/activity'/);
assert.match(seedText, /code: 'knowledge_health'[\s\S]*path: '\/knowledge\/health'/);
assert.match(seedText, /code: 'api_key_observability'[\s\S]*path: '\/api-keys\/observability'/);
assert.match(seedText, /code: 'api_key_webhook_deliveries'[\s\S]*path: '\/api-keys\/webhook-deliveries'/);
assert.match(seedText, /code: 'monitor_observability'[\s\S]*path: '\/monitor\/observability'/);
assert.match(seedText, /code: 'runtime_workflows'[\s\S]*path: '\/runtime\/workflows'/);
assert.match(seedText, /code: 'platform_usage_alerts'[\s\S]*path: '\/monitor\/platform-usage\/alerts'/);
assert.match(seedText, /code: 'settings_notification_policy'[\s\S]*path: '\/settings\/notification-policy'/);
assert.match(seedText, /code: 'settings_production_readiness'[\s\S]*path: '\/settings\/production-readiness'/);
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
pnpm --filter @aiaget/control-api exec tsx --test src/menus/menu-seed-contract.test.ts
```

Expected: fails because the new menu codes are not in `seed.ts`.

- [ ] **Step 3: Update `defaultMenus`**

Replace the current broad `agent_center` grouping with:

```text
dashboard
agent_platform
customer_delivery
channel_operations
plugin_ecosystem
external_access
observability_center
billing
security_center
system_management
```

Move existing entries:

```text
agents, agent_teams, skills, prompts, models, knowledge, tools, conversations -> agent_platform
role_scenarios, solution_packages, delivery_reviews, delivery_assets, customer_success_*, customer_assessments -> customer_delivery
channels and channel_* -> channel_operations
plugins -> plugin_ecosystem
api_keys, api_reference -> external_access
monitor and runtime/platform usage subpages -> observability_center
```

Add existing static subpage menu entries:

```text
knowledge_activity -> /knowledge/activity
knowledge_health -> /knowledge/health
api_key_observability -> /api-keys/observability
api_key_webhook_deliveries -> /api-keys/webhook-deliveries
monitor_observability -> /monitor/observability
runtime_workflows -> /runtime/workflows
platform_usage -> /monitor/platform-usage
platform_usage_alerts -> /monitor/platform-usage/alerts
platform_usage_notifications -> /monitor/platform-usage/notifications
platform_usage_tasks -> /monitor/platform-usage/tasks
settings_notification_policy -> /settings/notification-policy
settings_notification_policy_snapshots -> /settings/notification-policy/snapshots
settings_production_readiness -> /settings/production-readiness
channel_release_control/pipeline/gate/automation/self_healing/scheduler/reports -> /channels/release/*
```

Keep these out of seed:

```text
*/create
*/[id]
*/[id]/edit
/plugins/[pluginId]/*
/monitor/events/[eventId]
/monitor/traces/[traceId]
/api-keys/webhook-deliveries/[deliveryId]
```

- [ ] **Step 4: Run GREEN tests**

Run:

```bash
pnpm --filter @aiaget/control-api exec tsx --test src/menus/menu-seed-contract.test.ts
```

Expected: all tests pass.

---

## Task 2: Backend IA Contract Updates

**Files:**
- Modify: `apps/control-api/src/menus/monitor-menu-ia-contract.test.ts`
- Modify: `apps/control-api/src/menus/api-key-menu-ia-contract.test.ts`
- Modify: `apps/control-api/src/menus/knowledge-menu-ia-contract.test.ts`
- Modify: `apps/control-api/src/menus/plugin-menu-ia-contract.test.ts`
- Modify: `apps/control-api/src/menus/storage-menu-ia-contract.test.ts`
- Test: related files above

- [ ] **Step 1: Write/update failing expectations**

Update tests that currently assert static subpages stay out of seed:

```ts
// monitor-menu-ia-contract.test.ts
assert.match(seedText, /path: '\/monitor\/observability'/);
assert.match(seedText, /path: '\/runtime\/workflows'/);
assert.match(seedText, /path: '\/monitor\/platform-usage'/);
assert.match(seedText, /path: '\/monitor\/platform-usage\/alerts'/);
assert.match(seedText, /path: '\/monitor\/platform-usage\/notifications'/);
assert.match(seedText, /path: '\/monitor\/platform-usage\/tasks'/);
assert.doesNotMatch(seedText, /path: '\/monitor\/events/);
assert.doesNotMatch(seedText, /path: '\/monitor\/traces/);
```

```ts
// api-key-menu-ia-contract.test.ts
assert.match(seedText, /path: '\/api-keys\/observability'/);
assert.match(seedText, /path: '\/api-keys\/webhook-deliveries'/);
assert.doesNotMatch(seedText, /path: '\/api-keys\/create'/);
assert.doesNotMatch(seedText, /path: '\/api-keys\/webhook-deliveries\/\[deliveryId\]'/);
```

```ts
// knowledge-menu-ia-contract.test.ts
assert.match(seedText, /path: '\/knowledge\/activity'/);
assert.match(seedText, /path: '\/knowledge\/health'/);
assert.doesNotMatch(seedText, /path: '\/knowledge\/create'/);
assert.doesNotMatch(seedText, /path: '\/knowledge\/\[id\]/);
```

Keep plugin dynamic tests unchanged unless static plugin pages are added later.

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
pnpm --filter @aiaget/control-api exec tsx --test src/menus/monitor-menu-ia-contract.test.ts src/menus/api-key-menu-ia-contract.test.ts src/menus/knowledge-menu-ia-contract.test.ts
```

Expected: fails until Task 1 seed changes are applied.

- [ ] **Step 3: Finish test alignment**

Remove old negative assertions that block static operational subpages. Preserve negative assertions for dynamic create/edit/detail routes.

- [ ] **Step 4: Run GREEN tests**

Run:

```bash
pnpm --filter @aiaget/control-api exec tsx --test src/menus/monitor-menu-ia-contract.test.ts src/menus/api-key-menu-ia-contract.test.ts src/menus/knowledge-menu-ia-contract.test.ts src/menus/plugin-menu-ia-contract.test.ts src/menus/storage-menu-ia-contract.test.ts
```

Expected: all pass.

---

## Task 3: Frontend Navigation Mapping

**Files:**
- Modify: `apps/web/src/components/layout/menu-navigation.ts`
- Test: `apps/web/src/components/menus/menus-route-ia-contract.test.ts`

- [ ] **Step 1: Add failing assertions**

Add contract coverage that `codeIconMap` includes new menu codes:

```ts
assert.match(menuNavigationSource, /agent_platform:/);
assert.match(menuNavigationSource, /customer_delivery:/);
assert.match(menuNavigationSource, /channel_operations:/);
assert.match(menuNavigationSource, /external_access:/);
assert.match(menuNavigationSource, /observability_center:/);
assert.match(menuNavigationSource, /platform_usage:/);
assert.match(menuNavigationSource, /runtime_workflows:/);
assert.match(menuNavigationSource, /settings_notification_policy:/);
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
pnpm --filter @aiaget/web exec tsx --test src/components/menus/menus-route-ia-contract.test.ts
```

Expected: fails before icon mapping is added.

- [ ] **Step 3: Update icon imports and mappings**

Add suitable `lucide-react` imports such as `Building2`, `Cable`, `BellRing`, `ServerCog`, `LineChart`, `Webhook`, `PackageCheck`, `ShieldAlert`, `FolderTree`.

Map new menu codes to icons:

```ts
agent_platform: Bot,
customer_delivery: Building2,
channel_operations: RadioTower,
plugin_ecosystem: Boxes,
external_access: Cable,
observability_center: Activity,
knowledge_activity: ClipboardCheck,
knowledge_health: ServerCog,
api_key_observability: LineChart,
api_key_webhook_deliveries: Webhook,
monitor_observability: LineChart,
runtime_workflows: Workflow,
platform_usage: BarChart3,
settings_notification_policy: BellRing,
settings_notification_policy_snapshots: FileArchive,
settings_production_readiness: Rocket,
```

- [ ] **Step 4: Run GREEN test**

Run:

```bash
pnpm --filter @aiaget/web exec tsx --test src/components/menus/menus-route-ia-contract.test.ts
```

Expected: passes.

---

## Task 4: Sidebar and Mobile Multi-Level Navigation

**Files:**
- Modify: `apps/web/src/components/layout/sidebar.tsx`
- Modify: `apps/web/src/components/layout/mobile-nav.tsx`
- Test: `apps/web/src/components/menus/menus-route-ia-contract.test.ts`

- [ ] **Step 1: Add failing assertions**

Add assertions that sidebar supports deeper menu indentation and mobile nav uses grouped top-level navigation instead of flattening all children:

```ts
assert.match(sidebarSource, /item\.level > 2/);
assert.match(sidebarSource, /pathname\.startsWith/);
assert.doesNotMatch(mobileNavSource, /flattenNavigationLinks\(buildNavigationLinks/);
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
pnpm --filter @aiaget/web exec tsx --test src/components/menus/menus-route-ia-contract.test.ts
```

Expected: fails before sidebar/mobile changes.

- [ ] **Step 3: Update sidebar rendering**

Keep recursive rendering. Adjust classes so levels greater than two remain readable:

```ts
const childIndentClass = item.level === 2 ? 'pl-7 text-[13px]' : item.level > 2 ? 'pl-10 text-[12px]' : '';
```

Use the computed class in the link and directory label. Keep `isActive` based on `pathname === item.href || pathname.startsWith(`${item.href}/`)`.

- [ ] **Step 4: Update mobile nav**

Use top-level navigation groups instead of flattened full navigation:

```ts
const navigation = buildNavigationLinks(currentUser?.menus, currentUser?.user.permissions ?? []);
```

Render top-level entries and the active top-level entry’s children in a second horizontal row. Do not render every deep descendant in a single strip.

- [ ] **Step 5: Run GREEN test**

Run:

```bash
pnpm --filter @aiaget/web exec tsx --test src/components/menus/menus-route-ia-contract.test.ts
```

Expected: passes.

---

## Task 5: Seed, Typecheck, Smoke

**Files:**
- No code changes expected unless verification finds a real issue.

- [ ] **Step 1: Run backend menu tests**

Run:

```bash
pnpm --filter @aiaget/control-api exec tsx --test src/menus/menu-seed-contract.test.ts src/menus/monitor-menu-ia-contract.test.ts src/menus/api-key-menu-ia-contract.test.ts src/menus/knowledge-menu-ia-contract.test.ts src/menus/storage-menu-ia-contract.test.ts src/menus/billing-menu-ia-contract.test.ts src/menus/approval-menu-ia-contract.test.ts
```

Expected: all pass.

- [ ] **Step 2: Run frontend IA tests**

Run:

```bash
pnpm --filter @aiaget/web exec tsx --test src/components/menus/menus-route-ia-contract.test.ts
```

Expected: all pass.

- [ ] **Step 3: Run typechecks**

Run:

```bash
pnpm --filter @aiaget/control-api typecheck
pnpm --filter @aiaget/web typecheck
```

Expected: both pass.

- [ ] **Step 4: Run seed**

Run:

```bash
pnpm --filter @aiaget/control-api prisma:seed
```

Expected: seed completes and updates menu tree.

- [ ] **Step 5: Run authenticated smoke**

Run:

```bash
set -a && . ./.env && set +a && node scripts/production-smoke.mjs --control-api http://localhost:3001 --runtime http://localhost:8000 --web http://localhost:3000 --require-auth
```

Expected: `Production smoke validation passed.`

---

## Self-Review

- Spec coverage: covers menu taxonomy, static subpage exposure, dynamic route exclusion, sidebar/mobile navigation, tests, seed, and smoke.
- Placeholder scan: no TBD/TODO placeholders remain.
- Type consistency: menu codes use snake_case and map through existing `AuthorizedMenuItem.code` and `codeIconMap`.
