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

test('remove rejects menu deletion while role bindings still reference the menu', async () => {
  const service = new MenusService(buildPrisma({ roleMenuCount: 1, pluginMenuBindingCount: 0 }) as never);

  await assert.rejects(() => service.remove(currentUser, 'menu-1'), /角色绑定|role/i);
});

test('remove rejects menu deletion while plugin menu bindings still reference the menu', async () => {
  const service = new MenusService(buildPrisma({ roleMenuCount: 0, pluginMenuBindingCount: 1 }) as never);

  await assert.rejects(() => service.remove(currentUser, 'menu-1'), /插件菜单绑定|plugin/i);
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
