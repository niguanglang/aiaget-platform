'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit, FileArchive, ListChecks, MessageSquare, UsersRound } from 'lucide-react';
import Link from 'next/link';

import {
  DetailRow,
  ErrorPanel,
  failurePolicyLabel,
  formatDateTime,
  formatInteger,
  formatLatency,
  formatMoney,
  handoffPolicyLabel,
  LoadingPanel,
  teamModeLabel,
  teamRunStatusLabel,
  teamRunStatusTone,
  teamStatusLabel,
  teamStatusTone,
} from '@/components/agent-teams/agent-teams-shared';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { getAgentTeam } from '@/lib/api-client';

export function AgentTeamDetailContent({ teamId }: { teamId: string }) {
  const teamQuery = useQuery({
    queryKey: ['agent-team', teamId],
    queryFn: () => getAgentTeam(teamId),
  });

  const team = teamQuery.data;
  const latestRun = team?.runs[0] ?? null;
  const pendingHandoffs = team?.handoffs.filter((handoff) => handoff.status === 'PENDING').length ?? 0;
  const feedbackCount = team?.feedback.length ?? 0;

  if (teamQuery.isLoading) {
    return <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6"><LoadingPanel text="正在加载团队详情..." /></main>;
  }

  if (teamQuery.isError || !team) {
    return (
      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-6 lg:px-6">
        <Button asChild className="w-fit" variant="outline"><Link href="/agent-teams"><ArrowLeft className="size-4" />返回</Link></Button>
        <ErrorPanel text="团队详情加载失败。" />
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <section className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
        <div className="min-w-0">
          <Button asChild className="mb-4 w-fit" variant="outline"><Link href="/agent-teams"><ArrowLeft className="size-4" />Agent 团队</Link></Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone={teamStatusTone(team.status)}>{teamStatusLabel(team.status)}</StatusBadge>
            <StatusBadge tone="ready">{teamModeLabel(team.mode)}</StatusBadge>
            <StatusBadge tone="planned">{handoffPolicyLabel(team.handoff_policy)}</StatusBadge>
          </div>
          <h1 className="break-words text-2xl font-semibold">{team.name}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{team.description ?? '暂无描述。'}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link href={`/agent-teams/${teamId}/edit`}><Edit className="size-4" />编辑</Link></Button>
          <Button asChild variant="outline"><Link href={`/agent-teams/${teamId}/members`}><UsersRound className="size-4" />成员管理</Link></Button>
          <Button asChild><Link href={`/agent-teams/${teamId}/runs`}><ListChecks className="size-4" />运行记录</Link></Button>
          <Button asChild variant="outline"><Link href="/agent-teams/report-archives"><FileArchive className="size-4" />报告归档</Link></Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard helper="成员摘要" label="成员" value={`${team.active_member_count} / ${team.member_count}`} />
        <MetricCard helper="运行摘要" label="运行" value={formatInteger(team.run_count)} />
        <MetricCard helper="接力入口" label="待处理接力" value={formatInteger(pendingHandoffs)} />
        <MetricCard helper="反馈入口" label="反馈" value={formatInteger(feedbackCount)} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border bg-background p-5">
          <h2 className="text-sm font-semibold">基础信息</h2>
          <div className="mt-4 grid gap-3 text-sm">
            <DetailRow label="团队编码" value={team.code} />
            <DetailRow label="负责人" value={team.owner ? `${team.owner.name} (${team.owner.email})` : '-'} />
            <DetailRow label="失败策略" value={failurePolicyLabel(team.failure_policy)} />
            <DetailRow label="更新时间" value={formatDateTime(team.updated_at)} />
          </div>
        </div>

        <div className="rounded-lg border bg-background p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">成员摘要</h2>
            <Button asChild size="sm" variant="outline"><Link href={`/agent-teams/${teamId}/members`}>管理成员</Link></Button>
          </div>
          <div className="mt-4 grid gap-3 text-sm">
            {team.members.slice(0, 4).map((member) => (
              <div className="rounded-md border bg-muted/20 px-3 py-2" key={member.id}>
                <div className="font-medium">{member.agent_name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{member.role} · {member.required ? '必选' : '可选'} · 顺序 {member.execution_order}</div>
              </div>
            ))}
            {team.members.length === 0 ? <div className="text-sm text-muted-foreground">暂无成员。</div> : null}
          </div>
        </div>

        <div className="rounded-lg border bg-background p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">运行摘要</h2>
            <Button asChild size="sm" variant="outline"><Link href={`/agent-teams/${teamId}/runs`}>查看运行</Link></Button>
          </div>
          {latestRun ? (
            <div className="mt-4 grid gap-3 text-sm">
              <StatusBadge tone={teamRunStatusTone(latestRun.status)}>{teamRunStatusLabel(latestRun.status)}</StatusBadge>
              <DetailRow label="目标" value={latestRun.objective} />
              <DetailRow label="步骤" value={`${latestRun.completed_steps}/${latestRun.total_steps}，失败 ${latestRun.failed_steps}`} />
              <DetailRow label="消耗" value={`${formatInteger(latestRun.total_tokens)} Token / ${formatMoney(latestRun.total_cost)} / ${formatLatency(latestRun.latency_ms)}`} />
            </div>
          ) : <p className="mt-4 text-sm text-muted-foreground">暂无运行记录。</p>}
        </div>
      </section>

      <section className="rounded-lg border bg-background p-5">
        <h2 className="text-sm font-semibold">接力 / 反馈入口</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Link className="rounded-md border bg-muted/20 p-4 transition-colors hover:bg-muted/40" href={`/agent-teams/${teamId}/runs`}>
            <div className="flex items-center gap-2 font-medium"><ListChecks className="size-4" />进入运行记录</div>
            <p className="mt-2 text-sm text-muted-foreground">在运行记录页发起接力、保存反馈、导出报告或生成归档。</p>
          </Link>
          <Link className="rounded-md border bg-muted/20 p-4 transition-colors hover:bg-muted/40" href={`/agent-teams/${teamId}/runs`}>
            <div className="flex items-center gap-2 font-medium"><MessageSquare className="size-4" />查看反馈和接力</div>
            <p className="mt-2 text-sm text-muted-foreground">当前团队有 {pendingHandoffs} 条待处理接力和 {feedbackCount} 条运行反馈。</p>
          </Link>
        </div>
      </section>
    </main>
  );
}

