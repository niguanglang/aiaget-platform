import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const seedText = readFileSync(join(process.cwd(), 'prisma/seed.ts'), 'utf8');

test('tenant menu seed keeps only canonical top-level entries while settings exposes static operation pages', () => {
  assert.match(seedText, /code: 'tenants'[\s\S]*path: '\/tenants'/);
  assert.match(seedText, /code: 'settings'[\s\S]*path: '\/settings'/);
  assert.match(seedText, /code: 'settings_notification_policy'[\s\S]*parentCode: 'settings'[\s\S]*path: '\/settings\/notification-policy'/);
  assert.match(seedText, /code: 'settings_notification_policy_snapshots'[\s\S]*parentCode: 'settings_notification_policy'[\s\S]*path: '\/settings\/notification-policy\/snapshots'/);
  assert.match(seedText, /code: 'settings_production_readiness'[\s\S]*parentCode: 'settings'[\s\S]*path: '\/settings\/production-readiness'/);

  assert.doesNotMatch(seedText, /path: '\/tenants\/\[id\]'/);
  assert.doesNotMatch(seedText, /path: '\/tenants\/\[id\]\/edit'/);
  assert.doesNotMatch(seedText, /path: '\/system\/settings'/);
});
