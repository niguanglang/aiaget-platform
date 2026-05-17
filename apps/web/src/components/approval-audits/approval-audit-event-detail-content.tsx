'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ClipboardCheck, GitBranch, RefreshCw } from 'lucide-react';
import Link from 'next/link';

import {
  approvalAuditEventTypeLabel,
  ApprovalAuditPageShell,
  approvalAuditSourceLabel,
  approvalAuditStatusLabel,
  approvalAuditTone,
  DetailRow,
  formatDateTime,
  JsonPreviewCard,
  normalizeApprovalAuditWindow,
  SectionTitle,
} from '@/components/approval-audits/approval-audit-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { getApprovalAuditEvent } from '@/lib/api-client';

export function ApprovalAuditEventDetailContent({
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
    queryKey: ['approval-audit-event', eventId],
    queryFn: () => getApprovalAuditEvent(eventId),
  });
  const detail = eventQuery.data ?? null;
  const backHref = buildApprovalAuditBackHref(windowValue, keyword);

  return (
    <ApprovalAuditPageShell>
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4" variant="outline">
            <Link href={backHref}>
              <ArrowLeft className="size-4" />
              返回审批审计
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">事件详情</StatusBadge>
            <StatusBadge tone="planned">独立路由</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">审批审计事件详情</h1>
        </div>
        <Button disabled={eventQuery.isFetching} onClick={() => void eventQuery.refetch()} type="button" variant="outline">
          <RefreshCw className="size-4" />
          刷新详情
        </Button>
      </section>

      {eventQuery.isError ? (
        <Card className="p-6">
          <EmptyState title="详情加载失败" />
        </Card>
      ) : eventQuery.isLoading ? (
        <Card className="p-6 text-sm text-muted-foreground">正在加载审批审计事件详情...</Card>
      ) : !detail ? (
        <Card className="p-6">
          <EmptyState title="未找到事件" />
        </Card>
      ) : (
        <>
          <Card className="grid gap-5 p-5">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={approvalAuditTone(detail.event_status)}>{approvalAuditStatusLabel(detail.event_status)}</StatusBadge>
                  <StatusBadge tone="planned">{approvalAuditSourceLabel(detail.source_type)}</StatusBadge>
                  <StatusBadge tone="mock">{approvalAuditEventTypeLabel(detail.event_type)}</StatusBadge>
                </div>
                <h2 className="mt-3 text-xl font-semibold">{detail.title}</h2>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">{detail.note ?? '当前事件没有备注。'}</p>
              </div>
              <div className="rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                事件 ID
                <div className="mt-1 break-all font-mono text-sm text-foreground">{detail.id}</div>
              </div>
            </div>
          </Card>

          <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <Card className="grid gap-4 p-5">
              <SectionTitle>基础信息</SectionTitle>
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailRow label="事件标题" value={detail.title} />
                <DetailRow label="来源记录" value={detail.source_id} />
                <DetailRow label="来源类型" value={approvalAuditSourceLabel(detail.source_type)} />
                <DetailRow label="事件类型" value={approvalAuditEventTypeLabel(detail.event_type)} />
                <DetailRow label="事件状态" value={approvalAuditStatusLabel(detail.event_status)} />
                <DetailRow label="发生时间" value={formatDateTime(detail.occurred_at)} />
              </div>
            </Card>

            <Card className="grid gap-4 p-5">
              <SectionTitle>链路与操作人</SectionTitle>
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailRow label="操作人" value={detail.actor ? `${detail.actor.name} (${detail.actor.email})` : '系统'} />
                <DetailRow label="请求 ID" value={detail.request_id ?? '-'} />
                <DetailRow label="Trace ID" value={detail.trace_id ?? '-'} />
                <DetailRow label="租户 ID" value={detail.tenant_id} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline">
                  <Link href={`/approvals?requestId=${detail.source_id}${detail.source_type === 'NOTIFICATION_POLICY' ? '&type=notification-policy' : ''}`}>
                    <ClipboardCheck className="size-4" />
                    打开审批
                  </Link>
                </Button>
                {detail.trace_id ? (
                  <Button asChild variant="outline">
                    <Link href={`/monitor?traceId=${encodeURIComponent(detail.trace_id)}`}>
                      <GitBranch className="size-4" />
                      查看 Trace
                    </Link>
                  </Button>
                ) : null}
              </div>
            </Card>
          </section>

          <JsonPreviewCard title="事件元数据" value={detail.metadata} />
        </>
      )}
    </ApprovalAuditPageShell>
  );
}

function buildApprovalAuditBackHref(windowValue: string | undefined, keyword: string | undefined) {
  const params = new URLSearchParams();
  params.set('window', normalizeApprovalAuditWindow(windowValue));
  if (keyword) params.set('keyword', keyword);
  const query = params.toString();
  return query ? `/approval-audits?${query}` : '/approval-audits';
}
