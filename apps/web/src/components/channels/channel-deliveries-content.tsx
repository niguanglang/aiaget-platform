'use client';

import type { ChannelDeliveryItem } from '@aiaget/shared-types';
import { Eye } from 'lucide-react';
import Link from 'next/link';

import {
  ChannelOperationRow,
  ChannelOperationsListPage,
  ChannelOperationStatusBadge,
  formatLatency,
  formatNumber,
  type ChannelOperationMetric,
} from '@/components/channels/channel-operations-pages';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { listChannelDeliveries } from '@/lib/api-client';

const deliveriesQueryKey = 'channel-deliveries-focused-page';

const deliveryStatusOptions = [
  { label: '待处理', value: 'PENDING' },
  { label: '成功', value: 'SUCCESS' },
  { label: '失败', value: 'FAILED' },
  { label: '跳过', value: 'SKIPPED' },
  { label: '重试中', value: 'RETRYING' },
];

export function ChannelDeliveriesContent() {
  return (
    <ChannelOperationsListPage
      activeRoute="deliveries"
      badge="投递记录"
      buildMetrics={(input) => buildDeliveryMetrics(input.items, input.total)}
      emptyTitle="暂无投递记录"
      errorMessage="投递记录列表加载失败。"
      getItemId={(item) => item.id}
      listQuery={listChannelDeliveries}
      providerFilterLabel="供应商/渠道"
      queryKey={deliveriesQueryKey}
      renderItem={({ item, onToggle, permissions, selected }) => (
        <ChannelOperationRow
          badges={
            <>
              <ChannelOperationStatusBadge status={item.status} />
              <StatusBadge tone="ready">响应状态 {item.response_status ?? '无'}</StatusBadge>
            </>
          }
          details={[
            { label: '投递 ID', value: item.delivery_id ?? item.id },
            { label: '渠道提供方', value: item.provider_name ?? item.provider ?? '未记录' },
            { label: '发布渠道', value: item.channel_name ?? item.channel_id ?? '未绑定' },
            { label: '账号凭据', value: item.account_name ?? item.account_id ?? '未绑定' },
            { label: '投递目标', value: item.target ?? '未记录' },
            { label: '响应状态', value: item.response_status ?? '无响应' },
            { label: '投递耗时', value: formatLatency(item.latency_ms) },
            { label: '重试次数', value: formatNumber(item.retry_count ?? 0) },
          ]}
          selected={selected}
          stats={[
            { label: '耗时', value: formatLatency(item.latency_ms) },
            { label: '重试', value: formatNumber(item.retry_count ?? 0) },
          ]}
          subtitle={
            <span>
              响应状态：{item.response_status ?? '无'} · 耗时：{formatLatency(item.latency_ms)} · 目标：{item.target ?? '未记录'}
            </span>
          }
          title={item.delivery_id ?? item.id}
          actions={
            permissions.canView ? (
              <Button asChild size="sm" variant="outline">
                <Link href={`/channels/deliveries/${encodeURIComponent(item.id)}`}>
                  <Eye className="size-4" />
                  查看详情
                </Link>
              </Button>
            ) : null
          }
          onToggle={onToggle}
        />
      )}
      statusOptions={deliveryStatusOptions}
      title="投递记录"
    />
  );
}

function buildDeliveryMetrics(items: ChannelDeliveryItem[], total: number): ChannelOperationMetric[] {
  const successCount = items.filter((item) => item.status === 'SUCCESS').length;
  const failedCount = items.filter((item) => item.status === 'FAILED').length;
  const retryCount = items.reduce((sum, item) => sum + (item.retry_count ?? 0), 0);
  const latencyValues = items.map((item) => item.latency_ms).filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const averageLatency = latencyValues.length > 0 ? latencyValues.reduce((sum, value) => sum + value, 0) / latencyValues.length : null;

  return [
    { label: '投递记录', value: formatNumber(total), helper: '当前筛选范围' },
    { label: '成功投递', value: formatNumber(successCount), helper: '当前页 SUCCESS' },
    { label: '失败投递', value: formatNumber(failedCount), helper: '当前页 FAILED' },
    { label: '平均耗时', value: formatLatency(averageLatency), helper: `累计重试 ${formatNumber(retryCount)} 次` },
  ];
}
