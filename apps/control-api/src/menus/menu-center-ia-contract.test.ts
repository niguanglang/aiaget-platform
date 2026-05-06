import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const seedText = readFileSync(join(process.cwd(), 'prisma/seed.ts'), 'utf8');
const serviceText = readFileSync(join(process.cwd(), 'src/menus/menus.service.ts'), 'utf8');

test('default menu seed only exposes the menu center list route', () => {
  assert.match(seedText, /code: 'menus'[\s\S]*path: '\/menus'/);
  assert.doesNotMatch(seedText, /path: '\/menus\/create'/);
  assert.doesNotMatch(seedText, /path: '\/menus\/\[id\]\/edit'/);
  assert.doesNotMatch(seedText, /path: '\/menus\/:id\/edit'/);
});

test('menu service supports configurable multi-level menu trees instead of a three-level cap', () => {
  assert.match(serviceText, /MAX_MENU_LEVEL/);
  assert.match(serviceText, /Menu tree supports at most \$\{MAX_MENU_LEVEL\} levels/);
  assert.doesNotMatch(serviceText, /at most three levels/);
});
