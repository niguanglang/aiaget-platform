'use client';

import type { ChannelCallbackProvider, ChannelSenderDeliveryDetail } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, RefreshCw, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import {
  ChannelActionConfirmDialog,
  ChannelAlert,
  ChannelFocusedHeader,
  DetailGrid,
  channelOperationStatusLabel,
  channelOperationStatusTone,
  formatOptionalDateTime,
  useChannelOperationPermissions,
} from '@/components/channels/channel-operations-pages';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { getChannelSenderDelivery, retryChannelSenderDelivery, type ApiClientError } from '@/lib/api-client';
import { cn } from '@/lib/utils';

type SenderDeliveryActionTarget = {
  deliveryId: string;
  channelName: string;
};

export function ChannelSenderDeliveryDetailContent({ deliveryId }: { deliveryId: string }) {
  const queryClient = useQueryClient();
  const permissions = useChannelOperationPermissions();
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [senderDeliveryActionTarget, setSenderDeliveryActionTarget] = useState<SenderDeliveryActionTarget | null>(null);

  const detailQuery = useQuery({
    enabled: permissions.canView && Boolean(deliveryId),
    queryKey: ['channel-sender-delivery-detail', deliveryId],
    queryFn: () => getChannelSenderDelivery(deliveryId),
  });

  const retryMutation = useMutation({
    mutationFn: retryChannelSenderDelivery,
    onSuccess: async () => {
      setNotice('失败投递已提交重试。');
      setActionError(null);
      setSenderDeliveryActionTarget(null);
      await queryClient.invalidateQueries({ queryKey: ['channel-sender-focused-deliveries'] });
      await queryClient.invalidateQueries({ queryKey: ['channel-sender-delivery-detail', deliveryId] });
      await queryClient.invalidateQueries({ queryKey: ['channel-sender-focused-tasks'] });
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setActionError(error.message);
    },
  });

  const item = detailQuery.data ?? null;

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <ChannelFocusedHeader
        activeRoute="sender"
        badge="投递详情"
        description="查看单条 Sender 投递的请求头、请求正文、平台响应、Trace 和重试入口，避免在投递列表中塞入完整排障详情。"
        permissions={permissions}
        refreshing={detailQuery.isFetching}
        subtitle="/channels/sender/deliveries/:deliveryId"
        title="Sender 投递详情"
        onRefresh={() => void detailQuery.refetch()}
      />

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/channels/sender">返回 Sender 列表</Link>
        </Button>
        <Button disabled={detailQuery.isFetching} onClick={() => void detailQuery.refetch()} type="button" variant="outline">
          <RefreshCw className={`size-4 ${detailQuery.isFetching ? 'animate-spin' : ''}`} />
          刷新详情
        </Button>
      </div>

      <ChannelAlert message={notice} tone="ready" />
      <ChannelAlert message={actionError ?? (detailQuery.isError ? 'Sender 投递详情加载失败。' : null)} tone="error" />

      {!permissions.canView ? (
        <Card className="p-5">
          <EmptyState description="当前账号缺少 channel:publish:view 权限，无法查看 Sender 投递详情。" title="无权查看投递详情" />
        </Card>
      ) : detailQuery.isLoading ? (
        <Card className="grid gap-3 p-5">
          <div className="h-24 rounded-md border bg-muted/30" />
          <div className="h-52 rounded-md border bg-muted/30" />
        </Card>
      ) : !item ? (
        <Card className="p-5">
          <EmptyState description="投递详情不存在、已清理或没有权限查看。" title="投递详情不可用" />
        </Card>
      ) : (
        <>
          <Card className="grid gap-4 p-5">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={channelOperationStatusTone(item.status)}>{channelOperationStatusLabel(item.status)}</StatusBadge>
                  <StatusBadge tone="ready">{channelProviderLabel(item.provider)}</StatusBadge>
                  {item.trace_id ? <StatusBadge tone="loading">Trace</StatusBadge> : null}
                </div>
                <h2 className="mt-3 text-xl font-semibold">{item.channel_name}</h2>
                <p className="mt-2 max-w-4xl break-all text-sm leading-6 text-muted-foreground">{item.delivery_id}</p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <div>投递时间</div>
                <div className="mt-1 font-medium text-foreground">{formatOptionalDateTime(item.delivered_at ?? item.created_at)}</div>
              </div>
            </div>
          </Card>

          <Card className="grid gap-4 p-5">
            <h2 className="text-sm font-semibold">投递基础信息</h2>
            <SenderDeliveryDetailPanel
              canManage={permissions.canManage}
              item={item}
              onRetry={() => setSenderDeliveryActionTarget({ deliveryId: item.delivery_id, channelName: item.channel_name })}
              retrying={retryMutation.isPending}
            />
          </Card>
        </>
      )}

      {senderDeliveryActionTarget ? (
        <ChannelActionConfirmDialog
          body={`确认重试 Sender 投递“${senderDeliveryActionTarget.deliveryId}”？系统将再次向渠道“${senderDeliveryActionTarget.channelName}”的目标平台发送该投递内容，并刷新投递详情和 Sender 任务概览。`}
          confirmLabel="确认重试"
          onCancel={() => setSenderDeliveryActionTarget(null)}
          onConfirm={() => retryMutation.mutate(senderDeliveryActionTarget.deliveryId)}
          pending={retryMutation.isPending}
          title="确认重试失败投递"
        />
      ) : null}
    </main>
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
          <RotateCcw className={cn('size-4', retrying && 'animate-spin')} />
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
      <pre className="max-h-72 overflow-auto rounded-md border bg-slate-950 px-3 py-3 text-xs leading-6 text-slate-100">
        {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
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
