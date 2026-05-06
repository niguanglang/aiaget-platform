'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type PluginHookItem, type PluginMenuBindingItem } from '@aiaget/shared-types';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Power } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { PluginCenterBackground } from '@/components/plugins/plugin-center-background';
import { pluginHookStatusLabel, pluginHookStatusTone, pluginStatusLabel, pluginStatusTone } from '@/components/plugins/plugin-status';
import { DetailList, Message, PluginSectionNav, SummaryItem, usePluginPermissions } from '@/components/plugins/plugin-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { getPluginInstallation, updatePluginHook, updatePluginMenuBinding, type ApiClientError } from '@/lib/api-client';

export function PluginBindingsContent({ pluginId }: { pluginId: string }) {
  const queryClient = useQueryClient();
  const { canManage, canView } = usePluginPermissions();
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const detailQuery = useQuery({
    enabled: canView,
    queryKey: ['plugin-installation', pluginId],
    queryFn: () => getPluginInstallation(pluginId),
  });
  const detail = detailQuery.data ?? null;

  const hookMutation = useMutation({
    mutationFn: ({ hook, enabled }: { enabled: boolean; hook: PluginHookItem }) =>
      updatePluginHook(hook.plugin_id, hook.id, {
        config_json: hook.config,
        status: enabled ? 'ACTIVE' : 'DISABLED',
      }),
    onSuccess: async (hook) => {
      setNotice(`Hook ${hook.name} 已更新。`);
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ['plugin-installation', hook.plugin_id] });
      await queryClient.invalidateQueries({ queryKey: ['plugin-installations'] });
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setActionError(error.message);
    },
  });

  const menuBindingMutation = useMutation({
    mutationFn: ({ binding, patch }: { binding: PluginMenuBindingItem; patch: Partial<PluginMenuBindingItem> }) =>
      updatePluginMenuBinding(binding.plugin_id, binding.id, {
        enabled: patch.enabled,
        sort_order: patch.sort_order,
        visible: patch.visible,
      }),
    onSuccess: async (binding) => {
      setNotice(`菜单 ${binding.menu_name} 已更新。`);
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ['plugin-installation', binding.plugin_id] });
      await queryClient.invalidateQueries({ queryKey: ['plugin-installations'] });
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setActionError(error.message);
    },
  });

  if (!canView) return <BindingsStatePanel description="当前账号没有 plugin:center:view 权限。" title="无权限访问绑定配置" />;
  if (detailQuery.isLoading) return <BindingsStatePanel description="正在加载菜单绑定和 Hook 配置。" title="正在加载绑定配置" />;
  if (detailQuery.isError || !detail) return <BindingsStatePanel description="绑定配置加载失败，可能是插件不存在或权限不足。" title="绑定配置加载失败" />;

  const isMutating = hookMutation.isPending || menuBindingMutation.isPending;
  const metrics = [
    { helper: '控制台菜单入口', label: '菜单绑定', value: `${detail.menu_bindings.length}` },
    { helper: '当前可见入口', label: '可见菜单', value: `${detail.menu_bindings.filter((binding) => binding.visible).length}` },
    { helper: '扩展点配置', label: 'Hook 绑定', value: `${detail.hooks.length}` },
    { helper: '启用 Hook', label: '启用 Hook', value: `${detail.hooks.filter((hook) => hook.status === 'ACTIVE').length}` },
  ];

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <PluginCenterBackground />
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4" size="sm" variant="outline">
            <Link href={`/plugins/${pluginId}`}>
              <ArrowLeft className="size-4" />
              插件详情
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">绑定配置</StatusBadge>
            <StatusBadge tone={pluginStatusTone(detail.status)}>{pluginStatusLabel(detail.status)}</StatusBadge>
            <StatusBadge tone={canManage ? 'healthy' : 'degraded'}>{canManage ? '可编辑' : '只读权限'}</StatusBadge>
          </div>
          <h1 className="break-words text-2xl font-semibold">{detail.name} · 菜单绑定与 Hook 配置</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">维护插件向控制台注入的菜单绑定和控制面 Hook 配置。</p>
        </div>
        <PluginSectionNav active="bindings" pluginId={pluginId} />
      </section>

      {notice ? <Message tone="success" value={notice} /> : null}
      {actionError ? <Message tone="error" value={actionError} /> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <DetailList title="菜单绑定" subtitle="控制插件向控制台注入的菜单入口、可见性和启停状态。">
          {detail.menu_bindings.length === 0 ? (
            <EmptyState className="p-6" description="当前插件没有菜单绑定。" title="暂无菜单注入" />
          ) : (
            detail.menu_bindings.map((binding) => (
              <div className="rounded-lg border bg-background p-3" key={binding.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{binding.menu_name}</div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">{binding.menu_code} · {binding.path ?? '无路由'}</div>
                    <div className="mt-1 text-xs text-muted-foreground">组件：{binding.component ?? '未配置'}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button disabled={!canManage || isMutating} onClick={() => menuBindingMutation.mutate({ binding, patch: { visible: !binding.visible } })} size="icon" title={binding.visible ? '隐藏菜单' : '显示菜单'} type="button" variant="outline">
                      {binding.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                    </Button>
                    <Button disabled={!canManage || isMutating} onClick={() => menuBindingMutation.mutate({ binding, patch: { enabled: !binding.enabled } })} size="icon" title={binding.enabled ? '停用绑定' : '启用绑定'} type="button" variant="outline">
                      {binding.enabled ? <CheckCircle2 className="size-4" /> : <Power className="size-4" />}
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge tone={binding.enabled ? 'healthy' : 'planned'}>{binding.enabled ? '启用' : '停用'}</StatusBadge>
                  <StatusBadge tone={binding.visible ? 'ready' : 'planned'}>{binding.visible ? '可见' : '隐藏'}</StatusBadge>
                  <StatusBadge tone="planned">排序 {binding.sort_order}</StatusBadge>
                </div>
              </div>
            ))
          )}
        </DetailList>

        <DetailList title="Hook 绑定" subtitle="控制插件接入控制面事件或网关扩展点。">
          {detail.hooks.length === 0 ? (
            <EmptyState className="p-6" description="当前插件没有 Hook 绑定。" title="暂无 Hook" />
          ) : (
            detail.hooks.map((hook) => (
              <div className="rounded-lg border bg-background p-3" key={hook.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{hook.name}</div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">{hook.code} · {hook.hook_type} · {hook.method}</div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">{hook.target}</div>
                  </div>
                  <Button disabled={!canManage || isMutating} onClick={() => hookMutation.mutate({ hook, enabled: hook.status !== 'ACTIVE' })} size="sm" type="button" variant="outline">
                    {hook.status === 'ACTIVE' ? '停用' : '启用'}
                  </Button>
                </div>
                <div className="mt-3 grid gap-2">
                  <div><StatusBadge tone={pluginHookStatusTone(hook.status)}>{pluginHookStatusLabel(hook.status)}</StatusBadge></div>
                  <HookConfigSummary config={hook.config} />
                </div>
              </div>
            ))
          )}
        </DetailList>
      </section>

      <Card className="p-5">
        <h2 className="text-sm font-semibold">绑定配置说明</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <SummaryItem label="菜单可见性" value="控制是否出现在控制台菜单" />
          <SummaryItem label="菜单启停" value="控制绑定是否可用" />
          <SummaryItem label="Hook 启停" value="控制扩展点是否接收事件" />
        </div>
      </Card>
    </main>
  );
}

function HookConfigSummary({ config }: { config: Record<string, unknown> | null }) {
  if (!config) return <div className="text-xs text-muted-foreground">暂无 Hook 配置。</div>;

  const entries = Object.entries(config).slice(0, 4);
  if (entries.length === 0) return <div className="text-xs text-muted-foreground">Hook 配置为空对象。</div>;

  return (
    <div className="grid gap-1 rounded-md border bg-muted/20 p-2 text-xs text-muted-foreground">
      {entries.map(([key, value]) => (
        <div className="flex justify-between gap-3" key={key}>
          <span>{key}</span>
          <span className="truncate font-medium text-foreground">{String(value)}</span>
        </div>
      ))}
    </div>
  );
}

function BindingsStatePanel({ description, title }: { description: string; title: string }) {
  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <PluginCenterBackground />
      <Button asChild className="w-fit" variant="outline">
        <Link href="/plugins">
          <ArrowLeft className="size-4" />
          插件生态中心
        </Link>
      </Button>
      <Card className="p-6">
        <EmptyState description={description} title={title} />
      </Card>
    </main>
  );
}
