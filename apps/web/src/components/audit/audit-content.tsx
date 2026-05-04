'use client';

import { useQuery } from '@tanstack/react-query';
import type {
  ApprovalAuditOverview,
  AuditEventDetail,
  AuditEventSourceType,
  AuditEventStatus,
  AuditOverview,
  AuditWindow,
} from '@aiaget/shared-types';
import { motion } from 'motion/react';
import { AlertTriangle, Search } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { AuditCenterBackground } from '@/components/audit/audit-center-background';
import { auditSourceLabel, auditStatusLabel, auditStatusTone, formatDateTime, formatPercent } from '@/components/audit/audit-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { getApprovalAuditOverview, getAuditEvent, getAuditOverview, listAuditEvents } from '@/lib/api-client';

const windows: AuditWindow[] = ['24h', '7d'];
const sourceTypes: AuditEventSourceType[] = ['login', 'operation', 'approval_audit'];
const statuses: AuditEventStatus[] = ['SUCCESS', 'DEGRADED', 'FAILED'];

export function AuditContent() {
  const [windowValue, setWindowValue] = useState<AuditWindow>('24h');
  const [sourceType, setSourceType] = useState('');
  const [statusValue, setStatusValue] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

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
  const activeEventId = selectedEventId ?? events[0]?.event_id ?? null;

  const selectedEventQuery = useQuery({
    enabled: Boolean(activeEventId),
    queryKey: ['audit-event', activeEventId],
    queryFn: () => getAuditEvent(activeEventId ?? ''),
  });

  const metrics = useMemo(() => {
    const summary = overviewQuery.data?.summary;
    if (!summary) return [];

    return [
      { label: '登录日志', value: `${summary.login_total}`, helper: `${windowValue} 窗口` },
      { label: '操作日志', value: `${summary.operation_total}`, helper: '写操作拦截' },
      { label: '安全事件', value: `${summary.security_event_total}`, helper: '失败登录与异常操作' },
      { label: '配置变更', value: `${summary.config_change_total}`, helper: '配置类写操作' },
      { label: '成功率', value: formatPercent(summary.success_rate), helper: '统一审计事件流' },
    ];
  }, [overviewQuery.data, windowValue]);

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <AuditCenterBackground />

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
      >
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M10</StatusBadge>
            <StatusBadge tone="healthy">真实审计</StatusBadge>
            <StatusBadge tone="planned">统一事件流</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">审计中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            聚合登录日志和写操作日志，快速查看安全事件、配置变更和最近失败记录。
          </p>
        </div>
        <Button
          onClick={() => {
            void overviewQuery.refetch();
            void approvalAuditOverviewQuery.refetch();
            void eventsQuery.refetch();
            void selectedEventQuery.refetch();
          }}
          type="button"
          variant="outline"
        >
          刷新数据
        </Button>
      </motion.section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
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

      <section className="grid min-w-0 gap-4 xl:grid-cols-[1.18fr_0.82fr]">
        <Card className="min-w-0">
          <div className="border-b p-4">
            <div className="grid gap-4">
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                <div>
                  <h2 className="text-sm font-semibold">统一审计事件流</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    统一查看登录尝试和写操作记录，筛选用户、状态和窗口后直接查看上下文细节。
                  </p>
                </div>
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
                    placeholder="搜索用户、模块、链路 ID"
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
            <EmptyState description="当前筛选窗口内没有审计记录。" title="暂无审计事件" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {['时间', '来源', '状态', '用户', '模块', '动作', '链路 ID', '摘要'].map((column) => (
                      <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {events.map((event, index) => (
                    <motion.tr
                      animate={{ opacity: 1, y: 0 }}
                      className="border-b transition-colors last:border-0 hover:bg-muted/25"
                      initial={{ opacity: 0, y: 8 }}
                      key={event.event_id}
                      onClick={() => setSelectedEventId(event.event_id)}
                      transition={{ delay: index * 0.02, duration: 0.22 }}
                    >
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
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <AuditDetailPanel
          event={selectedEventQuery.data ?? null}
          loading={selectedEventQuery.isLoading}
        />
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
    <Card className="grid gap-4 p-5">
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
    <Card className="grid gap-4 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <AlertTriangle className="size-4 text-amber-600" />
        最近失败
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载失败样本...</div>
      ) : failures.length === 0 ? (
        <EmptyState description="当前窗口没有失败审计事件。" title="暂无失败事件" />
      ) : (
        <div className="grid gap-3">
          {failures.map((failure) => (
            <div className="rounded-md border bg-muted/20 px-3 py-2" key={failure.event_id}>
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium">{failure.title}</div>
                <span className="text-xs text-muted-foreground">{formatDateTime(failure.occurred_at)}</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{auditSourceLabel(failure.source_type)}</div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{failure.error_message}</p>
            </div>
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
    <Card className="overflow-hidden">
      <div className="grid gap-4 p-5 lg:grid-cols-[0.9fr_1.1fr_auto] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M79</StatusBadge>
            <StatusBadge tone="planned">审批审计联动</StatusBadge>
          </div>
          <h2 className="mt-3 text-sm font-semibold">审批审计风险入口</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            审计中心已纳入审批审计来源，可从这里查看审批风险概况并跳转到全局检索与导出页面。
          </p>
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
                href={`/approval-audits?eventId=${event.id}`}
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

function AuditDetailPanel({
  event,
  loading,
}: {
  event: AuditEventDetail | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card className="grid gap-4 p-5">
        <div className="text-sm text-muted-foreground">正在加载事件详情...</div>
      </Card>
    );
  }

  if (!event) {
    return (
      <Card className="grid gap-4 p-5">
        <EmptyState description="选择一条审计事件后，在这里查看 IP、请求摘要和错误信息。" title="未选择事件" />
      </Card>
    );
  }

  return (
    <Card className="grid gap-4 p-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={auditStatusTone(event.status)}>{auditStatusLabel(event.status)}</StatusBadge>
          <StatusBadge tone="planned">{auditSourceLabel(event.source_type)}</StatusBadge>
        </div>
        <h2 className="mt-3 text-base font-semibold">{event.title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{event.user_email}</p>
      </div>

      <div className="grid gap-3 text-sm">
        <DetailRow label="发生时间" value={formatDateTime(event.occurred_at)} />
        <DetailRow label="模块" value={event.module ?? '-'} />
        <DetailRow label="动作" value={event.action ?? '-'} />
        <DetailRow label="链路 ID" value={event.request_id ?? '-'} />
        <DetailRow label="IP 地址" value={event.ip ?? '-'} />
        <DetailRow label="客户端标识" value={event.user_agent ?? '-'} />
        <DetailRow label="请求路径" value={event.path ?? '-'} />
        <DetailRow label="请求方法" value={event.method ?? '-'} />
        <DetailRow label="状态码" value={event.status_code?.toString() ?? '-'} />
      </div>

      {event.error_message ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {event.error_message}
        </div>
      ) : null}

      <JsonCard title="请求摘要" value={event.request_summary} />
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-md border bg-muted/20 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="break-words font-medium">{value}</div>
    </div>
  );
}

function JsonCard({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="rounded-md border bg-slate-950 p-3">
      <div className="mb-2 text-xs font-medium text-slate-300">{title}</div>
      <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-slate-100">
        {JSON.stringify(value ?? null, null, 2)}
      </pre>
    </div>
  );
}
