'use client';

import type { ChannelCallbackProvider, ChannelSenderDeliveryDetail, ChannelSenderDeliveryListItem } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, RefreshCw, RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';

import {
  ChannelAlert,
  ChannelFocusedHeader,
  ChannelMetricGrid,
  DetailGrid,
  channelOperationStatusLabel,
  channelOperationStatusTone,
  formatLatency,
  formatNumber,
  formatOptionalDateTime,
  useChannelOperationPermissions,
  type ChannelOperationMetric,
} from '@/components/channels/channel-operations-pages';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  getChannelSenderDelivery,
  getChannelSenderTaskOverview,
  listChannelSenderDeliveries,
  retryChannelSenderDelivery,
  runChannelSenderAutoRetry,
  runChannelSenderCleanup,
  type ApiClientError,
} from '@/lib/api-client';
import { cn } from '@/lib/utils';

const senderStatuses = ['PENDING', 'SUCCESS', 'FAILED', 'SKIPPED', 'RETRYING'];
const senderProviders: ChannelCallbackProvider[] = ['WECHAT_WORK', 'DINGTALK', 'FEISHU', 'SLACK', 'CUSTOM_WEBHOOK'];

export function ChannelSenderContent() {
  const queryClient = useQueryClient();
  const permissions = useChannelOperationPermissions();
  const [status, setStatus] = useState('');
  const [provider, setProvider] = useState('');
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const deliveriesQuery = useQuery({
    enabled: permissions.canView,
    queryKey: ['channel-sender-focused-deliveries', status, provider],
    queryFn: () =>
      listChannelSenderDeliveries({
        status: status || undefined,
        provider: provider || undefined,
      }),
  });

  const detailQuery = useQuery({
    enabled: permissions.canView && Boolean(selectedDeliveryId),
    queryKey: ['channel-sender-focused-delivery', selectedDeliveryId],
    queryFn: () => getChannelSenderDelivery(selectedDeliveryId ?? ''),
  });

  const taskOverviewQuery = useQuery({
    enabled: permissions.canView,
    queryKey: ['channel-sender-focused-tasks'],
    queryFn: getChannelSenderTaskOverview,
  });

  const retryMutation = useMutation({
    mutationFn: retryChannelSenderDelivery,
    onSuccess: async (result) => {
      setNotice('失败投递已提交重试。');
      setActionError(null);
      setSelectedDeliveryId(result.item.delivery_id);
      await queryClient.invalidateQueries({ queryKey: ['channel-sender-focused-deliveries'] });
      await queryClient.invalidateQueries({ queryKey: ['channel-sender-focused-delivery', result.item.delivery_id] });
      await queryClient.invalidateQueries({ queryKey: ['channel-sender-focused-tasks'] });
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setActionError(error.message);
    },
  });

  const autoRetryMutation = useMutation({
    mutationFn: runChannelSenderAutoRetry,
    onSuccess: async () => {
      setNotice('Sender 自动重试任务已执行。');
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ['channel-sender-focused-deliveries'] });
      await queryClient.invalidateQueries({ queryKey: ['channel-sender-focused-tasks'] });
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setActionError(error.message);
    },
  });

  const cleanupMutation = useMutation({
    mutationFn: runChannelSenderCleanup,
    onSuccess: async () => {
      setNotice('Sender 清理任务已执行。');
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ['channel-sender-focused-tasks'] });
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setActionError(error.message);
    },
  });

  const deliveries = deliveriesQuery.data?.items ?? [];
  const total = deliveriesQuery.data?.total ?? 0;
  const metrics = buildSenderMetrics(deliveries, total, taskOverviewQuery.data?.summary);

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <ChannelFocusedHeader
        activeRoute="sender"
        badge="Sender 投递"
        description="主动回复排障台，集中查看企业微信、钉钉、飞书、Slack 和自定义 Webhook 的请求响应、Trace 上下文和失败重试。"
        permissions={permissions}
        refreshing={deliveriesQuery.isFetching || taskOverviewQuery.isFetching}
        subtitle="/channels/sender"
        title="Sender 投递"
        onRefresh={() => {
          void deliveriesQuery.refetch();
          void taskOverviewQuery.refetch();
          if (selectedDeliveryId) void detailQuery.refetch();
        }}
      />

      <ChannelAlert message={notice} tone="ready" />
      <ChannelAlert message={actionError ?? (deliveriesQuery.isError ? 'Sender 投递列表加载失败。' : null)} tone="error" />

      {!permissions.canView ? (
        <Card className="p-5">
          <EmptyState description="当前账号缺少 channel:publish:view 权限，无法查看 Sender 投递。" title="无权查看 Sender 投递" />
        </Card>
      ) : (
        <>
          <ChannelMetricGrid loading={deliveriesQuery.isLoading || taskOverviewQuery.isLoading} metrics={metrics} />
          <Card className="grid gap-4 p-5">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-sm font-semibold">Sender 任务</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  自动重试与清理任务会写入任务概览，执行按钮需要渠道管理权限。
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button disabled={!permissions.canManage || autoRetryMutation.isPending} onClick={() => autoRetryMutation.mutate()} type="button" variant="outline">
                  <RotateCcw className={cn('size-4', autoRetryMutation.isPending && 'animate-spin')} />
                  运行自动重试
                </Button>
                <Button disabled={!permissions.canManage || cleanupMutation.isPending} onClick={() => cleanupMutation.mutate()} type="button" variant="outline">
                  <Trash2 className="size-4" />
                  运行清理
                </Button>
              </div>
            </div>
          </Card>

          <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="grid gap-4 p-5">
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                <div>
                  <h2 className="text-sm font-semibold">主动回复投递列表</h2>
                  <p className="mt-1 text-sm text-muted-foreground">选择一条记录查看请求头、请求体、响应体和重试链路。</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setStatus(event.target.value)} value={status}>
                    <option value="">全部状态</option>
                    {senderStatuses.map((item) => (
                      <option key={item} value={item}>
                        {channelOperationStatusLabel(item)}
                      </option>
                    ))}
                  </select>
                  <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setProvider(event.target.value)} value={provider}>
                    <option value="">全部平台</option>
                    {senderProviders.map((item) => (
                      <option key={item} value={item}>
                        {channelProviderLabel(item)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {deliveriesQuery.isLoading ? (
                <div className="grid gap-3">
                  {Array.from({ length: 5 }).map((_, index) => <div className="h-28 rounded-md border bg-muted/30" key={index} />)}
                </div>
              ) : deliveries.length === 0 ? (
                <EmptyState description="当前筛选条件下没有主动回复投递记录。" title="暂无 Sender 投递" />
              ) : (
                <div className="grid gap-3">
                  {deliveries.map((item) => (
                    <SenderDeliveryRow
                      item={item}
                      key={item.id}
                      onOpen={() => setSelectedDeliveryId(item.delivery_id)}
                      onRetry={() => retryMutation.mutate(item.delivery_id)}
                      retrying={retryMutation.isPending}
                      selected={selectedDeliveryId === item.delivery_id}
                    />
                  ))}
                </div>
              )}
            </Card>

            <Card className="grid gap-4 p-5">
              <div>
                <h2 className="text-sm font-semibold">投递详情</h2>
                <p className="mt-1 text-sm text-muted-foreground">用于排查签名头、平台响应、Trace 和运行链路。</p>
              </div>

              {!selectedDeliveryId ? (
                <EmptyState description="先选择一条 Sender 投递记录查看详情。" title="未选择投递" />
              ) : detailQuery.isLoading ? (
                <div className="grid gap-3">
                  <div className="h-24 rounded-md border bg-muted/30" />
                  <div className="h-52 rounded-md border bg-muted/30" />
                </div>
              ) : detailQuery.data ? (
                <SenderDeliveryDetailPanel
                  canManage={permissions.canManage}
                  item={detailQuery.data}
                  onRetry={() => retryMutation.mutate(detailQuery.data.delivery_id)}
                  retrying={retryMutation.isPending}
                />
              ) : (
                <EmptyState description="投递详情加载失败或没有权限查看。" title="详情不可用" />
              )}
            </Card>
          </section>
        </>
      )}
    </main>
  );
}

function SenderDeliveryRow({
  item,
  onOpen,
  onRetry,
  retrying,
  selected,
}: {
  item: ChannelSenderDeliveryListItem;
  onOpen: () => void;
  onRetry: () => void;
  retrying: boolean;
  selected: boolean;
}) {
  return (
    <article className={cn('grid gap-3 rounded-md border bg-background/90 p-4 shadow-sm', selected && 'border-primary/50 bg-primary/5')}>
      <button className="grid gap-2 text-left" onClick={onOpen} type="button">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={channelOperationStatusTone(item.status)}>{channelOperationStatusLabel(item.status)}</StatusBadge>
          <StatusBadge tone="ready">{channelProviderLabel(item.provider)}</StatusBadge>
          <span className="text-sm font-semibold">{item.channel_name}</span>
        </div>
        <div className="grid gap-1 text-xs text-muted-foreground md:grid-cols-2">
          <span className="truncate">投递 ID：{item.delivery_id}</span>
          <span className="truncate">目标：{item.target ?? '未配置'}</span>
          <span>耗时：{formatLatency(item.latency_ms)}</span>
          <span>时间：{formatOptionalDateTime(item.delivered_at ?? item.created_at)}</span>
        </div>
      </button>
      <div className="flex flex-wrap justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone="mock">重试 {formatNumber(item.retry_count)} 次</StatusBadge>
          {item.trace_id ? <StatusBadge tone="loading">Trace</StatusBadge> : null}
        </div>
        <Button disabled={item.status !== 'FAILED' || retrying} onClick={onRetry} size="sm" type="button" variant="outline">
          <RotateCcw className={cn('size-4', retrying && 'animate-spin')} />
          失败重试
        </Button>
      </div>
    </article>
  );
}

function SenderDeliveryDetailPanel({
  canManage,
  item,
  onRetry,
  retrying,
}: {
  canManage: boolean;
  item: ChannelSenderDeliveryDetail;
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <div className="grid gap-4">
      <DetailGrid
        items={[
          { label: '投递 ID', value: item.delivery_id },
          { label: '父级投递', value: item.parent_delivery_id ?? '无' },
          { label: '渠道', value: item.channel_name },
          { label: 'Agent', value: item.agent_name ?? item.agent_id },
          { label: '平台', value: channelProviderLabel(item.provider) },
          { label: '目标', value: item.target ?? '未配置' },
          { label: '响应状态', value: item.response_status === null ? '无' : String(item.response_status) },
          { label: 'Trace', value: item.trace_id ?? '无' },
          { label: '外部会话', value: item.external_conversation_id ?? '无' },
          { label: '外部消息', value: item.external_message_id ?? '无' },
        ]}
      />
      <JsonBlock title="请求头" value={item.request_headers} />
      <JsonBlock title="请求正文" value={item.request_body} />
      <JsonBlock title="响应正文" value={item.response_body ?? '无响应正文'} />
      <div className="flex flex-wrap justify-end gap-2">
        <Button onClick={() => void navigator.clipboard?.writeText(item.delivery_id)} type="button" variant="outline">
          <Copy className="size-4" />
          复制投递 ID
        </Button>
        <Button disabled={!canManage || item.status !== 'FAILED' || retrying} onClick={onRetry} type="button" variant="outline">
          <RefreshCw className={cn('size-4', retrying && 'animate-spin')} />
          重试失败投递
        </Button>
      </div>
    </div>
  );
}

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="grid gap-2">
      <div className="text-sm font-semibold">{title}</div>
      <pre className="max-h-56 overflow-auto rounded-md border bg-slate-950 px-3 py-3 text-xs leading-6 text-slate-100">
        {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

function buildSenderMetrics(
  items: ChannelSenderDeliveryListItem[],
  total: number,
  taskSummary?: {
    pending_auto_retry_count: number;
    expired_delivery_count: number;
    auto_retry_enabled_channel_count: number;
    failed_delivery_count: number;
    oldest_failed_at: string | null;
  },
): ChannelOperationMetric[] {
  const failedCount = items.filter((item) => item.status === 'FAILED').length;
  const retryCount = items.reduce((sum, item) => sum + item.retry_count, 0);
  const latencyValues = items.map((item) => item.latency_ms).filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const averageLatency = latencyValues.length > 0 ? latencyValues.reduce((sum, value) => sum + value, 0) / latencyValues.length : null;

  return [
    { label: 'Sender 投递', value: formatNumber(total), helper: '当前筛选范围' },
    { label: '失败投递', value: formatNumber(taskSummary?.failed_delivery_count ?? failedCount), helper: '可执行失败重试' },
    { label: '待自动重试', value: formatNumber(taskSummary?.pending_auto_retry_count), helper: `累计重试 ${formatNumber(retryCount)} 次` },
    { label: '平均耗时', value: formatLatency(averageLatency), helper: `过期待清理 ${formatNumber(taskSummary?.expired_delivery_count)}` },
  ];
}

function channelProviderLabel(provider: ChannelCallbackProvider) {
  const labels: Record<ChannelCallbackProvider, string> = {
    CUSTOM_WEBHOOK: '自定义 Webhook',
    DINGTALK: '钉钉',
    FEISHU: '飞书',
    SLACK: 'Slack',
    WECHAT_WORK: '企业微信',
  };

  return labels[provider] ?? provider;
}
