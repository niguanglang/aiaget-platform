'use client';

import type { ChannelProviderItem, CreateChannelProviderInput, UpdateChannelProviderInput } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Plus, Power, PowerOff, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ChannelCenterBackground } from '@/components/channels/channel-center-background';
import { ChannelProviderForm, type ChannelProviderFormValues } from '@/components/channels/channel-provider-account-forms';
import {
  ChannelAlert,
  ChannelFocusedHeader,
  ChannelMetricGrid,
  ChannelOperationRow,
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
  createChannelProvider,
  deleteChannelProvider,
  disableChannelProvider,
  enableChannelProvider,
  listChannelProviders,
  updateChannelProvider,
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

type ProviderFormMode = 'create' | 'edit' | null;

export function ChannelProvidersContent() {
  const permissions = useChannelOperationPermissions();
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [provider, setProvider] = useState('');
  const [page, setPage] = useState(1);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<ProviderFormMode>(null);
  const [editingProvider, setEditingProvider] = useState<ChannelProviderItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChannelProviderItem | null>(null);
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

  const saveMutation = useMutation({
    mutationFn: ({ providerId, values }: { providerId?: string; values: ChannelProviderFormValues }) => {
      const input = normalizeProviderFormValues(values);
      return providerId ? updateChannelProvider(providerId, toUpdateChannelProviderInput(input)) : createChannelProvider(input);
    },
    onSuccess: async (_, variables) => {
      setActionNotice(variables.providerId ? '渠道提供方配置已保存。' : '渠道提供方已创建。');
      setActionError(null);
      closeForm();
      await queryClient.invalidateQueries({ queryKey: [providersQueryKey] });
    },
    onError: (error: ApiClientError) => {
      setActionNotice(null);
      setActionError(error.message);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ nextStatus, providerId }: { providerId: string; nextStatus: 'ACTIVE' | 'DISABLED' }) =>
      nextStatus === 'ACTIVE' ? enableChannelProvider(providerId) : disableChannelProvider(providerId),
    onSuccess: async (_, variables) => {
      setActionNotice(variables.nextStatus === 'ACTIVE' ? '渠道提供方已启用。' : '渠道提供方已停用。');
      setActionError(null);
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
      setDeleteTarget(null);
      setSelectedProviderId(null);
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
    setSelectedProviderId(null);
  }

  function clearFilters() {
    setKeyword('');
    setStatus('');
    setProvider('');
    setPage(1);
    setSelectedProviderId(null);
  }

  function openCreateForm() {
    setFormMode('create');
    setEditingProvider(null);
    setActionError(null);
  }

  function openEditForm(item: ChannelProviderItem) {
    setFormMode('edit');
    setEditingProvider(item);
    setActionError(null);
  }

  function closeForm() {
    setFormMode(null);
    setEditingProvider(null);
  }

  function submitProvider(values: ChannelProviderFormValues) {
    saveMutation.mutate({ providerId: editingProvider?.id, values });
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <ChannelCenterBackground />
      <ChannelFocusedHeader
        activeRoute="providers"
        badge="渠道提供方"
        description="集中治理企业微信、钉钉、飞书、Slack、自定义 Webhook 等渠道提供方。列表只展示平台适配和健康状态，配置表单独立展示，避免把完整详情塞进列表。"
        permissions={permissions}
        refreshing={providersQuery.isFetching}
        subtitle="/channels/providers"
        title="渠道提供方"
        onRefresh={() => void providersQuery.refetch()}
      />

      <div className="flex flex-wrap justify-end gap-2">
        <Button disabled={!permissions.canManage || saveMutation.isPending} onClick={openCreateForm} type="button">
          <Plus className="size-4" />
          新建提供方
        </Button>
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

          {formMode ? (
            <section className="grid gap-3">
              <div>
                <h2 className="text-sm font-semibold">{formMode === 'edit' ? '编辑渠道提供方' : '新建渠道提供方'}</h2>
                <p className="mt-1 text-sm text-muted-foreground">表单独立于列表展示，用于维护接入端点、鉴权、能力和扩展配置。</p>
              </div>
              <ChannelProviderForm
                initialValue={formMode === 'edit' && editingProvider ? providerToFormValues(editingProvider) : null}
                loading={saveMutation.isPending}
                onCancel={closeForm}
                onSubmit={submitProvider}
              />
            </section>
          ) : null}

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
                  <ChannelOperationRow
                    actions={
                      <>
                        <Button disabled={!permissions.canManage || saveMutation.isPending} onClick={() => openEditForm(item)} size="sm" type="button" variant="outline">
                          <Edit className="size-4" />
                          编辑配置
                        </Button>
                        {item.status === 'ACTIVE' ? (
                          <Button
                            disabled={!permissions.canDisable || statusMutation.isPending}
                            onClick={() => statusMutation.mutate({ providerId: item.id, nextStatus: 'DISABLED' })}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            <PowerOff className="size-4" />
                            停用提供方
                          </Button>
                        ) : (
                          <Button
                            disabled={!permissions.canManage || statusMutation.isPending}
                            onClick={() => statusMutation.mutate({ providerId: item.id, nextStatus: 'ACTIVE' })}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            <Power className="size-4" />
                            启用提供方
                          </Button>
                        )}
                        <Button disabled={!permissions.canManage || deleteMutation.isPending} onClick={() => setDeleteTarget(item)} size="sm" type="button" variant="outline">
                          <Trash2 className="size-4" />
                          删除提供方
                        </Button>
                      </>
                    }
                    badges={
                      <>
                        <ChannelOperationStatusBadge status={item.status} />
                        <StatusBadge tone={providerHealthTone(item.health_status)}>{providerHealthLabel(item.health_status)}</StatusBadge>
                      </>
                    }
                    details={[
                      { label: '提供方编码', value: item.code },
                      { label: '平台类型', value: item.type || '未配置' },
                      { label: '健康状态', value: providerHealthLabel(item.health_status) },
                      { label: '接入就绪', value: channelReadinessLabel(item.readiness) },
                      { label: '凭据轮换', value: credentialRotationLabel(item.credential_rotation) },
                      { label: '关联账号', value: formatNumber(item.account_count ?? 0) },
                      { label: '关联模板', value: formatNumber(item.template_count ?? 0) },
                      { label: '路由规则', value: formatNumber(item.route_rule_count ?? 0) },
                      { label: '24h 投递', value: formatNumber(item.delivery_count_24h ?? 0) },
                      { label: '24h 成功率', value: formatPercent(item.success_rate_24h) },
                      { label: '最近检查', value: formatOptionalDateTime(item.last_checked_at) },
                      { label: '更新时间', value: formatOptionalDateTime(item.updated_at) },
                    ]}
                    key={item.id}
                    onToggle={() => setSelectedProviderId((current) => (current === item.id ? null : item.id))}
                    selected={selectedProviderId === item.id}
                    stats={[
                      { label: '账号', value: formatNumber(item.account_count ?? 0) },
                      { label: '成功率', value: formatPercent(item.success_rate_24h) },
                    ]}
                    subtitle={
                      <span>
                        平台适配：{item.type || '未配置'} · 健康状态：{providerHealthLabel(item.health_status)} · 最近检查：
                        {formatOptionalDateTime(item.last_checked_at)}
                      </span>
                    }
                    title={`${item.name}（${item.code}）`}
                  />
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {deleteTarget ? (
        <ConfirmDeleteDialog
          body={`确认删除渠道提供方“${deleteTarget.name}”？删除前请确认其账号、模板和路由规则已经迁移或停用。`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          pending={deleteMutation.isPending}
          title="删除渠道提供方"
        />
      ) : null}
    </main>
  );
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

function normalizeProviderFormValues(values: ChannelProviderFormValues): CreateChannelProviderInput {
  return {
    auth_type: normalizeNullableString(values.auth_type),
    callback_url: normalizeNullableString(values.callback_url),
    capabilities: values.capabilities ?? [],
    code: values.code.trim(),
    config: values.config ?? null,
    description: normalizeNullableString(values.description),
    endpoint_url: normalizeNullableString(values.endpoint_url),
    name: values.name.trim(),
    provider_type: values.provider_type?.trim() || undefined,
    status: values.status,
  };
}

function toUpdateChannelProviderInput(input: CreateChannelProviderInput): UpdateChannelProviderInput {
  return {
    auth_type: input.auth_type,
    callback_url: input.callback_url,
    capabilities: input.capabilities,
    config: input.config,
    description: input.description,
    endpoint_url: input.endpoint_url,
    name: input.name,
    provider_type: input.provider_type,
    status: input.status,
  };
}

function providerToFormValues(item: ChannelProviderItem): Partial<ChannelProviderFormValues> {
  const metadata = item.metadata ?? {};

  return {
    auth_type: getMetadataString(metadata, 'auth_type'),
    callback_url: getMetadataString(metadata, 'callback_url'),
    capabilities: getMetadataStringArray(metadata, 'capabilities'),
    code: item.code,
    config: getMetadataRecord(metadata, 'config'),
    description: getMetadataString(metadata, 'description'),
    endpoint_url: getMetadataString(metadata, 'endpoint_url'),
    name: item.name,
    provider_type: getMetadataString(metadata, 'provider_type') ?? item.type,
    status: item.status as ChannelProviderFormValues['status'],
  };
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

function normalizeNullableString(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function getMetadataString(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === 'string' ? value : null;
}

function getMetadataStringArray(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function getMetadataRecord(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
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

function ConfirmDeleteDialog({
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
