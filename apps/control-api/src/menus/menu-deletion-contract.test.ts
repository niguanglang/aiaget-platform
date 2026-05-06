import assert from 'node:assert/strict';
import test from 'node:test';

import { MenusService } from './menus.service';

const currentUser = {
  id: '00000000-0000-0000-0000-000000000001',
  tenantId: '00000000-0000-0000-0000-000000000002',
  email: 'operator@example.com',
  roles: ['tenant_admin'],
  roleIds: [],
  permissions: [],
  departmentId: null,
};

interface MockMenuRecord {
  id: string;
  tenantId: string;
  parentId: string | null;
  parent: MockMenuRecord | null;
  children: MockMenuRecord[];
  roleMenus: Array<{
    roleId: string;
    role: {
      code: string;
      name: string;
    };
  }>;
  name: string;
  code: string;
  type: string;
  path: string;
  component: string;
  icon: string;
  permissionCode: string;
  sortOrder: number;
  visible: boolean;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

test('remove rejects menu deletion while role bindings still reference the menu', async () => {
  const service = new MenusService(buildPrisma({ roleMenuCount: 1, pluginMenuBindingCount: 0 }) as never);

  await assert.rejects(() => service.remove(currentUser, 'menu-1'), /角色绑定|role/i);
});

test('remove rejects menu deletion while plugin menu bindings still reference the menu', async () => {
  const service = new MenusService(buildPrisma({ roleMenuCount: 0, pluginMenuBindingCount: 1 }) as never);

  await assert.rejects(() => service.remove(currentUser, 'menu-1'), /插件菜单绑定|plugin/i);
});

test('create allows menu nodes deeper than three levels while preserving parent validation', async () => {
  const levelOne = buildMenuRecord({ id: 'menu-1', name: '一级菜单', parentId: null });
  const levelTwo = buildMenuRecord({ id: 'menu-2', name: '二级菜单', parentId: 'menu-1', parent: levelOne });
  const levelThree = buildMenuRecord({ id: 'menu-3', name: '三级菜单', parentId: 'menu-2', parent: levelTwo });
  const levelFour = buildMenuRecord({
    id: 'menu-4',
    name: '四级菜单',
    code: 'level_four',
    parentId: 'menu-3',
    parent: levelThree,
  });
  const menus = [levelOne, levelTwo, levelThree];
  const service = new MenusService(buildPrismaWithMenus(menus, levelFour) as never);

  const created = await service.create(currentUser, {
    parent_id: 'menu-3',
    name: '四级菜单',
    code: 'level_four',
    type: 'MENU',
    path: '/level-four',
    component: 'level-four/page',
    icon: 'ListTree',
    permission_code: 'system:menu:view',
    sort_order: 10,
    visible: true,
    enabled: true,
  });

  assert.equal(created.level, 4);
  assert.equal(created.parent_name, '三级菜单');
});

function buildPrisma({
  roleMenuCount,
  pluginMenuBindingCount,
}: {
  roleMenuCount: number;
  pluginMenuBindingCount: number;
}) {
  return {
    menu: {
      findFirst: () =>
        Promise.resolve({
          id: 'menu-1',
          tenantId: currentUser.tenantId,
          parentId: null,
          parent: null,
          children: [],
          roleMenus: [],
          name: '测试菜单',
          code: 'test_menu',
          type: 'MENU',
          path: '/test-menu',
          component: 'test-menu/page',
          icon: 'ListTree',
          permissionCode: 'system:menu:view',
          sortOrder: 10,
          visible: true,
          enabled: true,
          createdAt: new Date('2026-05-05T00:00:00.000Z'),
          updatedAt: new Date('2026-05-05T00:00:00.000Z'),
        }),
      update: () => Promise.resolve({}),
    },
    roleMenu: {
      count: () => Promise.resolve(roleMenuCount),
      updateMany: () => Promise.resolve({ count: 0 }),
    },
    pluginMenuBinding: {
      count: () => Promise.resolve(pluginMenuBindingCount),
    },
    $transaction: (operations: unknown[]) => Promise.all(operations),
  };
}

function buildPrismaWithMenus(menus: MockMenuRecord[], createdMenu: MockMenuRecord) {
  return {
    menu: {
      findFirst: ({ where }: { where: { id?: string } }) =>
        Promise.resolve(menus.find((menu) => menu.id === where.id) ?? null),
      findMany: () => Promise.resolve([...menus, createdMenu]),
      create: () => Promise.resolve(createdMenu),
    },
  };
}

function buildMenuRecord({
  code,
  id,
  name,
  parent = null,
  parentId,
}: {
  code?: string;
  id: string;
  name: string;
  parent?: MockMenuRecord | null;
  parentId: string | null;
}): MockMenuRecord {
  return {
    id,
    tenantId: currentUser.tenantId,
    parentId,
    parent,
    children: [],
    roleMenus: [],
    name,
    code: code ?? id.replaceAll('-', '_'),
    type: 'MENU',
    path: `/${code ?? id}`,
    component: `${code ?? id}/page`,
    icon: 'ListTree',
    permissionCode: 'system:menu:view',
    sortOrder: 10,
    visible: true,
    enabled: true,
    createdAt: new Date('2026-05-05T00:00:00.000Z'),
    updatedAt: new Date('2026-05-05T00:00:00.000Z'),
  };
}
