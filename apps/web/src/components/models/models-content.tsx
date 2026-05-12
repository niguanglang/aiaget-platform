'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission, type ModelProviderListItem, type ModelProviderStatus, type ModelProviderType } from '@aiaget/shared-types';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Edit, Eye, Plus, Power, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { ModelCenterBackground } from '@/components/models/model-center-background';
import {
  formatDateTime,
  modelCapabilityLabel,
  modelProviderStatusLabel,
  modelProviderTypeLabel,
  modelStatusTone,
} from '@/components/models/model-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  deleteModelProvider,
  disableModelProvider,
  enableModelProvider,
  listModelProviders,
  type ApiClientError,
} from '@/lib/api-client';

const providerTypes: ModelProviderType[] = ['OPENAI_COMPATIBLE', 'AZURE_OPENAI', 'ANTHROPIC', 'LOCAL'];
const statuses: ModelProviderStatus[] = ['ACTIVE', 'DISABLED'];
const capabilities = ['chat', 'embedding', 'rerank', 'vision', 'tool_call'] as const;
const pageSize = 20;

export function ModelsContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [providerType, setProviderType] = useState('');
  const [status, setStatus] = useState('');
  const [capability, setCapability] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<ModelProviderListItem | null>(null);
  const [statusTarget, setStatusTarget] = useState<ModelProviderListItem | null>(null);
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

  const providers = providersQuery.data?.items ?? [];
  const total = providersQuery.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const metrics = useMemo(() => {
    const enabledModels = providers.reduce((sum, provider) => sum + provider.enabled_model_count, 0);
    const apiKeys = providers.reduce((sum, provider) => sum + provider.api_key_count, 0);
    const activeProviders = providers.filter((provider) => provider.status === 'ACTIVE').length;

    return [
      { label: '供应商', value: `${total}`, helper: '租户范围' },
      { label: '启用供应商', value: `${activeProviders}`, helper: '当前页' },
      { label: '启用模型', value: `${enabledModels}`, helper: '当前页' },
      { label: '接口密钥', value: `${apiKeys}`, helper: '当前页脱敏密钥' },
    ];
  }, [providers, total]);

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

  function clearFilters() {
    setKeyword('');
    setProviderType('');
    setStatus('');
    setCapability('');
    setPage(1);
  }

  function updateFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <ModelCenterBackground />

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
      >
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">模型中心</StatusBadge>
            <StatusBadge tone="healthy">供应商列表</StatusBadge>
            <StatusBadge tone="planned">模型配置</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">模型中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">供应商、模型数量、接口密钥、能力标签和最近调用。</p>
        </div>
        {canWrite ? (
          <Button asChild className="w-full md:w-auto">
            <Link href="/models/create">
              <Plus className="size-4" />
              新建供应商
            </Link>
          </Button>
        ) : null}
      </motion.section>

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.04, duration: 0.32, ease: 'easeOut' }}
      >
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </motion.section>

      {actionError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <Card>
        <div className="border-b p-4">
          <div className="grid gap-4">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-sm font-semibold">供应商列表</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  名称、类型、状态、模型数量、密钥数量和最近调用。
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                显示 {providers.length} / {total}
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_190px_160px_160px_auto]">
              <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
                <Search className="size-4 text-muted-foreground" />
                <input
                  className="min-w-0 flex-1 bg-transparent outline-none"
                  onChange={(event) => updateFilter(setKeyword, event.target.value)}
                  placeholder="搜索供应商、编码、链接"
                  value={keyword}
                />
              </label>
              <select
                className="h-9 rounded-md border bg-background/80 px-3 text-sm"
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
                className="h-9 rounded-md border bg-background/80 px-3 text-sm"
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
                className="h-9 rounded-md border bg-background/80 px-3 text-sm"
                onChange={(event) => updateFilter(setCapability, event.target.value)}
                value={capability}
              >
                <option value="">全部能力</option>
                {capabilities.map((option) => (
                  <option key={option} value={option}>
                    {modelCapabilityLabel(option)}
                  </option>
                ))}
              </select>
              <Button onClick={clearFilters} type="button" variant="outline">
                清空
              </Button>
            </div>
          </div>
        </div>

        {providersQuery.isError ? (
          <div className="p-6 text-sm text-destructive">模型供应商加载失败。</div>
        ) : providersQuery.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">正在加载模型供应商...</div>
        ) : providers.length === 0 ? (
          <EmptyState
            action={
              canWrite ? (
                <Button asChild>
                  <Link href="/models/create">
                    <Plus className="size-4" />
                    新建供应商
                  </Link>
                </Button>
              ) : null
            }
            description="创建供应商后可添加模型、脱敏密钥、成本规则和兼容性测试。"
            title="暂无模型供应商"
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {['供应商', '类型', '状态', '模型', '密钥', '最近调用', '更新时间', '操作'].map((column) => (
                      <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {providers.map((provider, index) => (
                    <motion.tr
                      animate={{ opacity: 1, y: 0 }}
                      className="border-b transition-colors last:border-0 hover:bg-muted/25"
                      initial={{ opacity: 0, y: 8 }}
                      key={provider.id}
                      transition={{ delay: index * 0.025, duration: 0.22 }}
                    >
                      <td className="px-4 py-3">
                        <div className="grid max-w-md gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link className="font-medium hover:text-primary" href={`/models/${provider.id}`}>
                              {provider.name}
                            </Link>
                            {provider.is_default ? <StatusBadge tone="ready">默认</StatusBadge> : null}
                          </div>
                          <span className="text-xs text-muted-foreground">{provider.code}</span>
                          <span className="line-clamp-1 break-all text-xs text-muted-foreground">{provider.base_url}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{modelProviderTypeLabel(provider.provider_type)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={modelStatusTone(provider.status)}>{modelProviderStatusLabel(provider.status)}</StatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{provider.enabled_model_count}</div>
                        <div className="text-xs text-muted-foreground">共 {provider.model_count}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{provider.api_key_count}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(provider.last_call_at)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(provider.updated_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/models/${provider.id}`}>
                              <Eye className="size-4" />
                              查看
                            </Link>
                          </Button>
                          <Button
                            asChild
                            aria-disabled={!canWrite}
                            className={!canWrite ? 'pointer-events-none opacity-60' : undefined}
                            size="sm"
                            variant="outline"
                          >
                            <Link href={`/models/${provider.id}/edit`}>
                              <Edit className="size-4" />
                              编辑
                            </Link>
                          </Button>
                          <Button
                            disabled={!canWrite || providerStatusMutation.isPending}
                            onClick={() => setStatusTarget(provider)}
                            size="sm"
                            variant="outline"
                          >
                            <Power className="size-4" />
                            {provider.status === 'ACTIVE' ? '停用' : '启用'}
                          </Button>
                          <Button
                            disabled={!canWrite}
                            onClick={() => setDeleteTarget(provider)}
                            size="sm"
                            variant="outline"
                          >
                            <Trash2 className="size-4" />
                            删除
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t p-4">
              <PaginationBar onPageChange={setPage} page={page} pageCount={pageCount} total={total} />
            </div>
          </>
        )}
      </Card>

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
    </main>
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
      <div className="text-sm text-muted-foreground">
        第 {page} / {pageCount} 页 · 共 {total} 条
      </div>
      <div className="flex items-center gap-2">
        <Button
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          size="sm"
          type="button"
          variant="outline"
        >
          <ChevronLeft className="size-4" />
          上一页
        </Button>
        <Button
          disabled={page >= pageCount}
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
          size="sm"
          type="button"
          variant="outline"
        >
          下一页
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
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
