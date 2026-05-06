import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const seedText = readFileSync(join(process.cwd(), 'prisma/seed.ts'), 'utf8');

test('default menu seed only exposes the menu center list route', () => {
  assert.match(seedText, /code: 'menus'[\s\S]*path: '\/menus'/);
  assert.doesNotMatch(seedText, /path: '\/menus\/create'/);
  assert.doesNotMatch(seedText, /path: '\/menus\/\[id\]\/edit'/);
  assert.doesNotMatch(seedText, /path: '\/menus\/:id\/edit'/);
});
