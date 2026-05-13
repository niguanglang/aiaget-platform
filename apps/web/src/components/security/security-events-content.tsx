'use client';

import type {
  SecurityCenterEventListItem,
  SecurityCenterEventSource,
  SecurityCenterEventWindow,
} from '@aiaget/shared-types';
import { useQuery } from '@tanstack/react-query';
import { Activity, ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { SecurityPolicyBackground } from '@/components/security/security-policy-background';
import {
  LoadingRows,
  PageError,
  RefreshButton,
  SecurityWorkspaceHeader,
  formatDateTime,
  securityEventSourceLabel,
  securityRiskLevelLabel,
  securityRiskTone,
} from '@/components/security/security-page-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { listSecurityCenterEvents } from '@/lib/api-client';

const eventSources: Array<{ label: string; value: SecurityCenterEventSource }> = [
  { label: '数据权限', value: 'DATA_SCOPE' },
  { label: '资源授权', value: 'RESOURCE_ACL' },
  { label: '安全策略', value: 'SECURITY_POLICY' },
  { label: '操作拒绝', value: 'OPERATION' },
  { label: '审批工作台', value: 'APPROVAL_WORKBENCH' },
];
const eventWindows: Array<{ label: string; value: SecurityCenterEventWindow }> = [
  { label: '最近 1 小时', value: '1h' },
  { label: '最近 24 小时', value: '24h' },
  { label: '最近 7 天', value: '7d' },
  { label: '最近 30 天', value: '30d' },
];
const pageSize = 20;

export function SecurityEventsContent() {
  const [keyword, setKeyword] = useState('');
  const [source, setSource] = useState<SecurityCenterEventSource | ''>('');
  const [windowValue, setWindowValue] = useState<SecurityCenterEventWindow>('24h');
  const [traceOnly, setTraceOnly] = useState(false);
  const [page, setPage] = useState(1);

  const eventsQuery = useQuery({
    queryKey: ['security-events-page-list', keyword, source, windowValue, traceOnly, page],
    queryFn: () =>
      listSecurityCenterEvents({
        page,
        page_size: pageSize,
        keyword,
        source,
        trace_only: traceOnly,
        window: windowValue,
      }),
  });

  const events = eventsQuery.data?.items ?? [];
  const total = eventsQuery.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const tracedCount = events.filter((event) => event.has_trace).length;

  function resetFilters() {
    setKeyword('');
    setSource('');
    setWindowValue('24h');
    setTraceOnly(false);
    setPage(1);
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <SecurityPolicyBackground />

      <SecurityWorkspaceHeader
        actions={
          <RefreshButton loading={eventsQuery.isFetching} onClick={() => {
            void eventsQuery.refetch();
          }} />
	        }
	        badge="Trace"
	        title="安全事件"
	      />

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard helper={`${windowValue} 窗口`} label="事件总数" value={`${total}`} />
	        <MetricCard helper="Trace" label="Trace 事件" value={`${tracedCount}`} />
	        <MetricCard helper={traceOnly ? 'Trace' : '全部'} label="筛选模式" value={traceOnly ? 'Trace' : '全部'} />
      </section>

      <section className="grid gap-4">
        <Card className="min-w-0 overflow-hidden">
          <div className="border-b p-4">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="size-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold">事件列表</h2>
                </div>
	                <p className="mt-1 text-sm text-muted-foreground">{total} 条安全事件</p>
              </div>
              <Button disabled={!keyword && !source && !traceOnly && windowValue === '24h'} onClick={resetFilters} type="button" variant="outline">
                清空筛选
              </Button>
            </div>

            <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_180px_150px_auto]">
              <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
                <Search className="size-4 shrink-0 text-muted-foreground" />
                <input
                  className="min-w-0 flex-1 bg-transparent outline-none"
                  onChange={(event) => {
                    setKeyword(event.target.value);
                    setPage(1);
                  }}
                  placeholder="搜索标题、原因、request_id、trace_id"
                  value={keyword}
                />
              </label>
              <select
                className="h-9 rounded-md border bg-background/80 px-3 text-sm"
                onChange={(event) => {
                  setSource(event.target.value as SecurityCenterEventSource | '');
                  setPage(1);
                }}
                value={source}
              >
                <option value="">全部来源</option>
                {eventSources.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
              <select
                className="h-9 rounded-md border bg-background/80 px-3 text-sm"
                onChange={(event) => {
                  setWindowValue(event.target.value as SecurityCenterEventWindow);
                  setPage(1);
                }}
                value={windowValue}
              >
                {eventWindows.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
              <label className="flex h-9 items-center gap-2 rounded-md border bg-background/80 px-3 text-sm">
                <input
                  checked={traceOnly}
                  className="size-4"
                  onChange={(event) => {
                    setTraceOnly(event.target.checked);
                    setPage(1);
                  }}
                  type="checkbox"
                />
                仅 Trace
              </label>
            </div>
          </div>

          {eventsQuery.isError ? (
            <div className="p-4"><PageError>安全事件加载失败。</PageError></div>
          ) : eventsQuery.isLoading ? (
            <LoadingRows count={6} />
          ) : events.length === 0 ? (
	            <EmptyState title="暂无事件" />
          ) : (
            <div className="divide-y">
              {events.map((event) => (
                <SecurityEventRow
                  event={event}
                  key={event.id}
                />
              ))}
            </div>
          )}

          <div className="flex flex-col justify-between gap-3 border-t p-4 text-sm text-muted-foreground sm:flex-row sm:items-center">
            <span>第 {page} / {pageCount} 页</span>
            <div className="flex gap-2">
              <Button disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} size="sm" type="button" variant="outline">
                上一页
              </Button>
              <Button disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} size="sm" type="button" variant="outline">
                下一页
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}

function SecurityEventRow({
  event,
}: {
  event: SecurityCenterEventListItem;
}) {
  return (
    <Link
      className="grid w-full gap-3 p-4 text-left transition-colors hover:bg-muted/40 xl:grid-cols-[1fr_170px_150px_110px] xl:items-center"
      href={`/security/events/${encodeURIComponent(event.id)}`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={securityRiskTone(event.severity)}>{securityRiskLevelLabel(event.severity)}</StatusBadge>
          <StatusBadge tone="planned">{securityEventSourceLabel(event.source)}</StatusBadge>
          {event.has_trace ? <StatusBadge tone="mock">Trace</StatusBadge> : null}
          <span className="font-medium">{event.title}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{event.reason}</p>
        <p className="mt-1 break-all text-xs text-muted-foreground">
          {event.method} {event.path} · request_id {event.request_id}
        </p>
        <SecurityEventFieldLedgerChips event={event} />
      </div>
      <div className="text-sm text-muted-foreground">资源：{event.resource_type ?? '暂无'}</div>
      <div className="text-sm text-muted-foreground">{formatDateTime(event.occurred_at)}</div>
      <div className="flex items-center gap-2 text-sm text-primary">
        详情
          <ArrowRight className="size-4" />
      </div>
    </Link>
  );
}

function SecurityEventFieldLedgerChips({ event }: { event: SecurityCenterEventListItem }) {
  if (event.has_export_field_ledger !== true) return null;

  const chips = [
    { label: '字段账本', value: '已保留' },
    typeof event.exported_field_count === 'number' && event.exported_field_count > 0
      ? { label: '导出字段', value: `${event.exported_field_count} 项` }
      : null,
    typeof event.notification_archive_filter_field_count === 'number' && event.notification_archive_filter_field_count > 0
      ? { label: '归档筛选字段', value: `${event.notification_archive_filter_field_count} 项` }
      : null,
  ].filter((chip): chip is { label: string; value: string } => Boolean(chip));

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <span className="rounded-md border bg-background/80 px-2 py-1 text-xs text-muted-foreground" key={chip.label}>
          {chip.label}：{chip.value}
        </span>
      ))}
    </div>
  );
}
