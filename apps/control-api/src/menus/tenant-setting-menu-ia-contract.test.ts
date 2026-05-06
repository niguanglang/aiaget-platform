import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const seedText = readFileSync(join(process.cwd(), 'prisma/seed.ts'), 'utf8');

test('tenant and settings menu seed keeps only canonical top-level entries', () => {
  assert.match(seedText, /code: 'tenants'[\s\S]*path: '\/tenants'/);
  assert.match(seedText, /code: 'settings'[\s\S]*path: '\/settings'/);

  assert.doesNotMatch(seedText, /path: '\/tenants\/\[id\]'/);
  assert.doesNotMatch(seedText, /path: '\/tenants\/\[id\]\/edit'/);
  assert.doesNotMatch(seedText, /path: '\/settings\/notification-policy'/);
  assert.doesNotMatch(seedText, /path: '\/settings\/notification-policy\/snapshots'/);
  assert.doesNotMatch(seedText, /path: '\/system\/settings'/);
});
