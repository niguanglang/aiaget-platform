'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ApprovalAuditArchiveItem,
  ApprovalAuditEventItem,
  ApprovalAuditEventStatus,
  ApprovalAuditEventType,
  ApprovalAuditSourceType,
  ApprovalAuditWindow,
} from '@aiaget/shared-types';
import { motion } from 'motion/react';
import { Archive, ClipboardCheck, Download, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  createApprovalAuditArchive,
  deleteApprovalAuditArchive,
  exportApprovalAuditEvents,
  getApprovalAuditArchiveDownloadUrl,
  getApprovalAuditEvent,
  getApprovalAuditOverview,
  listApprovalAuditArchives,
  listApprovalAuditEvents,
} from '@/lib/api-client';

const windows: ApprovalAuditWindow[] = ['24h', '7d', '30d'];
const sourceTypes: ApprovalAuditSourceType[] = ['TOOL_APPROVAL', 'NOTIFICATION_POLICY'];
const eventTypes: ApprovalAuditEventType[] = [
  'REQUEST_CREATED',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'APPLIED',
  'EXECUTION_FAILED',
];
const eventStatuses: ApprovalAuditEventStatus[] = ['INFO', 'SUCCESS', 'WARNING', 'FAILED'];

export function ApprovalAuditContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [windowValue, setWindowValue] = useState<ApprovalAuditWindow>(
    normalizeInitialWindow(searchParams.get('window')),
  );
  const [keyword, setKeyword] = useState('');
  const [sourceType, setSourceType] = useState<ApprovalAuditSourceType | ''>('');
  const [eventType, setEventType] = useState<ApprovalAuditEventType | ''>('');
  const [eventStatus, setEventStatus] = useState<ApprovalAuditEventStatus | ''>('');
  const [traceOnly, setTraceOnly] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(searchParams.get('eventId'));
  const [exportState, setExportState] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
  const [archiveMessage, setArchiveMessage] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const exportParams = useMemo(
    () => ({
      window: windowValue,
      keyword,
      source_type: sourceType,
      event_type: eventType,
      event_status: eventStatus,
      trace_only: traceOnly,
    }),
    [eventStatus, eventType, keyword, sourceType, traceOnly, windowValue],
  );

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
  const activeEventId = selectedEventId ?? events[0]?.id ?? null;

  const detailQuery = useQuery({
    enabled: Boolean(activeEventId),
    queryKey: ['approval-audit-event', activeEventId],
    queryFn: () => getApprovalAuditEvent(activeEventId ?? ''),
  });

  const archivesQuery = useQuery({
    queryKey: ['approval-audit-archives'],
    queryFn: listApprovalAuditArchives,
  });

  const createArchiveMutation = useMutation({
    mutationFn: () => createApprovalAuditArchive(exportParams),
    onSuccess: async (result) => {
      setArchiveError(null);
      setArchiveMessage(`已生成归档 ${result.item.file_name}。`);
      await queryClient.invalidateQueries({ queryKey: ['approval-audit-archives'] });
    },
    onError: (error: Error) => {
      setArchiveMessage(null);
      setArchiveError(error.message);
    },
  });

  const downloadArchiveMutation = useMutation({
    mutationFn: (archive: ApprovalAuditArchiveItem) => getApprovalAuditArchiveDownloadUrl(archive.id),
    onSuccess: (result) => {
      setArchiveError(null);
      window.open(result.url, '_blank', 'noopener,noreferrer');
    },
    onError: (error: Error) => {
      setArchiveMessage(null);
      setArchiveError(error.message);
    },
  });

  const deleteArchiveMutation = useMutation({
    mutationFn: (archive: ApprovalAuditArchiveItem) => deleteApprovalAuditArchive(archive.id),
    onSuccess: async (result) => {
      setArchiveError(null);
      setArchiveMessage(`归档删除已提交审批，审批 ID：${result.approval_id}。`);
      await queryClient.invalidateQueries({ queryKey: ['approval-audit-archives'] });
      await queryClient.invalidateQueries({ queryKey: ['approval-audit-archive-approvals'] });
    },
    onError: (error: Error) => {
      setArchiveMessage(null);
      setArchiveError(error.message);
    },
  });

  const metrics = useMemo(() => {
    const summary = overviewQuery.data?.summary;
    if (!summary) return [];

    return [
      { label: '审计事件', value: `${summary.total_count}`, helper: `${overviewQuery.data?.window ?? windowValue} 窗口` },
      { label: '成功事件', value: `${summary.success_count}`, helper: '审批通过或生效' },
      { label: '失败事件', value: `${summary.failed_count}`, helper: '执行失败' },
      { label: '告警事件', value: `${summary.warning_count}`, helper: '拒绝或警告' },
      { label: 'Trace 覆盖', value: `${summary.trace_count}`, helper: '可追踪链路' },
    ];
  }, [overviewQuery.data, windowValue]);

  async function handleExport() {
    setExportState('exporting');
    try {
      const blob = await exportApprovalAuditEvents(exportParams);
      downloadBlob(blob, `审批审计事件-${new Date().toISOString().slice(0, 10)}.csv`);
      setExportState('success');
    } catch {
      setExportState('error');
    }
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
      >
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M78</StatusBadge>
            <StatusBadge tone="healthy">审批审计</StatusBadge>
            <StatusBadge tone="planned">全局检索</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">审批审计</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            全局检索工具审批和通知策略审批事件，按来源、类型、状态、Trace 与关键词定位完整审批链路。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={eventsQuery.isLoading || events.length === 0 || exportState === 'exporting'}
            onClick={() => void handleExport()}
            type="button"
            variant="outline"
          >
            <Download className="size-4" />
            {exportState === 'exporting' ? '正在导出' : '导出 CSV'}
          </Button>
          <Button
            onClick={() => {
              void overviewQuery.refetch();
              void eventsQuery.refetch();
              void detailQuery.refetch();
            }}
            type="button"
            variant="outline"
          >
            刷新数据
          </Button>
        </div>
      </motion.section>

      {exportState === 'success' ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          当前筛选条件下的审批审计事件已导出。
        </div>
      ) : exportState === 'error' ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          审批审计事件导出失败，请稍后重试。
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
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

      <ApprovalAuditArchivePanel
        archives={archivesQuery.data?.items ?? []}
        errorMessage={archiveError}
        isCreating={createArchiveMutation.isPending}
        isDeleting={deleteArchiveMutation.isPending}
        isDownloading={downloadArchiveMutation.isPending}
        loading={archivesQuery.isLoading}
        message={archiveMessage}
        onCreate={() => createArchiveMutation.mutate()}
        onDelete={(archive) => deleteArchiveMutation.mutate(archive)}
        onDownload={(archive) => downloadArchiveMutation.mutate(archive)}
        onRefresh={() => void archivesQuery.refetch()}
        summary={archivesQuery.data?.summary ?? null}
      />

      <section className="grid min-w-0 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="min-w-0">
          <div className="border-b p-4">
            <div className="grid gap-4">
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                <div>
                  <h2 className="text-sm font-semibold">审批审计事件</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    统一查看审批创建、批准、拒绝、生效和执行失败事件。
                  </p>
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
                    placeholder="搜索标题、备注、Trace、请求 ID、操作人"
                    value={keyword}
                  />
                </label>
                <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setWindowValue(event.target.value as ApprovalAuditWindow)} value={windowValue}>
                  {windows.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setSourceType(event.target.value as ApprovalAuditSourceType | '')} value={sourceType}>
                  <option value="">全部来源</option>
                  {sourceTypes.map((item) => <option key={item} value={item}>{approvalAuditSourceLabel(item)}</option>)}
                </select>
                <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setEventType(event.target.value as ApprovalAuditEventType | '')} value={eventType}>
                  <option value="">全部类型</option>
                  {eventTypes.map((item) => <option key={item} value={item}>{approvalAuditEventTypeLabel(item)}</option>)}
                </select>
                <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setEventStatus(event.target.value as ApprovalAuditEventStatus | '')} value={eventStatus}>
                  <option value="">全部状态</option>
                  {eventStatuses.map((item) => <option key={item} value={item}>{approvalAuditStatusLabel(item)}</option>)}
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
            <EmptyState description="当前筛选条件下没有审批审计事件。" title="暂无审批审计事件" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {['时间', '来源', '事件', '状态', '操作人', 'Trace ID', '请求 ID', '备注'].map((column) => (
                      <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {events.map((event, index) => (
                    <motion.tr
                      animate={{ opacity: 1, y: 0 }}
                      className="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/25"
                      initial={{ opacity: 0, y: 8 }}
                      key={event.id}
                      onClick={() => setSelectedEventId(event.id)}
                      transition={{ delay: index * 0.015, duration: 0.2 }}
                    >
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
                      <td className="px-4 py-3">
                        <div className="line-clamp-1 max-w-xs text-muted-foreground">{event.note ?? '-'}</div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <ApprovalAuditDetailPanel detail={detailQuery.data ?? null} loading={detailQuery.isLoading} />
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

function ApprovalAuditArchivePanel({
  archives,
  errorMessage,
  isCreating,
  isDeleting,
  isDownloading,
  loading,
  message,
  onCreate,
  onDelete,
  onDownload,
  onRefresh,
  summary,
}: {
  archives: ApprovalAuditArchiveItem[];
  errorMessage: string | null;
  isCreating: boolean;
  isDeleting: boolean;
  isDownloading: boolean;
  loading: boolean;
  message: string | null;
  onCreate: () => void;
  onDelete: (archive: ApprovalAuditArchiveItem) => void;
  onDownload: (archive: ApprovalAuditArchiveItem) => void;
  onRefresh: () => void;
  summary: { archive_count: number; total_size_bytes: number } | null;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col justify-between gap-4 border-b p-5 lg:flex-row lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M80</StatusBadge>
            <StatusBadge tone="planned">MinIO 归档</StatusBadge>
          </div>
          <h2 className="mt-3 text-sm font-semibold">审批审计归档</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            将当前筛选条件下的审批审计事件生成 CSV 归档，保存到对象存储，便于审计留痕和离线下载。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={isCreating} onClick={onCreate} type="button">
            <Archive className="size-4" />
            {isCreating ? '正在生成' : '生成归档'}
          </Button>
          <Button onClick={onRefresh} type="button" variant="outline">
            刷新归档
          </Button>
        </div>
      </div>

      {message ? (
        <div className="mx-5 mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}
      {errorMessage ? (
        <div className="mx-5 mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 p-5 lg:grid-cols-[260px_1fr]">
        <div className="grid gap-3">
          <ArchiveMetric helper="对象存储文件" label="归档文件" value={`${summary?.archive_count ?? 0}`} />
          <ArchiveMetric helper="CSV 总容量" label="归档容量" value={formatBytes(summary?.total_size_bytes ?? 0)} />
        </div>

        {loading ? (
          <div className="rounded-md border bg-muted/20 p-5 text-sm text-muted-foreground">正在加载归档文件...</div>
        ) : archives.length === 0 ? (
          <EmptyState description="点击生成归档后，当前筛选结果会保存为 CSV 文件。" title="暂无审批审计归档" />
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {['文件名', '目录', '大小', '更新时间', '对象路径', '操作'].map((column) => (
                    <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {archives.map((archive) => (
                  <tr className="border-b last:border-0" key={archive.id}>
                    <td className="px-4 py-3 font-medium">{archive.file_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{archive.folder}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatBytes(archive.size_bytes)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(archive.last_modified)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{archive.key}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          disabled={isDownloading}
                          onClick={() => onDownload(archive)}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          <Download className="size-4" />
                          下载
                        </Button>
                        <Button
                          disabled={isDeleting}
                          onClick={() => {
                            if (window.confirm(`确认申请删除归档 ${archive.file_name}？该操作需要审批后生效。`)) {
                              onDelete(archive);
                            }
                          }}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          <Trash2 className="size-4" />
                          申请删除
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}

function ArchiveMetric({ helper, label, value }: { helper: string; label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/15 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{helper}</div>
    </div>
  );
}

function ApprovalAuditDetailPanel({ detail, loading }: { detail: ApprovalAuditEventItem | null; loading: boolean }) {
  return (
    <Card className="grid h-fit gap-4 p-5">
      <div className="flex items-center gap-2">
        <ClipboardCheck className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">事件详情</h2>
      </div>
      {loading ? (
        <p className="rounded-md border bg-muted/20 px-3 py-8 text-sm text-muted-foreground">正在加载事件详情...</p>
      ) : !detail ? (
        <EmptyState description="从左侧选择一条审批审计事件查看详情。" title="未选择事件" />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={approvalAuditTone(detail.event_status)}>{approvalAuditStatusLabel(detail.event_status)}</StatusBadge>
            <StatusBadge tone="planned">{approvalAuditSourceLabel(detail.source_type)}</StatusBadge>
            <StatusBadge tone="mock">{approvalAuditEventTypeLabel(detail.event_type)}</StatusBadge>
          </div>
          <div className="grid gap-3 text-sm">
            <DetailRow label="事件标题" value={detail.title} />
            <DetailRow label="事件 ID" value={detail.id} />
            <DetailRow label="来源记录" value={detail.source_id} />
            <DetailRow label="操作人" value={detail.actor ? `${detail.actor.name} (${detail.actor.email})` : '系统'} />
            <DetailRow label="发生时间" value={formatDateTime(detail.occurred_at)} />
            <DetailRow label="请求 ID" value={detail.request_id ?? '-'} />
            <DetailRow label="Trace ID" value={detail.trace_id ?? '-'} />
          </div>
          {detail.note ? (
            <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">备注：</span>
              {detail.note}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`/approvals?requestId=${detail.source_id}${detail.source_type === 'NOTIFICATION_POLICY' ? '&type=notification-policy' : ''}`}>
                打开审批
              </Link>
            </Button>
            {detail.trace_id ? (
              <Button asChild size="sm" variant="outline">
                <Link href={`/monitor?traceId=${encodeURIComponent(detail.trace_id)}`}>查看 Trace</Link>
              </Button>
            ) : null}
          </div>
          <PreviewCard title="事件元数据" value={detail.metadata} />
        </>
      )}
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-md border bg-muted/15 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="break-words text-sm font-medium">{value}</div>
    </div>
  );
}

function PreviewCard({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="rounded-md border bg-slate-950 p-3">
      <div className="mb-2 text-xs font-medium text-slate-300">{title}</div>
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-100">
        {JSON.stringify(value ?? {}, null, 2)}
      </pre>
    </div>
  );
}

function approvalAuditSourceLabel(source: ApprovalAuditSourceType) {
  if (source === 'TOOL_APPROVAL') return '工具审批';
  if (source === 'APPROVAL_AUDIT_ARCHIVE') return '归档操作';
  return '通知策略';
}

function approvalAuditEventTypeLabel(type: ApprovalAuditEventType) {
  const labels: Record<ApprovalAuditEventType, string> = {
    REQUEST_CREATED: '请求创建',
    SUBMITTED: '提交审批',
    APPROVED: '审批通过',
    REJECTED: '审批拒绝',
    APPLIED: '变更生效',
    EXECUTION_FAILED: '执行失败',
    ARCHIVED: '归档生成',
    DOWNLOAD_URL_CREATED: '下载链接',
    DELETE_REQUESTED: '删除申请',
    DELETE_APPLIED: '删除生效',
  };
  return labels[type] ?? type;
}

function approvalAuditStatusLabel(status: ApprovalAuditEventStatus) {
  if (status === 'SUCCESS') return '成功';
  if (status === 'FAILED') return '失败';
  if (status === 'WARNING') return '警告';
  return '信息';
}

function approvalAuditTone(status: ApprovalAuditEventStatus) {
  if (status === 'SUCCESS') return 'healthy';
  if (status === 'FAILED') return 'unavailable';
  if (status === 'WARNING') return 'degraded';
  return 'planned';
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function normalizeInitialWindow(value: string | null): ApprovalAuditWindow {
  if (value === '7d' || value === '30d') return value;
  return '24h';
}

function formatBytes(value: number) {
  if (value <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function downloadBlob(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
