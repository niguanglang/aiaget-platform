'use client';

import type { ToolDetail } from '@aiaget/shared-types';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';

import {
  formatDateTime,
  formatLatency,
  toolCallStatusLabel,
  toolStatusTone,
} from './tool-status';

export function ToolCallLogsCard({ logs }: { logs: ToolDetail['call_logs'] }) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">调用日志</h2>
        <span className="text-xs text-muted-foreground">{logs.length} 条</span>
      </div>
      {logs.length === 0 ? (
        <EmptyState description="运行测试后会在这里看到最新调用日志。" title="暂无调用日志" />
      ) : (
        <div className="grid max-h-[620px] gap-3 overflow-auto pr-1">
          {logs.map((log) => (
            <div className="rounded-md border bg-muted/20 p-3" key={log.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StatusBadge tone={toolStatusTone(log.status)}>{toolCallStatusLabel(log.status)}</StatusBadge>
                  <span className="text-xs text-muted-foreground">{log.request_method}</span>
                </div>
                <span className="text-xs text-muted-foreground">{formatDateTime(log.created_at)}</span>
              </div>
              <div className="mt-2 text-sm font-medium">{log.request_url}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {log.response_status ? `HTTP ${log.response_status}` : '无响应状态'} · {formatLatency(log.latency_ms)} · 操作人 {log.created_by?.email ?? '系统'}
              </div>
              {log.error_message ? <p className="mt-2 text-xs text-destructive">{log.error_message}</p> : null}
              {log.approval_request_id ? (
                <div className="mt-3">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/approvals?requestId=${log.approval_request_id}`}>打开审批请求</Link>
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
