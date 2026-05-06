import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const seedText = readFileSync(join(process.cwd(), 'prisma/seed.ts'), 'utf8');

test('resource ACL route IA keeps dynamic create, edit, and check routes outside menu seed', () => {
  assert.match(seedText, /code: 'resource_acls'[\s\S]*path: '\/resource-acls'/);
  assert.doesNotMatch(seedText, /path: '\/resource-acls\/create'/);
  assert.doesNotMatch(seedText, /path: '\/resource-acls\/\[id\]\/edit'/);
  assert.doesNotMatch(seedText, /path: '\/resource-acls\/check'/);
  assert.doesNotMatch(seedText, /component: 'resource-acls\/create\/page'/);
  assert.doesNotMatch(seedText, /component: 'resource-acls\/\[id\]\/edit\/page'/);
  assert.doesNotMatch(seedText, /component: 'resource-acls\/check\/page'/);
});
