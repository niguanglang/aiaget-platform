'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission } from '@aiaget/shared-types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { MenuCenterBackground } from '@/components/menus/menu-center-background';
import { toUpdateMenuInput } from '@/components/menus/menu-form-converters';
import { MenuFormPanel, type MenuFormValues } from '@/components/menus/menu-form-panel';
import { booleanLabel, booleanTone, menuTypeLabel, menuTypeTone } from '@/components/menus/menu-status';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { getMenu, getMenuTree, updateMenu, type ApiClientError } from '@/lib/api-client';

export function MenuEditContent({ menuId }: { menuId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'system:menu:manage'),
  );

  const menuQuery = useQuery({
    queryKey: ['menu', menuId],
    queryFn: () => getMenu(menuId),
  });
  const treeQuery = useQuery({
    queryKey: ['menu-tree'],
    queryFn: getMenuTree,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: MenuFormValues }) => updateMenu(id, toUpdateMenuInput(values)),
    onSuccess: async (menu) => {
      queryClient.setQueryData(['menu', menu.id], menu);
      await queryClient.invalidateQueries({ queryKey: ['menus'] });
      await queryClient.invalidateQueries({ queryKey: ['menu-tree'] });
      router.push(`/menus/${menu.id}`);
    },
    onError: (error: ApiClientError | Error) => setFormError(error.message),
  });

  const menu = menuQuery.data ?? null;

  function submitForm(values: MenuFormValues) {
    setFormError(null);
    updateMutation.mutate({ id: menuId, values });
  }

  return (
    <main className="relative mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:px-6">
      <MenuCenterBackground />

      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href={menu ? `/menus/${menu.id}` : '/menus'}>
              <ArrowLeft className="size-4" />
              {menu ? '返回菜单详情' : '返回菜单中心'}
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">编辑页</StatusBadge>
            {menu ? <StatusBadge tone={menuTypeTone(menu.type)}>{menuTypeLabel(menu.type)}</StatusBadge> : null}
            {menu ? <StatusBadge tone={booleanTone(menu.enabled)}>{booleanLabel(menu.enabled, '已启用', '已停用')}</StatusBadge> : null}
            <StatusBadge tone={canWrite ? 'healthy' : 'degraded'}>{canWrite ? '可编辑' : '只读权限'}</StatusBadge>
          </div>
          <h1 className="break-words text-2xl font-semibold">{menu ? `编辑 ${menu.name}` : '编辑菜单节点'}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            这里编辑菜单的基础信息、路由、显示和权限控制。列表和详情页继续负责查询与浏览。
          </p>
        </div>
      </section>

      {menuQuery.isLoading ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">正在加载菜单...</div>
      ) : menuQuery.isError || !menu ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-destructive">菜单加载失败。</div>
      ) : !canWrite ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
          当前账号没有编辑菜单权限。
        </div>
      ) : (
        <MenuFormPanel
          error={formError}
          isPending={updateMutation.isPending}
          menu={menu}
          menuTree={treeQuery.data ?? []}
          mode="edit"
          onClose={() => router.push(`/menus/${menu.id}`)}
          onSubmit={submitForm}
          presentation="page"
        />
      )}
    </main>
  );
}
