'use client';

import type { WebhookDeliveryListItem } from '@aiaget/shared-types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Copy, RefreshCw, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';

import { formatDateTime } from '@/components/agents/agent-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { listTenantApiKeys, listWebhookDeliveries, retryWebhookDelivery, type ApiClientError } from '@/lib/api-client';

import { ConfirmDialog, ErrorBanner, NoticeBanner, average, formatLatency, formatWebhookTarget, isNumber, useCanManageApiKeys, webhookDeliveryLabel, webhookDeliveryTone } from './api-key-shared';

type WebhookRetryTarget = {
  apiKeyName: string;
  deliveryId: string;
  targetUrl: string;
};

export function WebhookDeliveriesContent() {
  const canManageApiKeys = useCanManageApiKeys();
  const [deliveryFilterKeyId, setDeliveryFilterKeyId] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [webhookRetryTarget, setWebhookRetryTarget] = useState<WebhookRetryTarget | null>(null);

  const apiKeysQuery = useQuery({ queryKey: ['tenant-api-keys'], queryFn: listTenantApiKeys });
  const webhookDeliveriesQuery = useQuery({
    queryKey: ['webhook-deliveries', deliveryFilterKeyId],
    queryFn: () => listWebhookDeliveries({ api_key_id: deliveryFilterKeyId || undefined }),
  });

  const retryMutation = useMutation({
    mutationFn: retryWebhookDelivery,
    onSuccess: async () => {
      setNotice('Webhook 投递已重新发送。');
      setErrorMessage(null);
      setWebhookRetryTarget(null);
      await webhookDeliveriesQuery.refetch();
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setErrorMessage(error.message);
    },
  });

  const apiKeys = apiKeysQuery.data ?? [];
  const deliveries = webhookDeliveriesQuery.data?.items ?? [];
  const metrics = useMemo(() => {
    const successCount = deliveries.filter((item) => item.status === 'SUCCESS').length;
    const failedCount = deliveries.filter((item) => item.status === 'FAILED').length;
    const retryingCount = deliveries.filter((item) => item.status === 'RETRYING').length;
    const averageLatency = average(deliveries.map((item) => item.latency_ms).filter(isNumber));
    return [
      { label: '投递总数', value: `${webhookDeliveriesQuery.data?.total ?? 0}`, helper: '最近投递记录' },
      { label: '成功投递', value: `${successCount}`, helper: '状态 SUCCESS' },
      { label: '失败投递', value: `${failedCount}`, helper: '可重试记录' },
      { label: '重试中', value: `${retryingCount}`, helper: '最近一次重试' },
      { label: '平均耗时', value: formatLatency(averageLatency), helper: '响应和网络耗时' },
    ];
  }, [deliveries, webhookDeliveriesQuery.data?.total]);

  async function copyText(value: string, message: string) {
    try {
      await navigator.clipboard?.writeText(value);
      setNotice(message);
      setErrorMessage(null);
    } catch {
      setNotice(null);
      setErrorMessage('复制失败，请手动选中文本复制。');
    }
  }

  function confirmWebhookRetry() {
    if (!webhookRetryTarget) return;
    retryMutation.mutate(webhookRetryTarget.deliveryId);
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2"><StatusBadge tone="healthy">Webhook 投递日志</StatusBadge><StatusBadge tone={canManageApiKeys ? 'mock' : 'planned'}>{canManageApiKeys ? '可重试' : '只读'}</StatusBadge></div>
          <h1 className="text-2xl font-semibold">Webhook 投递日志</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="h-9 rounded-md border bg-background px-3 text-sm" onChange={(event) => setDeliveryFilterKeyId(event.target.value)} value={deliveryFilterKeyId}>
            <option value="">全部 API Key</option>
            {apiKeys.map((apiKey) => <option key={apiKey.id} value={apiKey.id}>{apiKey.name}</option>)}
          </select>
          <Button onClick={() => void webhookDeliveriesQuery.refetch()} type="button" variant="outline"><RefreshCw className="size-4" />刷新日志</Button>
          <Button asChild type="button" variant="outline"><a href="/api-keys">返回列表</a></Button>
        </div>
      </section>

      <NoticeBanner message={notice} />
      <ErrorBanner message={errorMessage ?? (webhookDeliveriesQuery.isError || apiKeysQuery.isError ? 'Webhook 投递记录加载失败。' : null)} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {webhookDeliveriesQuery.isLoading ? Array.from({ length: 5 }).map((_, index) => <div className="h-24 rounded-lg border bg-muted/30" key={index} />) : metrics.map((metric) => <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />)}
      </section>

      <Card className="grid gap-4 p-5">
        <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold">最近投递</h2><StatusBadge tone="mock">{webhookDeliveriesQuery.data?.total ?? 0} 条</StatusBadge></div>
        {webhookDeliveriesQuery.isLoading ? <div className="grid gap-3">{Array.from({ length: 4 }).map((_, index) => <div className="h-28 rounded-md border bg-muted/30" key={index} />)}</div> : deliveries.length === 0 ? <EmptyState description="暂无记录。" title="暂无投递日志" /> : (
          <div className="grid gap-3">
            {deliveries.map((item) => (
              <WebhookDeliveryRow
                canManage={canManageApiKeys}
                item={item}
                key={item.id}
                onCopy={copyText}
                onRetry={() => setWebhookRetryTarget({ apiKeyName: item.api_key_name, deliveryId: item.delivery_id, targetUrl: item.target_url })}
              />
            ))}
          </div>
        )}
      </Card>
      {webhookRetryTarget ? (
        <ConfirmDialog
          body={`确认重试 Webhook 投递「${webhookRetryTarget.deliveryId}」？系统会再次向 ${formatWebhookTarget(webhookRetryTarget.targetUrl)} 发送 ${webhookRetryTarget.apiKeyName} 的回调内容，并刷新投递日志。`}
          onCancel={() => setWebhookRetryTarget(null)}
          onConfirm={confirmWebhookRetry}
          pending={retryMutation.isPending}
          title="确认重试 Webhook 投递"
        />
      ) : null}
    </main>
  );
}

function WebhookDeliveryRow({ item, canManage, onCopy, onRetry }: { item: WebhookDeliveryListItem; canManage: boolean; onCopy: (value: string, message: string) => void; onRetry: () => void }) {
  return (
    <div className="grid gap-3 rounded-md border bg-background/90 p-4 text-left shadow-sm transition-colors hover:bg-muted/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <a className="min-w-0 flex-1" href={`/api-keys/webhook-deliveries/${encodeURIComponent(item.delivery_id)}`}>
          <div className="flex flex-wrap items-center gap-2"><StatusBadge tone={webhookDeliveryTone(item.status)}>{webhookDeliveryLabel(item.status)}</StatusBadge><span className="text-sm font-semibold">{item.api_key_name}</span><span className="font-mono text-xs text-muted-foreground">{item.response_status ?? '无响应码'}</span></div>
          <div className="mt-2 grid gap-1 text-xs text-muted-foreground md:grid-cols-2"><span>投递 ID：{item.delivery_id}</span><span>父级：{item.parent_delivery_id ?? '无'}</span><span>事件：{item.event}</span><span>目标：{formatWebhookTarget(item.target_url)}</span><span>投递时间：{formatDateTime(item.delivered_at ?? item.created_at)}</span><span>创建：{formatDateTime(item.created_at)}</span></div>
          {item.error_message ? <div className="mt-2 line-clamp-2 text-xs text-destructive">{item.error_message}</div> : null}
        </a>
        <div className="flex shrink-0 flex-col items-end gap-2"><div className="flex flex-wrap gap-2"><StatusBadge tone="mock">{formatLatency(item.latency_ms)}</StatusBadge><StatusBadge tone="mock">重试 {item.retry_count} 次</StatusBadge></div><div className="flex flex-wrap justify-end gap-2"><Button onClick={() => onCopy(item.delivery_id, '投递 ID 已复制。')} size="sm" type="button" variant="outline"><Copy className="size-4" />复制</Button><Button disabled={!canManage || item.status !== 'FAILED'} onClick={onRetry} size="sm" type="button" variant="outline"><RotateCcw className="size-4" />重试</Button></div></div>
      </div>
    </div>
  );
}
