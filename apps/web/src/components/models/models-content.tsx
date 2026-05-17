'use client';

import {
  hasPermission,
  type ModelCapability,
  type ModelProviderListItem,
  type ModelProviderStatus,
  type ModelProviderType,
} from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Layers3,
  MoreHorizontal,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import {
  formatDateTime,
  modelCapabilityLabel,
  modelProviderStatusLabel,
  modelProviderTypeLabel,
  modelStatusTone,
} from '@/components/models/model-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  deleteModelProvider,
  disableModelProvider,
  enableModelProvider,
  getMonitorOverview,
  listModelProviders,
  type ApiClientError,
} from '@/lib/api-client';

const providerTypes: ModelProviderType[] = ['OPENAI_COMPATIBLE', 'AZURE_OPENAI', 'ANTHROPIC', 'LOCAL'];
const statuses: ModelProviderStatus[] = ['ACTIVE', 'DISABLED'];
const capabilities: ModelCapability[] = ['chat', 'embedding', 'rerank', 'vision', 'tool_call'];
const pageSize = 20;

const categoryItems: Array<{ label: string; value: '' | ModelCapability }> = [
  { label: '全部模型', value: '' },
  { label: '文本处理', value: 'chat' },
  { label: '知识检索', value: 'embedding' },
  { label: '重排能力', value: 'rerank' },
  { label: '多模态', value: 'vision' },
  { label: '工具调用', value: 'tool_call' },
];

const providerAvatarStyles = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-orange-100 text-orange-700',
  'bg-cyan-100 text-cyan-700',
] as const;

type BulkActionTarget = 'ACTIVE' | 'DISABLED';

export function ModelsContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [providerType, setProviderType] = useState('');
  const [status, setStatus] = useState('');
  const [capability, setCapability] = useState('');
  const [page, setPage] = useState(1);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<ModelProviderListItem | null>(null);
  const [statusTarget, setStatusTarget] = useState<ModelProviderListItem | null>(null);
  const [bulkActionTarget, setBulkActionTarget] = useState<BulkActionTarget | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'model:config:manage'),
  );

  const providersQuery = useQuery({
    queryKey: ['model-providers', page, keyword, providerType, status, capability],
    queryFn: () =>
      listModelProviders({
        page,
        page_size: pageSize,
        keyword,
        provider_type: providerType,
        status,
        capability,
      }),
  });
  const monitorOverviewQuery = useQuery({
    queryKey: ['model-center-monitor-overview', '7d'],
    queryFn: () => getMonitorOverview({ window: '7d' }),
  });

  const providers = providersQuery.data?.items ?? [];
  const total = providersQuery.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const selectableProviders = providers.filter((provider) => provider.status !== 'DELETED');
  const allCurrentPageSelected =
    selectableProviders.length > 0 && selectableProviders.every((provider) => bulkSelectedIds.includes(provider.id));
  const selectedProviders = providers.filter((provider) => bulkSelectedIds.includes(provider.id));
  const selectedProviderCount = bulkSelectedIds.length;
  const modelMetricByProvider = useMemo(() => {
    const result = new Map<string, { callCount: number; successRate: number | null }>();

    for (const ranking of monitorOverviewQuery.data?.model_rankings ?? []) {
      const current = result.get(ranking.provider_id);
      const callCount = (current?.callCount ?? 0) + ranking.call_count;
      const weightedSuccessTotal =
        (current?.successRate ?? 0) * (current?.callCount ?? 0) + ranking.success_rate * ranking.call_count;

      result.set(ranking.provider_id, {
        callCount,
        successRate: callCount > 0 ? weightedSuccessTotal / callCount : null,
      });
    }

    return result;
  }, [monitorOverviewQuery.data?.model_rankings]);

  const metrics = useMemo(() => {
    const enabledModels = providers.reduce((sum, provider) => sum + provider.enabled_model_count, 0);
    const activeProviders = providers.filter((provider) => provider.status === 'ACTIVE').length;
    const callCount = providers.reduce((sum, provider) => sum + (modelMetricByProvider.get(provider.id)?.callCount ?? 0), 0);
    const modelModuleErrorCount =
      monitorOverviewQuery.data?.module_breakdown.find((item) => item.module === 'model')?.error_count ?? null;

    return [
      {
        helper: '租户范围',
        icon: Layers3,
        iconClassName: 'bg-blue-100 text-blue-700',
        label: '模型总数',
        value: `${total}`,
      },
      {
        helper: '当前页',
        icon: CheckCircle2,
        iconClassName: 'bg-emerald-100 text-emerald-700',
        label: '已发布',
        value: `${activeProviders}`,
      },
      {
        helper: '近 7 天',
        icon: BarChart3,
        iconClassName: 'bg-violet-100 text-violet-700',
        label: '调用量',
        value: monitorOverviewQuery.isError ? '-' : formatNumber(callCount),
      },
      {
        helper: '近 7 天',
        icon: ShieldAlert,
        iconClassName: 'bg-orange-100 text-orange-700',
        label: '异常告警',
        value: modelModuleErrorCount === null || monitorOverviewQuery.isError ? '-' : formatNumber(modelModuleErrorCount),
      },
      {
        helper: '当前页',
        icon: Cpu,
        iconClassName: 'bg-cyan-100 text-cyan-700',
        label: '启用模型',
        value: `${enabledModels}`,
      },
    ];
  }, [modelMetricByProvider, monitorOverviewQuery.data?.module_breakdown, monitorOverviewQuery.isError, providers, total]);

  const providerStatusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: 'ACTIVE' | 'DISABLED' }) =>
      nextStatus === 'ACTIVE' ? enableModelProvider(id) : disableModelProvider(id),
    onSuccess: async (provider) => {
      queryClient.setQueryData(['model-provider', provider.id], provider);
      await queryClient.invalidateQueries({ queryKey: ['model-providers'] });
      setStatusTarget(null);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteModelProvider,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['model-providers'] });
      setDeleteTarget(null);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async ({ ids, nextStatus }: { ids: string[]; nextStatus: BulkActionTarget }) => {
      const results = [];

      for (const id of ids) {
        results.push(nextStatus === 'ACTIVE' ? await enableModelProvider(id) : await disableModelProvider(id));
      }

      return results;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['model-providers'] });
      setBulkActionTarget(null);
      setBulkSelectedIds([]);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  function clearFilters() {
    setKeyword('');
    setProviderType('');
    setStatus('');
    setCapability('');
    setPage(1);
    setBulkSelectedIds([]);
  }

  function updateFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
    setBulkSelectedIds([]);
  }

  function toggleProviderSelected(providerId: string, checked: boolean) {
    setBulkSelectedIds((current) =>
      checked ? Array.from(new Set([...current, providerId])) : current.filter((id) => id !== providerId),
    );
  }

  function toggleCurrentPageSelected(checked: boolean) {
    setBulkSelectedIds((current) => {
      const currentPageIds = selectableProviders.map((provider) => provider.id);

      if (checked) {
        return Array.from(new Set([...current, ...currentPageIds]));
      }

      return current.filter((id) => !currentPageIds.includes(id));
    });
  }

  function confirmBulkStatusChange() {
    if (!bulkActionTarget || bulkSelectedIds.length === 0) return;

    bulkStatusMutation.mutate({
      ids: bulkSelectedIds,
      nextStatus: bulkActionTarget,
    });
  }

  return (
    <main className="mx-auto grid max-w-[1680px] gap-5 px-4 py-5 lg:px-7">
      <section className="flex flex-col justify-between gap-4 py-3 md:flex-row md:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">技能模型中心</h1>
          <StatusBadge tone="healthy">模型广场</StatusBadge>
          <StatusBadge tone="planned">运行监控</StatusBadge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            className="h-10"
            disabled={!canWrite || selectedProviderCount === 0 || bulkStatusMutation.isPending}
            onClick={() => setBulkActionTarget('ACTIVE')}
            type="button"
            variant="outline"
          >
            批量发布
          </Button>
          <Button
            className="h-10"
            disabled={!canWrite || selectedProviderCount === 0 || bulkStatusMutation.isPending}
            onClick={() => setBulkActionTarget('DISABLED')}
            type="button"
            variant="outline"
          >
            批量下线
          </Button>
          {canWrite ? (
            <Button asChild className="h-10 bg-blue-600 px-5 shadow-[0_12px_26px_rgba(37,99,235,0.28)] hover:bg-blue-700">
              <Link href="/models/create">
                <Plus className="size-4" />
                新建技能模型
              </Link>
            </Button>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <div
              className="flex min-h-[124px] items-center gap-5 rounded-xl border border-slate-200/80 bg-white/[0.9] px-6 py-5 shadow-[0_16px_45px_rgba(15,23,42,0.05)] backdrop-blur-xl"
              key={metric.label}
            >
              <span className={`grid size-14 shrink-0 place-items-center rounded-full ${metric.iconClassName}`}>
                <Icon className="size-7" />
              </span>
              <div>
                <div className="text-sm font-medium text-slate-500">{metric.label}</div>
                <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{metric.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{metric.helper}</div>
              </div>
            </div>
          );
        })}
      </section>

      {actionError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <ModelCategoryPanel
          capability={capability}
          onCapabilityChange={(value) => updateFilter(setCapability, value)}
          providers={providers}
        />

        <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/[0.9] shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="border-b border-slate-200/80 px-5 py-4">
            <div className="grid gap-4">
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                <h2 className="text-lg font-semibold text-slate-950">技能模型列表</h2>
                <div className="text-sm text-muted-foreground">
                  共 {total} 条
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_180px_160px_180px_110px_110px]">
                <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm">
                  <Search className="size-4 text-muted-foreground" />
                  <input
                    className="min-w-0 flex-1 bg-transparent outline-none"
                    onChange={(event) => updateFilter(setKeyword, event.target.value)}
                    placeholder="搜索技能名称、描述、标签"
                    value={keyword}
                  />
                </label>
                <select
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition-colors hover:border-blue-200"
                  onChange={(event) => updateFilter(setProviderType, event.target.value)}
                  value={providerType}
                >
                  <option value="">全部类型</option>
                  {providerTypes.map((type) => (
                    <option key={type} value={type}>
                      {modelProviderTypeLabel(type)}
                    </option>
                  ))}
                </select>
                <select
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition-colors hover:border-blue-200"
                  onChange={(event) => updateFilter(setStatus, event.target.value)}
                  value={status}
                >
                  <option value="">全部状态</option>
                  {statuses.map((option) => (
                    <option key={option} value={option}>
                      {modelProviderStatusLabel(option)}
                    </option>
                  ))}
                </select>
                <select
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition-colors hover:border-blue-200"
                  onChange={(event) => updateFilter(setCapability, event.target.value)}
                  value={capability}
                >
                  <option value="">全部能力标签</option>
                  {capabilities.map((option) => (
                    <option key={option} value={option}>
                      {modelCapabilityLabel(option)}
                    </option>
                  ))}
                </select>
                <Button className="h-10" onClick={clearFilters} type="button" variant="outline">
                  <RotateCcw className="size-4" />
                  重置
                </Button>
                <Button className="h-10" disabled={providersQuery.isFetching} onClick={() => void providersQuery.refetch()} type="button" variant="outline">
                  <RefreshCw className={`size-4 ${providersQuery.isFetching ? 'animate-spin' : ''}`} />
                  刷新
                </Button>
              </div>
            </div>
          </div>

          {providersQuery.isError ? (
            <div className="p-6 text-sm text-destructive">加载失败。</div>
          ) : providersQuery.isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">正在加载...</div>
          ) : providers.length === 0 ? (
            <div className="p-10 text-center">
              <div className="font-medium">暂无数据</div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50/70">
                      <th className="px-4 py-3 font-medium text-slate-500">
                        <input
                          aria-label="选择当前页模型供应商"
                          checked={allCurrentPageSelected}
                          className="size-4 rounded border-slate-300"
                          onChange={(event) => toggleCurrentPageSelected(event.target.checked)}
                          type="checkbox"
                        />
                      </th>
                      {['技能名称', '能力类型', '关联模型', '默认', '状态', '7日调用', '成功率', '更新时间', '操作'].map((column) => (
                        <th className="px-4 py-3 font-medium text-slate-500" key={column}>
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {providers.map((provider) => {
                      const modelMetric = modelMetricByProvider.get(provider.id);

                      return (
                        <tr className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70" key={provider.id}>
                          <td className="px-4 py-3">
                            <input
                              aria-label={`选择 ${provider.name}`}
                              checked={bulkSelectedIds.includes(provider.id)}
                              className="size-4 rounded border-slate-300"
                              onChange={(event) => toggleProviderSelected(provider.id, event.target.checked)}
                              type="checkbox"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Link className="flex max-w-[280px] items-center gap-3 text-left transition-colors hover:text-blue-700" href={`/models/${provider.id}`}>
                              <ModelProviderAvatar provider={provider} />
                              <span className="min-w-0">
                                <span className="flex items-center gap-2 truncate font-medium text-slate-900">
                                  {provider.name}
                                  {provider.is_default ? <StatusBadge tone="ready">默认</StatusBadge> : null}
                                </span>
                                <span className="mt-1 block truncate text-xs text-muted-foreground">{provider.code}</span>
                              </span>
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge tone="planned">{modelProviderTypeLabel(provider.provider_type)}</StatusBadge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{provider.enabled_model_count} / {provider.model_count}</td>
                          <td className="px-4 py-3">{provider.is_default ? <StatusBadge tone="ready">默认</StatusBadge> : '-'}</td>
                          <td className="px-4 py-3">
                            <StatusBadge tone={modelStatusTone(provider.status)}>{modelProviderStatusLabel(provider.status)}</StatusBadge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{modelMetric ? formatNumber(modelMetric.callCount) : '-'}</td>
                          <td className="px-4 py-3">
                            <SuccessRateCell successRate={modelMetric?.successRate ?? null} />
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{formatDateTime(provider.updated_at)}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5">
                              <Button asChild className="h-8 px-3" size="sm" variant="outline">
                                <Link href={`/models/${provider.id}`}>查看</Link>
                              </Button>
                              <Button
                                asChild
                                aria-disabled={!canWrite}
                                className={canWrite ? 'h-8 px-3' : 'pointer-events-none h-8 px-3 opacity-60'}
                                size="sm"
                                variant="outline"
                              >
                                <Link href={`/models/${provider.id}/edit`}>编辑</Link>
                              </Button>
                              <Button
                                className="h-8 px-3"
                                disabled={!canWrite || providerStatusMutation.isPending}
                                onClick={() => setStatusTarget(provider)}
                                size="sm"
                                variant={provider.status === 'ACTIVE' ? 'outline' : 'default'}
                              >
                                {provider.status === 'ACTIVE' ? '停用' : '发布'}
                              </Button>
                              <Button
                                className="size-8 rounded-md p-0"
                                disabled={!canWrite}
                                onClick={() => setDeleteTarget(provider)}
                                size="sm"
                                title="更多操作"
                                variant="outline"
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-slate-200/80 px-5 py-4">
                <PaginationBar onPageChange={setPage} page={page} pageCount={pageCount} total={total} />
              </div>
            </>
          )}
        </section>
      </section>

      {deleteTarget ? (
        <ConfirmDialog
          body={`这会软删除供应商 ${deleteTarget.name}、其模型和接口密钥。删除后列表不再显示该供应商。`}
          confirmLabel="确认删除"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          pending={deleteMutation.isPending}
          title="删除供应商？"
        />
      ) : null}
      {statusTarget ? (
        <ConfirmDialog
          body={
            statusTarget.status === 'ACTIVE'
              ? `这会停用供应商 ${statusTarget.name}，已绑定该供应商的 Agent 将无法继续使用其模型配置。`
              : `这会启用供应商 ${statusTarget.name}，可用模型和密钥将重新进入调度范围。`
          }
          confirmLabel={statusTarget.status === 'ACTIVE' ? '确认停用' : '确认启用'}
          onCancel={() => setStatusTarget(null)}
          onConfirm={() =>
            providerStatusMutation.mutate({
              id: statusTarget.id,
              nextStatus: statusTarget.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
            })
          }
          pending={providerStatusMutation.isPending}
          title={statusTarget.status === 'ACTIVE' ? '停用供应商？' : '启用供应商？'}
        />
      ) : null}
      {bulkActionTarget ? (
        <ConfirmDialog
          body={`这会${bulkActionTarget === 'ACTIVE' ? '启用' : '停用'}已勾选的 ${selectedProviders.length} 个模型供应商。`}
          confirmLabel={bulkActionTarget === 'ACTIVE' ? '确认批量发布' : '确认批量下线'}
          onCancel={() => setBulkActionTarget(null)}
          onConfirm={confirmBulkStatusChange}
          pending={bulkStatusMutation.isPending}
          title={bulkActionTarget === 'ACTIVE' ? '批量发布供应商？' : '批量下线供应商？'}
        />
      ) : null}
    </main>
  );
}

function ModelCategoryPanel({
  capability,
  onCapabilityChange,
  providers,
}: {
  capability: string;
  onCapabilityChange: (value: string) => void;
  providers: ModelProviderListItem[];
}) {
  return (
    <aside className="rounded-xl border border-slate-200/80 bg-white/[0.9] p-4 shadow-[0_18px_55px_rgba(15,23,42,0.05)] backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontal className="size-4 text-blue-600" />
        <h2 className="text-base font-semibold text-slate-950">技能分类</h2>
      </div>
      <div className="grid gap-1">
        {categoryItems.map((item) => {
          const isActive = capability === item.value;
          const count = item.value ? null : providers.length;

          return (
            <button
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-700'
              }`}
              key={item.label}
              onClick={() => onCapabilityChange(item.value)}
              type="button"
            >
              <span className="flex items-center gap-2">
                <ChevronRight className="size-4" />
                {item.label}
              </span>
              <span className="text-xs text-muted-foreground">{count === null ? '-' : count}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function ModelProviderAvatar({ provider }: { provider: ModelProviderListItem }) {
  const styleIndex = Math.abs(hashText(provider.id || provider.code)) % providerAvatarStyles.length;

  return (
    <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${providerAvatarStyles[styleIndex]}`}>
      <Cpu className="size-5" />
    </span>
  );
}

function PaginationBar({
  onPageChange,
  page,
  pageCount,
  total,
}: {
  onPageChange: (value: number) => void;
  page: number;
  pageCount: number;
  total: number;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="text-sm text-muted-foreground">共 {total} 条</div>
      <div className="flex items-center gap-2">
        <Button
          className="size-8 p-0"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          size="sm"
          title="上一页"
          type="button"
          variant="outline"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="grid h-8 min-w-8 place-items-center rounded-md border border-blue-500 bg-blue-50 px-2 text-sm text-blue-700">{page}</span>
        <span className="text-sm text-muted-foreground">/ {pageCount}</span>
        <Button
          className="size-8 p-0"
          disabled={page >= pageCount}
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
          size="sm"
          title="下一页"
          type="button"
          variant="outline"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function SuccessRateCell({ successRate }: { successRate: number | null }) {
  if (successRate === null) {
    return <span className="text-muted-foreground">-</span>;
  }

  const width = Math.max(0, Math.min(100, successRate));

  return (
    <div className="grid gap-1">
      <span className="text-sm text-slate-700">{formatPercent(successRate)}</span>
      <span className="h-1.5 w-24 rounded-full bg-slate-100">
        <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${width}%` }} />
      </span>
    </div>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('zh-CN').format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
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

function hashText(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return hash;
}
