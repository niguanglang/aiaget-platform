'use client';

import type {
  ChannelOperationsListParams,
  ChannelOperationsListResult,
  PublishChannelListItem,
} from '@aiaget/shared-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Activity, Power, PowerOff } from 'lucide-react';
import { useState } from 'react';

import {
  ChannelOperationRow,
  ChannelOperationsListPage,
  formatNumber,
  formatOptionalDateTime,
  formatPercent,
  type ChannelOperationMetric,
} from '@/components/channels/channel-operations-pages';
import {
  publishChannelHealthLabel,
  publishChannelHealthTone,
  publishChannelStatusLabel,
  publishChannelStatuses,
  publishChannelStatusTone,
  publishChannelTypeLabel,
} from '@/components/channels/channel-status';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  checkPublishChannel,
  disablePublishChannel,
  enablePublishChannel,
  getPublishChannelOverview,
  type ApiClientError,
} from '@/lib/api-client';

const publishQueryKey = 'channel-publish-focused-page';

const publishStatusOptions = publishChannelStatuses.map((status) => ({
  label: publishChannelStatusLabel(status),
  value: status,
}));

export function ChannelPublishContent() {
  const queryClient = useQueryClient();
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const checkMutation = useMutation({
    mutationFn: checkPublishChannel,
    onSuccess: async () => {
      setActionNotice('渠道巡检已完成，健康状态已刷新。');
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: [publishQueryKey] });
    },
    onError: (error: ApiClientError) => {
      setActionNotice(null);
      setActionError(error.message);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ channelId, nextStatus }: { channelId: string; nextStatus: 'ACTIVE' | 'DISABLED' }) =>
      nextStatus === 'ACTIVE' ? enablePublishChannel(channelId) : disablePublishChannel(channelId),
    onSuccess: async (_, variables) => {
      setActionNotice(variables.nextStatus === 'ACTIVE' ? '发布渠道已启用。' : '发布渠道已停用。');
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: [publishQueryKey] });
    },
    onError: (error: ApiClientError) => {
      setActionNotice(null);
      setActionError(error.message);
    },
  });

  return (
    <ChannelOperationsListPage
      activeRoute="publish"
      actionError={actionError}
      actionNotice={actionNotice}
      badge="发布渠道"
      buildMetrics={buildPublishMetrics}
      description="聚焦已发布 Agent 的渠道入口、健康状态和 24h 调用表现；启停、渠道巡检等低频动作进入单行详情。"
      emptyDescription="当前没有发布渠道。请先在 Agent 详情中发布渠道，或回到总览查看完整发布配置。"
      emptyTitle="暂无发布渠道"
      errorMessage="发布渠道数据加载失败。"
      getItemId={(item) => item.id}
      listQuery={listPublishChannels}
      providerFilterLabel="渠道类型/Agent"
      queryKey={publishQueryKey}
      renderItem={({ item, onToggle, permissions, selected }) => (
        <ChannelOperationRow
          badges={
            <>
              <StatusBadge tone="ready">{publishChannelTypeLabel(item.channel)}</StatusBadge>
              <StatusBadge tone={publishChannelStatusTone(item.status)}>{publishChannelStatusLabel(item.status)}</StatusBadge>
              <StatusBadge tone={publishChannelHealthTone(item.health_status)}>{publishChannelHealthLabel(item.health_status)}</StatusBadge>
            </>
          }
          details={[
            { label: 'Agent', value: item.agent ? `${item.agent.name}（${item.agent.code}）` : '未绑定 Agent' },
            { label: '入口地址', value: item.endpoint_url ?? '未配置' },
            { label: '回调地址', value: item.callback_url ?? '未配置' },
            { label: '密钥状态', value: item.secret_masked ?? '未配置' },
            { label: '健康说明', value: item.health_message ?? '暂无异常说明' },
            { label: '最近发布', value: formatOptionalDateTime(item.last_published_at) },
            { label: '最近巡检', value: formatOptionalDateTime(item.last_checked_at) },
            { label: '更新时间', value: formatOptionalDateTime(item.updated_at) },
          ]}
          selected={selected}
          stats={[
            { label: '24h 请求', value: formatNumber(item.request_count_24h) },
            { label: '成功率', value: formatPercent(item.success_rate_24h) },
          ]}
          subtitle={
            <span>
              Agent：{item.agent?.name ?? '未绑定'} · 状态：{publishChannelStatusLabel(item.status)} · 健康状态：
              {publishChannelHealthLabel(item.health_status)}
            </span>
          }
          title={item.name}
          actions={
            <>
              <Button disabled={!permissions.canView || checkMutation.isPending} onClick={() => checkMutation.mutate(item.id)} size="sm" type="button" variant="outline">
                <Activity className="size-4" />
                渠道巡检
              </Button>
              {item.status === 'ACTIVE' ? (
                <Button
                  disabled={!permissions.canDisable || statusMutation.isPending}
                  onClick={() => statusMutation.mutate({ channelId: item.id, nextStatus: 'DISABLED' })}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <PowerOff className="size-4" />
                  停用渠道
                </Button>
              ) : (
                <Button
                  disabled={!permissions.canManage || statusMutation.isPending}
                  onClick={() => statusMutation.mutate({ channelId: item.id, nextStatus: 'ACTIVE' })}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Power className="size-4" />
                  启用渠道
                </Button>
              )}
            </>
          }
          onToggle={onToggle}
        />
      )}
      statusOptions={publishStatusOptions}
      subtitle="/channels/publish"
      title="发布渠道"
    />
  );
}

async function listPublishChannels(params: ChannelOperationsListParams): Promise<ChannelOperationsListResult<PublishChannelListItem>> {
  const overview = await getPublishChannelOverview();
  const keyword = params.keyword?.trim().toLowerCase() ?? '';
  const provider = params.provider?.trim().toLowerCase() ?? '';

  const filtered = overview.channels.filter((channel) => {
    const searchable = [
      channel.name,
      channel.channel,
      channel.agent?.name,
      channel.agent?.code,
      channel.endpoint_url,
      channel.callback_url,
      channel.health_message,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const providerSearchable = [channel.channel, channel.agent?.name, channel.agent?.code].filter(Boolean).join(' ').toLowerCase();

    return (!keyword || searchable.includes(keyword)) && (!params.status || channel.status === params.status) && (!provider || providerSearchable.includes(provider));
  });

  const page = params.page ?? 1;
  const pageSize = params.page_size ?? 20;
  const start = (page - 1) * pageSize;

  return {
    generated_at: overview.generated_at,
    items: filtered.slice(start, start + pageSize),
    page,
    page_size: pageSize,
    total: filtered.length,
  };
}

function buildPublishMetrics({ items, total }: { items: PublishChannelListItem[]; total: number }): ChannelOperationMetric[] {
  const activeCount = items.filter((item) => item.status === 'ACTIVE').length;
  const errorCount = items.filter((item) => item.status === 'ERROR').length;
  const requestCount = items.reduce((sum, item) => sum + item.request_count_24h, 0);
  const averageSuccessRate = items.length > 0 ? items.reduce((sum, item) => sum + item.success_rate_24h, 0) / items.length : null;

  return [
    { label: '发布渠道', value: formatNumber(total), helper: '当前筛选范围' },
    { label: '启用渠道', value: formatNumber(activeCount), helper: '当前页 ACTIVE' },
    { label: '异常渠道', value: formatNumber(errorCount), helper: '当前页 ERROR' },
    { label: '24h 请求', value: formatNumber(requestCount), helper: `平均成功率 ${formatPercent(averageSuccessRate)}` },
  ];
}
