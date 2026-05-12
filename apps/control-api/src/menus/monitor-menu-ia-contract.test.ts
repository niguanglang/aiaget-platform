import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const seedText = readFileSync(join(process.cwd(), 'prisma/seed.ts'), 'utf8');

test('monitor menu seed exposes static observability pages and excludes dynamic detail routes', () => {
  assert.match(seedText, /code: 'monitor'[\s\S]*path: '\/monitor'/);
  assert.match(seedText, /path: '\/monitor\/observability'/);
  assert.match(seedText, /path: '\/runtime\/workflows'/);
  assert.match(seedText, /path: '\/monitor\/platform-usage'/);
  assert.match(seedText, /path: '\/monitor\/platform-usage\/alerts'/);
  assert.match(seedText, /path: '\/monitor\/platform-usage\/notifications'/);
  assert.match(seedText, /path: '\/monitor\/platform-usage\/tasks'/);
  assert.doesNotMatch(seedText, /path: '\/monitor\/events/);
  assert.doesNotMatch(seedText, /path: '\/monitor\/traces/);
  assert.doesNotMatch(seedText, /component: 'monitor\/events/);
  assert.doesNotMatch(seedText, /component: 'monitor\/traces/);
});
