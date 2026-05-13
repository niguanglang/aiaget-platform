'use client';

import type { ChannelReplyItem } from '@aiaget/shared-types';
import { Eye } from 'lucide-react';
import Link from 'next/link';

import {
  ChannelOperationRow,
  ChannelOperationsListPage,
  ChannelOperationStatusBadge,
  formatNumber,
  formatOptionalDateTime,
  type ChannelOperationMetric,
} from '@/components/channels/channel-operations-pages';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { listChannelReplies } from '@/lib/api-client';

const repliesQueryKey = 'channel-replies-focused-page';

const replyStatusOptions = [
  { label: '待处理', value: 'PENDING' },
  { label: '成功', value: 'SUCCESS' },
  { label: '失败', value: 'FAILED' },
  { label: '跳过', value: 'SKIPPED' },
  { label: '重试中', value: 'RETRYING' },
];

export function ChannelRepliesContent() {
  return (
    <ChannelOperationsListPage
      activeRoute="replies"
      badge="回复记录"
      buildMetrics={(input) => buildReplyMetrics(input.items, input.total)}
      emptyTitle="暂无回复记录"
      errorMessage="回复记录列表加载失败。"
      getItemId={(item) => item.id}
      listQuery={listChannelReplies}
      providerFilterLabel="平台/渠道"
      queryKey={repliesQueryKey}
      renderItem={({ item, onToggle, permissions, selected }) => (
        <ChannelOperationRow
          badges={
            <>
              <ChannelOperationStatusBadge status={item.status} />
              <StatusBadge tone="ready">{item.reply_type ?? '默认回复'}</StatusBadge>
            </>
          }
          details={[
            { label: '回复 ID', value: item.reply_id ?? item.id },
            { label: '平台', value: item.provider ?? '未记录' },
            { label: '发布渠道', value: item.channel_name ?? item.channel_id ?? '未绑定' },
            { label: '投递记录', value: item.delivery_id ?? '未关联投递' },
            { label: '外部会话', value: item.external_conversation_id ?? '未记录' },
            { label: 'Trace', value: item.trace_id ?? '未记录' },
            { label: '回复时间', value: formatOptionalDateTime(item.replied_at ?? item.created_at) },
          ]}
          selected={selected}
          stats={[
            { label: '平台', value: item.provider ?? '-' },
            { label: 'Trace', value: item.trace_id ? '有' : '无' },
          ]}
          subtitle={
            <span>
              外部会话：{item.external_conversation_id ?? '未记录'} · 类型：{item.reply_type ?? '默认回复'} · Trace：{item.trace_id ? '有' : '无'}
            </span>
          }
          title={item.reply_id ?? item.external_message_id ?? item.id}
          actions={
            permissions.canView ? (
              <Button asChild size="sm" variant="outline">
                <Link href={`/channels/replies/${encodeURIComponent(item.id)}`}>
                  <Eye className="size-4" />
                  查看详情
                </Link>
              </Button>
            ) : null
          }
          onToggle={onToggle}
        />
      )}
      statusOptions={replyStatusOptions}
      title="回复记录"
    />
  );
}

function buildReplyMetrics(items: ChannelReplyItem[], total: number): ChannelOperationMetric[] {
  const successCount = items.filter((item) => item.status === 'SUCCESS').length;
  const failedCount = items.filter((item) => item.status === 'FAILED').length;
  const tracedCount = items.filter((item) => Boolean(item.trace_id)).length;

  return [
    { label: '回复记录', value: formatNumber(total), helper: '当前筛选范围' },
    { label: '成功回复', value: formatNumber(successCount), helper: '当前页 SUCCESS' },
    { label: '失败回复', value: formatNumber(failedCount), helper: '需要排查错误' },
    { label: 'Trace 覆盖', value: formatNumber(tracedCount), helper: '当前页可追踪链路' },
  ];
}
