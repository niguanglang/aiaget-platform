'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  hasPermission,
  type PluginHookItem,
  type PluginInstallationDetail,
  type PluginInstallationItem,
  type PluginInstallationStatus,
  type PluginMarketItem,
  type PluginMenuBindingItem,
  type PluginRiskLevel,
  type PluginRuntimeStatus,
} from '@aiaget/shared-types';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  PackagePlus,
  Power,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  UploadCloud,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { PluginCenterBackground } from '@/components/plugins/plugin-center-background';
import {
  formatPluginDateTime,
  pluginHookStatusLabel,
  pluginHookStatusTone,
  pluginInstallationStatuses,
  pluginRiskLabel,
  pluginRiskLevels,
  pluginRiskTone,
  pluginRuntimeLabel,
  pluginRuntimeStatuses,
  pluginRuntimeTone,
  pluginSourceLabel,
  pluginStatusLabel,
  pluginStatusTone,
} from '@/components/plugins/plugin-status';
import { parseJsonObjectText, stringifyJson } from '@/components/tools/tool-json';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  disablePlugin,
  enablePlugin,
  getPluginInstallation,
  getPluginOverview,
  installPlugin,
  listPluginInstallations,
  listPluginMarket,
  updatePluginHook,
  updatePluginInstallation,
  updatePluginMenuBinding,
  upgradePlugin,
  type ApiClientError,
} from '@/lib/api-client';
import { cn } from '@/lib/utils';

type TabKey = 'market' | 'installed';

interface EditPluginForm {
  name: string;
  description: string;
  status: PluginInstallationStatus;
  runtime_status: PluginRuntimeStatus;
  risk_level: PluginRiskLevel;
  latest_version: string;
  config_text: string;
}

export function PluginContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [tab, setTab] = useState<TabKey>('market');
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [selectedPluginId, setSelectedPluginId] = useState<string | null>(null);
  const [editingPlugin, setEditingPlugin] = useState<PluginInstallationDetail | null>(null);
  const [editForm, setEditForm] = useState<EditPluginForm | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const permissions = currentUser?.user.permissions ?? [];
  const isTenantAdmin = Boolean(currentUser?.user.roles.some((role) => role.code === 'tenant_admin'));
  const canView = isTenantAdmin || hasPermission(permissions, 'plugin:center:view');
  const canManage = isTenantAdmin || hasPermission(permissions, 'plugin:center:manage');
  const canInstall = isTenantAdmin || hasPermission(permissions, 'plugin:center:install');
  const canEnable = isTenantAdmin || hasPermission(permissions, 'plugin:center:enable');
  const canDisable = isTenantAdmin || hasPermission(permissions, 'plugin:center:disable');
  const canUpgrade = isTenantAdmin || hasPermission(permissions, 'plugin:center:upgrade');

  const overviewQuery = useQuery({
    enabled: canView,
    queryKey: ['plugin-overview'],
    queryFn: getPluginOverview,
  });
  const marketQuery = useQuery({
    enabled: canView,
    queryKey: ['plugin-market'],
    queryFn: listPluginMarket,
  });
  const installationsQuery = useQuery({
    enabled: canView,
    queryKey: ['plugin-installations'],
    queryFn: listPluginInstallations,
  });
  const detailQuery = useQuery({
    enabled: canView && Boolean(selectedPluginId),
    queryKey: ['plugin-installation', selectedPluginId],
    queryFn: () => getPluginInstallation(selectedPluginId ?? ''),
  });

  const market = marketQuery.data ?? [];
  const installations = installationsQuery.data ?? [];
  const selectedPlugin = detailQuery.data ?? null;
  const installedByPluginId = useMemo(
    () => new Map(installations.map((installation) => [installation.plugin_id, installation])),
    [installations],
  );

  const filteredMarket = useMemo(() => {
    return market.filter((item) => {
      if (!matchesKeyword(item, keyword)) return false;
      if (statusFilter && (item.install_status ?? 'UNINSTALLED') !== statusFilter) return false;
      if (riskFilter && item.risk_level !== riskFilter) return false;
      return true;
    });
  }, [keyword, market, riskFilter, statusFilter]);

  const filteredInstallations = useMemo(() => {
    return installations.filter((item) => {
      if (!matchesKeyword(item, keyword)) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      if (riskFilter && item.risk_level !== riskFilter) return false;
      return true;
    });
  }, [installations, keyword, riskFilter, statusFilter]);

  const activeRows = tab === 'market' ? filteredMarket : filteredInstallations;
  const metrics = [
    { label: '插件总数', value: `${overviewQuery.data?.total ?? market.length}`, helper: '市场与租户插件' },
    { label: '已启用', value: `${overviewQuery.data?.active_count ?? 0}`, helper: '运行态插件' },
    { label: '待审核', value: `${overviewQuery.data?.pending_review_count ?? 0}`, helper: '安全审查' },
    { label: '菜单注入', value: `${overviewQuery.data?.menu_count ?? 0}`, helper: '可见入口绑定' },
  ];

  const installMutation = useMutation({
    mutationFn: installPlugin,
    onSuccess: async (detail) => {
      setNotice(`已安装插件 ${detail.name}。`);
      setActionError(null);
      await refreshPlugins(detail.plugin_id);
      setSelectedPluginId(detail.plugin_id);
      setTab('installed');
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setActionError(error.message);
    },
  });

  const runtimeMutation = useMutation({
    mutationFn: ({ pluginId, action }: { pluginId: string; action: 'enable' | 'disable' }) =>
      action === 'enable' ? enablePlugin(pluginId) : disablePlugin(pluginId),
    onSuccess: async (detail) => {
      setNotice(`${detail.name} 已${detail.status === 'ACTIVE' ? '启用' : '停用'}。`);
      setActionError(null);
      await refreshPlugins(detail.plugin_id);
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setActionError(error.message);
    },
  });

  const upgradeMutation = useMutation({
    mutationFn: upgradePlugin,
    onSuccess: async (detail) => {
      setNotice(`${detail.name} 已进入升级流程。`);
      setActionError(null);
      await refreshPlugins(detail.plugin_id);
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setActionError(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ pluginId, values }: { pluginId: string; values: EditPluginForm }) => {
      const parsedConfig = parseJsonObjectText(values.config_text, '插件配置', { allowEmpty: true });
      if (!parsedConfig.ok) {
        throw new Error(parsedConfig.message);
      }

      return updatePluginInstallation(pluginId, {
        name: values.name,
        description: values.description.trim() || null,
        status: values.status,
        runtime_status: values.runtime_status,
        risk_level: values.risk_level,
        latest_version: values.latest_version,
        config_json: parsedConfig.value,
      });
    },
    onSuccess: async (detail) => {
      setNotice(`${detail.name} 已更新。`);
      setFormError(null);
      setEditingPlugin(null);
      setEditForm(null);
      await refreshPlugins(detail.plugin_id);
    },
    onError: (error: Error) => {
      setNotice(null);
      setFormError(error.message);
    },
  });

  const hookMutation = useMutation({
    mutationFn: ({ hook, enabled }: { hook: PluginHookItem; enabled: boolean }) =>
      updatePluginHook(hook.plugin_id, hook.id, {
        status: enabled ? 'ACTIVE' : 'DISABLED',
        config_json: hook.config,
      }),
    onSuccess: async (hook) => {
      setNotice(`Hook ${hook.name} 已更新。`);
      setActionError(null);
      await refreshPlugins(hook.plugin_id);
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
        visible: patch.visible,
        sort_order: patch.sort_order,
      }),
    onSuccess: async (binding) => {
      setNotice(`菜单 ${binding.menu_name} 已更新。`);
      setActionError(null);
      await refreshPlugins(binding.plugin_id);
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setActionError(error.message);
    },
  });

  async function refreshPlugins(pluginId?: string) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['plugin-overview'] }),
      queryClient.invalidateQueries({ queryKey: ['plugin-market'] }),
      queryClient.invalidateQueries({ queryKey: ['plugin-installations'] }),
      pluginId ? queryClient.invalidateQueries({ queryKey: ['plugin-installation', pluginId] }) : Promise.resolve(),
    ]);
  }

  function clearFilters() {
    setKeyword('');
    setStatusFilter('');
    setRiskFilter('');
  }

  function openEditPlugin(plugin: PluginInstallationDetail) {
    setEditingPlugin(plugin);
    setEditForm({
      name: plugin.name,
      description: plugin.description ?? '',
      status: plugin.status,
      runtime_status: plugin.runtime_status,
      risk_level: plugin.risk_level,
      latest_version: plugin.latest_version,
      config_text: stringifyJson(plugin.config_json, ''),
    });
    setFormError(null);
  }

  function submitEditPlugin() {
    if (!editingPlugin || !editForm || !canManage) return;
    setFormError(null);
    updateMutation.mutate({ pluginId: editingPlugin.plugin_id, values: editForm });
  }

  if (!canView) {
    return (
      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <PluginCenterBackground />
        <EmptyState description="当前账号没有插件中心查看权限，请联系管理员授权 plugin:center:view。" title="无权限访问插件中心" />
      </main>
    );
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <PluginCenterBackground />
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
      >
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M63-2</StatusBadge>
            <StatusBadge tone="healthy">插件生态</StatusBadge>
            <StatusBadge tone="planned">控制面安装</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">插件生态中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            管理插件市场、租户安装实例、启停升级、菜单注入、Hook 和审计记录。当前阶段只管理控制面状态，不执行任意第三方代码。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              void refreshPlugins(selectedPluginId ?? undefined);
            }}
            type="button"
            variant="outline"
          >
            <RefreshCw className="size-4" />
            刷新
          </Button>
          <Button onClick={() => setTab('market')} type="button">
            <PackagePlus className="size-4" />
            查看市场
          </Button>
        </div>
      </motion.section>

      {notice ? <Message tone="success" value={notice} /> : null}
      {actionError ? <Message tone="error" value={actionError} /> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="min-w-0 overflow-hidden">
          <div className="border-b p-4">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-sm font-semibold">插件列表</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  市场用于安装入口，已安装列表用于运行态和资源配置。
                </p>
              </div>
              <div className="inline-flex rounded-md border bg-background p-1">
                <button
                  className={cn('rounded px-3 py-1.5 text-xs transition-colors', tab === 'market' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}
                  onClick={() => setTab('market')}
                  type="button"
                >
                  市场
                </button>
                <button
                  className={cn('rounded px-3 py-1.5 text-xs transition-colors', tab === 'installed' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}
                  onClick={() => setTab('installed')}
                  type="button"
                >
                  已安装
                </button>
              </div>
            </div>
            <div className="mt-4 grid gap-2 lg:grid-cols-[1fr_170px_150px_auto]">
              <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
                <Search className="size-4 text-muted-foreground" />
                <input
                  className="min-w-0 flex-1 bg-transparent outline-none"
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="搜索名称、编码、提供方"
                  value={keyword}
                />
              </label>
              <select className="h-9 rounded-md border bg-background/70 px-3 text-sm" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
                <option value="">全部状态</option>
                {tab === 'market' ? <option value="UNINSTALLED">未安装</option> : null}
                {pluginInstallationStatuses.map((status) => (
                  <option key={status} value={status}>
                    {pluginStatusLabel(status)}
                  </option>
                ))}
              </select>
              <select className="h-9 rounded-md border bg-background/70 px-3 text-sm" onChange={(event) => setRiskFilter(event.target.value)} value={riskFilter}>
                <option value="">全部风险</option>
                {pluginRiskLevels.map((level) => (
                  <option key={level} value={level}>
                    {pluginRiskLabel(level)}
                  </option>
                ))}
              </select>
              <Button onClick={clearFilters} type="button" variant="outline">
                清空
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 font-medium text-muted-foreground">插件</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">版本</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">状态</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">风险</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">能力</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {activeRows.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        description={tab === 'market' ? '还没有可展示的插件市场条目，执行 seed 后会有示例插件。' : '当前租户还没有安装插件。'}
                        title={marketQuery.isLoading || installationsQuery.isLoading ? '正在加载插件' : '暂无插件'}
                      />
                    </td>
                  </tr>
                ) : null}
                {tab === 'market'
                  ? filteredMarket.map((plugin) => (
                      <MarketRow
                        canInstall={canInstall}
                        installedItem={installedByPluginId.get(plugin.plugin_id) ?? null}
                        isPending={installMutation.isPending}
                        key={plugin.plugin_id}
                        onInstall={() => installMutation.mutate(plugin)}
                        onSelect={() => {
                          if (plugin.installed) setSelectedPluginId(plugin.plugin_id);
                        }}
                        plugin={plugin}
                      />
                    ))
                  : filteredInstallations.map((installation) => (
                      <InstallationRow
                        canDisable={canDisable}
                        canEnable={canEnable}
                        canUpgrade={canUpgrade}
                        installation={installation}
                        isPending={runtimeMutation.isPending || upgradeMutation.isPending}
                        key={installation.id}
                        onDisable={() => runtimeMutation.mutate({ pluginId: installation.plugin_id, action: 'disable' })}
                        onEnable={() => runtimeMutation.mutate({ pluginId: installation.plugin_id, action: 'enable' })}
                        onSelect={() => setSelectedPluginId(installation.plugin_id)}
                        onUpgrade={() => upgradeMutation.mutate(installation.plugin_id)}
                        selected={installation.plugin_id === selectedPluginId}
                      />
                    ))}
              </tbody>
            </table>
          </div>
        </Card>

        <PluginDetailPanel
          canDisable={canDisable}
          canEnable={canEnable}
          canManage={canManage}
          canUpgrade={canUpgrade}
          detail={selectedPlugin}
          detailError={detailQuery.error}
          isLoading={detailQuery.isLoading}
          isMutating={runtimeMutation.isPending || upgradeMutation.isPending || hookMutation.isPending || menuBindingMutation.isPending}
          onDisable={(pluginId) => runtimeMutation.mutate({ pluginId, action: 'disable' })}
          onEdit={openEditPlugin}
          onEnable={(pluginId) => runtimeMutation.mutate({ pluginId, action: 'enable' })}
          onToggleHook={(hook, enabled) => hookMutation.mutate({ hook, enabled })}
          onToggleMenuBinding={(binding, patch) => menuBindingMutation.mutate({ binding, patch })}
          onUpgrade={(pluginId) => upgradeMutation.mutate(pluginId)}
        />
      </section>

      {editingPlugin && editForm ? (
        <EditPluginPanel
          error={formError}
          form={editForm}
          isPending={updateMutation.isPending}
          onChange={setEditForm}
          onClose={() => {
            setEditingPlugin(null);
            setEditForm(null);
            setFormError(null);
          }}
          onSubmit={submitEditPlugin}
        />
      ) : null}
    </main>
  );
}

function MarketRow({
  canInstall,
  installedItem,
  isPending,
  onInstall,
  onSelect,
  plugin,
}: {
  canInstall: boolean;
  installedItem: PluginInstallationItem | null;
  isPending: boolean;
  onInstall: () => void;
  onSelect: () => void;
  plugin: PluginMarketItem;
}) {
  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-3">
        <button className="grid text-left" onClick={onSelect} type="button">
          <span className="font-medium">{plugin.name}</span>
          <span className="mt-1 text-xs text-muted-foreground">
            {plugin.code} · {plugin.provider}
          </span>
          {plugin.description ? <span className="mt-1 truncate text-xs text-muted-foreground">{plugin.description}</span> : null}
        </button>
      </td>
      <td className="px-4 py-3">{plugin.latest_version}</td>
      <td className="px-4 py-3">
        <StatusBadge tone={pluginStatusTone(plugin.install_status)}>{pluginStatusLabel(plugin.install_status)}</StatusBadge>
      </td>
      <td className="px-4 py-3">
        <StatusBadge tone={pluginRiskTone(plugin.risk_level)}>{pluginRiskLabel(plugin.risk_level)}</StatusBadge>
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {plugin.menu_count} 菜单 / {plugin.hook_count} Hook / {plugin.permission_codes.length} 权限
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          {installedItem ? (
            <Button onClick={onSelect} size="sm" type="button" variant="outline">
              <Eye className="size-4" />
              详情
            </Button>
          ) : (
            <Button disabled={!canInstall || isPending} onClick={onInstall} size="sm" type="button">
              <PackagePlus className="size-4" />
              安装
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

function InstallationRow({
  canDisable,
  canEnable,
  canUpgrade,
  installation,
  isPending,
  onDisable,
  onEnable,
  onSelect,
  onUpgrade,
  selected,
}: {
  canDisable: boolean;
  canEnable: boolean;
  canUpgrade: boolean;
  installation: PluginInstallationItem;
  isPending: boolean;
  onDisable: () => void;
  onEnable: () => void;
  onSelect: () => void;
  onUpgrade: () => void;
  selected: boolean;
}) {
  return (
    <tr className={cn('border-b last:border-0', selected ? 'bg-blue-50/50' : 'hover:bg-muted/30')}>
      <td className="px-4 py-3">
        <button className="grid text-left" onClick={onSelect} type="button">
          <span className="font-medium">{installation.name}</span>
          <span className="mt-1 text-xs text-muted-foreground">
            {installation.code} · {installation.provider}
          </span>
        </button>
      </td>
      <td className="px-4 py-3">
        {installation.installed_version}
        {installation.installed_version !== installation.latest_version ? (
          <span className="ml-2 text-xs text-amber-600">可升级至 {installation.latest_version}</span>
        ) : null}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone={pluginStatusTone(installation.status)}>{pluginStatusLabel(installation.status)}</StatusBadge>
          <StatusBadge tone={pluginRuntimeTone(installation.runtime_status)}>{pluginRuntimeLabel(installation.runtime_status)}</StatusBadge>
        </div>
      </td>
      <td className="px-4 py-3">
        <StatusBadge tone={pluginRiskTone(installation.risk_level)}>{pluginRiskLabel(installation.risk_level)}</StatusBadge>
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {installation.menu_count} 菜单 / {installation.hook_count} Hook / {installation.permission_count} 权限
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          <Button onClick={onSelect} size="sm" type="button" variant="outline">
            <Eye className="size-4" />
          </Button>
          {installation.status === 'ACTIVE' ? (
            <Button disabled={!canDisable || isPending} onClick={onDisable} size="sm" type="button" variant="outline">
              停用
            </Button>
          ) : (
            <Button disabled={!canEnable || isPending} onClick={onEnable} size="sm" type="button" variant="outline">
              启用
            </Button>
          )}
          <Button disabled={!canUpgrade || isPending} onClick={onUpgrade} size="sm" type="button" variant="outline">
            升级
          </Button>
        </div>
      </td>
    </tr>
  );
}

function PluginDetailPanel({
  canDisable,
  canEnable,
  canManage,
  canUpgrade,
  detail,
  detailError,
  isLoading,
  isMutating,
  onDisable,
  onEdit,
  onEnable,
  onToggleHook,
  onToggleMenuBinding,
  onUpgrade,
}: {
  canDisable: boolean;
  canEnable: boolean;
  canManage: boolean;
  canUpgrade: boolean;
  detail: PluginInstallationDetail | null;
  detailError: unknown;
  isLoading: boolean;
  isMutating: boolean;
  onDisable: (pluginId: string) => void;
  onEdit: (plugin: PluginInstallationDetail) => void;
  onEnable: (pluginId: string) => void;
  onToggleHook: (hook: PluginHookItem, enabled: boolean) => void;
  onToggleMenuBinding: (binding: PluginMenuBindingItem, patch: Partial<PluginMenuBindingItem>) => void;
  onUpgrade: (pluginId: string) => void;
}) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <EmptyState description="正在加载插件安装实例、菜单绑定、Hook 和审计记录。" title="正在加载详情" />
      </Card>
    );
  }

  if (detailError) {
    return (
      <Card className="p-6">
        <EmptyState description="当前插件详情加载失败，可能是资源授权或插件安装实例不存在。" title="详情加载失败" />
      </Card>
    );
  }

  if (!detail) {
    return (
      <Card className="p-6">
        <EmptyState description="从左侧市场或已安装列表选择一个插件，查看菜单注入、Hook、权限预览和审计记录。" title="选择插件查看详情" />
      </Card>
    );
  }

  return (
    <Card className="min-w-0 overflow-hidden">
      <div className="border-b p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={pluginStatusTone(detail.status)}>{pluginStatusLabel(detail.status)}</StatusBadge>
              <StatusBadge tone={pluginRuntimeTone(detail.runtime_status)}>{pluginRuntimeLabel(detail.runtime_status)}</StatusBadge>
              <StatusBadge tone={pluginRiskTone(detail.risk_level)}>{pluginRiskLabel(detail.risk_level)}</StatusBadge>
            </div>
            <h2 className="mt-3 truncate text-lg font-semibold">{detail.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {detail.code} · {detail.provider} · {pluginSourceLabel(detail.source_type)}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            <Button disabled={!canManage} onClick={() => onEdit(detail)} size="sm" type="button" variant="outline">
              <Settings2 className="size-4" />
              配置
            </Button>
            {detail.status === 'ACTIVE' ? (
              <Button disabled={!canDisable || isMutating} onClick={() => onDisable(detail.plugin_id)} size="sm" type="button" variant="outline">
                <Power className="size-4" />
                停用
              </Button>
            ) : (
              <Button disabled={!canEnable || isMutating} onClick={() => onEnable(detail.plugin_id)} size="sm" type="button" variant="outline">
                <Power className="size-4" />
                启用
              </Button>
            )}
            <Button disabled={!canUpgrade || isMutating} onClick={() => onUpgrade(detail.plugin_id)} size="sm" type="button">
              <UploadCloud className="size-4" />
              升级
            </Button>
          </div>
        </div>
        {detail.description ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{detail.description}</p> : null}
      </div>

      <div className="grid gap-4 p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <InfoBlock label="已安装版本" value={detail.installed_version} />
          <InfoBlock label="最新版本" value={detail.latest_version} />
          <InfoBlock label="安装时间" value={formatPluginDateTime(detail.installed_at)} />
        </div>

        <section className="rounded-lg border bg-muted/20 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-4 text-emerald-600" />
            <div>
              <h3 className="text-sm font-semibold">安全预览</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{detail.security_preview.summary}</p>
              <div className="mt-3 grid gap-2">
                {[...detail.security_preview.risks, ...detail.security_preview.notes].map((item) => (
                  <div className="rounded-md border bg-background px-3 py-2 text-xs text-muted-foreground" key={item}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 2xl:grid-cols-2">
          <DetailList title="菜单注入" subtitle="控制插件向控制台注入的菜单入口。">
            {detail.menu_bindings.length === 0 ? (
              <EmptyState className="p-6" description="当前插件没有菜单绑定。" title="暂无菜单注入" />
            ) : (
              detail.menu_bindings.map((binding) => (
                <div className="rounded-lg border bg-background p-3" key={binding.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{binding.menu_name}</div>
                      <div className="mt-1 truncate text-xs text-muted-foreground">
                        {binding.menu_code} · {binding.path ?? '无路由'}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        disabled={!canManage || isMutating}
                        onClick={() => onToggleMenuBinding(binding, { visible: !binding.visible })}
                        size="icon"
                        title={binding.visible ? '隐藏菜单' : '显示菜单'}
                        type="button"
                        variant="outline"
                      >
                        {binding.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                      </Button>
                      <Button
                        disabled={!canManage || isMutating}
                        onClick={() => onToggleMenuBinding(binding, { enabled: !binding.enabled })}
                        size="icon"
                        title={binding.enabled ? '停用绑定' : '启用绑定'}
                        type="button"
                        variant="outline"
                      >
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
                      <div className="mt-1 truncate text-xs text-muted-foreground">
                        {hook.code} · {hook.hook_type} · {hook.method}
                      </div>
                      <div className="mt-1 truncate text-xs text-muted-foreground">{hook.target}</div>
                    </div>
                    <Button
                      disabled={!canManage || isMutating}
                      onClick={() => onToggleHook(hook, hook.status !== 'ACTIVE')}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      {hook.status === 'ACTIVE' ? '停用' : '启用'}
                    </Button>
                  </div>
                  <div className="mt-3">
                    <StatusBadge tone={pluginHookStatusTone(hook.status)}>{pluginHookStatusLabel(hook.status)}</StatusBadge>
                  </div>
                </div>
              ))
            )}
          </DetailList>
        </section>

        <section className="grid gap-4 2xl:grid-cols-2">
          <DetailList title="权限预览" subtitle="插件声明的权限编码会进入角色、资源授权和安全策略校验。">
            {detail.permission_preview.length === 0 ? (
              <EmptyState className="p-6" description="当前插件没有声明额外权限。" title="暂无权限声明" />
            ) : (
              <div className="flex flex-wrap gap-2">
                {detail.permission_preview.map((permission) => (
                  <span className="rounded-md border bg-background px-2.5 py-1 text-xs text-muted-foreground" key={permission}>
                    {permission}
                  </span>
                ))}
              </div>
            )}
          </DetailList>

          <DetailList title="审计记录" subtitle="安装、启停、升级、Hook 和菜单注入变更都会记录审计。">
            {detail.audit_logs.length === 0 ? (
              <EmptyState className="p-6" description="当前插件还没有审计记录。" title="暂无审计" />
            ) : (
              detail.audit_logs.slice(0, 6).map((log) => (
                <div className="rounded-lg border bg-background p-3" key={log.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">{log.title}</div>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{log.summary}</p>
                    </div>
                    <StatusBadge tone={pluginRiskTone(log.risk_level)}>{pluginRiskLabel(log.risk_level)}</StatusBadge>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">{formatPluginDateTime(log.created_at)}</div>
                </div>
              ))
            )}
          </DetailList>
        </section>
      </div>
    </Card>
  );
}

function EditPluginPanel({
  error,
  form,
  isPending,
  onChange,
  onClose,
  onSubmit,
}: {
  error: string | null;
  form: EditPluginForm;
  isPending: boolean;
  onChange: (form: EditPluginForm) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <section className="fixed inset-y-0 right-0 z-40 flex w-full max-w-2xl flex-col border-l bg-background/95 shadow-xl backdrop-blur">
      <div className="border-b p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">编辑插件配置</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              修改插件基础信息、状态、风险等级和配置 JSON。Hook 与菜单绑定在详情中单独控制。
            </p>
          </div>
          <Button onClick={onClose} size="icon" type="button" variant="ghost">
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid flex-1 gap-5 overflow-y-auto p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="名称">
            <Input onChange={(event) => onChange({ ...form, name: event.target.value })} value={form.name} />
          </Field>
          <Field label="最新版本">
            <Input onChange={(event) => onChange({ ...form, latest_version: event.target.value })} value={form.latest_version} />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="安装状态">
            <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => onChange({ ...form, status: event.target.value as PluginInstallationStatus })} value={form.status}>
              {pluginInstallationStatuses.map((status) => (
                <option key={status} value={status}>
                  {pluginStatusLabel(status)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="运行状态">
            <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => onChange({ ...form, runtime_status: event.target.value as PluginRuntimeStatus })} value={form.runtime_status}>
              {pluginRuntimeStatuses.map((status) => (
                <option key={status} value={status}>
                  {pluginRuntimeLabel(status)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="风险等级">
            <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => onChange({ ...form, risk_level: event.target.value as PluginRiskLevel })} value={form.risk_level}>
              {pluginRiskLevels.map((risk) => (
                <option key={risk} value={risk}>
                  {pluginRiskLabel(risk)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="描述">
          <textarea
            className="min-h-24 resize-y rounded-md border bg-background/80 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => onChange({ ...form, description: event.target.value })}
            value={form.description}
          />
        </Field>
        <Field label="配置 JSON">
          <textarea
            className="min-h-48 resize-y rounded-md border bg-background/80 px-3 py-2 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => onChange({ ...form, config_text: event.target.value })}
            placeholder='{"enabled": true}'
            value={form.config_text}
          />
        </Field>
        {error ? <Message tone="error" value={error} /> : null}
      </div>

      <div className="flex justify-end gap-2 border-t bg-background px-6 py-4">
        <Button onClick={onClose} type="button" variant="outline">
          取消
        </Button>
        <Button disabled={isPending} onClick={onSubmit} type="button">
          保存修改
        </Button>
      </div>
    </section>
  );
}

function DetailList({ children, subtitle, title }: { children: React.ReactNode; subtitle: string; title: string }) {
  return (
    <section className="rounded-lg border bg-muted/20 p-4">
      <div className="mb-3 flex items-start gap-2">
        <SlidersHorizontal className="mt-0.5 size-4 text-muted-foreground" />
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-sm font-medium">{value}</div>
    </div>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      {children}
    </label>
  );
}

function Message({ tone, value }: { tone: 'success' | 'error'; value: string }) {
  return (
    <div
      className={cn(
        'rounded-md border px-4 py-3 text-sm',
        tone === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-destructive/30 bg-destructive/5 text-destructive',
      )}
    >
      {value}
    </div>
  );
}

function matchesKeyword(item: PluginMarketItem | PluginInstallationItem, keyword: string) {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) return true;

  return [item.name, item.code, item.provider, item.description ?? '']
    .join(' ')
    .toLowerCase()
    .includes(normalized);
}
