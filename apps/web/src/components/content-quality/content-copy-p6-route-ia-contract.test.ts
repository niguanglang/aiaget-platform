import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const seedSource = readFileSync(join(root, '../control-api/prisma/seed.ts'), 'utf8');

test('p6 menu seed uses operational menu names and focused submenus', () => {
  assert.match(seedSource, /code: 'agent_platform', name: 'Agent 中心'/);
  assert.match(seedSource, /code: 'channel_operations', name: '渠道发布'/);
  assert.match(seedSource, /code: 'observability_center', name: '可观测中心'/);
  assert.match(seedSource, /code: 'billing', name: '计费成本'/);

  assert.match(seedSource, /code: 'knowledge_tasks'.*name: '文档处理任务'.*path: '\/knowledge\/tasks'/);
  assert.match(seedSource, /code: 'knowledge_recalls'.*name: '召回记录'.*path: '\/knowledge\/recalls'/);
  assert.match(seedSource, /code: 'tools_logs'.*name: '执行记录'.*path: '\/tools\/logs'/);
  assert.match(seedSource, /code: 'platform_usage_events'.*name: '平台事件'.*path: '\/monitor\/platform-usage\/events'/);
  assert.match(seedSource, /code: 'platform_usage_ledger'.*name: '用量账本'.*path: '\/monitor\/platform-usage\/ledger'/);
  assert.match(seedSource, /code: 'platform_usage_trends'.*name: '用量趋势'.*path: '\/monitor\/platform-usage\/trends'/);

  assert.doesNotMatch(seedSource, /name: 'Agent 平台'/);
  assert.doesNotMatch(seedSource, /name: '渠道运营'/);
  assert.doesNotMatch(seedSource, /name: '监控与可观测性'/);
  assert.doesNotMatch(seedSource, /name: '成本与额度'/);
  assert.doesNotMatch(seedSource, /code: 'knowledge_activity'.*name: '文档处理任务'/);
  assert.doesNotMatch(seedSource, /code: 'platform_usage'.*name: '平台事件与用量'/);
});

test('p6 focused route files exist for split knowledge usage and tool log pages', () => {
  const expectedRoutes = [
    'src/app/(console)/knowledge/tasks/page.tsx',
    'src/app/(console)/knowledge/recalls/page.tsx',
    'src/app/(console)/tools/logs/page.tsx',
    'src/app/(console)/monitor/platform-usage/events/page.tsx',
    'src/app/(console)/monitor/platform-usage/ledger/page.tsx',
    'src/app/(console)/monitor/platform-usage/trends/page.tsx',
  ];

  for (const route of expectedRoutes) {
    assert.ok(existsSync(join(root, route)), `${route} should exist`);
  }
});

test('p6 aggregate pages link to split pages without owning every business list', () => {
  const knowledgeOverview = readFileSync(join(root, 'src/components/knowledge/knowledge-content.tsx'), 'utf8');
  const knowledgeActivity = readFileSync(join(root, 'src/components/knowledge/knowledge-activity-content.tsx'), 'utf8');
  const platformUsageOverview = readFileSync(join(root, 'src/components/platform-event-usage/platform-usage-overview-content.tsx'), 'utf8');
  const toolList = readFileSync(join(root, 'src/components/tools/tool-content.tsx'), 'utf8');

  assert.match(knowledgeOverview, /\/knowledge\/tasks/);
  assert.match(knowledgeOverview, /\/knowledge\/recalls/);
  assert.match(knowledgeActivity, /\/knowledge\/tasks/);
  assert.match(knowledgeActivity, /\/knowledge\/recalls/);
  assert.doesNotMatch(knowledgeActivity, /recent_tasks[\s\S]*recent_recall_logs/);

  assert.match(platformUsageOverview, /\/monitor\/platform-usage\/events/);
  assert.match(platformUsageOverview, /\/monitor\/platform-usage\/ledger/);
  assert.match(platformUsageOverview, /\/monitor\/platform-usage\/trends/);
  assert.doesNotMatch(platformUsageOverview, /PlatformEventTable/);
  assert.doesNotMatch(platformUsageOverview, /UsageLedgerList/);
  assert.doesNotMatch(platformUsageOverview, /UsageTrendCard/);

  assert.match(toolList, /\/tools\/logs/);
});
