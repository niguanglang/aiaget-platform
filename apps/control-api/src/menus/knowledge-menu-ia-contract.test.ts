import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const seedText = readFileSync(join(process.cwd(), 'prisma/seed.ts'), 'utf8');

test('knowledge create and edit routes stay route-level pages outside dynamic menu seed', () => {
  assert.doesNotMatch(seedText, /path: '\/knowledge\/create'/);
  assert.doesNotMatch(seedText, /path: '\/knowledge\/\[id\]\/edit'/);
  assert.match(seedText, /code: 'knowledge'[\s\S]*path: '\/knowledge'/);
});
