import assert from 'node:assert/strict';
import test from 'node:test';

import { collectProductionRunbookIssues } from '../verify-production-runbook.mjs';

const completeRunbook = `
# P0-12 生产验收与发布 Runbook

## 1. 发布边界
## 2. 环境校验
pnpm validate:prod-env
pnpm verify:prod-template

## 3. 数据库迁移与 Seed
pnpm --filter @aiaget/control-api prisma:deploy
pnpm --filter @aiaget/control-api prisma:seed

## 4. 备份与恢复
pg_dump
pg_restore

## 5. 应用启动
docker compose -f deploy/docker-compose.production.yml --env-file .env.production up -d

## 6. 健康检查
node scripts/production-smoke.mjs

## 7. 业务 Smoke
GET /api/v1/health
GET /runtime/health

## 8. 观测与 Trace
node scripts/verify-trace-propagation.mjs

## 9. 回滚
docker compose -f deploy/docker-compose.production.yml --env-file .env.production down

## 10. 交付验收
人工验收 /settings/production-readiness
人工验收 客户成功计划 /customer-success-plans
人工验收 客户成功行动 /customer-success-actions
人工验收 续约机会 /customer-success-opportunities
人工验收 机会分析 /customer-success-opportunities/analytics
留档 docs/product/production-delivery-record-template.md
`;

test('collectProductionRunbookIssues accepts a complete P0-12 runbook', () => {
  assert.deepEqual(collectProductionRunbookIssues(completeRunbook), []);
});

test('collectProductionRunbookIssues reports missing release safety sections', () => {
  assert.deepEqual(
    collectProductionRunbookIssues('# P0-12 生产验收与发布 Runbook\n\n## 环境校验\npnpm validate:prod-env\n'),
    [
      'Runbook must include 数据库迁移与 Seed',
      'Runbook must include 备份与恢复',
      'Runbook must include 健康检查',
      'Runbook must include 业务 Smoke',
      'Runbook must include 观测与 Trace',
      'Runbook must include 回滚',
      'Runbook must mention pnpm verify:prod-template',
      'Runbook must mention prisma:deploy',
      'Runbook must mention production-smoke.mjs',
      'Runbook must mention verify-trace-propagation.mjs',
      'Runbook must mention /settings/production-readiness',
      'Runbook must mention /customer-success-plans',
      'Runbook must mention /customer-success-actions',
      'Runbook must mention /customer-success-opportunities',
      'Runbook must mention /customer-success-opportunities/analytics',
      'Runbook must mention production-delivery-record-template.md',
    ],
  );
});
