import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const menuListSource = readFileSync(join(process.cwd(), 'src/components/menus/menu-content.tsx'), 'utf8');
const menuDetailSourcePath = join(process.cwd(), 'src/components/menus/menu-detail-content.tsx');
const menuCreateSourcePath = join(process.cwd(), 'src/components/menus/menu-create-content.tsx');
const menuEditSourcePath = join(process.cwd(), 'src/components/menus/menu-edit-content.tsx');
const menuNavigationSource = readFileSync(join(process.cwd(), 'src/components/layout/menu-navigation.ts'), 'utf8');
const sidebarSource = readFileSync(join(process.cwd(), 'src/components/layout/sidebar.tsx'), 'utf8');
const mobileNavSource = readFileSync(join(process.cwd(), 'src/components/layout/mobile-nav.tsx'), 'utf8');
const sharedTypesSource = readFileSync(join(process.cwd(), '../../packages/shared-types/src/index.ts'), 'utf8');

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
  assert.match(menuListSource, /多级菜单/);
  assert.match(menuListSource, /层级路径/);

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

test('menu tree table renders hierarchy path before the single code column', () => {
  const tableBodySource = menuListSource.slice(menuListSource.indexOf('<tbody>'), menuListSource.indexOf('</tbody>'));
  const hierarchyPathIndex = tableBodySource.indexOf('hierarchyPathById.get(menu.id)');
  const firstCodeIndex = tableBodySource.indexOf('{menu.code}');
  const secondCodeIndex = tableBodySource.indexOf('{menu.code}', firstCodeIndex + 1);

  assert.ok(hierarchyPathIndex > -1);
  assert.ok(firstCodeIndex > -1);
  assert.equal(secondCodeIndex, -1);
  assert.ok(hierarchyPathIndex < firstCodeIndex);
});

test('menu status changes require an explicit confirmation before mutation', () => {
  const detailSource = readFileSync(menuDetailSourcePath, 'utf8');

  assert.match(menuListSource, /menuStatusTarget/);
  assert.match(menuListSource, /confirmMenuStatusChange/);
  assert.match(menuListSource, /确认更新菜单状态/);
  assert.match(menuListSource, /onConfirm=\{confirmMenuStatusChange\}/);

  assert.match(detailSource, /menuStatusTarget/);
  assert.match(detailSource, /confirmMenuStatusChange/);
  assert.match(detailSource, /确认更新菜单状态/);
  assert.match(detailSource, /onConfirm=\{confirmMenuStatusChange\}/);

  assert.doesNotMatch(menuListSource, /onToggle=\{\(menu\) => statusMutation\.mutate\(\{ id: menu\.id, enabled: !menu\.enabled \}\)\}/);
  assert.doesNotMatch(detailSource, /onClick=\{\(\) => statusMutation\.mutate\(!menu\.enabled\)\}/);
});

test('menu create and edit forms support deep multi-level parent selection', () => {
  const createSource = readFileSync(menuCreateSourcePath, 'utf8');
  const editSource = readFileSync(menuEditSourcePath, 'utf8');
  const formSource = readFileSync(join(process.cwd(), 'src/components/menus/menu-form-panel.tsx'), 'utf8');

  assert.match(formSource, /多级菜单/);
  assert.match(formSource, /层级路径/);
  assert.match(formSource, /flattenParentOptions/);
  assert.doesNotMatch(formSource, /level\s*<\s*3/);
  assert.doesNotMatch(formSource, /最多三级/);
  assert.match(createSource, /parentId/);
  assert.match(editSource, /menuTree/);
});

test('menu forms expose advanced route configuration fields', () => {
  const formSource = readFileSync(join(process.cwd(), 'src/components/menus/menu-form-panel.tsx'), 'utf8');
  const converterSource = readFileSync(join(process.cwd(), 'src/components/menus/menu-form-converters.ts'), 'utf8');
  const detailSource = readFileSync(menuDetailSourcePath, 'utf8');

  for (const field of ['is_external', 'external_url', 'redirect_path', 'keep_alive', 'affix', 'hide_breadcrumb', 'route_meta']) {
    assert.match(sharedTypesSource, new RegExp(`\\b${field}\\b`));
    assert.match(formSource, new RegExp(`\\b${field}\\b`));
    assert.match(converterSource, new RegExp(`\\b${field}\\b`));
    assert.match(detailSource, new RegExp(`\\b${field}\\b`));
  }

  assert.match(formSource, /外链地址/);
  assert.match(formSource, /重定向地址/);
  assert.match(formSource, /路由元信息/);
  assert.match(detailSource, /高级配置/);
});

test('menu forms validate external route configuration before submit', () => {
  const formSource = readFileSync(join(process.cwd(), 'src/components/menus/menu-form-panel.tsx'), 'utf8');

  assert.match(formSource, /superRefine/);
  assert.match(formSource, /外链菜单需要填写外链地址/);
  assert.match(formSource, /外链地址需要以 http:\/\/ 或 https:\/\/ 开头/);
  assert.match(formSource, /isAllowedExternalUrl/);
});

test('authorized navigation keeps external and redirect menu entries clickable', () => {
  assert.match(menuNavigationSource, /if \(menu\.is_external && menu\.external_url\) return menu\.external_url/);
  assert.match(menuNavigationSource, /if \(menu\.redirect_path\) return menu\.redirect_path/);
  assert.match(menuNavigationSource, /menu\.type === 'DIRECTORY' && children\.length === 0 && href === '#'/);
});

test('authorized navigation maps new business-domain menu codes to icons', () => {
  for (const code of [
    'agent_platform',
    'customer_delivery',
    'channel_operations',
    'external_access',
    'observability_center',
    'platform_usage',
    'runtime_workflows',
    'settings_notification_policy',
  ]) {
    assert.match(menuNavigationSource, new RegExp(`${code}:`));
  }
});

test('sidebar and mobile navigation support deep menu trees', () => {
  assert.match(sidebarSource, /item\.level > 2/);
  assert.match(sidebarSource, /pathname\.startsWith/);
  assert.doesNotMatch(mobileNavSource, /flattenNavigationLinks\(buildNavigationLinks/);
  assert.match(mobileNavSource, /function buildMobileNavigationLevels/);
  assert.match(mobileNavSource, /while \(currentItems\.length > 0\)/);
});

test('desktop sidebar follows RuoYi-style collapse and expandable menu behavior', () => {
  assert.match(sidebarSource, /isCollapsed/);
  assert.match(sidebarSource, /onToggleCollapsed/);
  assert.match(sidebarSource, /expandedIds/);
  assert.match(sidebarSource, /ChevronDown/);
  assert.match(sidebarSource, /ChevronRight/);
  assert.match(sidebarSource, /findActivePathIds/);
  assert.match(sidebarSource, /w-\[72px\]/);
  assert.match(sidebarSource, /w-\[240px\]/);
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
