import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const usersComponentsRoot = join(process.cwd(), 'src/components/users');
const usersListSource = readFileSync(join(process.cwd(), 'src/components/users/users-content.tsx'), 'utf8');
const userDetailSourcePath = join(process.cwd(), 'src/components/users/user-detail-content.tsx');
const userCreateSourcePath = join(process.cwd(), 'src/components/users/user-create-content.tsx');
const userEditSourcePath = join(process.cwd(), 'src/components/users/user-edit-content.tsx');

function readComponentSources(root: string) {
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.tsx') && !entry.name.endsWith('.test.tsx'))
    .map((entry) => [entry.name, readFileSync(join(root, entry.name), 'utf8')] as const);
}

test('user center route-level pages exist for list, create, detail, and edit', () => {
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/users/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/users/create/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/users/[id]/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/users/[id]/edit/page.tsx')));
});

test('user list page keeps detail and forms out of the list surface', () => {
  assert.doesNotMatch(usersListSource, /UserDetailCard/);
  assert.doesNotMatch(usersListSource, /UserFormDrawer/);
  assert.doesNotMatch(usersListSource, /selectedUser/);
  assert.doesNotMatch(usersListSource, /editingUser/);
  assert.doesNotMatch(usersListSource, /isCreatingUser/);
  assert.doesNotMatch(usersListSource, /\bcreateUser\s*[,(]/);
  assert.doesNotMatch(usersListSource, /\bupdateUser\s*[,(]/);
  assert.doesNotMatch(usersListSource, /useForm/);
  assert.doesNotMatch(usersListSource, /zodResolver/);
});

test('user dedicated pages own detail and form workflows', () => {
  assert.ok(existsSync(userDetailSourcePath));
  assert.ok(existsSync(userCreateSourcePath));
  assert.ok(existsSync(userEditSourcePath));

  const detailSource = readFileSync(userDetailSourcePath, 'utf8');
  const createSource = readFileSync(userCreateSourcePath, 'utf8');
  const editSource = readFileSync(userEditSourcePath, 'utf8');

  assert.match(detailSource, /getUser/);
  assert.match(createSource, /createUser/);
  assert.match(editSource, /updateUser/);
});

test('user components do not depend on the legacy console shell', () => {
  for (const [fileName, componentSource] of readComponentSources(usersComponentsRoot)) {
    assert.doesNotMatch(componentSource, /MetricCard/, fileName);
    assert.doesNotMatch(componentSource, /motion\/react/, fileName);
    assert.doesNotMatch(componentSource, /max-w-7xl/, fileName);
    assert.doesNotMatch(componentSource, /bg-\[radial-gradient/, fileName);
  }
});
