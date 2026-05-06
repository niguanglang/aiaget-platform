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

test('default menu seed exposes focused channel operation pages', () => {
  assert.match(seedText, /code: 'channel_publish'[\s\S]*parentCode: 'channels'[\s\S]*path: '\/channels\/publish'/);
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
});
