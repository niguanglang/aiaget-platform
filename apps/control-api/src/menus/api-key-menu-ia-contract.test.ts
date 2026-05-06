import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const seedText = readFileSync(join(process.cwd(), 'prisma/seed.ts'), 'utf8');

test('api key subroutes stay route-level pages outside dynamic menu seed', () => {
  assert.doesNotMatch(seedText, /path: '\/api-keys\/create'/);
  assert.doesNotMatch(seedText, /path: '\/api-keys\/observability'/);
  assert.doesNotMatch(seedText, /path: '\/api-keys\/webhook-deliveries'/);
  assert.doesNotMatch(seedText, /path: '\/api-keys\/webhook-deliveries\/\[deliveryId\]'/);
  assert.match(seedText, /code: 'api_keys'[\s\S]*path: '\/api-keys'/);
});
