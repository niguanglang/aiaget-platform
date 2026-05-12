'use client';

import type { ChannelCallbackProvider, ChannelSenderDeliveryListItem, ChannelSenderProviderApi } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, RotateCcw, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import {
  ChannelActionConfirmDialog,
  ChannelAlert,
  ChannelFocusedHeader,
  ChannelMetricGrid,
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

type SenderActionTarget =
  | { action: 'auto-retry' }
  | { action: 'cleanup' }
  | { action: 'retry-delivery'; deliveryId: string; channelName: string };

export function ChannelSenderContent() {
  const queryClient = useQueryClient();
  const permissions = useChannelOperationPermissions();
  const [status, setStatus] = useState('');
  const [provider, setProvider] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [senderActionTarget, setSenderActionTarget] = useState<SenderActionTarget | null>(null);

  const deliveriesQuery = useQuery({
    enabled: permissions.canView,
    queryKey: ['channel-sender-focused-deliveries', status, provider],
    queryFn: () =>
      listChannelSenderDeliveries({
        status: status || undefined,
        provider: provider || undefined,
      }),
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
      setSenderActionTarget(null);
      await queryClient.invalidateQueries({ queryKey: ['channel-sender-focused-deliveries'] });
      await queryClient.invalidateQueries({ queryKey: ['channel-sender-delivery-detail', result.item.delivery_id] });
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
      setSenderActionTarget(null);
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
      setSenderActionTarget(null);
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
                <Button disabled={!permissions.canManage || autoRetryMutation.isPending} onClick={() => setSenderActionTarget({ action: 'auto-retry' })} type="button" variant="outline">
                  <RotateCcw className={cn('size-4', autoRetryMutation.isPending && 'animate-spin')} />
                  运行自动重试
                </Button>
                <Button disabled={!permissions.canManage || cleanupMutation.isPending} onClick={() => setSenderActionTarget({ action: 'cleanup' })} type="button" variant="outline">
                  <Trash2 className="size-4" />
                  运行清理
                </Button>
              </div>
            </div>
          </Card>

          <section className="grid gap-4">
            <Card className="grid gap-4 p-5">
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                <div>
                  <h2 className="text-sm font-semibold">主动回复投递列表</h2>
                  <p className="mt-1 text-sm text-muted-foreground">列表只保留核心识别字段，完整请求、响应和重试链路进入独立详情页。</p>
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
                      onRetry={() => setSenderActionTarget({ action: 'retry-delivery', deliveryId: item.delivery_id, channelName: item.channel_name })}
                      retrying={retryMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </Card>
          </section>
        </>
      )}

      {senderActionTarget ? (
        <ChannelActionConfirmDialog
          body={getSenderActionConfirmBody(senderActionTarget)}
          confirmLabel={getSenderActionConfirmLabel(senderActionTarget)}
          onCancel={() => setSenderActionTarget(null)}
          onConfirm={() => {
            if (senderActionTarget.action === 'auto-retry') {
              autoRetryMutation.mutate();
              return;
            }
            if (senderActionTarget.action === 'cleanup') {
              cleanupMutation.mutate();
              return;
            }
            retryMutation.mutate(senderActionTarget.deliveryId);
          }}
          pending={
            senderActionTarget.action === 'auto-retry'
              ? autoRetryMutation.isPending
              : senderActionTarget.action === 'cleanup'
                ? cleanupMutation.isPending
                : retryMutation.isPending
          }
          title={getSenderActionConfirmTitle(senderActionTarget)}
          variant={senderActionTarget.action === 'cleanup' ? 'destructive' : 'default'}
        />
      ) : null}
    </main>
  );
}

function getSenderActionConfirmTitle(target: SenderActionTarget) {
  if (target.action === 'auto-retry') return '确认运行自动重试';
  if (target.action === 'cleanup') return '确认运行清理';

  return '确认重试失败投递';
}

function getSenderActionConfirmBody(target: SenderActionTarget) {
  if (target.action === 'auto-retry') {
    return '确认运行 Sender 自动重试任务？系统将扫描当前租户符合条件的失败投递，并按重试策略重新提交。';
  }
  if (target.action === 'cleanup') {
    return '确认运行 Sender 清理任务？系统将清理当前租户过期的 Sender 投递任务记录，清理后的历史记录可能不再展示。';
  }

  return `确认重试渠道“${target.channelName}”的失败投递“${target.deliveryId}”？重试会重新向目标平台发送该投递内容。`;
}

function getSenderActionConfirmLabel(target: SenderActionTarget) {
  if (target.action === 'auto-retry') return '确认运行';
  if (target.action === 'cleanup') return '确认清理';

  return '确认重试';
}

function SenderDeliveryRow({
  item,
  onRetry,
  retrying,
}: {
  item: ChannelSenderDeliveryListItem;
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <article className="grid gap-3 rounded-md border bg-background/90 p-4 shadow-sm transition-colors hover:bg-muted/25">
      <Link className="grid gap-2 text-left" href={`/channels/sender/deliveries/${encodeURIComponent(item.delivery_id)}`}>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={channelOperationStatusTone(item.status)}>{channelOperationStatusLabel(item.status)}</StatusBadge>
          <StatusBadge tone="ready">{channelProviderLabel(item.provider)}</StatusBadge>
          <span className="text-sm font-semibold">{item.channel_name}</span>
        </div>
        <div className="grid gap-1 text-xs text-muted-foreground md:grid-cols-2">
          <span className="truncate">投递 ID：{item.delivery_id}</span>
          <span className="truncate">目标：{item.target ?? '未配置'}</span>
          <span>发送模式：{senderModeLabel(item.sender_mode)}</span>
          <span className="truncate">平台 API：{providerApiLabel(item.provider_api)}</span>
          <span>耗时：{formatLatency(item.latency_ms)}</span>
          <span>时间：{formatOptionalDateTime(item.delivered_at ?? item.created_at)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-primary">
          查看投递详情
          <ArrowRight className="size-4" />
        </div>
      </Link>
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

function senderModeLabel(mode: ChannelSenderDeliveryListItem['sender_mode']) {
  if (mode === 'NATIVE_API') return '原生 API';
  if (mode === 'WEBHOOK') return 'Webhook';
  return '已跳过';
}

function providerApiLabel(value: ChannelSenderProviderApi) {
  const labels: Record<ChannelSenderProviderApi, string> = {
    WECHAT_WORK_MESSAGE_SEND: '企业微信消息发送',
    DINGTALK_SESSION_WEBHOOK: '钉钉会话 Webhook',
    FEISHU_BOT_WEBHOOK: '飞书机器人 Webhook',
    FEISHU_IM_MESSAGE: '飞书 IM 消息',
    SLACK_INCOMING_WEBHOOK: 'Slack Incoming Webhook',
    SLACK_CHAT_POST_MESSAGE: 'Slack chat.postMessage',
    CUSTOM_WEBHOOK: '自定义 Webhook',
  };

  return labels[value] ?? value;
}
