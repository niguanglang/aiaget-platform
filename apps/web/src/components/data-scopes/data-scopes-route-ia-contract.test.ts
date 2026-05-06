import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const dataScopeListSource = readFileSync(
  join(process.cwd(), 'src/components/data-scopes/data-scope-content.tsx'),
  'utf8',
);
const dataScopeDetailSourcePath = join(process.cwd(), 'src/components/data-scopes/data-scope-detail-content.tsx');
const dataScopeEditSourcePath = join(process.cwd(), 'src/components/data-scopes/data-scope-edit-content.tsx');

test('data-scope route-level pages exist for overview, role detail, and role edit', () => {
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/data-scopes/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/data-scopes/roles/[roleId]/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/data-scopes/roles/[roleId]/edit/page.tsx')));
});

test('data-scope overview page keeps edit and preview workflow state out of the list surface', () => {
  assert.doesNotMatch(dataScopeListSource, /\breplaceRoleDataScopes\b/);
  assert.doesNotMatch(dataScopeListSource, /\bpreviewDataScope\b/);
  assert.doesNotMatch(dataScopeListSource, /\bselectedRoleId\b/);
  assert.doesNotMatch(dataScopeListSource, /\bdraftScopes\b/);
  assert.doesNotMatch(dataScopeListSource, /\bpreviewResult\b/);
  assert.doesNotMatch(dataScopeListSource, /\bsaveMutation\b/);
  assert.doesNotMatch(dataScopeListSource, /\bpreviewMutation\b/);
  assert.doesNotMatch(dataScopeListSource, /<ScopeEditor\b/);
});

test('data-scope dedicated pages own role detail, edit, save, and preview workflows', () => {
  assert.ok(existsSync(dataScopeDetailSourcePath));
  assert.ok(existsSync(dataScopeEditSourcePath));

  const detailSource = readFileSync(dataScopeDetailSourcePath, 'utf8');
  const editSource = readFileSync(dataScopeEditSourcePath, 'utf8');

  assert.match(detailSource, /\bgetRoleDataScopes\b/);
  assert.doesNotMatch(detailSource, /\breplaceRoleDataScopes\b/);
  assert.doesNotMatch(detailSource, /\bpreviewDataScope\b/);
  assert.doesNotMatch(detailSource, /\bdraftScopes\b/);

  assert.match(editSource, /\bgetRoleDataScopes\b/);
  assert.match(editSource, /\breplaceRoleDataScopes\b/);
  assert.match(editSource, /\bpreviewDataScope\b/);
});
