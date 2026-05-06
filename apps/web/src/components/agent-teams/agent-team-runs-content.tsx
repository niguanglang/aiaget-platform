'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission, type AgentTeamRunSummary } from '@aiaget/shared-types';
import { ArrowLeft, FileArchive, MessageSquare, Play, Send } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

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
  nullableText,
  teamRunStatusLabel,
  teamRunStatusTone,
} from '@/components/agent-teams/agent-teams-shared';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  createAgentTeamFeedback,
  createAgentTeamHandoff,
  createAgentTeamRunReportArchive,
  exportAgentTeamRunReport,
  getAgentTeam,
  startAgentTeamRun,
  type ApiClientError,
} from '@/lib/api-client';

export function AgentTeamRunsContent({ teamId }: { teamId: string }) {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [objective, setObjective] = useState('');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [handoffReason, setHandoffReason] = useState('');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [actionError, setActionError] = useState<string | null>(null);

  const permissions = currentUser?.user.permissions ?? [];
  const isTenantAdmin = Boolean(currentUser?.user.roles.some((role) => role.code === 'tenant_admin'));
  const canRun = isTenantAdmin || hasPermission(permissions, 'agent:team:run');

  const teamQuery = useQuery({
    queryKey: ['agent-team', teamId],
    queryFn: () => getAgentTeam(teamId),
  });

  const startRunMutation = useMutation({
    mutationFn: ({ id, runObjective }: { id: string; runObjective: string }) => startAgentTeamRun(id, { objective: runObjective }),
    onSuccess: (team) => {
      queryClient.setQueryData(['agent-team', team.id], team);
      void queryClient.invalidateQueries({ queryKey: ['agent-teams'] });
      setSelectedRunId(team.runs[0]?.id ?? null);
      setObjective('');
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });
  const handoffMutation = useMutation({
    mutationFn: ({ runId, reason }: { runId: string; reason: string }) => createAgentTeamHandoff(runId, { reason, status: 'PENDING' }),
    onSuccess: (team) => {
      queryClient.setQueryData(['agent-team', team.id], team);
      setHandoffReason('');
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });
  const feedbackMutation = useMutation({
    mutationFn: ({ runId, rating, comment }: { runId: string; rating: number; comment: string }) => createAgentTeamFeedback(runId, { rating, comment: nullableText(comment) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['agent-team', teamId] });
      setFeedbackComment('');
      setFeedbackRating(5);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });
  const exportMutation = useMutation({
    mutationFn: ({ run, fileName }: { run: AgentTeamRunSummary; fileName: string }) => exportAgentTeamRunReport(run.id).then((blob) => ({ blob, fileName })),
    onSuccess: ({ blob, fileName }) => downloadBlob(blob, fileName),
    onError: (error: ApiClientError) => setActionError(error.message),
  });
  const archiveMutation = useMutation({
    mutationFn: (runId: string) => createAgentTeamRunReportArchive(runId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['agent-team-run-report-archives'] });
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const team = teamQuery.data;
  const runs = useMemo(() => [...(team?.runs ?? [])].sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at)), [team?.runs]);
  const selectedRun = runs.find((run) => run.id === selectedRunId) ?? runs[0] ?? null;
  const handoffs = selectedRun ? (team?.handoffs ?? []).filter((handoff) => handoff.run_id === selectedRun.id) : [];
  const feedback = selectedRun ? (team?.feedback ?? []).filter((item) => item.run_id === selectedRun.id) : [];

  if (teamQuery.isLoading) {
    return <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6"><LoadingPanel text="正在加载运行记录..." /></main>;
  }

  if (teamQuery.isError || !team) {
    return (
      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-6 lg:px-6">
        <Button asChild className="w-fit" variant="outline"><Link href="/agent-teams"><ArrowLeft className="size-4" />返回</Link></Button>
        <ErrorPanel text="运行记录加载失败。" />
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <section className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline"><Link href={`/agent-teams/${teamId}`}><ArrowLeft className="size-4" />团队详情</Link></Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">运行记录</StatusBadge>
            <StatusBadge tone={canRun ? 'healthy' : 'degraded'}>{canRun ? '可启动' : '无运行权限'}</StatusBadge>
          </div>
          <h1 className="break-words text-2xl font-semibold">{team.name} · 运行记录</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">查看团队运行摘要，发起新任务，并处理接力、反馈、报告导出和报告归档。</p>
        </div>
        <Button asChild variant="outline"><Link href="/agent-teams/report-archives"><FileArchive className="size-4" />报告归档</Link></Button>
      </section>

      <section className="rounded-lg border bg-background p-4">
        <h2 className="text-sm font-semibold">启动团队任务</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
          <input className="h-10 rounded-md border bg-background px-3 text-sm outline-none" onChange={(event) => setObjective(event.target.value)} placeholder="输入团队任务目标" value={objective} />
          <Button disabled={!canRun || !objective.trim() || startRunMutation.isPending} onClick={() => startRunMutation.mutate({ id: teamId, runObjective: objective })} type="button">
            <Play className="size-4" />启动运行
          </Button>
        </div>
      </section>

      {actionError ? <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{actionError}</div> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard helper="全部任务" label="运行总数" value={formatInteger(runs.length)} />
        <MetricCard helper="等待人工" label="接力中" value={formatInteger(runs.filter((run) => run.status === 'WAITING_HUMAN').length)} />
        <MetricCard helper="失败或取消" label="异常运行" value={formatInteger(runs.filter((run) => run.status === 'FAILED' || run.status === 'CANCELLED').length)} />
        <MetricCard helper="运行反馈" label="反馈" value={formatInteger(team.feedback.length)} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-lg border bg-background">
          <div className="border-b p-4"><h2 className="text-sm font-semibold">运行列表</h2></div>
          {runs.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">暂无运行记录。</div>
          ) : (
            <div className="divide-y">
              {runs.map((run) => (
                <button className="grid w-full gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/40" key={run.id} onClick={() => setSelectedRunId(run.id)} type="button">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium">{run.objective}</div>
                    <StatusBadge tone={teamRunStatusTone(run.status)}>{teamRunStatusLabel(run.status)}</StatusBadge>
                  </div>
                  <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-4">
                    <span>步骤 {run.completed_steps}/{run.total_steps}</span>
                    <span>失败 {run.failed_steps}</span>
                    <span>{formatInteger(run.total_tokens)} Token</span>
                    <span>{formatDateTime(run.created_at)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="grid gap-4">
          {selectedRun ? (
            <>
              <div className="rounded-lg border bg-background p-5">
                <h2 className="text-sm font-semibold">运行摘要</h2>
                <div className="mt-4 grid gap-3 text-sm">
                  <StatusBadge tone={teamRunStatusTone(selectedRun.status)}>{teamRunStatusLabel(selectedRun.status)}</StatusBadge>
                  <DetailRow label="目标" value={selectedRun.objective} />
                  <DetailRow label="Trace" value={selectedRun.trace_id ?? '-'} />
                  <DetailRow label="消耗" value={`${formatInteger(selectedRun.total_tokens)} Token / ${formatMoney(selectedRun.total_cost)} / ${formatLatency(selectedRun.latency_ms)}`} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button disabled={exportMutation.isPending} onClick={() => exportMutation.mutate({ run: selectedRun, fileName: reportFileName(team.code, selectedRun) })} size="sm" type="button" variant="outline">导出报告</Button>
                  <Button disabled={archiveMutation.isPending} onClick={() => archiveMutation.mutate(selectedRun.id)} size="sm" type="button" variant="outline">生成归档</Button>
                </div>
              </div>

              <div className="rounded-lg border bg-background p-5">
                <h2 className="text-sm font-semibold">接力入口</h2>
                <textarea className="mt-3 min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none" onChange={(event) => setHandoffReason(event.target.value)} placeholder="填写接力原因" value={handoffReason} />
                <Button className="mt-3" disabled={!canRun || !handoffReason.trim() || handoffMutation.isPending} onClick={() => handoffMutation.mutate({ runId: selectedRun.id, reason: handoffReason })} size="sm" type="button">
                  <Send className="size-4" />发起接力
                </Button>
                <div className="mt-4 grid gap-2">
                  {handoffs.map((handoff) => (
                    <div className="rounded-md border bg-muted/20 px-3 py-2" key={handoff.id}>
                      <StatusBadge tone={handoffStatusTone(handoff.status)}>{handoffStatusLabel(handoff.status)}</StatusBadge>
                      <p className="mt-2 text-sm text-muted-foreground">{handoff.reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border bg-background p-5">
                <h2 className="text-sm font-semibold">反馈入口</h2>
                <div className="mt-3 grid gap-2">
                  <select className="h-9 rounded-md border bg-background px-3 text-sm" onChange={(event) => setFeedbackRating(Number(event.target.value))} value={feedbackRating}>
                    {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} 分</option>)}
                  </select>
                  <textarea className="min-h-20 rounded-md border bg-background px-3 py-2 text-sm outline-none" onChange={(event) => setFeedbackComment(event.target.value)} placeholder="填写反馈备注" value={feedbackComment} />
                  <Button disabled={!canRun || feedbackMutation.isPending} onClick={() => feedbackMutation.mutate({ runId: selectedRun.id, rating: feedbackRating, comment: feedbackComment })} size="sm" type="button">
                    <MessageSquare className="size-4" />保存反馈
                  </Button>
                </div>
                <div className="mt-4 grid gap-2">
                  {feedback.map((item) => <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm" key={item.id}>{item.rating} 分 · {item.comment ?? '未填写备注'}</div>)}
                </div>
              </div>
            </>
          ) : <div className="rounded-lg border bg-background p-5 text-sm text-muted-foreground">选择一条运行查看详情。</div>}
        </aside>
      </section>
    </main>
  );
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
