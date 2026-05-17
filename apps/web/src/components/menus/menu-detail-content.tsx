'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission, type MenuDetail } from '@aiaget/shared-types';
import { ArrowLeft, Edit, Eye, Plus, Power, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { booleanLabel, booleanTone, formatDateTime, menuTypeLabel, menuTypeTone } from '@/components/menus/menu-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { deleteMenu, disableMenu, enableMenu, getMenu, type ApiClientError } from '@/lib/api-client';

export function MenuDetailContent({ menuId }: { menuId: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { currentUser } = useAuth();
  const [deleteTarget, setDeleteTarget] = useState<MenuDetail | null>(null);
  const [menuStatusTarget, setMenuStatusTarget] = useState<{ id: string; name: string; enabled: boolean } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'system:menu:manage'),
  );

  const menuQuery = useQuery({
    queryKey: ['menu', menuId],
    queryFn: () => getMenu(menuId),
  });
  const menu = menuQuery.data ?? null;

  const metrics = menu
    ? [
        { label: '子节点', value: `${menu.child_count}` },
        { label: '角色引用', value: `${menu.role_count}` },
        { label: '层级', value: `${menu.level}` },
        { label: '更新时间', value: formatDateTime(menu.updated_at) },
      ]
    : [];

  const statusMutation = useMutation({
    mutationFn: (enabled: boolean) => (enabled ? enableMenu(menuId) : disableMenu(menuId)),
    onSuccess: async (result) => {
      queryClient.setQueryData(['menu', result.id], result);
      await queryClient.invalidateQueries({ queryKey: ['menus'] });
      await queryClient.invalidateQueries({ queryKey: ['menu-tree'] });
      setMenuStatusTarget(null);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  function confirmMenuStatusChange() {
    if (!menuStatusTarget) return;
    statusMutation.mutate(menuStatusTarget.enabled);
  }

  const deleteMutation = useMutation({
    mutationFn: deleteMenu,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['menus'] });
      await queryClient.invalidateQueries({ queryKey: ['menu-tree'] });
      setDeleteTarget(null);
      router.push('/menus');
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  if (menuQuery.isLoading) {
    return (
      <main className="mx-auto max-w-[1680px] px-4 py-5 lg:px-7">
        <Card className="rounded-xl border border-slate-200/80 bg-white/[0.9] p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
          <div className="text-sm text-muted-foreground">正在加载菜单详情...</div>
        </Card>
      </main>
    );
  }

  if (menuQuery.isError || !menu) {
    return (
      <main className="mx-auto grid max-w-[1680px] gap-4 px-4 py-5 lg:px-7">
        <Button asChild className="w-fit" variant="outline">
          <Link href="/menus">
            <ArrowLeft className="size-4" />
            返回菜单中心
          </Link>
        </Button>
        <Card className="rounded-xl border border-slate-200/80 bg-white/[0.9] p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
          <div className="text-sm text-destructive">菜单详情加载失败。</div>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-[1680px] gap-5 px-4 py-5 lg:px-7">
      <section className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200/80 bg-white/[0.9] p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)] md:flex-row md:items-start">
        <div className="min-w-0">
          <Button asChild className="mb-4" size="sm" variant="outline">
            <Link href="/menus">
              <ArrowLeft className="size-4" />
              菜单中心
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">菜单档案</StatusBadge>
            <StatusBadge tone={menuTypeTone(menu.type)}>{menuTypeLabel(menu.type)}</StatusBadge>
            <StatusBadge tone={booleanTone(menu.enabled)}>{booleanLabel(menu.enabled, '已启用', '已停用')}</StatusBadge>
            <StatusBadge tone={canWrite ? 'healthy' : 'degraded'}>{canWrite ? '可编辑' : '只读权限'}</StatusBadge>
          </div>
          <h1 className="break-words text-2xl font-semibold">{menu.name}</h1>
          <p className="mt-1 text-xs text-muted-foreground">{menu.code}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canWrite ? (
            <Button asChild variant="outline">
              <Link href={`/menus/${menuId}/edit`}>
                <Edit className="size-4" />
                编辑
              </Link>
            </Button>
          ) : (
            <Button disabled variant="outline">
              <Edit className="size-4" />
              编辑
            </Button>
          )}
          {canWrite ? (
            <Button asChild variant="outline">
              <Link href={`/menus/create?parentId=${menu.id}`}>
                <Plus className="size-4" />
                新建子节点
              </Link>
            </Button>
          ) : (
            <Button disabled variant="outline">
              <Plus className="size-4" />
              新建子节点
            </Button>
          )}
          <Button
            disabled={!canWrite || statusMutation.isPending}
            onClick={() => setMenuStatusTarget({ id: menu.id, name: menu.name, enabled: !menu.enabled })}
            variant="outline"
          >
            <Power className="size-4" />
            {menu.enabled ? '停用' : '启用'}
          </Button>
          <Button disabled={!canWrite} onClick={() => setDeleteTarget(menu)} variant="destructive">
            <Trash2 className="size-4" />
            删除
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div
            className="rounded-xl border border-slate-200/80 bg-white/[0.9] px-5 py-4 shadow-[0_16px_45px_rgba(15,23,42,0.05)]"
            key={metric.label}
          >
            <div className="text-xs font-medium text-muted-foreground">{metric.label}</div>
            <div className="mt-2 break-words text-2xl font-semibold tracking-normal text-slate-950">{metric.value}</div>
          </div>
        ))}
      </section>

      {actionError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <InfoCard title="基础信息">
          <DetailLine label="名称" value={menu.name} />
          <DetailLine label="编码" value={menu.code} />
          <DetailLine label="父级节点" value={menu.parent_name ?? '根节点'} />
          <DetailLine label="层级" value={`${menu.level}`} />
          <DetailLine label="排序号" value={`${menu.sort_order}`} />
          <DetailLine label="更新时间" value={formatDateTime(menu.updated_at)} />
        </InfoCard>

        <InfoCard title="路由信息">
          <DetailLine label="路由路径" value={menu.path ?? '暂无'} />
          <DetailLine label="组件标识" value={menu.component ?? '暂无'} />
          <DetailLine label="图标标识" value={menu.icon ?? '暂无'} />
          <DetailLine label="重定向地址" value={menu.redirect_path ?? '暂无'} />
          <DetailLine label="权限编码" value={menu.permission_code ?? '无需权限'} />
          <DetailLine label="节点类型" value={menuTypeLabel(menu.type)} />
          <DetailLine label="节点状态" value={booleanLabel(menu.enabled, '已启用', '已停用')} />
        </InfoCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <InfoCard title="显示控制">
          <DetailLine label="导航可见" value={booleanLabel(menu.visible, '可见', '隐藏')} />
          <DetailLine label="子节点数" value={`${menu.child_count}`} />
          <DetailLine label="角色引用" value={`${menu.role_count}`} />
          <DetailLine label="创建时间" value={formatDateTime(menu.created_at)} />
          <DetailLine label="最近更新时间" value={formatDateTime(menu.updated_at)} />
        </InfoCard>

        <InfoCard title="高级配置">
          <DetailLine label="外链菜单" value={booleanLabel(menu.is_external, '是', '否')} />
          <DetailLine label="外链地址" value={menu.external_url ?? '暂无'} />
          <DetailLine label="缓存页面" value={booleanLabel(menu.keep_alive, '是', '否')} />
          <DetailLine label="固定标签" value={booleanLabel(menu.affix, '是', '否')} />
          <DetailLine label="面包屑隐藏" value={booleanLabel(menu.hide_breadcrumb, '是', '否')} />
          <div className="rounded-md border bg-slate-950 p-3 text-xs text-slate-100">
            <div className="mb-2 text-slate-300">路由元信息</div>
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words">{stringifyRouteMeta(menu.route_meta)}</pre>
          </div>
        </InfoCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <InfoCard title="权限控制">
          <DetailLine label="权限编码" value={menu.permission_code ?? '无需权限'} />
          <DetailLine label="角色绑定" value={`${menu.role_bindings.length}`} />
          <div className="mt-3 flex flex-wrap gap-2">
            {menu.role_bindings.length > 0 ? (
              menu.role_bindings.map((role) => (
                <StatusBadge key={role.role_id} tone="mock">
                  {role.role_name}
                </StatusBadge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">暂无角色绑定。</span>
            )}
          </div>
        </InfoCard>
        <InfoCard title="依赖与子节点">
          {menu.children.length > 0 ? (
            <div className="grid gap-2">
              {menu.children.map((child) => (
                <div className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm" key={child.id}>
                  <div className="min-w-0">
                    <div className="truncate font-medium">{child.name}</div>
                    <div className="text-xs text-muted-foreground">{child.code}</div>
                  </div>
                  <StatusBadge tone={menuTypeTone(child.type)}>{menuTypeLabel(child.type)}</StatusBadge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState description="当前菜单没有直接子节点。" title="暂无子节点" />
          )}
        </InfoCard>

        <InfoCard title="快捷操作">
          <div className="grid gap-2 text-sm text-muted-foreground">
            <p>删除前会校验子节点和角色引用。</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/menus/${menu.id}`}>
                <Eye className="size-4" />
                菜单档案
              </Link>
            </Button>
          </div>
        </InfoCard>
      </section>

      {deleteTarget ? (
        <ConfirmDialog
          body={`这会软删除菜单节点「${deleteTarget.name}」。如果该节点仍有子节点、角色绑定或插件菜单绑定，后端会拒绝删除。`}
          pending={deleteMutation.isPending}
          title="删除菜单节点？"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        />
      ) : null}

      {menuStatusTarget ? (
        <ConfirmDialog
          body={`这会${menuStatusTarget.enabled ? '启用' : '停用'}菜单节点「${menuStatusTarget.name}」，并影响控制台导航入口、角色菜单授权入口和用户可见状态。`}
          confirmLabel={menuStatusTarget.enabled ? '确认启用' : '确认停用'}
          pending={statusMutation.isPending}
          title="确认更新菜单状态"
          onCancel={() => setMenuStatusTarget(null)}
          onConfirm={confirmMenuStatusChange}
        />
      ) : null}
    </main>
  );
}

function InfoCard({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <Card className="p-4">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-4 grid gap-3 text-sm">{children}</div>
    </Card>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-dashed pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[72%] break-words text-right font-medium">{value}</span>
    </div>
  );
}

function stringifyRouteMeta(value: Record<string, unknown> | null) {
  return value ? JSON.stringify(value, null, 2) : '暂无';
}

function ConfirmDialog({
  body,
  confirmLabel = '确认删除',
  onCancel,
  onConfirm,
  pending,
  title,
}: {
  body: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 px-4 backdrop-blur-sm">
      <Card className="w-full max-w-md p-5">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={onCancel} type="button" variant="outline">
            取消
          </Button>
          <Button disabled={pending} onClick={onConfirm} type="button" variant="destructive">
            {confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}
