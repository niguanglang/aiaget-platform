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
  formatLatency,
  formatNumber,
  formatOptionalDateTime,
  useChannelOperationPermissions,
} from '@/components/channels/channel-operations-pages';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { getChannelDelivery } from '@/lib/api-client';
import { cn } from '@/lib/utils';

export function ChannelDeliveryDetailContent({ deliveryId }: { deliveryId: string }) {
  const permissions = useChannelOperationPermissions();
  const detailQuery = useQuery({
    enabled: permissions.canView && Boolean(deliveryId),
    queryKey: ['channel-delivery-detail', deliveryId],
    queryFn: () => getChannelDelivery(deliveryId),
  });

  const item = detailQuery.data ?? null;

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <ChannelFocusedHeader
        activeRoute="deliveries"
        badge="投递详情"
        description="查看单条渠道投递的请求信息、响应信息、错误原因和链路信息，列表页只保留投递概览。"
        permissions={permissions}
        refreshing={detailQuery.isFetching}
        subtitle="/channels/deliveries/:deliveryId"
        title="投递详情"
        onRefresh={() => void detailQuery.refetch()}
      />

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/channels/deliveries">返回投递记录列表</Link>
        </Button>
        <Button disabled={detailQuery.isFetching} onClick={() => void detailQuery.refetch()} type="button" variant="outline">
          <RefreshCw className={cn('size-4', detailQuery.isFetching && 'animate-spin')} />
          刷新详情
        </Button>
      </div>

      <ChannelAlert message={detailQuery.isError ? '投递详情加载失败。' : null} tone="error" />

      {!permissions.canView ? (
        <Card className="p-5">
          <EmptyState description="当前账号缺少 channel:publish:view 权限，无法查看投递详情。" title="无权查看投递详情" />
        </Card>
      ) : detailQuery.isLoading ? (
        <Card className="grid gap-3 p-5">
          <div className="h-24 rounded-md border bg-muted/30" />
          <div className="h-52 rounded-md border bg-muted/30" />
        </Card>
      ) : !item ? (
        <Card className="p-5">
          <EmptyState description="投递记录不存在、已清理或当前账号没有权限查看。" title="投递详情不可用" />
        </Card>
      ) : (
        <>
          <Card className="grid gap-4 p-5">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={channelOperationStatusTone(item.status)}>{channelOperationStatusLabel(item.status)}</StatusBadge>
                  <StatusBadge tone="ready">响应状态 {item.response_status ?? '无'}</StatusBadge>
                  {item.trace_id ? <StatusBadge tone="loading">Trace</StatusBadge> : null}
                </div>
                <h2 className="mt-3 text-xl font-semibold">{item.delivery_id ?? item.id}</h2>
                <p className="mt-2 max-w-4xl break-all text-sm leading-6 text-muted-foreground">{item.target ?? '未记录投递目标'}</p>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Button onClick={() => void navigator.clipboard?.writeText(item.delivery_id ?? item.id)} type="button" variant="outline">
                  <Copy className="size-4" />
                  复制投递 ID
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
            <h2 className="text-sm font-semibold">投递基础信息</h2>
            <DetailGrid
              items={[
                { label: '投递 ID', value: item.delivery_id ?? item.id },
                { label: '投递方向', value: item.direction ?? '未记录' },
                { label: '渠道提供方', value: item.provider_name ?? item.provider ?? '未记录' },
                { label: '发布渠道', value: item.channel_name ?? item.channel_id ?? '未绑定' },
                { label: '账号凭据', value: item.account_name ?? item.account_id ?? '未绑定' },
                { label: 'Agent', value: item.agent_name ?? item.agent_id ?? '未绑定' },
                { label: '消息模板', value: item.template_name ?? item.template_id ?? '未绑定' },
                { label: '发布任务', value: item.publish_job_id ?? '未关联' },
                { label: '响应状态', value: item.response_status ?? '无响应' },
                { label: '投递耗时', value: formatLatency(item.latency_ms) },
                { label: '重试次数', value: formatNumber(item.retry_count ?? 0) },
                { label: '错误原因', value: item.error_message ?? '暂无错误' },
                { label: '投递时间', value: formatOptionalDateTime(item.delivered_at) },
                { label: '创建时间', value: formatOptionalDateTime(item.created_at) },
                { label: '更新时间', value: formatOptionalDateTime(item.updated_at) },
              ]}
            />
          </Card>

          <section className="grid gap-4 xl:grid-cols-2">
            <Card className="grid gap-4 p-5">
              <h2 className="text-sm font-semibold">请求信息</h2>
              <DetailGrid items={[{ label: '请求地址', value: item.request_url ?? '未记录' }]} />
              <JsonBlock title="请求头" value={item.request_headers ?? null} />
              <JsonBlock title="请求正文" value={item.request_body ?? null} />
            </Card>

            <Card className="grid gap-4 p-5">
              <h2 className="text-sm font-semibold">响应信息</h2>
              <JsonBlock title="响应正文" value={item.response_body ?? null} />
            </Card>
          </section>

          <Card className="grid gap-4 p-5">
            <h2 className="text-sm font-semibold">链路信息</h2>
            <DetailGrid
              items={[
                { label: 'Trace ID', value: item.trace_id ?? '未记录' },
                { label: '会话 ID', value: item.conversation_id ?? '未生成' },
                { label: '运行 ID', value: item.run_id ?? '未生成' },
                { label: '外部会话', value: item.external_conversation_id ?? '未记录' },
                { label: '外部消息', value: item.external_message_id ?? '未记录' },
              ]}
            />
          </Card>
        </>
      )}
    </main>
  );
}

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="grid gap-2">
      <div className="text-sm font-semibold">{title}</div>
      <pre className="max-h-96 overflow-auto rounded-md border bg-slate-950 px-3 py-3 text-xs leading-6 text-slate-100">
        {value === null || value === undefined ? '无' : typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
