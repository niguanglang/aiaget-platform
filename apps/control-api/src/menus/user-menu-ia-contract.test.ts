import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const seedText = readFileSync(join(process.cwd(), 'prisma/seed.ts'), 'utf8');

test('user create and edit routes stay outside dynamic menu seed', () => {
  assert.doesNotMatch(seedText, /path: '\/users\/create'/);
  assert.doesNotMatch(seedText, /path: '\/users\/\[id\]\/edit'/);
  assert.match(seedText, /code: 'users'[\s\S]*path: '\/users'/);
});
