'use client';

import { useQuery } from '@tanstack/react-query';
import type { AgentTeamModelCallItem, AgentTeamStepItem, ConversationReferenceItem, ConversationRunStepItem, ConversationToolCallItem } from '@aiaget/shared-types';
import { ArrowLeft, BrainCircuit, Database, GitBranch, MessageSquare, Timer, Workflow, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import {
  AgentTeamMetricTile,
  DetailRow,
  ErrorPanel,
  formatDateTime,
  formatInteger,
  formatLatency,
  formatMoney,
  LoadingPanel,
  teamRunStatusLabel,
  teamRunStatusTone,
} from '@/components/agent-teams/agent-teams-shared';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { getAgentTeam } from '@/lib/api-client';

type StepEventType = 'child_steps' | 'references' | 'tool_calls' | 'model_call';

type StepEvent =
  | { id: string; type: 'child_steps'; title: string; item: ConversationRunStepItem }
  | { id: string; type: 'references'; title: string; item: ConversationReferenceItem }
  | { id: string; type: 'tool_calls'; title: string; item: ConversationToolCallItem }
  | { id: string; type: 'model_call'; title: string; item: AgentTeamModelCallItem };

export function AgentTeamRunStepDetailContent({
  runId,
  selectedEventId,
  selectedEventType,
  stepId,
  teamId,
}: {
  runId: string;
  selectedEventId?: string;
  selectedEventType?: string;
  stepId: string;
  teamId: string;
}) {
  const teamQuery = useQuery({
    queryKey: ['agent-team', teamId],
    queryFn: () => getAgentTeam(teamId),
  });

  const team = teamQuery.data;
  const run = useMemo(() => team?.runs.find((item) => item.id === runId) ?? null, [runId, team?.runs]);
  const step = useMemo(() => team?.steps.find((item) => item.id === stepId && item.run_id === runId) ?? null, [runId, stepId, team?.steps]);
  const events = useMemo(() => (step ? buildStepEvents(step) : []), [step]);
  const selectedEvent = useMemo(
    () => pickSelectedEvent(events, selectedEventType, selectedEventId),
    [events, selectedEventId, selectedEventType],
  );

  if (teamQuery.isLoading) {
    return <main className="mx-auto max-w-[1680px] px-4 py-5 lg:px-7"><LoadingPanel text="正在加载步骤详情" /></main>;
  }

  if (teamQuery.isError || !team) {
    return (
      <main className="mx-auto grid max-w-[1680px] gap-4 px-4 py-5 lg:px-7">
        <Button asChild className="w-fit" variant="outline"><Link href={`/agent-teams/${teamId}/runs/${runId}`}><ArrowLeft className="size-4" />运行详情</Link></Button>
        <ErrorPanel text="步骤详情加载失败。" />
      </main>
    );
  }

  if (!run || !step) {
    return (
      <main className="mx-auto grid max-w-[1680px] gap-4 px-4 py-5 lg:px-7">
        <Button asChild className="w-fit" variant="outline"><Link href={`/agent-teams/${teamId}/runs/${runId}`}><ArrowLeft className="size-4" />运行详情</Link></Button>
        <EmptyState title="步骤记录不存在" />
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-[1680px] gap-5 px-4 py-5 lg:px-7">
      <section className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline"><Link href={`/agent-teams/${teamId}/runs/${runId}`}><ArrowLeft className="size-4" />运行详情</Link></Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">步骤详情</StatusBadge>
            <StatusBadge tone={step.status === 'SUCCESS' ? 'healthy' : step.status === 'FAILED' ? 'unavailable' : 'planned'}>{step.status}</StatusBadge>
            <StatusBadge tone={teamRunStatusTone(run.status)}>{teamRunStatusLabel(run.status)}</StatusBadge>
          </div>
          <h1 className="break-words text-2xl font-semibold">{step.title}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {step.trace_id ? (
            <Button asChild variant="outline"><Link href={`/monitor/traces/${step.trace_id}`}>Trace</Link></Button>
          ) : null}
          <Button asChild variant="outline"><Link href={`/agent-teams/${teamId}/members`}><GitBranch className="size-4" />成员</Link></Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AgentTeamMetricTile helper={step.agent_name ?? undefined} label="执行成员" value={step.agent_code ?? '-'} />
        <AgentTeamMetricTile label="Token" value={formatInteger(step.total_tokens)} />
        <AgentTeamMetricTile label="延迟" value={formatLatency(step.duration_ms)} />
        <AgentTeamMetricTile label="成本" value={formatMoney(step.cost_total)} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-4">
          <section className="rounded-xl border border-slate-200/80 bg-white/[0.9] p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-2">
              <Workflow className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">基础信息</h2>
            </div>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <DetailRow label="步骤类型" value={step.step_type} />
              <DetailRow label="执行 Agent" value={step.agent_name ? `${step.agent_name} (${step.agent_code ?? '-'})` : '-'} />
              <DetailRow label="输入摘要" value={step.input_summary ?? '-'} />
              <DetailRow label="输出摘要" value={step.output_summary ?? '-'} />
              <DetailRow label="Trace ID" value={step.trace_id ?? '-'} />
              <DetailRow label="Span / Parent Span" value={`${step.span_id ?? '-'} / ${step.parent_span_id ?? '-'}`} />
              <DetailRow label="开始时间" value={formatDateTime(step.started_at)} />
              <DetailRow label="结束时间" value={formatDateTime(step.ended_at)} />
            </div>
            {step.error_message ? <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{step.error_message}</div> : null}
          </section>

          <section className="rounded-xl border border-slate-200/80 bg-white/[0.9] p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-2">
              <Workflow className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">成员内部事件</h2>
            </div>
            {events.length === 0 ? (
              <EmptyState className="mt-4 rounded-md border bg-muted/20 p-8" title="暂无子事件" />
            ) : (
              <div className="mt-4 grid gap-3">
                {events.map((event) => (
                  <StepEventCard
                    event={event}
                    href={stepEventHref(teamId, runId, step.id, event)}
                    isSelected={selectedEvent?.type === event.type && selectedEvent.id === event.id}
                    key={`${event.type}:${event.id}`}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="grid content-start gap-4">
          <section className="rounded-xl border border-slate-200/80 bg-white/[0.9] p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">子事件详情</h2>
            </div>
            {selectedEvent ? (
              <SelectedStepEvent event={selectedEvent} />
            ) : (
              <EmptyState className="mt-4 rounded-md border bg-muted/20 p-8" title="请选择子事件" />
            )}
          </section>

          <section className="rounded-xl border border-slate-200/80 bg-white/[0.9] p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-2">
              <Timer className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">运行上下文</h2>
            </div>
            <div className="mt-4 grid gap-3 text-sm">
              <DetailRow label="团队" value={team.name} />
              <DetailRow label="运行目标" value={run.objective} />
              <DetailRow label="运行状态" value={teamRunStatusLabel(run.status)} />
              <DetailRow label="步骤创建" value={formatDateTime(step.created_at)} />
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

function buildStepEvents(step: AgentTeamStepItem): StepEvent[] {
  return [
    ...step.child_steps.map((item) => ({ id: item.id, type: 'child_steps' as const, title: item.title, item })),
    ...step.references.map((item) => ({ id: item.id, type: 'references' as const, title: item.title, item })),
    ...step.tool_calls.map((item, index) => ({ id: toolCallEventId(item, index), type: 'tool_calls' as const, title: item.tool_name, item })),
    ...(step.model_call ? [{ id: modelCallEventId(step), type: 'model_call' as const, title: step.model_call.request_model, item: step.model_call }] : []),
  ];
}

function pickSelectedEvent(events: StepEvent[], selectedEventType?: string, selectedEventId?: string) {
  if (!selectedEventType && !selectedEventId) return events[0] ?? null;
  const typedEventType = isStepEventType(selectedEventType) ? selectedEventType : null;
  return events.find((event) => (!typedEventType || event.type === typedEventType) && (!selectedEventId || event.id === selectedEventId)) ?? events[0] ?? null;
}

function isStepEventType(value?: string): value is StepEventType {
  return value === 'child_steps' || value === 'references' || value === 'tool_calls' || value === 'model_call';
}

function toolCallEventId(item: ConversationToolCallItem, index: number) {
  return `${item.tool_id || item.tool_code || 'tool'}-${index}`;
}

function modelCallEventId(step: AgentTeamStepItem) {
  return step.model_call?.trace_id ?? step.trace_id ?? 'model-call';
}

function stepEventHref(teamId: string, runId: string, stepId: string, event: StepEvent) {
  const params = new URLSearchParams({ eventType: event.type, eventId: event.id });
  return `/agent-teams/${teamId}/runs/${runId}/steps/${stepId}?${params.toString()}`;
}

function StepEventCard({ event, href, isSelected }: { event: StepEvent; href: string; isSelected: boolean }) {
  return (
    <Link className={`rounded-lg border p-4 transition-colors ${isSelected ? 'border-primary/40 bg-primary/5' : 'bg-muted/15 hover:bg-muted/35'}`} href={href}>
      <div className="flex flex-wrap items-center gap-2">
        {eventIcon(event.type)}
        <span className="font-medium">{event.title}</span>
        <StatusBadge tone={eventTone(event)}>{eventTypeLabel(event.type)}</StatusBadge>
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{eventSummary(event)}</p>
      <div className="mt-3 text-xs text-muted-foreground">子事件详情</div>
    </Link>
  );
}

function SelectedStepEvent({ event }: { event: StepEvent }) {
  if (event.type === 'child_steps') {
    const item = event.item;
    return (
      <div className="mt-4 grid gap-3 text-sm">
        <DetailRow label="事件类型" value={item.type} />
        <DetailRow label="状态" value={item.status} />
        <DetailRow label="摘要" value={item.summary || '-'} />
        <DetailRow label="Trace / Span" value={`${item.trace_id ?? '-'} / ${item.span_id ?? '-'}`} />
        <DetailRow label="模型 / 工具 / 检索" value={`${item.request_model ?? '-'} / ${item.tool_name ?? '-'} / ${item.retrieval_mode ?? '-'}`} />
        <DetailRow label="Token / 成本" value={`${formatInteger(item.total_tokens ?? 0)} / ${formatMoney(item.cost_total ?? 0)}`} />
        <DetailRow label="耗时 / 条目" value={`${formatLatency(item.latency_ms ?? 0)} / ${formatInteger(item.item_count ?? 0)}`} />
      </div>
    );
  }

  if (event.type === 'references') {
    const item = event.item;
    return (
      <div className="mt-4 grid gap-3 text-sm">
        <DetailRow label="标题" value={item.title} />
        <DetailRow label="来源类型" value={item.source_type ?? '知识库'} />
        <DetailRow label="Score" value={item.score === null ? '-' : String(item.score)} />
        <DetailRow label="引用片段" value={item.snippet || '-'} />
      </div>
    );
  }

  if (event.type === 'tool_calls') {
    const item = event.item;
    return (
      <div className="mt-4 grid gap-3 text-sm">
        <DetailRow label="工具" value={`${item.tool_name} (${item.tool_code})`} />
        <DetailRow label="状态" value={item.status} />
        <DetailRow label="响应状态" value={item.response_status === null ? '-' : String(item.response_status)} />
        <DetailRow label="审批请求" value={item.approval_request_id ?? '-'} />
        <DetailRow label="耗时" value={formatLatency(item.latency_ms)} />
        <DetailRow label="输出预览" value={item.output_preview ?? item.error_message ?? '-'} />
      </div>
    );
  }

  const item = event.item;
  return (
    <div className="mt-4 grid gap-3 text-sm">
      <DetailRow label="模型" value={item.request_model} />
      <DetailRow label="状态" value={item.status} />
      <DetailRow label="Trace ID" value={item.trace_id ?? '-'} />
      <DetailRow label="Prompt / Completion" value={`${formatInteger(item.prompt_tokens)} / ${formatInteger(item.completion_tokens)}`} />
      <DetailRow label="总 Token / 耗时" value={`${formatInteger(item.total_tokens)} / ${formatLatency(item.latency_ms)}`} />
      <DetailRow label="输出预览" value={item.output_preview ?? item.error_message ?? '-'} />
    </div>
  );
}

function eventTypeLabel(type: StepEventType) {
  return ({ child_steps: '成员内部事件', references: '知识引用', tool_calls: '工具调用', model_call: '模型调用' } as const)[type];
}

function eventSummary(event: StepEvent) {
  if (event.type === 'child_steps') return event.item.summary || '-';
  if (event.type === 'references') return event.item.snippet || '-';
  if (event.type === 'tool_calls') return event.item.output_preview ?? event.item.error_message ?? '-';
  return event.item.output_preview ?? event.item.error_message ?? '-';
}

function eventTone(event: StepEvent) {
  if (event.type === 'child_steps') return event.item.status === 'done' ? 'healthy' : event.item.status === 'failed' ? 'unavailable' : 'planned';
  if (event.type === 'tool_calls') return event.item.status === 'SUCCESS' ? 'healthy' : event.item.status === 'FAILED' ? 'unavailable' : 'degraded';
  if (event.type === 'model_call') return event.item.status === 'SUCCESS' ? 'healthy' : 'unavailable';
  return 'planned';
}

function eventIcon(type: StepEventType) {
  if (type === 'references') return <Database className="size-4 text-primary" />;
  if (type === 'tool_calls') return <Wrench className="size-4 text-primary" />;
  if (type === 'model_call') return <BrainCircuit className="size-4 text-primary" />;
  return <Workflow className="size-4 text-primary" />;
}
