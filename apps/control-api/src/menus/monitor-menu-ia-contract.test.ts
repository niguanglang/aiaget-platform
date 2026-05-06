import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const seedText = readFileSync(join(process.cwd(), 'prisma/seed.ts'), 'utf8');

test('monitor menu seed exposes only the monitor root route', () => {
  assert.match(seedText, /code: 'monitor'[\s\S]*path: '\/monitor'/);
  assert.doesNotMatch(seedText, /path: '\/monitor\/events/);
  assert.doesNotMatch(seedText, /path: '\/monitor\/traces/);
  assert.doesNotMatch(seedText, /path: '\/monitor\/observability'/);
  assert.doesNotMatch(seedText, /component: 'monitor\/events/);
  assert.doesNotMatch(seedText, /component: 'monitor\/traces/);
  assert.doesNotMatch(seedText, /component: 'monitor\/observability/);
  assert.doesNotMatch(seedText, /path: '\/runtime\/workflows'/);
});
