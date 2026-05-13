'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AgentTeamRunSummary, AgentTeamStepItem } from '@aiaget/shared-types';
import { Activity, ArrowLeft, BrainCircuit, Database, Eye, FileArchive, GitBranch, MessageSquare, Timer, Workflow, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { AgentTeamConfirmDialog } from '@/components/agent-teams/agent-team-confirm-dialog';
import { AgentTeamRunTraceGraph } from '@/components/agent-teams/agent-team-run-trace-graph';
import {
  DetailRow,
  ErrorPanel,
  formatDateTime,
  formatInteger,
  formatLatency,
  formatMoney,
  handoffStatusLabel,
  handoffStatusTone,
  LoadingPanel,
  teamRunStatusLabel,
  teamRunStatusTone,
} from '@/components/agent-teams/agent-teams-shared';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  createAgentTeamRunReportArchive,
  exportAgentTeamRunReport,
  getAgentTeam,
  type ApiClientError,
} from '@/lib/api-client';
import { cn } from '@/lib/utils';

type ConfirmTarget = { type: 'ARCHIVE'; run: AgentTeamRunSummary };
type RunReplayMetrics = {
  childEvents: number;
  completedSteps: number;
  cost: number;
  durationMs: number;
  failedSteps: number;
  modelCalls: number;
  outputSummary: string;
  references: number;
  steps: number;
  tokens: number;
  toolCalls: number;
};
type MemberReplayAggregate = {
  code: string | null;
  cost: number;
  durationMs: number;
  key: string;
  modelCalls: number;
  name: string;
  outputSummary: string;
  references: number;
  steps: number;
  tokens: number;
  toolCalls: number;
};
type MemberReplayRow = {
  current: MemberReplayAggregate | null;
  key: string;
  name: string;
  previous: MemberReplayAggregate | null;
};

export function AgentTeamRunDetailContent({ teamId, runId }: { teamId: string; runId: string }) {
  const queryClient = useQueryClient();
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const teamQuery = useQuery({
    queryKey: ['agent-team', teamId],
    queryFn: () => getAgentTeam(teamId),
  });

  const exportMutation = useMutation({
    mutationFn: ({ run, fileName }: { run: AgentTeamRunSummary; fileName: string }) => exportAgentTeamRunReport(run.id).then((blob) => ({ blob, fileName })),
    onSuccess: ({ blob, fileName }) => downloadBlob(blob, fileName),
    onError: (error: ApiClientError) => setActionError(error.message),
  });
  const archiveMutation = useMutation({
    mutationFn: (targetRunId: string) => createAgentTeamRunReportArchive(targetRunId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['agent-team-run-report-archives'] });
      setConfirmTarget(null);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const team = teamQuery.data;
  const sortedRuns = useMemo(() => [...(team?.runs ?? [])].sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at)), [team?.runs]);
  const run = useMemo(() => sortedRuns.find((item) => item.id === runId) ?? null, [runId, sortedRuns]);
  const previousRun = useMemo(() => {
    if (!run) return null;
    const index = sortedRuns.findIndex((item) => item.id === run.id);
    return index >= 0 ? sortedRuns[index + 1] ?? null : null;
  }, [run, sortedRuns]);
  const steps = useMemo(() => {
    if (!run) return [];
    return filterRunSteps(run, team?.steps ?? []).sort((left, right) => Date.parse(left.created_at) - Date.parse(right.created_at));
  }, [run, team?.steps]);
  const previousSteps = useMemo(() => {
    if (!previousRun) return [];
    return filterRunSteps(previousRun, team?.steps ?? []).sort((left, right) => Date.parse(left.created_at) - Date.parse(right.created_at));
  }, [previousRun, team?.steps]);
  const replayMetrics = useMemo(() => (run ? buildRunReplayMetrics(run, steps) : null), [run, steps]);
  const previousReplayMetrics = useMemo(() => (previousRun ? buildRunReplayMetrics(previousRun, previousSteps) : null), [previousRun, previousSteps]);
  const memberReplayRows = useMemo(() => buildMemberReplayRows(steps, previousSteps), [steps, previousSteps]);
  const handoffs = useMemo(() => {
    return [...(team?.handoffs ?? [])]
      .filter((handoff) => handoff.run_id === runId)
      .sort((left, right) => Date.parse(left.created_at) - Date.parse(right.created_at));
  }, [runId, team?.handoffs]);
  const feedback = useMemo(() => {
    return [...(team?.feedback ?? [])]
      .filter((item) => item.run_id === runId)
      .sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at));
  }, [runId, team?.feedback]);

  if (teamQuery.isLoading) {
    return <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6"><LoadingPanel text="正在加载运行详情..." /></main>;
  }

  if (teamQuery.isError || !team) {
    return (
      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-6 lg:px-6">
        <Button asChild className="w-fit" variant="outline"><Link href={`/agent-teams/${teamId}/runs`}><ArrowLeft className="size-4" />运行记录</Link></Button>
        <ErrorPanel text="运行详情加载失败。" />
      </main>
    );
  }

  if (!run) {
    return (
      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-6 lg:px-6">
        <Button asChild className="w-fit" variant="outline"><Link href={`/agent-teams/${teamId}/runs`}><ArrowLeft className="size-4" />运行记录</Link></Button>
        <EmptyState description="当前团队下没有找到这条运行记录，可能已被归档或筛选数据尚未同步。" title="运行记录不存在" />
      </main>
    );
  }

  const currentReplayMetrics = replayMetrics ?? buildRunReplayMetrics(run, steps);

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <section className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline"><Link href={`/agent-teams/${teamId}/runs`}><ArrowLeft className="size-4" />运行记录</Link></Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">运行详情</StatusBadge>
            <StatusBadge tone={teamRunStatusTone(run.status)}>{teamRunStatusLabel(run.status)}</StatusBadge>
          </div>
          <h1 className="break-words text-2xl font-semibold">{run.objective}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">步骤时间线、接力记录、反馈记录、Trace 关联和报告动作。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={exportMutation.isPending}
            onClick={() => exportMutation.mutate({ run, fileName: reportFileName(team.code, run) })}
            type="button"
            variant="outline"
          >
            <FileArchive className="size-4" />导出报告
          </Button>
          <Button disabled={archiveMutation.isPending} onClick={() => setConfirmTarget({ type: 'ARCHIVE', run })} type="button">
            <FileArchive className="size-4" />生成归档
          </Button>
        </div>
      </section>

      {actionError ? <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{actionError}</div> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard helper="完成 / 全部" label="步骤进度" value={`${formatInteger(run.completed_steps)}/${formatInteger(run.total_steps)}`} />
        <MetricCard helper="失败步骤" label="异常" value={formatInteger(run.failed_steps)} />
        <MetricCard helper="模型消耗" label="Token" value={formatInteger(run.total_tokens)} />
        <MetricCard helper={formatLatency(run.latency_ms)} label="成本" value={formatMoney(run.total_cost)} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-lg border bg-background/85 p-5 shadow-sm backdrop-blur">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
            <div>
              <div className="flex items-center gap-2">
                <FileArchive className="size-4 text-primary" />
                <h2 className="text-sm font-semibold">审计报告导出</h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">CSV 审计报告包含团队信息、运行摘要、成员步骤和运行内事件。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button disabled={exportMutation.isPending} onClick={() => exportMutation.mutate({ run, fileName: reportFileName(team.code, run) })} size="sm" type="button" variant="outline">
                <FileArchive className="size-4" />导出报告
              </Button>
              <Button disabled={archiveMutation.isPending} onClick={() => setConfirmTarget({ type: 'ARCHIVE', run })} size="sm" type="button">
                <FileArchive className="size-4" />生成归档
              </Button>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xs font-medium text-muted-foreground">报告覆盖范围</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {['运行摘要', '步骤', '内部事件', '知识引用', '工具调用', '模型调用', '接力记录', '反馈记录'].map((label) => (
                <StatusBadge key={label} tone="planned">{label}</StatusBadge>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
            <DetailRow label="运行 ID" value={run.id} />
            <DetailRow label="Trace" value={run.trace_id ?? '-'} />
            <DetailRow label="导出格式" value="CSV / UTF-8" />
          </div>
        </section>

        <section className="rounded-lg border bg-background/85 p-5 shadow-sm backdrop-blur">
          <div className="flex items-center gap-2">
            <Workflow className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">当前运行回放</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">基于当前运行步骤、成员内部事件、RAG、工具调用和模型调用聚合关键执行信号。</p>
          <div className="mt-4 grid gap-2 text-sm">
            <DetailRow label="执行信号" value={`${formatInteger(currentReplayMetrics.steps)} 步 / ${formatInteger(currentReplayMetrics.childEvents)} 个内部事件`} />
            <DetailRow label="RAG / 工具 / 模型" value={`${formatInteger(currentReplayMetrics.references)} / ${formatInteger(currentReplayMetrics.toolCalls)} / ${formatInteger(currentReplayMetrics.modelCalls)}`} />
            <DetailRow label="Token / 成本 / 耗时" value={`${formatInteger(currentReplayMetrics.tokens)} / ${formatMoney(currentReplayMetrics.cost)} / ${formatLatency(currentReplayMetrics.durationMs)}`} />
            <DetailRow label="输出摘要" value={currentReplayMetrics.outputSummary} />
          </div>
        </section>
      </section>

      <RunComparePanel
        currentMetrics={currentReplayMetrics}
        memberRows={memberReplayRows}
        previousMetrics={previousReplayMetrics}
        previousRun={previousRun}
      />

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-4">
          <AgentTeamRunTraceGraph run={run} steps={steps} />

          <section className="rounded-lg border bg-background/85 p-5 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2">
              <Workflow className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">步骤时间线</h2>
            </div>
            {steps.length === 0 ? (
              <EmptyState className="rounded-md border bg-muted/20 p-8" description="暂无计划、成员执行、接力、校验和汇总记录。" title="暂无步骤" />
            ) : (
              <div className="mt-5 grid gap-3">
                {steps.map((step, index) => (
                  <div className="grid gap-3 rounded-lg border bg-muted/15 p-4 md:grid-cols-[32px_minmax(0,1fr)]" key={step.id}>
                    <div className={cn('flex size-8 items-center justify-center rounded-full border text-xs font-semibold', step.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700' : step.status === 'FAILED' ? 'bg-red-50 text-red-700' : 'bg-background text-muted-foreground')}>
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium">{step.title}</div>
                        <StatusBadge tone={step.status === 'SUCCESS' ? 'healthy' : step.status === 'FAILED' ? 'unavailable' : 'planned'}>{step.status}</StatusBadge>
                        <StatusBadge tone="planned">{step.step_type}</StatusBadge>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                        <DetailRow label="执行 Agent" value={step.agent_name ? `${step.agent_name} (${step.agent_code ?? '-'})` : '-'} />
                        <DetailRow label="耗时 / Token / 成本" value={`${formatLatency(step.duration_ms)} / ${formatInteger(step.total_tokens)} / ${formatMoney(step.cost_total)}`} />
                        <DetailRow label="输入摘要" value={step.input_summary ?? '-'} />
                        <DetailRow label="输出摘要" value={step.output_summary ?? '-'} />
                      </div>
                      {step.error_message ? <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{step.error_message}</div> : null}
                      <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                        <span>Trace：{step.trace_id ?? '-'}</span>
                        <span>Span：{step.span_id ?? '-'}</span>
                        <span>开始：{formatDateTime(step.started_at)}</span>
                      </div>
                      <div className="mt-3">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/agent-teams/${teamId}/runs/${runId}/steps/${step.id}`}><Eye className="size-4" />步骤详情</Link>
                        </Button>
                      </div>
                      <AgentTeamStepDrilldown runId={runId} step={step} teamId={teamId} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border bg-background/85 p-5 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2">
              <GitBranch className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">接力记录</h2>
            </div>
            {handoffs.length === 0 ? (
              <EmptyState className="rounded-md border bg-muted/20 p-8" description="暂无自动接力、人工接力和审批决策。" title="暂无接力" />
            ) : (
              <div className="mt-4 grid gap-3">
                {handoffs.map((handoff) => (
                  <div className="rounded-lg border bg-muted/15 p-4" key={handoff.id}>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={handoffStatusTone(handoff.status)}>{handoffStatusLabel(handoff.status)}</StatusBadge>
                      <span className="text-sm font-medium">{handoff.from_agent_name ?? '-'} → {handoff.to_agent_name ?? '-'}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{handoff.reason}</p>
                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                      <span>决策：{handoff.decision_note ?? '-'}</span>
                      <span>时间：{formatDateTime(handoff.decided_at ?? handoff.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="grid content-start gap-4">
          <section className="rounded-lg border bg-background/85 p-5 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">Trace 关联</h2>
            </div>
            <div className="mt-4 grid gap-3 text-sm">
              <DetailRow label="Trace ID" value={run.trace_id ?? '-'} />
              <DetailRow label="Request ID" value={run.request_id ?? '-'} />
              <DetailRow label="状态" value={teamRunStatusLabel(run.status)} />
              <DetailRow label="错误" value={run.error_message ?? '-'} />
            </div>
            {run.trace_id ? (
              <Button asChild className="mt-4 w-full" variant="outline">
                <Link href={`/monitor/traces/${run.trace_id}`}>查看 Trace</Link>
              </Button>
            ) : null}
          </section>

          <section className="rounded-lg border bg-background/85 p-5 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2">
              <Timer className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">运行时间</h2>
            </div>
            <div className="mt-4 grid gap-3 text-sm">
              <DetailRow label="创建时间" value={formatDateTime(run.created_at)} />
              <DetailRow label="开始时间" value={formatDateTime(run.started_at)} />
              <DetailRow label="结束时间" value={formatDateTime(run.ended_at)} />
              <DetailRow label="操作人" value={run.created_by ? `${run.created_by.name} (${run.created_by.email})` : '-'} />
            </div>
          </section>

          <section className="rounded-lg border bg-background/85 p-5 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">反馈记录</h2>
            </div>
            {feedback.length === 0 ? (
              <EmptyState className="rounded-md border bg-muted/20 p-8" description="团队运行反馈会显示评分、备注和提交人。" title="暂无反馈" />
            ) : (
              <div className="mt-4 grid gap-2">
                {feedback.map((item) => (
                  <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm" key={item.id}>
                    <div className="font-medium">{item.rating} 分</div>
                    <p className="mt-1 text-muted-foreground">{item.comment ?? '未填写备注'}</p>
                    <div className="mt-2 text-xs text-muted-foreground">{formatDateTime(item.created_at)}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </section>

      {confirmTarget ? (
        <AgentTeamConfirmDialog
          body={`确认生成运行「${confirmTarget.run.objective}」的报告归档？归档文件会进入报告归档中心。`}
          confirmLabel="确认生成"
          onCancel={() => setConfirmTarget(null)}
          onConfirm={() => archiveMutation.mutate(confirmTarget.run.id)}
          pending={archiveMutation.isPending}
          title="生成报告归档？"
        />
      ) : null}
    </main>
  );
}

function AgentTeamStepDrilldown({ runId, step, teamId }: { runId: string; step: AgentTeamStepItem; teamId: string }) {
  const hasChildSteps = step.child_steps.length > 0;
  const hasReferences = step.references.length > 0;
  const hasToolCalls = step.tool_calls.length > 0;
  const hasModelCall = Boolean(step.model_call);

  if (!hasChildSteps && !hasReferences && !hasToolCalls && !hasModelCall) {
    return null;
  }

  return (
    <div className="mt-4 grid gap-3 rounded-lg border bg-background/75 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone="ready">成员内部事件</StatusBadge>
        <span className="text-xs text-muted-foreground">RAG、工具和模型调用明细。</span>
      </div>

      {hasChildSteps ? (
        <section className="grid gap-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Workflow className="size-3.5" />成员内部事件
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {step.child_steps.map((childStep) => (
              <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm" key={childStep.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{childStep.title}</span>
                  <StatusBadge tone={childStep.status === 'done' ? 'healthy' : childStep.status === 'failed' ? 'unavailable' : 'planned'}>{childStep.type}</StatusBadge>
                </div>
                <p className="mt-1 line-clamp-2 text-muted-foreground">{childStep.summary || '-'}</p>
                <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
                  <span>Token / 条目 / 耗时：{formatInteger(childStep.total_tokens ?? 0)} / {formatInteger(childStep.item_count ?? 0)} / {formatLatency(childStep.latency_ms ?? 0)}</span>
                  <span>模型 / 工具 / 检索：{childStep.request_model ?? '-'} / {childStep.tool_name ?? '-'} / {childStep.retrieval_mode ?? '-'}</span>
                </div>
                <Button asChild className="mt-3" size="sm" variant="outline">
                  <Link href={stepEventHref(teamId, runId, step.id, 'child_steps', childStep.id)}>子事件详情</Link>
                </Button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {hasReferences ? (
        <section className="grid gap-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Database className="size-3.5" />知识引用
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {step.references.map((reference) => (
              <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm" key={reference.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{reference.title}</span>
                  <StatusBadge tone="planned">{reference.source_type ?? '知识库'}</StatusBadge>
                </div>
                <p className="mt-1 line-clamp-2 text-muted-foreground">{reference.snippet || '-'}</p>
                <div className="mt-2 text-xs text-muted-foreground">Score：{reference.score ?? '-'}</div>
                <Button asChild className="mt-3" size="sm" variant="outline">
                  <Link href={stepEventHref(teamId, runId, step.id, 'references', reference.id)}>子事件详情</Link>
                </Button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {hasToolCalls ? (
        <section className="grid gap-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Wrench className="size-3.5" />工具调用
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {step.tool_calls.map((toolCall, index) => (
              <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm" key={`${toolCall.tool_id}:${toolCall.tool_code}:${toolCall.latency_ms}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{toolCall.tool_name}</span>
                  <StatusBadge tone={toolCall.status === 'SUCCESS' ? 'healthy' : toolCall.status === 'FAILED' ? 'unavailable' : 'degraded'}>{toolCall.status}</StatusBadge>
                </div>
                <p className="mt-1 line-clamp-2 text-muted-foreground">{toolCall.output_preview ?? toolCall.error_message ?? '-'}</p>
                <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
                  <span>编码：{toolCall.tool_code}</span>
                  <span>响应 / 耗时：{toolCall.response_status ?? '-'} / {formatLatency(toolCall.latency_ms)}</span>
                  <span>审批：{toolCall.approval_request_id ?? '-'}</span>
                </div>
                <Button asChild className="mt-3" size="sm" variant="outline">
                  <Link href={stepEventHref(teamId, runId, step.id, 'tool_calls', toolCallEventId(toolCall, index))}>子事件详情</Link>
                </Button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {step.model_call ? (
        <section className="grid gap-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <BrainCircuit className="size-3.5" />模型调用
          </div>
          <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{step.model_call.request_model}</span>
              <StatusBadge tone={step.model_call.status === 'SUCCESS' ? 'healthy' : 'unavailable'}>{step.model_call.status}</StatusBadge>
            </div>
            <p className="mt-1 line-clamp-2 text-muted-foreground">{step.model_call.output_preview ?? step.model_call.error_message ?? '-'}</p>
            <div className="mt-2 grid gap-1 text-xs text-muted-foreground md:grid-cols-2">
              <span>Prompt / Completion：{formatInteger(step.model_call.prompt_tokens)} / {formatInteger(step.model_call.completion_tokens)}</span>
              <span>总 Token / 耗时：{formatInteger(step.model_call.total_tokens)} / {formatLatency(step.model_call.latency_ms)}</span>
              <span className="md:col-span-2">Trace：{step.model_call.trace_id ?? step.trace_id ?? '-'}</span>
            </div>
            <Button asChild className="mt-3" size="sm" variant="outline">
              <Link href={stepEventHref(teamId, runId, step.id, 'model_call', modelCallEventId(step))}>子事件详情</Link>
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function RunComparePanel({
  currentMetrics,
  memberRows,
  previousMetrics,
  previousRun,
}: {
  currentMetrics: RunReplayMetrics;
  memberRows: MemberReplayRow[];
  previousMetrics: RunReplayMetrics | null;
  previousRun: AgentTeamRunSummary | null;
}) {
  return (
    <section className="rounded-lg border bg-background/85 p-5 shadow-sm backdrop-blur">
      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-start">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">上一轮运行对比</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">对比当前运行与上一条团队运行，定位步骤、成员输出、Token、成本、RAG 和工具调用变化。</p>
        </div>
        {previousRun ? <StatusBadge tone={teamRunStatusTone(previousRun.status)}>上一轮：{teamRunStatusLabel(previousRun.status)}</StatusBadge> : null}
      </div>

      {!previousRun || !previousMetrics ? (
        <EmptyState className="mt-4 rounded-md border bg-muted/20 p-8" description="暂无可对比的上一轮团队运行。" title="暂无上一轮可对比" />
      ) : (
        <div className="mt-5 grid gap-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <RunDiffMetric current={currentMetrics.tokens} formatter={formatInteger} label="Token 差异" previous={previousMetrics.tokens} />
            <RunDiffMetric current={currentMetrics.cost} formatter={formatMoney} label="成本差异" previous={previousMetrics.cost} />
            <RunDiffMetric current={currentMetrics.durationMs} formatter={formatLatency} label="耗时差异" previous={previousMetrics.durationMs} />
            <RunDiffMetric current={currentMetrics.steps} formatter={formatInteger} label="步骤差异" previous={previousMetrics.steps} />
            <RunDiffMetric current={currentMetrics.childEvents} formatter={formatInteger} label="内部事件差异" previous={previousMetrics.childEvents} />
            <RunDiffMetric current={currentMetrics.references} formatter={formatInteger} label="知识引用差异" previous={previousMetrics.references} />
            <RunDiffMetric current={currentMetrics.toolCalls} formatter={formatInteger} label="工具调用差异" previous={previousMetrics.toolCalls} />
            <RunDiffMetric current={currentMetrics.modelCalls} formatter={formatInteger} label="模型调用差异" previous={previousMetrics.modelCalls} />
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <BrainCircuit className="size-4 text-primary" />
              <h3 className="text-sm font-semibold">成员差异</h3>
            </div>
            {memberRows.length === 0 ? (
              <EmptyState className="rounded-md border bg-muted/20 p-8" description="当前运行和上一轮都没有成员步骤可用于聚合。" title="暂无成员差异" />
            ) : (
              <div className="grid gap-3">
                {memberRows.map((row) => (
                  <div className="rounded-lg border bg-muted/15 p-4" key={row.key}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-medium">{row.name}</div>
                      <StatusBadge tone={row.current && row.previous ? 'ready' : row.current ? 'healthy' : 'degraded'}>
                        {row.current && row.previous ? '持续参与' : row.current ? '本轮新增' : '本轮缺席'}
                      </StatusBadge>
                    </div>
                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
                      <MemberReplaySnapshot label="当前运行" value={row.current} />
                      <MemberReplaySnapshot label="上一轮运行" value={row.previous} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function RunDiffMetric({ current, formatter, label, previous }: { current: number; formatter: (value: number) => string; label: string; previous: number }) {
  const diff = current - previous;
  const diffLabel = diff === 0 ? '无变化' : `${diff > 0 ? '+' : ''}${formatter(diff)}`;

  return (
    <div className="rounded-lg border bg-background px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{diffLabel}</div>
      <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
        <span>当前：{formatter(current)}</span>
        <span>上一轮：{formatter(previous)}</span>
      </div>
    </div>
  );
}

function MemberReplaySnapshot({ label, value }: { label: string; value: MemberReplayAggregate | null }) {
  if (!value) {
    return (
      <div className="rounded-md border bg-background/75 px-3 py-2 text-sm text-muted-foreground">
        <div className="font-medium text-foreground">{label}</div>
        <div className="mt-2">无成员步骤</div>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-background/75 px-3 py-2 text-sm">
      <div className="font-medium">{label}</div>
      <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
        <span>步骤 / Token / 成本：{formatInteger(value.steps)} / {formatInteger(value.tokens)} / {formatMoney(value.cost)}</span>
        <span>耗时 / RAG / 工具 / 模型：{formatLatency(value.durationMs)} / {formatInteger(value.references)} / {formatInteger(value.toolCalls)} / {formatInteger(value.modelCalls)}</span>
      </div>
      <p className="mt-2 line-clamp-2 text-muted-foreground">{value.outputSummary}</p>
    </div>
  );
}

function filterRunSteps(run: AgentTeamRunSummary, allSteps: AgentTeamStepItem[]) {
  return allSteps.filter((step) => {
    if (step.run_id === run.id) return true;
    return !step.run_id && Boolean(run.trace_id) && step.trace_id === run.trace_id;
  });
}

function buildRunReplayMetrics(run: AgentTeamRunSummary, steps: AgentTeamStepItem[]): RunReplayMetrics {
  const childEvents = steps.reduce((total, step) => total + step.child_steps.length, 0);
  const references = steps.reduce((total, step) => total + step.references.length, 0);
  const toolCalls = steps.reduce((total, step) => total + step.tool_calls.length, 0);
  const modelCalls = steps.reduce((total, step) => total + (step.model_call ? 1 : 0), 0);
  const tokens = sumSteps(steps, 'total_tokens') || run.total_tokens;
  const cost = sumSteps(steps, 'cost_total') || run.total_cost;
  const durationMs = sumSteps(steps, 'duration_ms') || run.latency_ms;
  const outputSummary = latestStepOutput(steps) ?? run.error_message ?? '-';

  return {
    childEvents,
    completedSteps: run.completed_steps,
    cost,
    durationMs,
    failedSteps: run.failed_steps,
    modelCalls,
    outputSummary,
    references,
    steps: steps.length || run.total_steps,
    tokens,
    toolCalls,
  };
}

function buildMemberReplayRows(currentSteps: AgentTeamStepItem[], previousSteps: AgentTeamStepItem[]): MemberReplayRow[] {
  const current = aggregateMemberSteps(currentSteps);
  const previous = aggregateMemberSteps(previousSteps);
  const keys = new Set([...current.keys(), ...previous.keys()]);

  return [...keys].map((key) => {
    const currentMember = current.get(key) ?? null;
    const previousMember = previous.get(key) ?? null;
    return {
      current: currentMember,
      key,
      name: currentMember?.name ?? previousMember?.name ?? '未命名成员',
      previous: previousMember,
    };
  });
}

function aggregateMemberSteps(steps: AgentTeamStepItem[]) {
  const members = new Map<string, MemberReplayAggregate>();

  steps.forEach((step) => {
    const key = step.member_id ?? step.agent_id ?? step.agent_code ?? step.agent_name ?? 'unknown-member';
    const existing = members.get(key) ?? {
      code: step.agent_code,
      cost: 0,
      durationMs: 0,
      key,
      modelCalls: 0,
      name: step.agent_name ?? step.agent_code ?? '未命名成员',
      outputSummary: '-',
      references: 0,
      steps: 0,
      tokens: 0,
      toolCalls: 0,
    };

    existing.cost += step.cost_total;
    existing.durationMs += step.duration_ms;
    existing.modelCalls += step.model_call ? 1 : 0;
    existing.references += step.references.length;
    existing.steps += 1;
    existing.tokens += step.total_tokens;
    existing.toolCalls += step.tool_calls.length;
    existing.outputSummary = step.output_summary || existing.outputSummary;
    members.set(key, existing);
  });

  return members;
}

function latestStepOutput(steps: AgentTeamStepItem[]) {
  return [...steps].reverse().find((step) => step.output_summary)?.output_summary ?? null;
}

function sumSteps(fieldSteps: AgentTeamStepItem[], key: 'cost_total' | 'duration_ms' | 'total_tokens') {
  return fieldSteps.reduce((total, step) => total + step[key], 0);
}

function stepEventHref(teamId: string, runId: string, stepId: string, eventType: 'child_steps' | 'references' | 'tool_calls' | 'model_call', eventId: string) {
  const encodedEventId = encodeURIComponent(eventId);
  if (eventType === 'child_steps') return `/agent-teams/${teamId}/runs/${runId}/steps/${stepId}?eventType=child_steps&eventId=${encodedEventId}`;
  if (eventType === 'references') return `/agent-teams/${teamId}/runs/${runId}/steps/${stepId}?eventType=references&eventId=${encodedEventId}`;
  if (eventType === 'tool_calls') return `/agent-teams/${teamId}/runs/${runId}/steps/${stepId}?eventType=tool_calls&eventId=${encodedEventId}`;
  return `/agent-teams/${teamId}/runs/${runId}/steps/${stepId}?eventType=model_call&eventId=${encodedEventId}`;
}

function toolCallEventId(toolCall: AgentTeamStepItem['tool_calls'][number], index: number) {
  return `${toolCall.tool_id || toolCall.tool_code || 'tool'}-${index}`;
}

function modelCallEventId(step: AgentTeamStepItem) {
  return step.model_call?.trace_id ?? step.trace_id ?? 'model-call';
}

function reportFileName(teamCode: string, run: AgentTeamRunSummary) {
  const code = teamCode.replace(/[^a-zA-Z0-9_-]/g, '-');
  return `Agent团队运行报告-${code}-${run.id.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.csv`;
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
