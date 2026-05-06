import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const seedText = readFileSync(join(process.cwd(), 'prisma/seed.ts'), 'utf8');

test('data-scope route IA keeps dynamic role detail and edit routes outside menu seed', () => {
  assert.match(seedText, /code: 'data_scopes'[\s\S]*path: '\/data-scopes'/);
  assert.doesNotMatch(seedText, /path: '\/data-scopes\/roles\/\[roleId\]'/);
  assert.doesNotMatch(seedText, /path: '\/data-scopes\/roles\/\[roleId\]\/edit'/);
  assert.doesNotMatch(seedText, /component: 'data-scopes\/roles\/\[roleId\]\/page'/);
  assert.doesNotMatch(seedText, /component: 'data-scopes\/roles\/\[roleId\]\/edit\/page'/);
});
