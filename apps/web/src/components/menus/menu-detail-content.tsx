'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission, type MenuDetail } from '@aiaget/shared-types';
import { motion } from 'motion/react';
import { ArrowLeft, Edit, Eye, Plus, Power, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { MenuCenterBackground } from '@/components/menus/menu-center-background';
import { booleanLabel, booleanTone, formatDateTime, menuTypeLabel, menuTypeTone } from '@/components/menus/menu-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { deleteMenu, disableMenu, enableMenu, getMenu, type ApiClientError } from '@/lib/api-client';

export function MenuDetailContent({ menuId }: { menuId: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { currentUser } = useAuth();
  const [deleteTarget, setDeleteTarget] = useState<MenuDetail | null>(null);
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
        { label: '子节点', value: `${menu.child_count}`, helper: '直接子节点' },
        { label: '角色引用', value: `${menu.role_count}`, helper: '授权引用数' },
        { label: '层级', value: `${menu.level}`, helper: '树深度' },
        { label: '更新时间', value: formatDateTime(menu.updated_at), helper: '最近修改' },
      ]
    : [];

  const statusMutation = useMutation({
    mutationFn: (enabled: boolean) => (enabled ? enableMenu(menuId) : disableMenu(menuId)),
    onSuccess: async (result) => {
      queryClient.setQueryData(['menu', result.id], result);
      await queryClient.invalidateQueries({ queryKey: ['menus'] });
      await queryClient.invalidateQueries({ queryKey: ['menu-tree'] });
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

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
      <main className="relative mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <MenuCenterBackground />
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">正在加载菜单详情...</div>
        </Card>
      </main>
    );
  }

  if (menuQuery.isError || !menu) {
    return (
      <main className="relative mx-auto grid max-w-7xl gap-4 px-4 py-6 lg:px-6">
        <MenuCenterBackground />
        <Button asChild className="w-fit" variant="outline">
          <Link href="/menus">
            <ArrowLeft className="size-4" />
            返回菜单中心
          </Link>
        </Button>
        <Card className="p-6">
          <div className="text-sm text-destructive">菜单详情加载失败。</div>
        </Card>
      </main>
    );
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <MenuCenterBackground />

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
      >
        <div className="min-w-0">
          <Button asChild className="mb-4" size="sm" variant="outline">
            <Link href="/menus">
              <ArrowLeft className="size-4" />
              菜单中心
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">详情页</StatusBadge>
            <StatusBadge tone={menuTypeTone(menu.type)}>{menuTypeLabel(menu.type)}</StatusBadge>
            <StatusBadge tone={booleanTone(menu.enabled)}>{booleanLabel(menu.enabled, '已启用', '已停用')}</StatusBadge>
            <StatusBadge tone={canWrite ? 'healthy' : 'degraded'}>{canWrite ? '可编辑' : '只读权限'}</StatusBadge>
          </div>
          <h1 className="break-words text-2xl font-semibold">{menu.name}</h1>
          <p className="mt-1 text-xs text-muted-foreground">{menu.code}</p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            菜单详情页查看基础信息、路由、显示和权限控制，以及直接子节点和角色引用。
          </p>
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
            onClick={() => statusMutation.mutate(!menu.enabled)}
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
      </motion.section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
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

        <InfoCard title="操作预览">
          <div className="grid gap-2 text-sm text-muted-foreground">
            <p>查看、编辑、新建子节点、启停和删除都从详情页发起。</p>
            <p>删除仍保留后端依赖校验体验，菜单中心不改写拒绝逻辑。</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/menus/${menu.id}`}>
                <Eye className="size-4" />
                当前详情
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
  onCancel,
  onConfirm,
  pending,
  title,
}: {
  body: string;
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
            确认删除
          </Button>
        </div>
      </Card>
    </div>
  );
}
