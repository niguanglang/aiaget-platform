'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type PluginHookItem, type PluginMenuBindingItem } from '@aiaget/shared-types';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Play, Power } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { PluginCenterBackground } from '@/components/plugins/plugin-center-background';
import { pluginHookStatusLabel, pluginHookStatusTone, pluginStatusLabel, pluginStatusTone } from '@/components/plugins/plugin-status';
import { ConfirmDialog, DetailList, Message, PluginSectionNav, SummaryItem, usePluginPermissions } from '@/components/plugins/plugin-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { getPluginInstallation, queuePluginHookExecution, updatePluginHook, updatePluginMenuBinding, type ApiClientError } from '@/lib/api-client';

type BindingActionTarget =
  | {
      enabled: boolean;
      hook: PluginHookItem;
      type: 'HOOK_STATUS';
    }
  | {
      hook: PluginHookItem;
      type: 'HOOK_EXECUTION_QUEUE';
    }
  | {
      binding: PluginMenuBindingItem;
      type: 'MENU_VISIBILITY';
      visible: boolean;
    }
  | {
      binding: PluginMenuBindingItem;
      enabled: boolean;
      type: 'MENU_STATUS';
    };

export function PluginBindingsContent({ pluginId }: { pluginId: string }) {
  const queryClient = useQueryClient();
  const { canManage, canView } = usePluginPermissions();
  const [notice, setNotice] = useState<string | null>(null);
  const [queuedEventId, setQueuedEventId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [bindingActionTarget, setBindingActionTarget] = useState<BindingActionTarget | null>(null);
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
      setQueuedEventId(null);
      setActionError(null);
      setBindingActionTarget(null);
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
      setQueuedEventId(null);
      setActionError(null);
      setBindingActionTarget(null);
      await queryClient.invalidateQueries({ queryKey: ['plugin-installation', binding.plugin_id] });
      await queryClient.invalidateQueries({ queryKey: ['plugin-installations'] });
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setActionError(error.message);
    },
  });

  const hookExecutionMutation = useMutation({
    mutationFn: ({ hook }: { hook: PluginHookItem }) =>
      queuePluginHookExecution(hook.plugin_id, hook.id, {
        payload: {
          source: 'PLUGIN_BINDINGS_PAGE',
          hook_code: hook.code,
        },
        source_event_id: `manual:${hook.id}:${Date.now()}`,
      }),
    onSuccess: (result) => {
      setNotice(`Hook 已进入受控异步执行队列，事件编号：${result.event_id}。`);
      setQueuedEventId(result.event_id);
      setActionError(null);
      setBindingActionTarget(null);
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setQueuedEventId(null);
      setActionError(error.message);
    },
  });

  if (!canView) return <BindingsStatePanel description="当前账号没有 plugin:center:view 权限。" title="无权限访问绑定配置" />;
  if (detailQuery.isLoading) return <BindingsStatePanel description="正在加载菜单绑定和 Hook 配置。" title="正在加载绑定配置" />;
  if (detailQuery.isError || !detail) return <BindingsStatePanel description="绑定配置加载失败，可能是插件不存在或权限不足。" title="绑定配置加载失败" />;

  const isMutating = hookMutation.isPending || menuBindingMutation.isPending || hookExecutionMutation.isPending;
  const metrics = [
    { helper: '控制台菜单入口', label: '菜单绑定', value: `${detail.menu_bindings.length}` },
    { helper: '当前可见入口', label: '可见菜单', value: `${detail.menu_bindings.filter((binding) => binding.visible).length}` },
    { helper: '扩展点配置', label: 'Hook 绑定', value: `${detail.hooks.length}` },
    { helper: '启用 Hook', label: '启用 Hook', value: `${detail.hooks.filter((hook) => hook.status === 'ACTIVE').length}` },
  ];

  function confirmBindingAction() {
    if (!bindingActionTarget) return;

    if (bindingActionTarget.type === 'HOOK_STATUS') {
      hookMutation.mutate({ enabled: bindingActionTarget.enabled, hook: bindingActionTarget.hook });
      return;
    }

    if (bindingActionTarget.type === 'HOOK_EXECUTION_QUEUE') {
      hookExecutionMutation.mutate({ hook: bindingActionTarget.hook });
      return;
    }

    if (bindingActionTarget.type === 'MENU_VISIBILITY') {
      menuBindingMutation.mutate({
        binding: bindingActionTarget.binding,
        patch: { visible: bindingActionTarget.visible },
      });
      return;
    }

    menuBindingMutation.mutate({
      binding: bindingActionTarget.binding,
      patch: { enabled: bindingActionTarget.enabled },
    });
  }

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
        </div>
        <PluginSectionNav active="bindings" pluginId={pluginId} />
      </section>

      {notice ? (
        <div className="grid gap-2">
          <Message tone="success" value={notice} />
          {queuedEventId ? (
            <Button asChild className="w-fit" size="sm" variant="outline">
              <Link href={`/monitor/events/${queuedEventId}`}>查看事件详情</Link>
            </Button>
          ) : null}
        </div>
      ) : null}
      {actionError ? <Message tone="error" value={actionError} /> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <DetailList title="菜单绑定" subtitle="控制插件向控制台注入的菜单入口、可见性和启停状态。">
          {detail.menu_bindings.length === 0 ? (
            <EmptyState className="p-6" description="暂无记录。" title="暂无菜单注入" />
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
                    <Button disabled={!canManage || isMutating} onClick={() => setBindingActionTarget({ binding, type: 'MENU_VISIBILITY', visible: !binding.visible })} size="icon" title={binding.visible ? '隐藏菜单' : '显示菜单'} type="button" variant="outline">
                      {binding.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                    </Button>
                    <Button disabled={!canManage || isMutating} onClick={() => setBindingActionTarget({ binding, enabled: !binding.enabled, type: 'MENU_STATUS' })} size="icon" title={binding.enabled ? '停用绑定' : '启用绑定'} type="button" variant="outline">
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
            <EmptyState className="p-6" description="暂无记录。" title="暂无 Hook" />
          ) : (
            detail.hooks.map((hook) => (
              <div className="rounded-lg border bg-background p-3" key={hook.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{hook.name}</div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">{hook.code} · {hook.hook_type} · {hook.method}</div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">{hook.target}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button disabled={!canManage || isMutating || hook.status !== 'ACTIVE'} onClick={() => setBindingActionTarget({ hook, type: 'HOOK_EXECUTION_QUEUE' })} size="icon" title="受控入队" type="button" variant="outline">
                      <Play className="size-4" />
                    </Button>
                    <Button disabled={!canManage || isMutating} onClick={() => setBindingActionTarget({ enabled: hook.status !== 'ACTIVE', hook, type: 'HOOK_STATUS' })} size="sm" type="button" variant="outline">
                      {hook.status === 'ACTIVE' ? '停用' : '启用'}
                    </Button>
                  </div>
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
          <SummaryItem label="Hook 入队" value="仅记录受控平台事件，不执行第三方代码" />
        </div>
      </Card>

      {bindingActionTarget ? (
        <ConfirmDialog
          body={bindingActionBody(bindingActionTarget)}
          confirmLabel={bindingActionConfirmLabel(bindingActionTarget)}
          onCancel={() => setBindingActionTarget(null)}
          onConfirm={confirmBindingAction}
          pending={isMutating}
          title={bindingActionTitle(bindingActionTarget)}
          variant={bindingActionVariant(bindingActionTarget)}
        />
      ) : null}
    </main>
  );
}

function bindingActionTitle(target: BindingActionTarget) {
  if (target.type === 'HOOK_STATUS') return target.enabled ? '确认启用 Hook' : '确认停用 Hook';
  if (target.type === 'HOOK_EXECUTION_QUEUE') return '确认受控入队 Hook';
  if (target.type === 'MENU_VISIBILITY') return target.visible ? '确认显示菜单' : '确认隐藏菜单';

  return target.enabled ? '确认启用菜单绑定' : '确认停用菜单绑定';
}

function bindingActionConfirmLabel(target: BindingActionTarget) {
  if (target.type === 'HOOK_STATUS') return target.enabled ? '确认启用' : '确认停用';
  if (target.type === 'HOOK_EXECUTION_QUEUE') return '确认入队';
  if (target.type === 'MENU_VISIBILITY') return target.visible ? '确认显示' : '确认隐藏';

  return target.enabled ? '确认启用' : '确认停用';
}

function bindingActionBody(target: BindingActionTarget) {
  if (target.type === 'HOOK_STATUS') {
    return target.enabled
      ? `确认启用 Hook「${target.hook.name}」？启用后插件会接收 ${target.hook.hook_type} 事件并调用目标 ${target.hook.target}。`
      : `确认停用 Hook「${target.hook.name}」？停用后插件将不再接收该扩展点事件，相关自动化能力会暂停。`;
  }

  if (target.type === 'HOOK_EXECUTION_QUEUE') {
    return `确认将 Hook「${target.hook.name}」写入受控异步执行队列？当前操作只会记录平台事件，不会在控制台直接执行第三方代码、HTTP 调用或脚本。`;
  }

  if (target.type === 'MENU_VISIBILITY') {
    return target.visible
      ? `确认显示菜单「${target.binding.menu_name}」？显示后符合权限条件的用户可以在控制台看到该插件菜单入口。`
      : `确认隐藏菜单「${target.binding.menu_name}」？隐藏后该入口不再出现在控制台菜单中，但绑定状态仍会保留。`;
  }

  return target.enabled
    ? `确认启用菜单绑定「${target.binding.menu_name}」？启用后该菜单入口会按可见性和权限策略参与控制台导航。`
    : `确认停用菜单绑定「${target.binding.menu_name}」？停用后该菜单入口不可用，相关插件页面入口会暂停。`;
}

function bindingActionVariant(target: BindingActionTarget) {
  if (target.type === 'HOOK_STATUS') return target.enabled ? 'default' : 'destructive';
  if (target.type === 'HOOK_EXECUTION_QUEUE') return 'default';
  if (target.type === 'MENU_VISIBILITY') return 'default';

  return target.enabled ? 'default' : 'destructive';
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
