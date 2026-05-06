import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const seedText = readFileSync(join(process.cwd(), 'prisma/seed.ts'), 'utf8');

test('storage menu seed exposes list, settings, and upload as static pages', () => {
  assert.match(seedText, /code: 'storage'[\s\S]*path: '\/storage'[\s\S]*component: 'storage\/page'/);
  assert.match(
    seedText,
    /code: 'storage_settings'[\s\S]*parentCode: 'storage'[\s\S]*path: '\/storage\/settings'[\s\S]*component: 'storage\/settings\/page'/,
  );
  assert.match(
    seedText,
    /code: 'storage_upload'[\s\S]*parentCode: 'storage'[\s\S]*path: '\/storage\/upload'[\s\S]*component: 'storage\/upload\/page'/,
  );
});

test('storage object detail route stays out of menu seed', () => {
  assert.doesNotMatch(seedText, /path: '\/storage\/objects\/\[\.\.\.key\]'/);
  assert.doesNotMatch(seedText, /path: '\/storage\/objects\/:key'/);
  assert.doesNotMatch(seedText, /component: 'storage\/objects/);
});
