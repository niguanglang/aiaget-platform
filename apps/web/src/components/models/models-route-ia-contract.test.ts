import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const modelsListSource = readFileSync(join(process.cwd(), 'src/components/models/models-content.tsx'), 'utf8');

test('model center route-level pages exist for list, create, detail, and edit', () => {
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/models/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/models/create/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/models/[id]/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/models/[id]/edit/page.tsx')));
});

test('model list page keeps provider detail and forms out of the list surface', () => {
  assert.doesNotMatch(modelsListSource, /ProviderDetailPanel/);
  assert.doesNotMatch(modelsListSource, /ProviderFormPanel/);
  assert.doesNotMatch(modelsListSource, /ModelFormPanel/);
  assert.doesNotMatch(modelsListSource, /selectedProviderId/);
  assert.doesNotMatch(modelsListSource, /testModelProvider/);
});
