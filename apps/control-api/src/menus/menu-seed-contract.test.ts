import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const seedText = readFileSync(join(process.cwd(), 'prisma/seed.ts'), 'utf8');

test('default menu seed includes approval audit and billing uses billing permission', () => {
  assert.match(seedText, /code: 'approval_audits'/);
  assert.match(seedText, /path: '\/approval-audits'/);
  assert.match(seedText, /code: 'billing'[\s\S]*permissionCode: PERMISSION_CODES\.billingCenterView/);
});

test('default menu seed groups pages by business domains', () => {
  assert.match(seedText, /code: 'agent_platform'[\s\S]*name: 'Agent 中心'[\s\S]*type: 'DIRECTORY'/);
  assert.match(seedText, /code: 'customer_delivery'[\s\S]*name: '客户落地运营'[\s\S]*type: 'DIRECTORY'/);
  assert.match(seedText, /code: 'channel_operations'[\s\S]*name: '渠道发布'[\s\S]*type: 'DIRECTORY'/);
  assert.match(seedText, /code: 'plugin_ecosystem'[\s\S]*name: '插件生态'[\s\S]*type: 'DIRECTORY'/);
  assert.match(seedText, /code: 'external_access'[\s\S]*name: '外部接入'[\s\S]*type: 'DIRECTORY'/);
  assert.match(seedText, /code: 'observability_center'[\s\S]*name: '可观测中心'[\s\S]*type: 'DIRECTORY'/);
  assert.match(seedText, /const retiredMenuCodes = \['agent_center'\] as const/);
  assert.match(seedText, /code: \{\s*in: \[\.\.\.retiredMenuCodes\]/);
});

test('default menu seed exposes existing static operation subpages', () => {
  assert.match(seedText, /code: 'knowledge_activity'[\s\S]*path: '\/knowledge\/activity'/);
  assert.match(seedText, /code: 'knowledge_health'[\s\S]*path: '\/knowledge\/health'/);
  assert.match(seedText, /code: 'api_key_observability'[\s\S]*path: '\/api-keys\/observability'/);
  assert.match(seedText, /code: 'api_key_webhook_deliveries'[\s\S]*path: '\/api-keys\/webhook-deliveries'/);
  assert.match(seedText, /code: 'monitor_observability'[\s\S]*path: '\/monitor\/observability'/);
  assert.match(seedText, /code: 'runtime_workflows'[\s\S]*path: '\/runtime\/workflows'/);
  assert.match(seedText, /code: 'platform_usage_alerts'[\s\S]*path: '\/monitor\/platform-usage\/alerts'/);
  assert.match(seedText, /code: 'settings_notification_policy'[\s\S]*path: '\/settings\/notification-policy'/);
  assert.match(seedText, /code: 'settings_production_readiness'[\s\S]*path: '\/settings\/production-readiness'/);
});

test('default menu seed exposes focused channel operation pages', () => {
  assert.match(seedText, /code: 'channel_publish'[\s\S]*parentCode: 'channels'[\s\S]*path: '\/channels\/publish'/);
  assert.match(seedText, /code: 'channel_providers'[\s\S]*parentCode: 'channels'[\s\S]*path: '\/channels\/providers'/);
  assert.match(seedText, /code: 'channel_accounts'[\s\S]*parentCode: 'channels'[\s\S]*path: '\/channels\/accounts'/);
  assert.match(seedText, /code: 'channel_templates'[\s\S]*parentCode: 'channels'[\s\S]*path: '\/channels\/templates'/);
  assert.match(seedText, /code: 'channel_route_rules'[\s\S]*parentCode: 'channels'[\s\S]*path: '\/channels\/route-rules'/);
  assert.match(seedText, /code: 'channel_jobs'[\s\S]*parentCode: 'channels'[\s\S]*path: '\/channels\/jobs'/);
  assert.match(seedText, /code: 'channel_deliveries'[\s\S]*parentCode: 'channels'[\s\S]*path: '\/channels\/deliveries'/);
  assert.match(seedText, /code: 'channel_replies'[\s\S]*parentCode: 'channels'[\s\S]*path: '\/channels\/replies'/);
  assert.match(seedText, /code: 'channel_sender'[\s\S]*parentCode: 'channels'[\s\S]*path: '\/channels\/sender'/);
  assert.match(seedText, /code: 'channel_release'[\s\S]*parentCode: 'channels'[\s\S]*path: '\/channels\/release'/);
});

test('default menu seed exposes focused security center pages', () => {
  assert.match(seedText, /code: 'security_overview'[\s\S]*parentCode: 'security_center'[\s\S]*path: '\/security'/);
  assert.match(seedText, /code: 'security_policies'[\s\S]*parentCode: 'security_center'[\s\S]*path: '\/security\/policies'/);
  assert.match(seedText, /code: 'security_events'[\s\S]*parentCode: 'security_center'[\s\S]*path: '\/security\/events'/);
  assert.match(seedText, /code: 'security_alerts'[\s\S]*parentCode: 'security_center'[\s\S]*path: '\/security\/alerts'/);
  assert.match(seedText, /code: 'security_recovery'[\s\S]*parentCode: 'security_center'[\s\S]*path: '\/security\/recovery'/);
  assert.match(seedText, /code: 'security_archives'[\s\S]*parentCode: 'security_center'[\s\S]*path: '\/security\/archives'/);
});

test('billing invoice seed is idempotent by subscription period', () => {
  assert.match(seedText, /tenantId_subscriptionId_periodStart_periodEnd/);
  assert.doesNotMatch(seedText, /billingInvoice\.upsert\(\{[\s\S]*?where: \{[\s\S]*?tenantId_invoiceNo/);
});
