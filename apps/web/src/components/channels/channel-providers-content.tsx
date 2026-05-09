'use client';

import type { ChannelProviderItem } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Plus, Power, PowerOff, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { ChannelCenterBackground } from '@/components/channels/channel-center-background';
import {
  ChannelActionConfirmDialog,
  ChannelAlert,
  ChannelFocusedHeader,
  ChannelMetricGrid,
  ChannelOperationStatusBadge,
  channelReadinessLabel,
  credentialRotationLabel,
  formatNumber,
  formatOptionalDateTime,
  formatPercent,
  useChannelOperationPermissions,
  type ChannelOperationMetric,
} from '@/components/channels/channel-operations-pages';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  deleteChannelProvider,
  disableChannelProvider,
  enableChannelProvider,
  listChannelProviders,
  type ApiClientError,
} from '@/lib/api-client';

const providersQueryKey = 'channel-providers-focused-page';
const pageSize = 20;

const providerStatusOptions = [
  { label: '启用', value: 'ACTIVE' },
  { label: '停用', value: 'DISABLED' },
  { label: '异常', value: 'ERROR' },
  { label: '草稿', value: 'DRAFT' },
];

type ProviderActionTarget = {
  action: 'enable' | 'disable' | 'delete';
  item: ChannelProviderItem;
};

export function ChannelProvidersContent() {
  const permissions = useChannelOperationPermissions();
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [provider, setProvider] = useState('');
  const [page, setPage] = useState(1);
  const [providerActionTarget, setProviderActionTarget] = useState<ProviderActionTarget | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const listParams = useMemo(
    () => ({
      page,
      page_size: pageSize,
      keyword: keyword.trim() || undefined,
      status: status || undefined,
      provider: provider.trim() || undefined,
    }),
    [keyword, page, provider, status],
  );

  const providersQuery = useQuery({
    enabled: permissions.canView,
    queryKey: [providersQueryKey, listParams],
    queryFn: () => listChannelProviders(listParams),
  });

  const providers = providersQuery.data?.items ?? [];
  const total = providersQuery.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const metrics = useMemo(() => buildProviderMetrics(providers, total), [providers, total]);

  const statusMutation = useMutation({
    mutationFn: ({ nextStatus, providerId }: { providerId: string; nextStatus: 'ACTIVE' | 'DISABLED' }) =>
      nextStatus === 'ACTIVE' ? enableChannelProvider(providerId) : disableChannelProvider(providerId),
    onSuccess: async (_, variables) => {
      setActionNotice(variables.nextStatus === 'ACTIVE' ? '渠道提供方已启用。' : '渠道提供方已停用。');
      setActionError(null);
      setProviderActionTarget(null);
      await queryClient.invalidateQueries({ queryKey: [providersQueryKey] });
    },
    onError: (error: ApiClientError) => {
      setActionNotice(null);
      setActionError(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteChannelProvider,
    onSuccess: async () => {
      setActionNotice('渠道提供方已删除。');
      setActionError(null);
      setProviderActionTarget(null);
      await queryClient.invalidateQueries({ queryKey: [providersQueryKey] });
    },
    onError: (error: ApiClientError) => {
      setActionNotice(null);
      setActionError(error.message);
    },
  });

  function updateFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  function clearFilters() {
    setKeyword('');
    setStatus('');
    setProvider('');
    setPage(1);
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <ChannelCenterBackground />
      <ChannelFocusedHeader
        activeRoute="providers"
        badge="渠道提供方"
        description="集中治理企业微信、钉钉、飞书、Slack、自定义 Webhook 等渠道提供方。列表只展示平台适配和健康状态，新增与编辑进入独立表单页。"
        permissions={permissions}
        refreshing={providersQuery.isFetching}
        subtitle="/channels/providers"
        title="渠道提供方"
        onRefresh={() => void providersQuery.refetch()}
      />

      <div className="flex flex-wrap justify-end gap-2">
        {permissions.canManage ? (
          <Button asChild>
            <Link href="/channels/providers/create">
              <Plus className="size-4" />
              新建提供方
            </Link>
          </Button>
        ) : (
          <Button disabled type="button">
            <Plus className="size-4" />
            新建提供方
          </Button>
        )}
      </div>

      <ChannelAlert message={actionNotice} tone="ready" />
      <ChannelAlert message={actionError ?? (providersQuery.isError ? '渠道提供方列表加载失败。' : null)} tone="error" />

      {!permissions.canView ? (
        <Card className="p-5">
          <EmptyState description="当前账号缺少 channel:publish:view 权限，无法查看渠道提供方。" title="无权查看渠道提供方" />
        </Card>
      ) : (
        <>
          <ChannelMetricGrid loading={providersQuery.isLoading} metrics={metrics} />

          <Card className="grid gap-4 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-sm font-semibold">渠道提供方列表</h2>
                <p className="mt-1 text-sm text-muted-foreground">只保留名称、编码、状态、平台类型和关键健康指标，完整配置进入独立表单。</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Input
                  className="min-w-56"
                  onChange={(event) => updateFilter(setKeyword, event.target.value)}
                  placeholder="搜索名称、编码、端点"
                  value={keyword}
                />
                <select
                  className="h-10 rounded-md border bg-background/80 px-3 text-sm"
                  onChange={(event) => updateFilter(setStatus, event.target.value)}
                  value={status}
                >
                  <option value="">全部状态</option>
                  {providerStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Input
                  className="w-40"
                  onChange={(event) => updateFilter(setProvider, event.target.value)}
                  placeholder="平台类型"
                  value={provider}
                />
                <Button onClick={clearFilters} type="button" variant="outline">
                  重置
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                共 {formatNumber(total)} 条，当前第 {formatNumber(page)} / {formatNumber(pageCount)} 页
              </span>
              <div className="flex gap-2">
                <Button disabled={page <= 1 || providersQuery.isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))} size="sm" type="button" variant="outline">
                  上一页
                </Button>
                <Button disabled={page >= pageCount || providersQuery.isFetching} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} size="sm" type="button" variant="outline">
                  下一页
                </Button>
              </div>
            </div>

            {providersQuery.isLoading ? (
              <ProviderRowSkeleton />
            ) : providers.length === 0 ? (
              <EmptyState description="当前没有渠道提供方。创建提供方后，再配置账号凭据、模板和路由规则。" title="暂无渠道提供方" />
            ) : (
              <div className="grid gap-3">
                {providers.map((item) => (
                  <ProviderListRow
                    canDisable={permissions.canDisable}
                    canManage={permissions.canManage}
                    deleting={deleteMutation.isPending}
                    item={item}
                    key={item.id}
                    statusChanging={statusMutation.isPending}
                    onDelete={() => setProviderActionTarget({ action: 'delete', item })}
                    onDisable={() => setProviderActionTarget({ action: 'disable', item })}
                    onEnable={() => setProviderActionTarget({ action: 'enable', item })}
                  />
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {providerActionTarget ? (
        <ChannelActionConfirmDialog
          body={getProviderActionBody(providerActionTarget)}
          confirmLabel={getProviderActionConfirmLabel(providerActionTarget.action)}
          onCancel={() => setProviderActionTarget(null)}
          onConfirm={() => {
            if (providerActionTarget.action === 'delete') {
              deleteMutation.mutate(providerActionTarget.item.id);
              return;
            }

            statusMutation.mutate({
              providerId: providerActionTarget.item.id,
              nextStatus: providerActionTarget.action === 'enable' ? 'ACTIVE' : 'DISABLED',
            });
          }}
          pending={providerActionTarget.action === 'delete' ? deleteMutation.isPending : statusMutation.isPending}
          title={getProviderActionTitle(providerActionTarget.action)}
          variant={providerActionTarget.action === 'delete' ? 'destructive' : 'default'}
        />
      ) : null}
    </main>
  );
}

function ProviderListRow({
  canDisable,
  canManage,
  deleting,
  item,
  onDelete,
  onDisable,
  onEnable,
  statusChanging,
}: {
  canDisable: boolean;
  canManage: boolean;
  deleting: boolean;
  item: ChannelProviderItem;
  onDelete: () => void;
  onDisable: () => void;
  onEnable: () => void;
  statusChanging: boolean;
}) {
  return (
    <article className="grid gap-4 rounded-md border bg-background/90 p-4 shadow-sm transition-colors hover:bg-muted/10">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <ChannelOperationStatusBadge status={item.status} />
            <StatusBadge tone={providerHealthTone(item.health_status)}>{providerHealthLabel(item.health_status)}</StatusBadge>
            <div className="truncate text-sm font-semibold">{`${item.name}（${item.code}）`}</div>
          </div>
          <div className="mt-2 text-xs leading-5 text-muted-foreground">
            平台适配：{item.type || '未配置'} · 健康状态：{providerHealthLabel(item.health_status)} · 最近检查：
            {formatOptionalDateTime(item.last_checked_at)}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-start gap-2 lg:justify-end">
          <StatusBadge tone="mock">账号 {formatNumber(item.account_count ?? 0)}</StatusBadge>
          <StatusBadge tone="mock">成功率 {formatPercent(item.success_rate_24h)}</StatusBadge>
        </div>
      </div>

      <dl className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ProviderListField label="平台类型" value={item.type || '未配置'} />
        <ProviderListField label="接入就绪" value={channelReadinessLabel(item.readiness)} />
        <ProviderListField label="凭据轮换" value={credentialRotationLabel(item.credential_rotation)} />
        <ProviderListField label="更新时间" value={formatOptionalDateTime(item.updated_at)} />
      </dl>

      <div className="flex flex-wrap justify-end gap-2 border-t pt-3">
        {canManage ? (
          <Button asChild size="sm" variant="outline">
            <Link href={`/channels/providers/${encodeURIComponent(item.id)}/edit`}>
              <Edit className="size-4" />
              编辑配置
            </Link>
          </Button>
        ) : (
          <Button disabled size="sm" type="button" variant="outline">
            <Edit className="size-4" />
            编辑配置
          </Button>
        )}
        {item.status === 'ACTIVE' ? (
          <Button disabled={!canDisable || statusChanging} onClick={onDisable} size="sm" type="button" variant="outline">
            <PowerOff className="size-4" />
            停用提供方
          </Button>
        ) : (
          <Button disabled={!canManage || statusChanging} onClick={onEnable} size="sm" type="button" variant="outline">
            <Power className="size-4" />
            启用提供方
          </Button>
        )}
        <Button disabled={!canManage || deleting} onClick={onDelete} size="sm" type="button" variant="outline">
          <Trash2 className="size-4" />
          删除提供方
        </Button>
      </div>
    </article>
  );
}

function ProviderListField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium">{value}</dd>
    </div>
  );
}

function getProviderActionTitle(action: ProviderActionTarget['action']) {
  if (action === 'enable') return '确认启用渠道提供方';
  if (action === 'disable') return '确认停用渠道提供方';

  return '确认删除渠道提供方';
}

function getProviderActionConfirmLabel(action: ProviderActionTarget['action']) {
  if (action === 'enable') return '确认启用';
  if (action === 'disable') return '确认停用';

  return '确认删除';
}

function getProviderActionBody(target: ProviderActionTarget) {
  if (target.action === 'enable') {
    return `确认启用渠道提供方“${target.item.name}”？启用后该提供方下的账号、模板和路由规则可继续参与渠道发送与回调处理。`;
  }
  if (target.action === 'disable') {
    return `确认停用渠道提供方“${target.item.name}”？停用后其账号、模板和路由规则将不再作为可用发送链路，正在依赖该提供方的业务可能受影响。`;
  }

  return `确认删除渠道提供方“${target.item.name}”？删除会影响关联账号、消息模板和路由规则，执行前请确认它们已经迁移、停用或不再被使用。`;
}

function buildProviderMetrics(items: ChannelProviderItem[], total: number): ChannelOperationMetric[] {
  const activeCount = items.filter((item) => item.status === 'ACTIVE').length;
  const averageSuccessRate = items.length > 0 ? items.reduce((sum, item) => sum + (item.success_rate_24h ?? 0), 0) / items.length : null;
  const credentialRisks = items.filter((item) => {
    const status = item.credential_rotation?.status;
    return status === 'EXPIRED' || status === 'ROTATION_DUE' || item.credential_rotation?.secret_configured === false;
  }).length;
  const blockedProviders = items.filter((item) => item.readiness?.status === 'BLOCKED' || item.readiness?.status === 'DEGRADED').length;

  return [
    { label: '渠道提供方', value: formatNumber(total), helper: '当前筛选范围' },
    { label: '启用提供方', value: formatNumber(activeCount), helper: '当前页 ACTIVE' },
    { label: '平均成功率', value: formatPercent(averageSuccessRate), helper: '当前页 24h 投递' },
    { label: '配置风险', value: formatNumber(credentialRisks + blockedProviders), helper: '凭据或适配器需处理' },
  ];
}

function providerHealthLabel(status: string | null | undefined) {
  const labels: Record<string, string> = {
    DEGRADED: '降级',
    HEALTHY: '健康',
    UNKNOWN: '未检查',
    UNAVAILABLE: '不可用',
  };

  return labels[status ?? 'UNKNOWN'] ?? status ?? '未检查';
}

function providerHealthTone(status: string | null | undefined) {
  if (status === 'HEALTHY') return 'healthy' as const;
  if (status === 'DEGRADED') return 'degraded' as const;
  if (status === 'UNAVAILABLE') return 'unavailable' as const;

  return 'planned' as const;
}

function ProviderRowSkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div className="h-28 rounded-md border bg-muted/30" key={index} />
      ))}
    </div>
  );
}
