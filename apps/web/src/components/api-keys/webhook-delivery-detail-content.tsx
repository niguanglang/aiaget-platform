'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { Copy, RotateCcw } from 'lucide-react';
import { useState } from 'react';

import { formatDateTime } from '@/components/agents/agent-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { getWebhookDelivery, retryWebhookDelivery, type ApiClientError } from '@/lib/api-client';

import { ConfirmDialog, DetailRow, ErrorBanner, NoticeBanner, formatLatency, formatWebhookTarget, stringifyPretty, useCanManageApiKeys, webhookDeliveryLabel, webhookDeliveryTone } from './api-key-shared';

type WebhookRetryTarget = {
  apiKeyName: string;
  deliveryId: string;
  targetUrl: string;
};

export function WebhookDeliveryDetailContent({ deliveryId }: { deliveryId: string }) {
  const canManageApiKeys = useCanManageApiKeys();
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [webhookRetryTarget, setWebhookRetryTarget] = useState<WebhookRetryTarget | null>(null);

  const selectedDeliveryQuery = useQuery({
    queryKey: ['webhook-delivery', deliveryId],
    queryFn: () => getWebhookDelivery(deliveryId),
    enabled: Boolean(deliveryId),
  });

  const retryMutation = useMutation({
    mutationFn: retryWebhookDelivery,
    onSuccess: async () => {
      setNotice('Webhook 投递已重新发送。');
      setErrorMessage(null);
      setWebhookRetryTarget(null);
      await selectedDeliveryQuery.refetch();
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setErrorMessage(error.message);
    },
  });

  const item = selectedDeliveryQuery.data ?? null;

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
          <div className="mb-2 flex flex-wrap items-center gap-2"><StatusBadge tone="healthy">Webhook 投递详情</StatusBadge>{item ? <StatusBadge tone={webhookDeliveryTone(item.status)}>{webhookDeliveryLabel(item.status)}</StatusBadge> : null}</div>
          <h1 className="text-2xl font-semibold">Webhook 投递详情</h1>
          <p className="mt-2 max-w-3xl break-all text-sm leading-6 text-muted-foreground">投递 ID：{deliveryId}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild type="button" variant="outline"><a href="/api-keys/webhook-deliveries">返回投递列表</a></Button>
          <Button asChild type="button" variant="outline"><a href="/api-keys">返回密钥列表</a></Button>
        </div>
      </section>

      <NoticeBanner message={notice} />
      <ErrorBanner message={errorMessage ?? (selectedDeliveryQuery.isError ? '投递详情加载失败。' : null)} />

      {selectedDeliveryQuery.isLoading ? (
        <div className="grid gap-3"><div className="h-32 rounded-md border bg-muted/30" /><div className="h-64 rounded-md border bg-muted/30" /></div>
      ) : item ? (
        <Card className="grid gap-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="text-sm font-semibold">投递元数据</h2><p className="mt-1 text-sm text-muted-foreground">请求头、payload、响应正文和重试链路。</p></div>
            <div className="flex flex-wrap gap-2"><Button onClick={() => void copyText(item.delivery_id, '投递 ID 已复制。')} type="button" variant="outline"><Copy className="size-4" />复制 ID</Button><Button disabled={!canManageApiKeys || item.status !== 'FAILED'} onClick={() => setWebhookRetryTarget({ apiKeyName: item.api_key_name, deliveryId: item.delivery_id, targetUrl: item.target_url })} type="button" variant="outline"><RotateCcw className="size-4" />重试失败投递</Button></div>
          </div>

          <div className="grid gap-2 rounded-md border bg-muted/20 p-3 text-xs md:grid-cols-2 xl:grid-cols-3">
            <DetailRow label="投递 ID" value={item.delivery_id} />
            <DetailRow label="父级投递 ID" value={item.parent_delivery_id ?? '无'} />
            <DetailRow label="API Key" value={`${item.api_key_name} / ${item.api_key_prefix}`} />
            <DetailRow label="事件类型" value={item.event} />
            <DetailRow label="目标地址" value={formatWebhookTarget(item.target_url)} />
            <DetailRow label="投递状态" value={webhookDeliveryLabel(item.status)} />
            <DetailRow label="响应状态码" value={item.response_status === null ? '无' : `${item.response_status}`} />
            <DetailRow label="耗时" value={formatLatency(item.latency_ms)} />
            <DetailRow label="重试次数" value={`${item.retry_count}`} />
            <DetailRow label="投递时间" value={formatDateTime(item.delivered_at ?? item.created_at)} />
            <DetailRow label="更新时间" value={formatDateTime(item.updated_at)} />
          </div>

          <CodeBlock title="请求头" value={stringifyPretty(item.request_headers)} />
          <CodeBlock title="Payload" value={stringifyPretty(item.payload)} />
          <CodeBlock title="响应正文" value={item.response_body ?? '无响应正文'} />
          {item.error_message ? <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{item.error_message}</div> : null}
        </Card>
      ) : <EmptyState description="未找到该 Webhook 投递记录。" title="详情不可用" />}
      {webhookRetryTarget ? (
        <ConfirmDialog
          body={`确认重试 Webhook 投递「${webhookRetryTarget.deliveryId}」？系统会再次向 ${formatWebhookTarget(webhookRetryTarget.targetUrl)} 发送 ${webhookRetryTarget.apiKeyName} 的回调内容，并刷新投递详情。`}
          onCancel={() => setWebhookRetryTarget(null)}
          onConfirm={confirmWebhookRetry}
          pending={retryMutation.isPending}
          title="确认重试 Webhook 投递"
        />
      ) : null}
    </main>
  );
}

function CodeBlock({ title, value }: { title: string; value: string }) {
  return <div className="grid gap-2"><div className="text-sm font-semibold">{title}</div><pre className="max-h-72 overflow-auto rounded-md border bg-slate-950 px-3 py-3 text-xs leading-6 text-slate-100">{value}</pre></div>;
}
