import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const seedText = readFileSync(join(process.cwd(), 'prisma/seed.ts'), 'utf8');

test('knowledge create edit and dynamic operation routes stay route-level pages outside menu seed', () => {
  assert.doesNotMatch(seedText, /path: '\/knowledge\/create'/);
  assert.doesNotMatch(seedText, /path: '\/knowledge\/\[id\]\/edit'/);
  assert.doesNotMatch(seedText, /path: '\/knowledge\/\[id\]\/documents'/);
  assert.doesNotMatch(seedText, /path: '\/knowledge\/\[id\]\/upload'/);
  assert.doesNotMatch(seedText, /path: '\/knowledge\/\[id\]\/retrieval'/);
  assert.doesNotMatch(seedText, /path: '\/knowledge\/:id\/documents'/);
  assert.doesNotMatch(seedText, /path: '\/knowledge\/:id\/upload'/);
  assert.doesNotMatch(seedText, /path: '\/knowledge\/:id\/retrieval'/);
  assert.match(seedText, /code: 'knowledge'[\s\S]*path: '\/knowledge'/);
});
