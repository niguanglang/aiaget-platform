import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
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
const resourceAclComponentDir = join(process.cwd(), 'src/components/resource-acls');
const resourceAclComponentSources = readdirSync(resourceAclComponentDir)
  .filter((fileName) => fileName.endsWith('.tsx'))
  .map((fileName) => ({
    fileName,
    source: readFileSync(join(resourceAclComponentDir, fileName), 'utf8'),
  }));
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

test('resource ACL list status and delete actions require confirmation before mutation', () => {
  assert.match(resourceAclListSource, /aclActionTarget/);
  assert.match(resourceAclListSource, /function confirmAclAction/);
  assert.match(resourceAclListSource, /确认停用资源授权|确认启用资源授权|确认删除资源授权/);
  assert.match(resourceAclListSource, /onConfirm=\{confirmAclAction\}/);
  assert.doesNotMatch(resourceAclListSource, /onDelete=\{\(acl\) => \{[\s\S]*?deleteMutation\.mutate\(acl\.id\);[\s\S]*?\}\}/);
  assert.doesNotMatch(resourceAclListSource, /onToggleStatus=\{\(acl\) => \{[\s\S]*?statusMutation\.mutate\(\{ id: acl\.id/);
});

test('resource ACL api client exposes detail endpoint for edit route', () => {
  assert.match(apiClientSource, /export function getResourceAcl/);
  assert.match(apiClientSource, /\/resource-acls\/\$\{resourceAclId\}/);
});

test('resource ACL components use the operations shell without legacy decorations', () => {
  for (const { fileName, source } of resourceAclComponentSources) {
    assert.doesNotMatch(source, /motion\/react/, `${fileName} should not depend on motion/react`);
    assert.doesNotMatch(source, /\bmotion\./, `${fileName} should not render motion components`);
    assert.doesNotMatch(source, /\bMetricCard\b/, `${fileName} should not depend on MetricCard`);
    assert.doesNotMatch(source, /max-w-7xl/, `${fileName} should not use the old marketing-width shell`);
    assert.doesNotMatch(source, /\bResourceAclBackground\b/, `${fileName} should not depend on ResourceAclBackground`);
    assert.doesNotMatch(source, /resource-acl-background/, `${fileName} should not import the old background component`);
  }

  for (const sourcePath of [
    join(resourceAclComponentDir, 'resource-acl-content.tsx'),
    resourceAclCreateSourcePath,
    resourceAclEditSourcePath,
    resourceAclCheckSourcePath,
  ]) {
    const source = readFileSync(sourcePath, 'utf8');
    assert.match(source, /max-w-\[1680px\]/);
    assert.match(source, /rounded-xl border border-slate-200\/80 bg-white\/\[0\.9\]/);
  }
});
