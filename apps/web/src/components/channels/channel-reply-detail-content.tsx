'use client';

import { useQuery } from '@tanstack/react-query';
import { Copy, GitBranch, RefreshCw } from 'lucide-react';
import Link from 'next/link';

import {
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
import { getChannelReply } from '@/lib/api-client';
import { cn } from '@/lib/utils';

export function ChannelReplyDetailContent({ replyId }: { replyId: string }) {
  const permissions = useChannelOperationPermissions();
  const detailQuery = useQuery({
    enabled: permissions.canView && Boolean(replyId),
    queryKey: ['channel-reply-detail', replyId],
    queryFn: () => getChannelReply(replyId),
  });

  const item = detailQuery.data ?? null;

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <ChannelFocusedHeader
        activeRoute="replies"
        badge="回复详情"
        description="回复消息链路、消息内容、原始载荷和处理时间。"
        permissions={permissions}
        refreshing={detailQuery.isFetching}
        subtitle="/channels/replies/:replyId"
        title="回复详情"
        onRefresh={() => void detailQuery.refetch()}
      />

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/channels/replies">返回回复记录列表</Link>
        </Button>
        <Button disabled={detailQuery.isFetching} onClick={() => void detailQuery.refetch()} type="button" variant="outline">
          <RefreshCw className={cn('size-4', detailQuery.isFetching && 'animate-spin')} />
          刷新详情
        </Button>
      </div>

      <ChannelAlert message={detailQuery.isError ? '回复详情加载失败。' : null} tone="error" />

      {!permissions.canView ? (
        <Card className="p-5">
          <EmptyState description="当前账号缺少 channel:publish:view 权限，无法查看回复详情。" title="无权查看回复详情" />
        </Card>
      ) : detailQuery.isLoading ? (
        <Card className="grid gap-3 p-5">
          <div className="h-24 rounded-md border bg-muted/30" />
          <div className="h-52 rounded-md border bg-muted/30" />
        </Card>
      ) : !item ? (
        <Card className="p-5">
          <EmptyState description="回复记录不存在、已清理或当前账号没有权限查看。" title="回复详情不可用" />
        </Card>
      ) : (
        <>
          <Card className="grid gap-4 p-5">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={channelOperationStatusTone(item.status)}>{channelOperationStatusLabel(item.status)}</StatusBadge>
                  <StatusBadge tone="ready">{item.reply_type ?? '默认回复'}</StatusBadge>
                  {item.trace_id ? <StatusBadge tone="loading">Trace</StatusBadge> : null}
                </div>
                <h2 className="mt-3 text-xl font-semibold">{item.reply_id ?? item.external_message_id ?? item.id}</h2>
                <p className="mt-2 max-w-4xl break-all text-sm leading-6 text-muted-foreground">
                  {item.external_conversation_id ?? '未记录外部会话'} / {item.external_message_id ?? '未记录外部消息'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Button onClick={() => void navigator.clipboard?.writeText(item.reply_id ?? item.id)} type="button" variant="outline">
                  <Copy className="size-4" />
                  复制回复 ID
                </Button>
                {item.trace_id ? (
                  <Button asChild variant="outline">
                    <Link href={`/monitor/traces/${encodeURIComponent(item.trace_id)}`}>
                      <GitBranch className="size-4" />
                      查看 Trace
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </Card>

          <Card className="grid gap-4 p-5">
            <h2 className="text-sm font-semibold">回复基础信息</h2>
            <DetailGrid
              items={[
                { label: '回复 ID', value: item.reply_id ?? item.id },
                { label: '回复方向', value: item.direction ?? '未记录' },
                { label: '平台', value: item.provider_name ?? item.provider ?? '未记录' },
                { label: '发布渠道', value: item.channel_name ?? item.channel_id ?? '未绑定' },
                { label: '账号凭据', value: item.account_name ?? item.account_id ?? '未绑定' },
                { label: 'Agent', value: item.agent_name ?? item.agent_id ?? '未绑定' },
                { label: '投递记录', value: item.delivery_id ?? '未关联' },
                { label: '消息 ID', value: item.message_id ?? '未生成' },
                { label: '接收时间', value: formatOptionalDateTime(item.received_at) },
                { label: '处理时间', value: formatOptionalDateTime(item.processed_at) },
                { label: '回复时间', value: formatOptionalDateTime(item.replied_at ?? item.created_at) },
              ]}
            />
          </Card>

          <Card className="grid gap-4 p-5">
            <h2 className="text-sm font-semibold">消息链路</h2>
            <DetailGrid
              items={[
                { label: '外部会话', value: item.external_conversation_id ?? '未记录' },
                { label: '外部消息', value: item.external_message_id ?? '未记录' },
                { label: '内部会话', value: item.conversation_id ?? '未生成' },
                { label: '运行 ID', value: item.run_id ?? '未生成' },
                { label: 'Trace ID', value: item.trace_id ?? '未记录' },
                { label: '发送方', value: item.sender ?? '未记录' },
                { label: '接收方', value: item.recipient ?? '未记录' },
              ]}
            />
          </Card>

          <section className="grid gap-4 xl:grid-cols-2">
            <Card className="grid gap-4 p-5">
              <h2 className="text-sm font-semibold">消息内容</h2>
              <pre className="min-h-48 whitespace-pre-wrap rounded-md border bg-muted/20 px-3 py-3 text-sm leading-6">
                {item.content ?? item.content_preview ?? '无消息内容'}
              </pre>
            </Card>

            <Card className="grid gap-4 p-5">
              <h2 className="text-sm font-semibold">原始载荷</h2>
              <JsonBlock value={item.payload ?? null} />
            </Card>
          </section>
        </>
      )}
    </main>
  );
}

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="max-h-96 overflow-auto rounded-md border bg-slate-950 px-3 py-3 text-xs leading-6 text-slate-100">
      {value === null || value === undefined ? '无' : typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
    </pre>
  );
}
