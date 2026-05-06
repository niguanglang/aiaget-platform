'use client';

import type { ConversationRunItem } from '@aiaget/shared-types';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';

import {
  conversationRunStatusLabel,
  conversationStatusTone,
  formatDateTime,
  formatLatency,
} from './conversation-status';

export function ConversationRunTraceCard({ runs }: { runs: ConversationRunItem[] }) {
  return (
    <Card className="grid gap-4 p-5">
      <h2 className="text-sm font-semibold">运行轨迹</h2>
      {runs.length === 0 ? (
        <EmptyState description="发送消息后会在这里看到最近运行轨迹。" title="暂无运行记录" />
      ) : (
        <div className="grid max-h-[620px] gap-4 overflow-auto pr-1">
          {runs.map((run) => (
            <div className="rounded-md border bg-muted/20 p-3" key={run.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StatusBadge tone={conversationStatusTone(run.status)}>{conversationRunStatusLabel(run.status)}</StatusBadge>
                  <span className="text-xs text-muted-foreground">{run.request_model ?? '未返回模型标识'}</span>
                </div>
                <span className="text-xs text-muted-foreground">{formatDateTime(run.created_at)}</span>
              </div>
              <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                <span>延迟 {formatLatency(run.latency_ms)}</span>
                <span>输入 {run.prompt_tokens}</span>
                <span>输出 {run.completion_tokens}</span>
              </div>
              {run.cost_total ? (
                <div className="mt-1 text-xs text-muted-foreground">总成本 {run.cost_total.toFixed(6)}</div>
              ) : null}
              {run.error_message ? <p className="mt-2 text-xs text-destructive">{run.error_message}</p> : null}
              <div className="mt-3 grid gap-2">
                {run.steps.map((step) => (
                  <div className="rounded-md border bg-background px-3 py-2" key={step.id}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{step.title}</span>
                      <span className="text-xs text-muted-foreground">{step.status}</span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{step.summary}</p>
                    <StepMetaRow step={step} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function StepMetaRow({ step }: { step: ConversationRunItem['steps'][number] }) {
  const items = [
    step.request_model ? `模型 ${step.request_model}` : null,
    step.tool_name ? `工具 ${step.tool_name}` : null,
    step.retrieval_mode ? `检索 ${step.retrieval_mode}` : null,
    step.response_status ? `HTTP ${step.response_status}` : null,
    step.item_count !== undefined && step.item_count !== null ? `数量 ${step.item_count}` : null,
    step.latency_ms !== undefined && step.latency_ms !== null ? `延迟 ${formatLatency(step.latency_ms)}` : null,
    step.prompt_tokens !== undefined && step.prompt_tokens !== null ? `输入 ${step.prompt_tokens}` : null,
    step.completion_tokens !== undefined && step.completion_tokens !== null ? `输出 ${step.completion_tokens}` : null,
    step.cost_total ? `成本 ${step.cost_total.toFixed(6)}` : null,
  ].filter(Boolean);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {items.map((item) => (
        <span className="rounded-md border bg-muted/20 px-2 py-1 text-[11px] text-muted-foreground" key={item}>
          {item}
        </span>
      ))}
    </div>
  );
}
