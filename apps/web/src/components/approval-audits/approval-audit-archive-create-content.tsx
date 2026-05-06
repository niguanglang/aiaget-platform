'use client';

import { useMutation } from '@tanstack/react-query';
import type { ApprovalAuditEventStatus, ApprovalAuditEventType, ApprovalAuditSourceType, ApprovalAuditWindow } from '@aiaget/shared-types';
import { ArrowLeft, Archive, Download, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import {
  approvalAuditEventStatuses,
  approvalAuditEventTypeLabel,
  approvalAuditEventTypes,
  approvalAuditSourceLabel,
  approvalAuditSourceTypes,
  approvalAuditStatusLabel,
  approvalAuditWindows,
  downloadBlob,
  formatBytes,
} from '@/components/approval-audits/approval-audit-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { createApprovalAuditArchive, exportApprovalAuditEvents } from '@/lib/api-client';

export function ApprovalAuditArchiveCreateContent() {
  const [windowValue, setWindowValue] = useState<ApprovalAuditWindow>('24h');
  const [keyword, setKeyword] = useState('');
  const [sourceType, setSourceType] = useState<ApprovalAuditSourceType | ''>('');
  const [eventType, setEventType] = useState<ApprovalAuditEventType | ''>('');
  const [eventStatus, setEventStatus] = useState<ApprovalAuditEventStatus | ''>('');
  const [traceOnly, setTraceOnly] = useState(false);
  const [csvState, setCsvState] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');

  const archiveParams = {
    window: windowValue,
    keyword,
    source_type: sourceType,
    event_type: eventType,
    event_status: eventStatus,
    trace_only: traceOnly,
  };

  const createArchiveMutation = useMutation({
    mutationFn: () => createApprovalAuditArchive(archiveParams),
  });

  async function handleExport() {
    setCsvState('exporting');
    try {
      const blob = await exportApprovalAuditEvents(archiveParams);
      downloadBlob(blob, `审批审计事件-${new Date().toISOString().slice(0, 10)}.csv`);
      setCsvState('success');
    } catch {
      setCsvState('error');
    }
  }

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:px-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4" variant="outline">
            <Link href="/approval-audits/archives">
              <ArrowLeft className="size-4" />
              返回归档中心
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">归档生成</StatusBadge>
            <StatusBadge tone="planned">导出留痕</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">生成审批审计归档</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            使用同一组筛选条件导出 CSV 或生成对象存储归档，归档文件可在归档中心下载和申请删除。
          </p>
        </div>
        <Button
          onClick={() => {
            setWindowValue('24h');
            setKeyword('');
            setSourceType('');
            setEventType('');
            setEventStatus('');
            setTraceOnly(false);
          }}
          type="button"
          variant="outline"
        >
          <RotateCcw className="size-4" />
          重置条件
        </Button>
      </section>

      <Card className="grid gap-5 p-5">
        <div>
          <h2 className="text-sm font-semibold">归档筛选条件</h2>
          <p className="mt-1 text-sm text-muted-foreground">筛选条件会同时用于 CSV 导出和 MinIO 归档生成。</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="text-xs text-muted-foreground">关键词</span>
            <input
              className="h-9 rounded-md border bg-background/80 px-3 text-sm outline-none"
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="标题、备注、Trace、请求 ID、操作人"
              value={keyword}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-xs text-muted-foreground">时间窗口</span>
            <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setWindowValue(event.target.value as ApprovalAuditWindow)} value={windowValue}>
              {approvalAuditWindows.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-xs text-muted-foreground">审批来源</span>
            <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setSourceType(event.target.value as ApprovalAuditSourceType | '')} value={sourceType}>
              <option value="">全部来源</option>
              {approvalAuditSourceTypes.map((item) => <option key={item} value={item}>{approvalAuditSourceLabel(item)}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-xs text-muted-foreground">事件类型</span>
            <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setEventType(event.target.value as ApprovalAuditEventType | '')} value={eventType}>
              <option value="">全部类型</option>
              {approvalAuditEventTypes.map((item) => <option key={item} value={item}>{approvalAuditEventTypeLabel(item)}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-xs text-muted-foreground">事件状态</span>
            <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setEventStatus(event.target.value as ApprovalAuditEventStatus | '')} value={eventStatus}>
              <option value="">全部状态</option>
              {approvalAuditEventStatuses.map((item) => <option key={item} value={item}>{approvalAuditStatusLabel(item)}</option>)}
            </select>
          </label>
          <label className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <input checked={traceOnly} onChange={(event) => setTraceOnly(event.target.checked)} type="checkbox" />
            只归档带 Trace 的事件
          </label>
        </div>
      </Card>

      <Card className="grid gap-4 p-5">
        <div>
          <h2 className="text-sm font-semibold">执行操作</h2>
          <p className="mt-1 text-sm text-muted-foreground">CSV 导出直接下载，生成归档会写入对象存储并进入归档中心。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={csvState === 'exporting'} onClick={() => void handleExport()} type="button" variant="outline">
            <Download className="size-4" />
            {csvState === 'exporting' ? '正在导出' : '导出 CSV'}
          </Button>
          <Button disabled={createArchiveMutation.isPending} onClick={() => createArchiveMutation.mutate()} type="button">
            <Archive className="size-4" />
            {createArchiveMutation.isPending ? '正在生成' : '生成归档'}
          </Button>
        </div>
        {csvState === 'success' ? <Feedback tone="success" text="当前筛选条件下的审批审计事件已导出。" /> : null}
        {csvState === 'error' ? <Feedback tone="error" text="审批审计事件导出失败，请稍后重试。" /> : null}
        {createArchiveMutation.isSuccess ? (
          <Feedback
            tone="success"
            text={`已生成归档 ${createArchiveMutation.data.item.file_name}，大小 ${formatBytes(createArchiveMutation.data.item.size_bytes)}。`}
          />
        ) : null}
        {createArchiveMutation.isError ? <Feedback tone="error" text={createArchiveMutation.error.message} /> : null}
      </Card>
    </main>
  );
}

function Feedback({ text, tone }: { text: string; tone: 'success' | 'error' }) {
  const className = tone === 'success'
    ? 'rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700'
    : 'rounded-md border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive';
  return <div className={className}>{text}</div>;
}

