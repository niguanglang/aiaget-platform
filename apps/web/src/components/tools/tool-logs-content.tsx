'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import Link from 'next/link';
import type { ToolCallLogItem } from '@aiaget/shared-types';

import {
  formatDateTime,
  formatLatency,
  formatPercent,
  toolApprovalStatusLabel,
  toolCallStatusLabel,
  toolCallTriggerSourceLabel,
  toolMethodLabel,
  toolStatusTone,
} from '@/components/tools/tool-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { listToolCallLogs } from '@/lib/api-client';

import { ToolStatTile } from './tool-stat-tile';

export function ToolLogsContent() {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [triggerSource, setTriggerSource] = useState('');
  const [approvalStatus, setApprovalStatus] = useState('');
  const [requestMethod, setRequestMethod] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const logsQuery = useQuery({
    queryKey: ['tool-execution-records', keyword, status, triggerSource, approvalStatus, requestMethod, dateFrom, dateTo, page],
    queryFn: () =>
      listToolCallLogs({
        page,
        page_size: 20,
        keyword,
        status,
        trigger_source: triggerSource,
        approval_status: approvalStatus,
        request_method: requestMethod,
        date_from: toDateFromIso(dateFrom),
        date_to: toDateToIso(dateTo),
      }),
  });
  const logs = logsQuery.data?.items ?? [];
  const pageSize = logsQuery.data?.page_size ?? 20;
  const total = logsQuery.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const metrics = useMemo(() => {
    const failureCount = logs.filter((log) => log.status === 'FAILED').length;
    const approvalCount = logs.filter((log) => log.status === 'APPROVAL_REQUIRED' || log.approval_status === 'PENDING').length;
    const failureRate = logs.length === 0 ? 0 : (failureCount / logs.length) * 100;
    const averageLatency = logs.length === 0 ? 0 : logs.reduce((sum, log) => sum + log.latency_ms, 0) / logs.length;

    return [
      { label: '记录数', value: `${total}`, helper: '当前筛选' },
      { label: '失败记录', value: `${failureCount}`, helper: '当前页' },
      { label: '失败率', value: formatPercent(failureRate), helper: '当前筛选' },
      { label: '待审批', value: `${approvalCount}`, helper: `均耗时 ${formatLatency(Math.round(averageLatency))}` },
    ];
  }, [logs, total]);

  return (
    <main className="mx-auto grid max-w-[1536px] gap-6 rounded-xl border border-slate-200/80 bg-white/[0.9] px-4 py-6 lg:px-7">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">执行记录</StatusBadge>
            <StatusBadge tone="healthy">工具调用</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">工具执行记录</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={logsQuery.isFetching} onClick={() => void logsQuery.refetch()} type="button" variant="outline">刷新记录</Button>
          <Button asChild type="button" variant="outline"><Link href="/tools">返回工具</Link></Button>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => <ToolStatTile helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />)}
      </section>
      <Card>
        <div className="border-b p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <h2 className="text-sm font-semibold">执行记录</h2>
            <div className="flex flex-wrap gap-2">
              <label className="flex h-9 min-w-64 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
                <Search className="size-4 text-muted-foreground" />
                <input className="min-w-0 flex-1 bg-transparent outline-none" onChange={(event) => { setKeyword(event.target.value); setPage(1); }} placeholder="搜索链接、错误、工具或操作人" value={keyword} />
              </label>
              <select className="h-9 rounded-md border bg-background/70 px-3 text-sm outline-none" onChange={(event) => { setStatus(event.target.value); setPage(1); }} value={status}>
                <option value="">全部状态</option>
                <option value="SUCCESS">成功</option>
                <option value="FAILED">失败</option>
                <option value="APPROVAL_REQUIRED">等待审批</option>
                <option value="REJECTED">已拒绝</option>
              </select>
              <select className="h-9 rounded-md border bg-background/70 px-3 text-sm outline-none" onChange={(event) => { setTriggerSource(event.target.value); setPage(1); }} value={triggerSource}>
                <option value="">全部来源</option>
                <option value="TEST">控制台测试</option>
                <option value="RUNTIME">运行时</option>
              </select>
              <select className="h-9 rounded-md border bg-background/70 px-3 text-sm outline-none" onChange={(event) => { setApprovalStatus(event.target.value); setPage(1); }} value={approvalStatus}>
                <option value="">全部审批</option>
                <option value="PENDING">待审批</option>
                <option value="APPROVED">已通过</option>
                <option value="REJECTED">已拒绝</option>
              </select>
              <select className="h-9 rounded-md border bg-background/70 px-3 text-sm outline-none" onChange={(event) => { setRequestMethod(event.target.value); setPage(1); }} value={requestMethod}>
                <option value="">全部方法</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
              <label className="grid gap-1 text-xs text-muted-foreground">
                开始日期
                <input className="h-9 rounded-md border bg-background/70 px-3 text-sm text-foreground outline-none" onChange={(event) => { setDateFrom(event.target.value); setPage(1); }} type="date" value={dateFrom} />
              </label>
              <label className="grid gap-1 text-xs text-muted-foreground">
                结束日期
                <input className="h-9 rounded-md border bg-background/70 px-3 text-sm text-foreground outline-none" onChange={(event) => { setDateTo(event.target.value); setPage(1); }} type="date" value={dateTo} />
              </label>
            </div>
          </div>
        </div>
        {logsQuery.isError ? (
          <div className="p-6 text-sm text-destructive">工具执行记录加载失败。</div>
        ) : logsQuery.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">正在加载工具执行记录...</div>
        ) : logs.length === 0 ? (
          <EmptyState title="暂无执行记录" />
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {['工具', '来源', '状态', '审批', '请求', '响应', '耗时', '操作人', '时间', '操作'].map((column) => <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>{column}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <ToolLogRow key={log.id} log={log} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-muted-foreground">
              <span>第 {page} / {pageCount} 页，共 {total} 条</span>
              <div className="flex gap-2">
                <Button disabled={page <= 1 || logsQuery.isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))} size="sm" type="button" variant="outline">上一页</Button>
                <Button disabled={page >= pageCount || logsQuery.isFetching} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} size="sm" type="button" variant="outline">下一页</Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </main>
  );
}

function toDateFromIso(value: string) {
  return toLocalDateTimeIso(value, '00:00:00.000');
}

function toDateToIso(value: string) {
  return toLocalDateTimeIso(value, '23:59:59.999');
}

function toLocalDateTimeIso(value: string, time: string) {
  if (!value) return '';

  const date = new Date(`${value}T${time}`);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function ToolLogRow({ log }: { log: ToolCallLogItem }) {
  return (
    <tr className="border-b transition-colors last:border-0 hover:bg-muted/25">
      <td className="px-4 py-3">
        <div className="grid max-w-xs gap-1">
          <Link className="font-medium hover:text-primary" href={`/tools/${log.tool_id}`}>{log.tool_name}</Link>
          <span className="text-xs text-muted-foreground">{log.tool_code}</span>
          <span className="line-clamp-1 break-all text-xs text-muted-foreground">{log.tool_id}</span>
        </div>
      </td>
      <td className="px-4 py-3"><StatusBadge tone="planned">{toolCallTriggerSourceLabel(log.trigger_source)}</StatusBadge></td>
      <td className="px-4 py-3"><StatusBadge tone={toolStatusTone(log.status)}>{toolCallStatusLabel(log.status)}</StatusBadge></td>
      <td className="px-4 py-3 text-muted-foreground">{toolApprovalStatusLabel(log.approval_status)}</td>
      <td className="px-4 py-3 text-muted-foreground">
        <div className="grid gap-1">
          <span>{toolMethodLabel(log.request_method)}</span>
          <span className="line-clamp-1 break-all text-xs">{log.request_url}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        <div className="grid gap-1">
          <span>{log.response_status ?? '-'}</span>
          {log.error_message ? <span className="line-clamp-1 max-w-48 text-xs text-destructive">{log.error_message}</span> : null}
        </div>
      </td>
      <td className="px-4 py-3 text-muted-foreground">{formatLatency(log.latency_ms)}</td>
      <td className="px-4 py-3 text-muted-foreground">{log.created_by?.name ?? log.created_by?.email ?? '-'}</td>
      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(log.created_at)}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" type="button" variant="outline"><Link href={`/tools/${log.tool_id}`}>工具详情</Link></Button>
          {log.approval_request_id ? <Button asChild size="sm" type="button" variant="outline"><Link href={`/approvals?requestId=${log.approval_request_id}`}>审批</Link></Button> : null}
        </div>
      </td>
    </tr>
  );
}
