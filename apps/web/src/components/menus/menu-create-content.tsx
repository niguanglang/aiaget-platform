'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission, type MenuTreeItem } from '@aiaget/shared-types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { MenuCenterBackground } from '@/components/menus/menu-center-background';
import { toCreateMenuInput } from '@/components/menus/menu-form-converters';
import { MenuFormPanel, type MenuFormValues } from '@/components/menus/menu-form-panel';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { createMenu, getMenuTree, type ApiClientError } from '@/lib/api-client';

export function MenuCreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { currentUser, refreshCurrentUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const parentId = searchParams.get('parentId');

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'system:menu:manage'),
  );

  const treeQuery = useQuery({
    queryKey: ['menu-tree'],
    queryFn: getMenuTree,
  });

  const parent = useMemo(
    () => (parentId ? findMenuById(treeQuery.data ?? [], parentId) : null),
    [parentId, treeQuery.data],
  );

  const createMutation = useMutation({
    mutationFn: createMenu,
    onSuccess: async (menu) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['menu-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['menu-tree'] }),
        queryClient.invalidateQueries({ queryKey: ['menus'] }),
        refreshCurrentUser(),
      ]);
      queryClient.setQueryData(['menu', menu.id], menu);
      router.push(`/menus/${menu.id}`);
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  function submitForm(values: MenuFormValues) {
    setFormError(null);
    createMutation.mutate(toCreateMenuInput(values));
  }

  return (
    <main className="relative mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:px-6">
      <MenuCenterBackground />

      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href="/menus">
              <ArrowLeft className="size-4" />
              菜单中心
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">新增页</StatusBadge>
            <StatusBadge tone={canWrite ? 'healthy' : 'degraded'}>{canWrite ? '可编辑' : '只读权限'}</StatusBadge>
            {parent ? <StatusBadge tone="planned">父级：{parent.name}</StatusBadge> : null}
          </div>
          <h1 className="text-2xl font-semibold">新建菜单节点</h1>
        </div>
      </section>

      {!canWrite ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
          当前账号没有新建菜单权限。
        </div>
      ) : treeQuery.isLoading ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">正在加载菜单父级...</div>
      ) : treeQuery.isError ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-destructive">菜单父级加载失败。</div>
      ) : (
        <MenuFormPanel
          error={formError}
          isPending={createMutation.isPending}
          menuTree={treeQuery.data ?? []}
          mode="create"
          onClose={() => router.push('/menus')}
          onSubmit={submitForm}
          parent={parent}
          presentation="page"
        />
      )}
    </main>
  );
}

function findMenuById(items: MenuTreeItem[], targetId: string): MenuTreeItem | null {
  for (const item of items) {
    if (item.id === targetId) return item;
    const found = findMenuById(item.children, targetId);
    if (found) return found;
  }
  return null;
}
