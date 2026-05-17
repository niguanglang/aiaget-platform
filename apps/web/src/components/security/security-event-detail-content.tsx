'use client';

import { useQuery } from '@tanstack/react-query';
import { GitBranch, LinkIcon, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import {
  DetailLine,
  JsonBlock,
  LoadingRows,
  PageError,
  SECURITY_PAGE_SHELL_CLASS,
  SecurityWorkspaceHeader,
  formatDateTime,
  securityEventSourceLabel,
  securityRiskLevelLabel,
  securityRiskTone,
  shortId,
} from '@/components/security/security-page-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { getSecurityCenterEvent } from '@/lib/api-client';

export function SecurityEventDetailContent({ eventId }: { eventId: string }) {
  const eventQuery = useQuery({
    enabled: Boolean(eventId),
    queryKey: ['security-event-detail', eventId],
    queryFn: () => getSecurityCenterEvent(eventId),
  });
  const event = eventQuery.data ?? null;

  return (
    <main className={SECURITY_PAGE_SHELL_CLASS}>
      <SecurityWorkspaceHeader
        actions={
          <Button disabled={eventQuery.isFetching} onClick={() => void eventQuery.refetch()} type="button" variant="outline">
            <RefreshCw className={`size-4 ${eventQuery.isFetching ? 'animate-spin' : ''}`} />
            刷新详情
          </Button>
	        }
	        badge="事件详情"
	        title="安全事件详情"
	      />

      <div className="flex">
        <Button asChild variant="outline">
          <Link href="/security/events">返回事件列表</Link>
        </Button>
      </div>

      {eventQuery.isError ? (
        <Card className="p-5">
          <PageError>安全事件详情加载失败。</PageError>
        </Card>
      ) : eventQuery.isLoading ? (
        <Card>
          <LoadingRows count={5} />
        </Card>
      ) : !event ? (
        <Card className="p-5">
	          <EmptyState title="未找到安全事件" />
        </Card>
      ) : (
        <>
          <Card className="grid gap-4 p-5">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={securityRiskTone(event.severity)}>{securityRiskLevelLabel(event.severity)}</StatusBadge>
                  <StatusBadge tone="planned">{securityEventSourceLabel(event.source)}</StatusBadge>
                  {event.has_trace ? <StatusBadge tone="mock">Trace</StatusBadge> : null}
                </div>
                <h2 className="mt-3 text-xl font-semibold">{event.title}</h2>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">{event.reason}</p>
              </div>
              <div className="rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                事件 ID
                <div className="mt-1 font-mono text-sm text-foreground">{shortId(event.id)}</div>
              </div>
            </div>
          </Card>

          <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <Card className="grid gap-3 p-5">
              <h2 className="text-sm font-semibold">基础信息</h2>
              <DetailLine label="来源" value={securityEventSourceLabel(event.source)} />
              <DetailLine label="资源类型" value={event.resource_type ?? '暂无'} />
              <DetailLine label="资源 ID" value={event.resource_id ?? '暂无'} />
              <DetailLine label="发生时间" value={formatDateTime(event.occurred_at)} />
              <DetailLine label="请求路径" value={`${event.method} ${event.path}`} />
              <DetailLine label="状态码" value={event.status_code} />
            </Card>

            <Card className="grid gap-3 p-5">
              <h2 className="text-sm font-semibold">请求与链路</h2>
              <DetailLine label="Request ID" value={event.request_id} />
              <DetailLine label="Trace ID" value={event.trace_id ?? '暂无'} />
              <DetailLine label="IP 地址" value={event.ip ?? '暂无'} />
              <DetailLine label="客户端" value={event.user_agent ?? '暂无'} />
              <DetailLine label="错误信息" value={event.error_message ?? '暂无'} />
              {event.trace_id ? (
                <Button asChild className="w-fit" variant="outline">
                  <Link href={`/monitor/traces/${encodeURIComponent(event.trace_id)}`}>
                    <GitBranch className="size-4" />
                    查看 Trace
                  </Link>
                </Button>
              ) : null}
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
            <Card className="grid gap-3 p-5">
              <h2 className="text-sm font-semibold">关联对象</h2>
              <TraceLine icon={<LinkIcon className="size-4" />} label="操作人" value={event.operator?.name ?? event.operator?.email ?? '暂无'} />
              <TraceLine icon={<LinkIcon className="size-4" />} label="匹配策略" value={event.matched_policy?.name ?? event.matched_policy?.code ?? '暂无'} />
              <TraceLine icon={<LinkIcon className="size-4" />} label="源记录" value={`${event.source_record_type} / ${shortId(event.source_record_id)}`} />
            </Card>

            <Card className="grid gap-3 p-5">
              <h2 className="text-sm font-semibold">请求摘要</h2>
              <JsonBlock value={event.request_summary} />
            </Card>
          </section>

          <ExportFieldSummary context={event.context} />

          <Card className="grid gap-3 p-5">
            <h2 className="text-sm font-semibold">主体 / 资源 / 上下文</h2>
            <div className="grid gap-3 lg:grid-cols-3">
              <JsonBlock value={event.subject} />
              <JsonBlock value={event.resource} />
              <JsonBlock value={event.context} />
            </div>
          </Card>
        </>
      )}
    </main>
  );
}

function ExportFieldSummary({ context }: { context: Record<string, unknown> | null }) {
  const exportedFields = stringArray(context?.exported_fields);
  const notificationArchiveFilterFields = stringArray(context?.notification_archive_filter_fields);
  if (exportedFields.length === 0 && notificationArchiveFilterFields.length === 0) return null;

  return (
    <Card className="grid gap-4 p-5">
	      <div>
	        <h2 className="text-sm font-semibold">审批导出字段清单</h2>
	      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <FieldChipGroup fields={exportedFields} title="导出字段" />
        <FieldChipGroup fields={notificationArchiveFilterFields} title="通知归档筛选字段" />
      </div>
    </Card>
  );
}

function FieldChipGroup({ fields, title }: { fields: string[]; title: string }) {
  return (
    <div className="grid gap-2 rounded-md border bg-muted/15 p-3">
      <div className="text-xs font-medium text-muted-foreground">{title}</div>
      {fields.length === 0 ? (
        <div className="text-sm text-muted-foreground">暂无字段</div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {fields.map((field) => (
            <span className="rounded-md border bg-background/80 px-2 py-1 text-xs text-muted-foreground" key={field}>
              {field}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function TraceLine({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
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
