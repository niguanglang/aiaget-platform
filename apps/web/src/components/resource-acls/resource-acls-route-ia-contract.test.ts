import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const resourceAclListSource = readFileSync(
  join(process.cwd(), 'src/components/resource-acls/resource-acl-content.tsx'),
  'utf8',
);
const resourceAclCreateSourcePath = join(
  process.cwd(),
  'src/components/resource-acls/resource-acl-create-content.tsx',
);
const resourceAclEditSourcePath = join(process.cwd(), 'src/components/resource-acls/resource-acl-edit-content.tsx');
const resourceAclCheckSourcePath = join(
  process.cwd(),
  'src/components/resource-acls/resource-acl-check-content.tsx',
);
const apiClientSource = readFileSync(join(process.cwd(), 'src/lib/api-client.ts'), 'utf8');

test('resource ACL route-level pages exist for list, create, edit, and check', () => {
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/resource-acls/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/resource-acls/create/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/resource-acls/[id]/edit/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/resource-acls/check/page.tsx')));
});

test('resource ACL list page keeps create, update, and check state out of the list surface', () => {
  assert.doesNotMatch(resourceAclListSource, /\bcreateResourceAcl\b/);
  assert.doesNotMatch(resourceAclListSource, /\bcheckResourceAcl\b/);
  assert.doesNotMatch(resourceAclListSource, /\bselectedAcl\b/);
  assert.doesNotMatch(resourceAclListSource, /\bselectedAclId\b/);
  assert.doesNotMatch(resourceAclListSource, /\bdraft\b/);
  assert.doesNotMatch(resourceAclListSource, /\bcheckResult\b/);
  assert.doesNotMatch(resourceAclListSource, /\bcreateMutation\b/);
  assert.doesNotMatch(resourceAclListSource, /\bcheckMutation\b/);
  assert.doesNotMatch(resourceAclListSource, /<AclEditor\b/);
  assert.doesNotMatch(resourceAclListSource, /<ResourceSubjectSelector\b/);
});

test('resource ACL dedicated pages own create, edit, and simulation workflows', () => {
  assert.ok(existsSync(resourceAclCreateSourcePath));
  assert.ok(existsSync(resourceAclEditSourcePath));
  assert.ok(existsSync(resourceAclCheckSourcePath));

  const createSource = readFileSync(resourceAclCreateSourcePath, 'utf8');
  const editSource = readFileSync(resourceAclEditSourcePath, 'utf8');
  const checkSource = readFileSync(resourceAclCheckSourcePath, 'utf8');

  assert.match(createSource, /\bcreateResourceAcl\b/);
  assert.doesNotMatch(createSource, /\bupdateResourceAcl\b/);
  assert.doesNotMatch(createSource, /\bcheckResourceAcl\b/);

  assert.match(editSource, /\bgetResourceAcl\b/);
  assert.match(editSource, /\bupdateResourceAcl\b/);
  assert.doesNotMatch(editSource, /\bcreateResourceAcl\b/);
  assert.doesNotMatch(editSource, /\bcheckResourceAcl\b/);
  assert.doesNotMatch(editSource, /updateResourceAcl\([\s\S]*resource_type:/);
  assert.doesNotMatch(editSource, /updateResourceAcl\([\s\S]*resource_id:/);
  assert.doesNotMatch(editSource, /updateResourceAcl\([\s\S]*subject_type:/);
  assert.doesNotMatch(editSource, /updateResourceAcl\([\s\S]*subject_id:/);

  assert.match(checkSource, /\bcheckResourceAcl\b/);
  assert.doesNotMatch(checkSource, /\bcreateResourceAcl\b/);
  assert.doesNotMatch(checkSource, /\bupdateResourceAcl\b/);
});

test('resource ACL api client exposes detail endpoint for edit route', () => {
  assert.match(apiClientSource, /export function getResourceAcl/);
  assert.match(apiClientSource, /\/resource-acls\/\$\{resourceAclId\}/);
});
