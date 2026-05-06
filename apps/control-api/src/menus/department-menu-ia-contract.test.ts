import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const seedText = readFileSync(join(process.cwd(), 'prisma/seed.ts'), 'utf8');

test('department menu seed keeps only the list route and omits create and edit pages', () => {
  assert.match(seedText, /code: 'departments'[\s\S]*path: '\/departments'/);
  assert.doesNotMatch(seedText, /path: '\/departments\/create'/);
  assert.doesNotMatch(seedText, /path: '\/departments\/\[id\]\/edit'/);
});

