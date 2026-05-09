'use client';

import type { AgentTeamRunSummary, AgentTeamStepItem } from '@aiaget/shared-types';
import { BrainCircuit, GitBranch, Workflow } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { formatInteger, formatLatency } from '@/components/agent-teams/agent-teams-shared';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';

type TraceNodeKind = 'run' | 'step' | 'child_step' | 'model_call';

interface TraceGraphNode {
  id: string;
  kind: TraceNodeKind;
  title: string;
  status: string;
  traceId: string | null;
  spanId: string | null;
  parentSpanId: string | null;
  latencyMs: number;
  totalTokens: number;
  parentFound: boolean;
}

export function AgentTeamRunTraceGraph({
  run,
  steps,
}: {
  run: AgentTeamRunSummary;
  steps: AgentTeamStepItem[];
}) {
  const graph = useMemo(() => buildTraceGraph(run, steps), [run, steps]);

  if (graph.nodes.length === 0) {
    return (
      <section className="rounded-lg border bg-background/85 p-5 shadow-sm backdrop-blur">
        <div className="flex items-center gap-2">
          <GitBranch className="size-4 text-primary" />
          <h2 className="text-sm font-semibold">运行内 Trace 图谱</h2>
        </div>
        <EmptyState className="mt-4 rounded-md border bg-muted/20 p-8" description="当前运行还没有可用于绘制关系图的 trace_id、span_id 或 parent_span_id。" title="暂无 Trace 关系" />
      </section>
    );
  }

  return (
    <section className="rounded-lg border bg-background/85 p-5 shadow-sm backdrop-blur">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">运行内 Trace 图谱</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">基于当前团队运行台账里的 trace_id、span_id、parent_span_id 构建轻量关系视图，完整链路仍跳转监控中心。</p>
        </div>
        {run.trace_id ? (
          <Button asChild size="sm" variant="outline">
            <Link href={`/monitor/traces/${encodeURIComponent(run.trace_id)}`}>打开监控 Trace</Link>
          </Button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <MetricCard helper="运行、步骤、子事件" label="节点" value={formatInteger(graph.nodes.length)} />
        <MetricCard helper="parent_span_id 命中" label="已连接" value={formatInteger(graph.linkedCount)} />
        <MetricCard helper="没有父 Span" label="根节点" value={formatInteger(graph.rootCount)} />
        <MetricCard helper="父 Span 未在运行内出现" label="孤立节点" value={formatInteger(graph.orphanCount)} />
      </div>

      <div className="mt-4 grid gap-3">
        {graph.nodes.map((node) => (
          <div className="grid gap-3 rounded-lg border bg-muted/15 p-4 md:grid-cols-[24px_minmax(0,1fr)_auto]" key={node.id}>
            <div className="flex size-6 items-center justify-center rounded-full border bg-background text-xs">{nodeIcon(node.kind)}</div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{node.title}</span>
                <StatusBadge tone={nodeTone(node.status)}>{node.status}</StatusBadge>
                <StatusBadge tone="planned">{nodeKindLabel(node.kind)}</StatusBadge>
                {!node.parentSpanId ? <StatusBadge tone="ready">根节点</StatusBadge> : node.parentFound ? <StatusBadge tone="healthy">已连接</StatusBadge> : <StatusBadge tone="degraded">孤立节点</StatusBadge>}
              </div>
              <div className="mt-2 grid gap-1 text-xs text-muted-foreground md:grid-cols-3">
                <span className="break-all">Trace：{node.traceId ?? '-'}</span>
                <span className="break-all">Span：{node.spanId ?? '-'}</span>
                <span className="break-all">Parent：{node.parentSpanId ?? '-'}</span>
                <span>耗时：{formatLatency(node.latencyMs)}</span>
                <span>Token：{formatInteger(node.totalTokens)}</span>
              </div>
            </div>
            {node.traceId ? (
              <Button asChild size="sm" variant="outline">
                <Link href={`/monitor/traces/${encodeURIComponent(node.traceId)}`}>监控</Link>
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function buildTraceGraph(run: AgentTeamRunSummary, steps: AgentTeamStepItem[]) {
  const nodes: TraceGraphNode[] = [];

  if (run.trace_id) {
    nodes.push({
      id: `run:${run.id}`,
      kind: 'run',
      title: '团队运行',
      status: run.status,
      traceId: run.trace_id,
      spanId: null,
      parentSpanId: null,
      latencyMs: run.latency_ms,
      totalTokens: run.total_tokens,
      parentFound: false,
    });
  }

  steps.forEach((step) => {
    if (step.trace_id || step.span_id || step.parent_span_id) {
      nodes.push({
        id: `step:${step.id}`,
        kind: 'step',
        title: step.title,
        status: step.status,
        traceId: step.trace_id,
        spanId: step.span_id,
        parentSpanId: step.parent_span_id,
        latencyMs: step.duration_ms,
        totalTokens: step.total_tokens,
        parentFound: false,
      });
    }

    step.child_steps.forEach((childStep) => {
      if (!childStep.trace_id && !childStep.span_id && !childStep.parent_span_id) return;
      nodes.push({
        id: `child:${step.id}:${childStep.id}`,
        kind: 'child_step',
        title: childStep.title,
        status: childStep.status,
        traceId: childStep.trace_id ?? step.trace_id,
        spanId: childStep.span_id ?? null,
        parentSpanId: childStep.parent_span_id ?? step.span_id,
        latencyMs: childStep.latency_ms ?? 0,
        totalTokens: childStep.total_tokens ?? 0,
        parentFound: false,
      });
    });

    if (step.model_call?.trace_id || step.trace_id) {
      nodes.push({
        id: `model:${step.id}`,
        kind: 'model_call',
        title: step.model_call?.request_model ?? '模型调用',
        status: step.model_call?.status ?? step.status,
        traceId: step.model_call?.trace_id ?? step.trace_id,
        spanId: null,
        parentSpanId: step.span_id,
        latencyMs: step.model_call?.latency_ms ?? 0,
        totalTokens: step.model_call?.total_tokens ?? 0,
        parentFound: false,
      });
    }
  });

  const spanIds = new Set(nodes.map((node) => node.spanId).filter(Boolean));
  const normalizedNodes = nodes.map((node) => ({
    ...node,
    parentFound: Boolean(node.parentSpanId && spanIds.has(node.parentSpanId)),
  }));

  return {
    nodes: normalizedNodes,
    linkedCount: normalizedNodes.filter((node) => node.parentFound).length,
    orphanCount: normalizedNodes.filter((node) => node.parentSpanId && !node.parentFound).length,
    rootCount: normalizedNodes.filter((node) => !node.parentSpanId).length,
  };
}

function nodeKindLabel(kind: TraceNodeKind) {
  return ({ run: '运行', step: '步骤', child_step: '子事件', model_call: '模型调用' } as const)[kind];
}

function nodeTone(status: string) {
  if (status === 'SUCCESS' || status === 'done') return 'healthy';
  if (status === 'FAILED' || status === 'failed' || status === 'CANCELLED') return 'unavailable';
  if (status === 'WAITING_HUMAN') return 'degraded';
  return 'planned';
}

function nodeIcon(kind: TraceNodeKind) {
  if (kind === 'model_call') return <BrainCircuit className="size-3.5 text-primary" />;
  if (kind === 'run') return <GitBranch className="size-3.5 text-primary" />;
  return <Workflow className="size-3.5 text-primary" />;
}
