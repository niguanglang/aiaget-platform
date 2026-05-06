import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const seedText = readFileSync(join(process.cwd(), 'prisma/seed.ts'), 'utf8');

test('conversation create route stays a route-level page outside dynamic menu seed', () => {
  assert.doesNotMatch(seedText, /path: '\/conversations\/create'/);
  assert.match(seedText, /code: 'conversations'[\s\S]*path: '\/conversations'/);
});
