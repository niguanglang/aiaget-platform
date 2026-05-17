'use client';

import { useQuery } from '@tanstack/react-query';
import type { ApprovalAuditEventStatus, ApprovalAuditEventType, ApprovalAuditSourceType, ApprovalAuditWindow } from '@aiaget/shared-types';
import { Archive, ExternalLink, FilePlus2, RefreshCw, Search } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import {
  approvalAuditEventStatuses,
  approvalAuditEventTypeLabel,
  approvalAuditEventTypes,
  ApprovalAuditPageShell,
  approvalAuditSourceLabel,
  approvalAuditSourceTypes,
  approvalAuditStatusLabel,
  ApprovalAuditSummaryTile,
  approvalAuditTone,
  approvalAuditWindows,
  formatDateTime,
  normalizeApprovalAuditWindow,
} from '@/components/approval-audits/approval-audit-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { getApprovalAuditOverview, listApprovalAuditEvents } from '@/lib/api-client';

export function ApprovalAuditContent() {
  const searchParams = useSearchParams();
  const [windowValue, setWindowValue] = useState<ApprovalAuditWindow>(
    normalizeApprovalAuditWindow(searchParams.get('window')),
  );
  const [keyword, setKeyword] = useState(searchParams.get('keyword') ?? '');
  const [sourceType, setSourceType] = useState<ApprovalAuditSourceType | ''>(
    normalizeSourceType(searchParams.get('source')),
  );
  const [eventType, setEventType] = useState<ApprovalAuditEventType | ''>(normalizeEventType(searchParams.get('type')));
  const [eventStatus, setEventStatus] = useState<ApprovalAuditEventStatus | ''>(
    normalizeEventStatus(searchParams.get('status')),
  );
  const [traceOnly, setTraceOnly] = useState(searchParams.get('traceOnly') === 'true');

  const overviewQuery = useQuery({
    queryKey: ['approval-audit-overview', windowValue],
    queryFn: () => getApprovalAuditOverview({ window: windowValue }),
  });

  const eventsQuery = useQuery({
    queryKey: ['approval-audit-events', windowValue, keyword, sourceType, eventType, eventStatus, traceOnly],
    queryFn: () =>
      listApprovalAuditEvents({
        page: 1,
        page_size: 50,
        window: windowValue,
        keyword,
        source_type: sourceType,
        event_type: eventType,
        event_status: eventStatus,
        trace_only: traceOnly,
      }),
  });

  const events = eventsQuery.data?.items ?? [];

  const metrics = useMemo(() => {
    const summary = overviewQuery.data?.summary;
    if (!summary) return [];

    return [
      { label: '审计事件', value: `${summary.total_count}` },
      { label: '成功事件', value: `${summary.success_count}` },
      { label: '失败事件', value: `${summary.failed_count}` },
      { label: '告警事件', value: `${summary.warning_count}` },
      { label: 'Trace 覆盖', value: `${summary.trace_count}` },
    ];
  }, [overviewQuery.data, windowValue]);

  return (
    <ApprovalAuditPageShell>
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="healthy">审批审计</StatusBadge>
            <StatusBadge tone="planned">事件追踪</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">审批审计</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/approval-audits/archives">
              <Archive className="size-4" />
              归档中心
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/approval-audits/archives/create">
              <FilePlus2 className="size-4" />
              生成归档
            </Link>
          </Button>
          <Button
            onClick={() => {
              void overviewQuery.refetch();
              void eventsQuery.refetch();
            }}
            type="button"
            variant="outline"
          >
            <RefreshCw className="size-4" />
            刷新数据
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <ApprovalAuditSummaryTile key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <RankingCard
          items={overviewQuery.data?.source_rankings.map((item) => ({
            title: approvalAuditSourceLabel(item.source_type),
            value: `${item.event_count} 条`,
            helper: `${item.failed_count} 条失败`,
          })) ?? []}
          loading={overviewQuery.isLoading}
          title="来源分布"
        />
        <RankingCard
          items={overviewQuery.data?.event_type_rankings.map((item) => ({
            title: approvalAuditEventTypeLabel(item.event_type),
            value: `${item.event_count} 条`,
            helper: `${item.failed_count} 条失败`,
          })) ?? []}
          loading={overviewQuery.isLoading}
          title="事件类型排行"
        />
      </section>

      <Card className="min-w-0">
        <div className="border-b p-4">
          <div className="grid gap-4">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-sm font-semibold">审批审计事件</h2>
              </div>
              <div className="text-sm text-muted-foreground">
                显示 {events.length} / {eventsQuery.data?.total ?? 0}
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_100px_150px_150px_120px_auto]">
              <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
                <Search className="size-4 text-muted-foreground" />
                <input
                  className="min-w-0 flex-1 bg-transparent outline-none"
                  onChange={(event) => setKeyword(event.target.value)}
                  value={keyword}
                />
              </label>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setWindowValue(event.target.value as ApprovalAuditWindow)} value={windowValue}>
                {approvalAuditWindows.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setSourceType(event.target.value as ApprovalAuditSourceType | '')} value={sourceType}>
                <option value="">全部来源</option>
                {approvalAuditSourceTypes.map((item) => <option key={item} value={item}>{approvalAuditSourceLabel(item)}</option>)}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setEventType(event.target.value as ApprovalAuditEventType | '')} value={eventType}>
                <option value="">全部类型</option>
                {approvalAuditEventTypes.map((item) => <option key={item} value={item}>{approvalAuditEventTypeLabel(item)}</option>)}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setEventStatus(event.target.value as ApprovalAuditEventStatus | '')} value={eventStatus}>
                <option value="">全部状态</option>
                {approvalAuditEventStatuses.map((item) => <option key={item} value={item}>{approvalAuditStatusLabel(item)}</option>)}
              </select>
              <Button onClick={() => {
                setKeyword('');
                setSourceType('');
                setEventType('');
                setEventStatus('');
                setTraceOnly(false);
                setWindowValue('24h');
              }} type="button" variant="outline">
                清空
              </Button>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input checked={traceOnly} onChange={(event) => setTraceOnly(event.target.checked)} type="checkbox" />
              只看带 Trace 的事件
            </label>
          </div>
        </div>

        {eventsQuery.isError ? (
          <div className="p-6 text-sm text-destructive">审批审计事件加载失败。</div>
        ) : eventsQuery.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">正在加载审批审计事件...</div>
        ) : events.length === 0 ? (
          <EmptyState title="暂无审批审计事件" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {['时间', '来源', '事件', '状态', '操作人', 'Trace ID', '请求 ID', '备注', '操作'].map((column) => (
                    <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr className="border-b transition-colors last:border-0 hover:bg-muted/25" key={event.id}>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(event.occurred_at)}</td>
                    <td className="px-4 py-3">{approvalAuditSourceLabel(event.source_type)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{event.title}</div>
                      <div className="text-xs text-muted-foreground">{approvalAuditEventTypeLabel(event.event_type)}</div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge tone={approvalAuditTone(event.event_status)}>{approvalAuditStatusLabel(event.event_status)}</StatusBadge></td>
                    <td className="px-4 py-3 text-muted-foreground">{event.actor?.email ?? '系统'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{event.trace_id ?? '-'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{event.request_id ?? '-'}</td>
                    <td className="px-4 py-3"><div className="line-clamp-1 max-w-xs text-muted-foreground">{event.note ?? '-'}</div></td>
                    <td className="px-4 py-3">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/approval-audits/events/${event.id}${buildListQuery(windowValue, keyword)}`}>
                          <ExternalLink className="size-3.5" />
                          查看详情
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </ApprovalAuditPageShell>
  );
}

function RankingCard({
  items,
  loading,
  title,
}: {
  items: Array<{ title: string; value: string; helper: string }>;
  loading: boolean;
  title: string;
}) {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">正在加载...</p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">暂无数据。</p>
      ) : (
        <div className="mt-4 grid gap-3">
          {items.map((item) => (
            <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/20 px-3 py-2" key={item.title}>
              <div>
                <div className="text-sm font-medium">{item.title}</div>
                <div className="text-xs text-muted-foreground">{item.helper}</div>
              </div>
              <div className="text-sm font-semibold">{item.value}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function normalizeSourceType(value: string | null): ApprovalAuditSourceType | '' {
  return approvalAuditSourceTypes.includes(value as ApprovalAuditSourceType) ? value as ApprovalAuditSourceType : '';
}

function normalizeEventType(value: string | null): ApprovalAuditEventType | '' {
  return approvalAuditEventTypes.includes(value as ApprovalAuditEventType) ? value as ApprovalAuditEventType : '';
}

function normalizeEventStatus(value: string | null): ApprovalAuditEventStatus | '' {
  return approvalAuditEventStatuses.includes(value as ApprovalAuditEventStatus) ? value as ApprovalAuditEventStatus : '';
}

function buildListQuery(windowValue: ApprovalAuditWindow, keyword: string) {
  const params = new URLSearchParams();
  params.set('window', windowValue);
  if (keyword.trim()) params.set('keyword', keyword.trim());
  const query = params.toString();
  return query ? `?${query}` : '';
}
