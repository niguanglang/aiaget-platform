'use client';

import type { TestToolResult, ToolDetail } from '@aiaget/shared-types';
import { Send } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';

import { stringifyJson } from './tool-json';
import {
  formatLatency,
  toolCallStatusLabel,
  toolStatusTone,
} from './tool-status';

export function ToolTestPanel({
  canExecute,
  error,
  inputText,
  onChangeInput,
  onLoadDefaults,
  onRun,
  pending,
  result,
  tool,
}: {
  canExecute: boolean;
  error: string | null;
  inputText: string;
  onChangeInput: (value: string) => void;
  onLoadDefaults: () => void;
  onRun: () => void;
  pending: boolean;
  result: TestToolResult | null;
  tool: ToolDetail;
}) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">测试面板</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            使用 JSON 输入运行真实 HTTP 测试，并将结果记录为调用日志。
          </p>
        </div>
        <Button onClick={onLoadDefaults} size="sm" type="button" variant="outline">
          加载默认值
        </Button>
      </div>

      <textarea
        className="min-h-56 resize-y rounded-md border bg-slate-950 px-3 py-3 font-mono text-sm leading-6 text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onChange={(event) => onChangeInput(event.target.value)}
        spellCheck={false}
        value={inputText}
      />
      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      <Button disabled={!canExecute || pending || tool.status !== 'ACTIVE'} onClick={onRun} type="button">
        <Send className="size-4" />
        运行测试
      </Button>

      {result ? (
        <div className="rounded-md border bg-muted/25 p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">最新测试结果</h3>
            <StatusBadge tone={toolStatusTone(result.status)}>{toolCallStatusLabel(result.status)}</StatusBadge>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {result.response_status ? `HTTP ${result.response_status}` : '无响应状态'} · {formatLatency(result.latency_ms)}
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {result.approval_required
              ? '当前工具为高风险并要求审批，本次测试已创建审批请求。'
              : result.error_message ?? '测试调用已完成。'}
          </p>
          <div className="mt-4 grid gap-3 xl:grid-cols-2">
            <PreviewCard title="请求体" value={result.request_body} />
            <PreviewCard title="响应体" value={result.response_body} />
          </div>
          {result.approval_request_id ? (
            <div className="mt-4">
              <Button asChild size="sm" variant="outline">
                <Link href={`/approvals?requestId=${result.approval_request_id}`}>打开审批请求</Link>
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}

function PreviewCard({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="mb-2 text-xs font-medium text-muted-foreground">{title}</div>
      <pre className="max-h-52 overflow-auto whitespace-pre-wrap break-words text-xs leading-5">
        {stringifyJson(value, 'null')}
      </pre>
    </div>
  );
}
