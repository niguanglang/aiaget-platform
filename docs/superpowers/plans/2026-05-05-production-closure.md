# Enterprise Platform Production Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining commercial and production-operation gaps for the enterprise AI Agent platform without adding new middleware or containers.

**Architecture:** Implement the missing closure in bounded backend slices first, then expose only the resulting state/actions in the console. Shared contracts live in `packages/shared-types`; Control API modules own business enforcement; frontend pages remain API-driven and Chinese-language.

**Tech Stack:** NestJS, Prisma, PostgreSQL, Next.js, React, TypeScript, Tailwind CSS, shadcn-style local components, Python FastAPI Runtime.

---

## Execution Boundaries

- Do not create or start middleware/container services without explicit user approval.
- Preserve the current PostgreSQL, MinIO, Qdrant, OpenSearch, and Runtime integration contracts.
- Prefer additive changes to existing modules; avoid large unrelated refactors.
- Every backend behavior change gets a deterministic typecheck/build verification. Where the repo has no test runner, add narrow pure TypeScript test helpers only when they do not require dependency installation.

## Module Plan

### Task 1: Plugin Ecosystem Closure

**Files:**
- Modify: `packages/shared-types/src/index.ts`
- Modify: `apps/control-api/src/plugins/plugins.controller.ts`
- Modify: `apps/control-api/src/plugins/plugins.service.ts`
- Modify: `apps/control-api/src/plugins/dto/update-plugin-installation.dto.ts`
- Modify: `apps/web/src/components/plugins/plugin-content.tsx`

- [x] Add plugin uninstall and manifest validation contracts.
- [x] Add uninstall endpoint that soft-deletes installation, generated menus, hooks, and generated tools while keeping audit history.
- [x] Block enable for high-risk plugins unless status is active/installed and security review state is acceptable.
- [x] Surface uninstall and validation state in the plugin center.

### Task 2: Billing Commercial Closure

**Files:**
- Modify: `packages/shared-types/src/index.ts`
- Modify: `apps/control-api/src/billing/billing.controller.ts`
- Modify: `apps/control-api/src/billing/billing.service.ts`
- Add: `apps/control-api/src/billing/dto/review-billing-adjustment.dto.ts`
- Modify: `apps/web/src/components/billing/billing-content.tsx`

- [x] Add quota enforcement result API for runtime and external callers.
- [x] Add adjustment review/apply/void endpoints so adjustments are not self-approved by creation alone.
- [x] Add invoice status transitions for lock, mark paid, void, overdue.
- [x] Surface blocking quota and invoice lifecycle state in billing center.

### Task 3: Channel and External Invocation Closure

**Files:**
- Modify: `packages/shared-types/src/index.ts`
- Modify: `apps/control-api/src/external-api/external-api-key.service.ts`
- Modify: `apps/control-api/src/external-api/external-api.service.ts`
- Modify: `apps/control-api/src/external-api/external-channel-sender.service.ts`
- Modify: `apps/control-api/src/channels/channel-operations.controller.ts`
- Modify: `apps/control-api/src/channels/channel-operations.service.ts`
- Modify: `apps/web/src/components/channels/channel-content.tsx`

- [x] Enforce billing/quota policy before external Agent and channel invocations.
- [x] Add request idempotency keys for external calls and channel callbacks.
- [x] Add channel credential rotation metadata and audit event.
- [x] Surface adapter readiness and credential rotation in channel operations.

### Task 4: Runtime and Workflow Operation Closure

**Files:**
- Modify: `packages/shared-types/src/index.ts`
- Modify: `apps/control-api/src/runtime-execution/runtime-execution.controller.ts`
- Modify: `apps/control-api/src/runtime-execution/runtime-execution.service.ts`
- Modify: `apps/control-api/src/knowledge/knowledge-task-dispatcher.service.ts`
- Modify: `apps/agent-runtime/app/workflows/worker.py`
- Modify: `apps/web/src/components/monitor/monitor-content.tsx`

- [x] Add workflow backend/status visibility for local fallback vs Temporal.
- [x] Add failed workflow retry/recover operation for known task types.
- [x] Record workflow dispatch failures as platform events with operator-facing summaries.
- [x] Surface workflow backend health and failed-recovery entry in monitor center.

### Task 5: Permission Coverage and Verification

**Files:**
- Modify: `apps/control-api/src/billing/billing.controller.ts`
- Modify: `apps/control-api/src/api-keys/api-keys.controller.ts`
- Modify: `apps/control-api/src/storage/storage.controller.ts`
- Add: `docs/product/production-closure-coverage.md`

- [x] Document the final permission/data-scope/resource-ACL/security-policy coverage matrix.
- [x] Add missing guards only where resource-level restrictions are meaningful.
- [x] Run `pnpm --filter @aiaget/shared-types typecheck`.
- [x] Run `pnpm --filter @aiaget/control-api typecheck`.
- [x] Run `pnpm --filter @aiaget/web typecheck`.
- [x] Run `python3 -m compileall apps/agent-runtime/app`.
