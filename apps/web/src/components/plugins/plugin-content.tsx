'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type CreatePluginInstallationInput, type PluginInstallationItem, type PluginManifestValidationResult, type PluginMarketItem } from '@aiaget/shared-types';
import { Code2, Eye, PackagePlus, RefreshCw, Search, Settings2, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { PluginCenterBackground } from '@/components/plugins/plugin-center-background';
import {
  pluginInstallationStatuses,
  pluginRiskLabel,
  pluginRiskLevels,
  pluginRiskTone,
  pluginRuntimeLabel,
  pluginRuntimeTone,
  pluginStatusLabel,
  pluginStatusTone,
} from '@/components/plugins/plugin-status';
import {
  CustomPluginDialog,
  InstallGuideDialog,
  Message,
  usePluginPermissions,
} from '@/components/plugins/plugin-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  getPluginOverview,
  installPlugin,
  listPluginInstallations,
  listPluginMarket,
  validatePluginManifest,
  type ApiClientError,
} from '@/lib/api-client';
import { cn } from '@/lib/utils';

type TabKey = 'market' | 'installed';

export function PluginContent() {
  const queryClient = useQueryClient();
  const { canInstall, canView } = usePluginPermissions();
  const [tab, setTab] = useState<TabKey>('market');
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [installCandidate, setInstallCandidate] = useState<PluginMarketItem | null>(null);
  const [customInstallOpen, setCustomInstallOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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

  const market = marketQuery.data ?? [];
  const installations = installationsQuery.data ?? [];
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
    { label: '待审核', value: `${overviewQuery.data?.pending_review_count ?? 0}`, helper: '安全审核入口' },
    { label: '绑定入口', value: `${overviewQuery.data?.menu_count ?? 0}`, helper: '菜单与 Hook 摘要' },
  ];

  const installMutation = useMutation({
    mutationFn: installPlugin,
    onSuccess: async (detail) => {
      setNotice(`已安装插件 ${detail.name}。`);
      setActionError(null);
      setInstallCandidate(null);
      setCustomInstallOpen(false);
      setTab('installed');
      await refreshPlugins();
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setActionError(error.message);
    },
  });
  const validateManifestMutation = useMutation({
    mutationFn: validatePluginManifest,
    onError: (error: ApiClientError) => {
      setNotice(null);
      setActionError(error.message);
    },
  });

  async function validateCustomManifest(input: CreatePluginInstallationInput): Promise<PluginManifestValidationResult> {
    setActionError(null);
    setNotice(null);
    return validateManifestMutation.mutateAsync(input);
  }

  async function refreshPlugins() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['plugin-overview'] }),
      queryClient.invalidateQueries({ queryKey: ['plugin-market'] }),
      queryClient.invalidateQueries({ queryKey: ['plugin-installations'] }),
    ]);
  }

  function clearFilters() {
    setKeyword('');
    setStatusFilter('');
    setRiskFilter('');
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
            <StatusBadge tone="planned">列表与入口</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">插件生态中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            查询插件市场和租户安装清单，查看概览，并进入插件详情、安装配置、安全审核和绑定配置页面。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              void refreshPlugins();
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
          <Button disabled={!canInstall} onClick={() => setCustomInstallOpen(true)} type="button" variant="outline">
            <Code2 className="size-4" />
            自定义插件
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

      <Card className="min-w-0 overflow-hidden">
        <div className="border-b p-4">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-sm font-semibold">插件列表</h2>
              <p className="mt-1 text-sm text-muted-foreground">市场用于安装入口，已安装清单用于进入详情与配置页面。</p>
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
          <table className="w-full min-w-[960px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 font-medium text-muted-foreground">插件</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">版本</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">状态</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">风险</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">能力摘要</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">入口</th>
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
                      onInstall={() => setInstallCandidate(plugin)}
                      plugin={plugin}
                    />
                  ))
                : filteredInstallations.map((installation) => (
                    <InstallationRow installation={installation} key={installation.id} />
                  ))}
            </tbody>
          </table>
        </div>
      </Card>

      {installCandidate ? (
        <InstallGuideDialog
          canInstall={canInstall}
          isPending={installMutation.isPending}
          onClose={() => setInstallCandidate(null)}
          onConfirm={() => installMutation.mutate(installCandidate)}
          plugin={installCandidate}
        />
      ) : null}

      {customInstallOpen ? (
        <CustomPluginDialog
          canInstall={canInstall}
          isPending={installMutation.isPending}
          onClose={() => {
            validateManifestMutation.reset();
            setCustomInstallOpen(false);
          }}
          onConfirm={(input) => installMutation.mutate(input)}
          onValidate={validateCustomManifest}
          validationError={validateManifestMutation.error?.message ?? null}
          validationPending={validateManifestMutation.isPending}
          validationResult={validateManifestMutation.data ?? null}
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
  plugin,
}: {
  canInstall: boolean;
  installedItem: PluginInstallationItem | null;
  isPending: boolean;
  onInstall: () => void;
  plugin: PluginMarketItem;
}) {
  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-3">
        <div className="grid text-left">
          <span className="font-medium">{plugin.name}</span>
          <span className="mt-1 text-xs text-muted-foreground">
            {plugin.code} · {plugin.provider}
          </span>
          {plugin.description ? <span className="mt-1 truncate text-xs text-muted-foreground">{plugin.description}</span> : null}
        </div>
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
          {installedItem ? <PluginEntryActions pluginId={plugin.plugin_id} /> : null}
          {!installedItem ? (
            <Button disabled={!canInstall || isPending} onClick={onInstall} size="sm" type="button">
              <PackagePlus className="size-4" />
              安装
            </Button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function InstallationRow({ installation }: { installation: PluginInstallationItem }) {
  return (
    <tr className="border-b last:border-0 hover:bg-muted/30">
      <td className="px-4 py-3">
        <div className="grid text-left">
          <span className="font-medium">{installation.name}</span>
          <span className="mt-1 text-xs text-muted-foreground">
            {installation.code} · {installation.provider}
          </span>
        </div>
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
        <PluginEntryActions pluginId={installation.plugin_id} />
      </td>
    </tr>
  );
}

function PluginEntryActions({ pluginId }: { pluginId: string }) {
  return (
    <div className="flex justify-end gap-2">
      <Button asChild size="sm" type="button" variant="outline">
        <Link href={`/plugins/${pluginId}`}>
          <Eye className="size-4" />
          详情
        </Link>
      </Button>
      <Button asChild size="sm" type="button" variant="outline">
        <Link href={`/plugins/${pluginId}/installations`}>
          <Settings2 className="size-4" />
          安装配置
        </Link>
      </Button>
      <Button asChild size="sm" type="button" variant="outline">
        <Link href={`/plugins/${pluginId}/security`}>
          <ShieldCheck className="size-4" />
          安全审核
        </Link>
      </Button>
      <Button asChild size="sm" type="button" variant="outline">
        <Link href={`/plugins/${pluginId}/bindings`}>
          <SlidersHorizontal className="size-4" />
          绑定配置
        </Link>
      </Button>
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
