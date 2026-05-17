'use client';

import { useQuery } from '@tanstack/react-query';
import type {
  ApprovalAuditOverview,
  AuditEventSourceType,
  AuditEventStatus,
  AuditOverview,
  AuditWindow,
} from '@aiaget/shared-types';
import { AlertTriangle, ExternalLink, Search } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { auditSourceLabel, auditStatusLabel, auditStatusTone, formatDateTime, formatPercent } from '@/components/audit/audit-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { getApprovalAuditOverview, getAuditOverview, listAuditEvents } from '@/lib/api-client';

const windows: AuditWindow[] = ['24h', '7d'];
const sourceTypes: AuditEventSourceType[] = ['login', 'operation', 'approval_audit', 'billing'];
const statuses: AuditEventStatus[] = ['SUCCESS', 'DEGRADED', 'FAILED'];

export function AuditContent() {
  const searchParams = useSearchParams();
  const initialWindow = parseAuditWindow(searchParams.get('window'));
  const initialKeyword = searchParams.get('keyword') ?? '';
  const [windowValue, setWindowValue] = useState<AuditWindow>(initialWindow);
  const [sourceType, setSourceType] = useState('');
  const [statusValue, setStatusValue] = useState('');
  const [keyword, setKeyword] = useState(initialKeyword);

  const overviewQuery = useQuery({
    queryKey: ['audit-overview', windowValue],
    queryFn: () => getAuditOverview({ window: windowValue }),
  });

  const approvalAuditOverviewQuery = useQuery({
    queryKey: ['audit-approval-audit-overview', windowValue],
    queryFn: () => getApprovalAuditOverview({ window: windowValue }),
  });

  const eventsQuery = useQuery({
    queryKey: ['audit-events', windowValue, sourceType, statusValue, keyword],
    queryFn: () =>
      listAuditEvents({
        page: 1,
        page_size: 40,
        window: windowValue,
        source_type: sourceType,
        status: statusValue,
        keyword,
      }),
  });

  const events = eventsQuery.data?.items ?? [];
  const inheritedQuery = buildInheritedQuery(windowValue, keyword);

  const metrics = useMemo(() => {
    const summary = overviewQuery.data?.summary;
    if (!summary) return [];

    return [
      { label: '登录日志', value: `${summary.login_total}` },
      { label: '操作日志', value: `${summary.operation_total}` },
      { label: '计费事件', value: `${summary.billing_event_total}` },
      { label: '安全事件', value: `${summary.security_event_total}` },
      { label: '配置变更', value: `${summary.config_change_total}` },
      { label: '成功率', value: formatPercent(summary.success_rate) },
    ];
  }, [overviewQuery.data, windowValue]);

  return (
    <main className="mx-auto grid max-w-[1680px] gap-6 px-4 py-6 lg:px-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">登录</StatusBadge>
            <StatusBadge tone="healthy">操作</StatusBadge>
            <StatusBadge tone="planned">计费</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">审计中心</h1>
        </div>
        <Button
          onClick={() => {
            void overviewQuery.refetch();
            void approvalAuditOverviewQuery.refetch();
            void eventsQuery.refetch();
          }}
          type="button"
          variant="outline"
        >
          刷新数据
        </Button>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {metrics.map((metric) => (
          <MetricTile key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_0.8fr_1.4fr]">
        <RankingCard
          items={overviewQuery.data?.user_rankings.map((item) => ({
            title: item.user_email,
            value: `${item.event_count} 条`,
            helper: `${item.failure_count} 条失败`,
          })) ?? []}
          loading={overviewQuery.isLoading}
          title="高频用户"
        />
        <RankingCard
          items={overviewQuery.data?.module_rankings.map((item) => ({
            title: item.module,
            value: `${item.event_count} 条`,
            helper: `${item.failure_count} 条失败`,
          })) ?? []}
          loading={overviewQuery.isLoading}
          title="高频模块"
        />
        <FailureCard
          failures={overviewQuery.data?.failures ?? []}
          loading={overviewQuery.isLoading}
        />
      </section>

      <ApprovalAuditBridgeCard
        loading={approvalAuditOverviewQuery.isLoading}
        overview={approvalAuditOverviewQuery.data ?? null}
        windowValue={windowValue}
      />

      <section className="min-w-0">
        <Card className="min-w-0 rounded-xl border border-slate-200/80 bg-white/[0.9]">
          <div className="border-b p-4">
            <div className="grid gap-4">
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                <h2 className="text-sm font-semibold">统一审计事件流</h2>
                <div className="text-sm text-muted-foreground">
                  显示 {events.length} / {eventsQuery.data?.total ?? 0}
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_120px_120px_120px_auto]">
                <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
                  <Search className="size-4 text-muted-foreground" />
                  <input
                    className="min-w-0 flex-1 bg-transparent outline-none"
                    onChange={(event) => setKeyword(event.target.value)}
                    aria-label="搜索用户、模块、调账单号、机会名、客户名、链路 ID"
                    value={keyword}
                  />
                </label>
                <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setWindowValue(event.target.value as AuditWindow)} value={windowValue}>
                  {windows.map((windowItem) => (
                    <option key={windowItem} value={windowItem}>
                      {windowItem}
                    </option>
                  ))}
                </select>
                <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setSourceType(event.target.value)} value={sourceType}>
                  <option value="">全部来源</option>
                  {sourceTypes.map((source) => (
                    <option key={source} value={source}>
                      {auditSourceLabel(source)}
                    </option>
                  ))}
                </select>
                <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setStatusValue(event.target.value)} value={statusValue}>
                  <option value="">全部状态</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {auditStatusLabel(status)}
                    </option>
                  ))}
                </select>
                <Button onClick={() => {
                  setKeyword('');
                  setSourceType('');
                  setStatusValue('');
                  setWindowValue('24h');
                }} type="button" variant="outline">
                  清空
                </Button>
              </div>
            </div>
          </div>

          {eventsQuery.isError ? (
            <div className="p-6 text-sm text-destructive">审计事件加载失败。</div>
          ) : eventsQuery.isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">正在加载审计事件...</div>
          ) : events.length === 0 ? (
            <EmptyState title="暂无审计事件" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {['时间', '来源', '状态', '用户', '模块', '动作', '链路 ID', '摘要', '操作'].map((column) => (
                      <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr className="border-b transition-colors last:border-0 hover:bg-muted/25" key={event.event_id}>
                      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(event.occurred_at)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{auditSourceLabel(event.source_type)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={auditStatusTone(event.status)}>{auditStatusLabel(event.status)}</StatusBadge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{event.user_email}</td>
                      <td className="px-4 py-3 text-muted-foreground">{event.module ?? '-'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{event.action ?? '-'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{event.request_id ?? '-'}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{event.title}</div>
                        <div className="line-clamp-1 text-xs text-muted-foreground">{event.summary}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/audit/events/${event.event_id}${inheritedQuery}`}>
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
      </section>
    </main>
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
    <Card className="grid gap-4 rounded-xl border border-slate-200/80 bg-white/[0.9] p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载排行...</div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">暂无排行数据。</p>
      ) : (
        <div className="grid gap-3">
          {items.map((item, index) => (
            <div className="rounded-md border bg-muted/20 px-3 py-2" key={`${title}-${item.title}-${index}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium">{item.title}</div>
                <div className="text-sm font-semibold">{item.value}</div>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{item.helper}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function FailureCard({
  failures,
  loading,
}: {
  failures: AuditOverview['failures'];
  loading: boolean;
}) {
  return (
    <Card className="grid gap-4 rounded-xl border border-slate-200/80 bg-white/[0.9] p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <AlertTriangle className="size-4 text-amber-600" />
        最近失败
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载失败样本...</div>
      ) : failures.length === 0 ? (
        <EmptyState title="暂无失败事件" />
      ) : (
        <div className="grid gap-3">
          {failures.map((failure) => (
            <Link className="rounded-md border bg-muted/20 px-3 py-2 transition-colors hover:bg-muted/40" href={`/audit/events/${failure.event_id}`} key={failure.event_id}>
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium">{failure.title}</div>
                <span className="text-xs text-muted-foreground">{formatDateTime(failure.occurred_at)}</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{auditSourceLabel(failure.source_type)}</div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{failure.error_message}</p>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

function ApprovalAuditBridgeCard({
  loading,
  overview,
  windowValue,
}: {
  loading: boolean;
  overview: ApprovalAuditOverview | null;
  windowValue: AuditWindow;
}) {
  const summary = overview?.summary;
  const recentRiskEvents = overview?.recent_events.filter((event) => event.event_status !== 'SUCCESS').slice(0, 3) ?? [];

  return (
    <Card className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/[0.9]">
      <div className="grid gap-4 p-5 lg:grid-cols-[0.9fr_1.1fr_auto] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="planned">审批审计联动</StatusBadge>
          </div>
          <h2 className="mt-3 text-sm font-semibold">审批审计风险入口</h2>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">正在加载审批审计概况...</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <BridgeMetric label="审批事件" value={`${summary?.total_count ?? 0}`} helper={`${windowValue} 窗口`} />
            <BridgeMetric label="失败事件" value={`${summary?.failed_count ?? 0}`} helper="执行失败" />
            <BridgeMetric label="Trace 覆盖" value={`${summary?.trace_count ?? 0}`} helper="可追踪链路" />
          </div>
        )}

        <Button asChild className="w-full lg:w-auto" variant="outline">
          <Link href={`/approval-audits?window=${windowValue}`}>打开审批审计</Link>
        </Button>
      </div>

      <div className="border-t bg-muted/20 p-5">
        <div className="mb-3 text-xs font-medium text-muted-foreground">最近审批风险</div>
        {loading ? (
          <div className="text-sm text-muted-foreground">正在加载风险样本...</div>
        ) : recentRiskEvents.length === 0 ? (
          <div className="text-sm text-muted-foreground">当前窗口没有审批风险事件。</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {recentRiskEvents.map((event) => (
              <Link
                className="rounded-md border bg-background/80 px-3 py-2 transition-colors hover:bg-muted/40"
                href={`/approval-audits/events/${event.id}?window=${windowValue}`}
                key={event.id}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="line-clamp-1 text-sm font-medium">{event.title}</span>
                  <StatusBadge tone={event.event_status === 'FAILED' ? 'unavailable' : 'degraded'}>
                    {event.event_status === 'FAILED' ? '失败' : '告警'}
                  </StatusBadge>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">{formatDateTime(event.occurred_at)}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function BridgeMetric({ helper, label, value }: { helper: string; label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background/80 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{helper}</div>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/[0.9] px-4 py-3">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-2 text-xl font-semibold">{value}</div>
    </div>
  );
}

function parseAuditWindow(value: string | null): AuditWindow {
  return value === '7d' ? '7d' : '24h';
}

function buildInheritedQuery(windowValue: AuditWindow, keyword: string) {
  const params = new URLSearchParams();
  params.set('window', windowValue);
  if (keyword.trim()) params.set('keyword', keyword.trim());
  const query = params.toString();
  return query ? `?${query}` : '';
}
