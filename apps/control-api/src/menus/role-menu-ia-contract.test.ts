import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const seedText = readFileSync(join(process.cwd(), 'prisma/seed.ts'), 'utf8');

test('role create, edit, and configuration routes stay outside dynamic menu seed', () => {
  assert.doesNotMatch(seedText, /path: '\/roles\/create'/);
  assert.doesNotMatch(seedText, /path: '\/roles\/\[id\]\/edit'/);
  assert.doesNotMatch(seedText, /path: '\/roles\/\[id\]\/permissions'/);
  assert.doesNotMatch(seedText, /path: '\/roles\/\[id\]\/menus'/);
  assert.match(seedText, /code: 'roles'[\s\S]*path: '\/roles'/);
});
