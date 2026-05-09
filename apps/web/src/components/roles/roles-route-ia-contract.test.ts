import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const rolesListSource = readFileSync(join(process.cwd(), 'src/components/roles/role-permission-content.tsx'), 'utf8');
const roleDetailSourcePath = join(process.cwd(), 'src/components/roles/role-detail-content.tsx');
const rolePermissionsSourcePath = join(process.cwd(), 'src/components/roles/role-permissions-content.tsx');
const roleMenusSourcePath = join(process.cwd(), 'src/components/roles/role-menus-content.tsx');

test('role center route-level pages exist for list, create, detail, edit, permissions, and menus', () => {
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/roles/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/roles/create/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/roles/[id]/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/roles/[id]/edit/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/roles/[id]/permissions/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/roles/[id]/menus/page.tsx')));
});

test('role list page keeps detail, forms, and authorization matrices out of the list surface', () => {
  assert.doesNotMatch(rolesListSource, /RoleDetailCard/);
  assert.doesNotMatch(rolesListSource, /RoleFormPanel/);
  assert.doesNotMatch(rolesListSource, /PermissionMatrix/);
  assert.doesNotMatch(rolesListSource, /MenuAuthorizationMatrix/);
  assert.doesNotMatch(rolesListSource, /selectedRoleId/);
  assert.doesNotMatch(rolesListSource, /\bgetRole\s*[,(]/);
  assert.doesNotMatch(rolesListSource, /\bcreateRole\s*[,(]/);
  assert.doesNotMatch(rolesListSource, /\bupdateRole\s*[,(]/);
  assert.doesNotMatch(rolesListSource, /\bupdateRolePermissions\b/);
  assert.doesNotMatch(rolesListSource, /\bupdateMenuRoleBinding\b/);
});

test('role dedicated pages own detail and authorization workflows', () => {
  assert.ok(existsSync(roleDetailSourcePath));
  assert.ok(existsSync(rolePermissionsSourcePath));
  assert.ok(existsSync(roleMenusSourcePath));

  const detailSource = readFileSync(roleDetailSourcePath, 'utf8');
  const permissionsSource = readFileSync(rolePermissionsSourcePath, 'utf8');
  const menusSource = readFileSync(roleMenusSourcePath, 'utf8');

  assert.match(detailSource, /getRole/);
  assert.match(permissionsSource, /updateRolePermissions/);
  assert.match(menusSource, /updateMenuRoleBinding/);
});

test('role status changes require confirmation before mutation', () => {
  const detailSource = readFileSync(roleDetailSourcePath, 'utf8');

  assert.match(rolesListSource, /roleStatusTarget/);
  assert.match(rolesListSource, /function confirmRoleStatusChange/);
  assert.match(rolesListSource, /确认更新角色状态/);
  assert.match(rolesListSource, /onConfirm=\{confirmRoleStatusChange\}/);
  assert.match(detailSource, /roleStatusTarget/);
  assert.match(detailSource, /function confirmRoleStatusChange/);
  assert.match(detailSource, /确认更新角色状态/);
  assert.match(detailSource, /onConfirm=\{confirmRoleStatusChange\}/);
  assert.doesNotMatch(rolesListSource, /onToggle=\{\(role\) =>\s*statusMutation\.mutate/);
  assert.doesNotMatch(detailSource, /onClick=\{\(\) =>\s*statusMutation\.mutate/);
});

test('role menu authorization keeps parent and child selections consistent', () => {
  const menusSource = readFileSync(roleMenusSourcePath, 'utf8');

  assert.match(menusSource, /toggleMenu\(menu/);
  assert.match(menusSource, /collectAncestorMenuIds/);
  assert.match(menusSource, /collectDescendantMenuIds/);
  assert.match(menusSource, /nextSelection\.delete\(descendantId\)/);
  assert.match(menusSource, /nextSelection\.add\(ancestorId\)/);
});

test('role menu authorization excludes button permission nodes from menu grants', () => {
  const menusSource = readFileSync(roleMenusSourcePath, 'utf8');
  const detailSource = readFileSync(roleDetailSourcePath, 'utf8');

  assert.match(menusSource, /grantableTree/);
  assert.match(menusSource, /removeButtonMenuNodes/);
  assert.match(menusSource, /按钮权限请在角色权限配置页维护/);
  assert.doesNotMatch(menusSource, /按钮权限`/);
  assert.match(detailSource, /菜单入口/);
  assert.doesNotMatch(detailSource, /目录、菜单、按钮/);
});
