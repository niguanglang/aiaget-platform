import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const seedText = readFileSync(join(process.cwd(), 'prisma/seed.ts'), 'utf8');

test('audit event detail route stays route-level and out of dynamic menu seed', () => {
  assert.doesNotMatch(seedText, /path: '\/audit\/events\/\[id\]'/);
  assert.match(seedText, /code: 'audit'[\s\S]*path: '\/audit'/);
});
