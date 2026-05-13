'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, GitBranch, LinkIcon, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { AuditCenterBackground } from '@/components/audit/audit-center-background';
import { auditSourceLabel, auditStatusLabel, auditStatusTone, formatDateTime } from '@/components/audit/audit-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { getAuditEvent } from '@/lib/api-client';

export function AuditEventDetailContent({
  eventId,
  keyword,
  windowValue,
}: {
  eventId: string;
  keyword?: string;
  windowValue?: string;
}) {
  const eventQuery = useQuery({
    enabled: Boolean(eventId),
    queryKey: ['audit-event', eventId],
    queryFn: () => getAuditEvent(eventId),
  });
  const event = eventQuery.data ?? null;
  const backHref = buildAuditBackHref(windowValue, keyword);

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <AuditCenterBackground />

      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4" variant="outline">
            <Link href={backHref}>
              <ArrowLeft className="size-4" />
              返回审计列表
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">事件详情</StatusBadge>
            <StatusBadge tone="planned">独立路由</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">审计事件详情</h1>
        </div>
        <Button disabled={eventQuery.isFetching} onClick={() => void eventQuery.refetch()} type="button" variant="outline">
          <RefreshCw className="size-4" />
          刷新详情
        </Button>
      </section>

      {eventQuery.isError ? (
        <Card className="p-6">
          <EmptyState description="审计事件详情加载失败，请稍后重试或返回列表重新进入。" title="详情加载失败" />
        </Card>
      ) : eventQuery.isLoading ? (
        <Card className="p-6 text-sm text-muted-foreground">正在加载事件详情...</Card>
      ) : !event ? (
        <Card className="p-6">
          <EmptyState description="当前事件不存在或已超出可查询范围。" title="未找到审计事件" />
        </Card>
      ) : (
        <>
          <Card className="grid gap-5 p-5">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={auditStatusTone(event.status)}>{auditStatusLabel(event.status)}</StatusBadge>
                  <StatusBadge tone="planned">{auditSourceLabel(event.source_type)}</StatusBadge>
                </div>
                <h2 className="mt-3 text-xl font-semibold">{event.title}</h2>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">{event.summary}</p>
              </div>
              <div className="rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                事件 ID
                <div className="mt-1 font-mono text-sm text-foreground">{event.event_id}</div>
              </div>
            </div>
          </Card>

          <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <Card className="grid gap-4 p-5">
              <SectionTitle title="基础信息" />
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailRow label="发生时间" value={formatDateTime(event.occurred_at)} />
                <DetailRow label="用户" value={event.user_email} />
                <DetailRow label="模块" value={event.module ?? '-'} />
                <DetailRow label="动作" value={event.action ?? '-'} />
                <DetailRow label="来源" value={auditSourceLabel(event.source_type)} />
                <DetailRow label="状态" value={auditStatusLabel(event.status)} />
              </div>
            </Card>

            <Card className="grid gap-4 p-5">
              <SectionTitle title="请求上下文" />
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailRow label="请求 ID / Trace" value={event.request_id ?? '-'} />
                <DetailRow label="IP 地址" value={event.ip ?? '-'} />
                <DetailRow label="请求方法" value={event.method ?? '-'} />
                <DetailRow label="请求路径" value={event.path ?? '-'} />
                <DetailRow label="状态码" value={event.status_code?.toString() ?? '-'} />
                <DetailRow label="客户端标识" value={event.user_agent ?? '-'} />
              </div>
              {event.error_message ? (
                <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {event.error_message}
                </div>
              ) : null}
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
            <Card className="grid gap-4 p-5">
              <SectionTitle title="Trace 与主体" />
              <div className="grid gap-3">
                <TraceRow icon={<GitBranch className="size-4" />} label="Trace 入口" value={event.request_id ?? '暂无 Trace ID'} />
                <TraceRow icon={<LinkIcon className="size-4" />} label="主体" value={`${event.user_email} / ${event.module ?? '未归属模块'}`} />
                <TraceRow icon={<LinkIcon className="size-4" />} label="关联检索" value={event.request_id ? '可按请求 ID 返回列表继续检索' : '当前事件暂无请求 ID'} />
              </div>
              <Button asChild variant="outline">
                <Link href={event.request_id ? `/audit?keyword=${encodeURIComponent(event.request_id)}&window=${encodeURIComponent(windowValue ?? '24h')}` : backHref}>
                  查看关联事件
                </Link>
              </Button>
            </Card>

            <JsonCard title="详情 JSON" value={event.request_summary} />
          </section>

          <Card className="grid gap-4 p-5">
            <SectionTitle title="时间线 / 关联入口" />
            <div className="grid gap-3 md:grid-cols-3">
              <TimelineItem helper={event.user_email} title="主体发起" value={formatDateTime(event.occurred_at)} />
              <TimelineItem helper={`${event.method ?? '-'} ${event.path ?? '-'}`} title="请求处理" value={event.status_code?.toString() ?? '-'} />
              <TimelineItem helper={event.error_message ?? '无错误信息'} title="审计记录" value={auditStatusLabel(event.status)} />
            </div>
          </Card>
        </>
      )}
    </main>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="text-sm font-semibold">{title}</h2>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-md border bg-muted/20 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="break-words text-sm font-medium">{value}</div>
    </div>
  );
}

function TraceRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-3 rounded-md border bg-muted/20 px-3 py-2">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="break-words text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

function JsonCard({ title, value }: { title: string; value: unknown }) {
  return (
    <Card className="grid gap-3 bg-slate-950 p-5">
      <div className="text-sm font-semibold text-slate-100">{title}</div>
      <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-slate-100">
        {JSON.stringify(value ?? null, null, 2)}
      </pre>
    </Card>
  );
}

function TimelineItem({ helper, title, value }: { helper: string; title: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/20 px-3 py-2">
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{value}</div>
      <div className="mt-2 line-clamp-2 text-sm text-muted-foreground">{helper}</div>
    </div>
  );
}

function buildAuditBackHref(windowValue: string | undefined, keyword: string | undefined) {
  const params = new URLSearchParams();
  if (windowValue) params.set('window', windowValue);
  if (keyword) params.set('keyword', keyword);
  const query = params.toString();
  return query ? `/audit?${query}` : '/audit';
}
