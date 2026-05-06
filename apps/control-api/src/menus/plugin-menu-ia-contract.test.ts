import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const seedText = readFileSync(join(process.cwd(), 'prisma/seed.ts'), 'utf8');

test('plugin ecosystem exposes only the top-level route in menu seed', () => {
  assert.match(seedText, /code: 'plugins'[\s\S]*path: '\/plugins'/);
  assert.doesNotMatch(seedText, /path: '\/plugins\/\[pluginId\]'/);
  assert.doesNotMatch(seedText, /path: '\/plugins\/\[pluginId\]\/installations'/);
  assert.doesNotMatch(seedText, /path: '\/plugins\/\[pluginId\]\/security'/);
  assert.doesNotMatch(seedText, /path: '\/plugins\/\[pluginId\]\/bindings'/);
  assert.doesNotMatch(seedText, /path: '\/plugins\/:pluginId/);
});
