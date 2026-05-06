import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const menuListSource = readFileSync(join(process.cwd(), 'src/components/menus/menu-content.tsx'), 'utf8');
const menuDetailSourcePath = join(process.cwd(), 'src/components/menus/menu-detail-content.tsx');
const menuCreateSourcePath = join(process.cwd(), 'src/components/menus/menu-create-content.tsx');
const menuEditSourcePath = join(process.cwd(), 'src/components/menus/menu-edit-content.tsx');

test('menu center route-level pages exist for list, create, detail, and edit', () => {
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/menus/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/menus/create/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/menus/[id]/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/menus/[id]/edit/page.tsx')));
});

test('menu list page is only the tree table and query entry', () => {
  assert.match(menuListSource, /菜单树表/);
  assert.match(menuListSource, /展开全部/);
  assert.match(menuListSource, /折叠全部/);
  assert.match(menuListSource, /搜索名称、编码、路径/);

  assert.doesNotMatch(menuListSource, /MenuDetailCard/);
  assert.doesNotMatch(menuListSource, /MenuFormPanel/);
  assert.doesNotMatch(menuListSource, /selectedMenu/);
  assert.doesNotMatch(menuListSource, /selectedMenuId/);
  assert.doesNotMatch(menuListSource, /editingMenu/);
  assert.doesNotMatch(menuListSource, /formMode/);
  assert.doesNotMatch(menuListSource, /\bgetMenu\b/);
  assert.doesNotMatch(menuListSource, /\bcreateMenu\b/);
  assert.doesNotMatch(menuListSource, /\bupdateMenu\b/);
});

test('menu dedicated pages own detail, create, and edit API workflows', () => {
  assert.ok(existsSync(menuDetailSourcePath));
  assert.ok(existsSync(menuCreateSourcePath));
  assert.ok(existsSync(menuEditSourcePath));

  const detailSource = readFileSync(menuDetailSourcePath, 'utf8');
  const createSource = readFileSync(menuCreateSourcePath, 'utf8');
  const editSource = readFileSync(menuEditSourcePath, 'utf8');

  assert.match(detailSource, /\bgetMenu\b/);
  assert.doesNotMatch(detailSource, /\bcreateMenu\b/);
  assert.doesNotMatch(detailSource, /\bupdateMenu\b/);

  assert.match(createSource, /\bcreateMenu\b/);
  assert.match(createSource, /parentId/);
  assert.doesNotMatch(createSource, /\bupdateMenu\b/);

  assert.match(editSource, /\bgetMenu\b/);
  assert.match(editSource, /\bupdateMenu\b/);
  assert.doesNotMatch(editSource, /\bcreateMenu\b/);
});
