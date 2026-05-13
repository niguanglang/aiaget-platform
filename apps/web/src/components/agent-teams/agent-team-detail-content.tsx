'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, ArrowLeft, Edit, FileArchive, ListChecks, MessageSquare, ShieldCheck, UsersRound } from 'lucide-react';
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
  const qualityGateText = team ? (team.quality_gate_enabled ? '开启' : '关闭') : '-';

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

      <section className="grid gap-4 lg:grid-cols-4">
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
          <h2 className="text-sm font-semibold">策略摘要</h2>
          <div className="mt-4 grid gap-3 text-sm">
            <DetailRow label="主管模型" value={team.supervisor_model_name ?? '未指定'} />
            <DetailRow label="质检门禁" value={qualityGateText} />
            <DetailRow label="质量阈值" value={`${Math.round(team.quality_threshold * 100)}%`} />
            <DetailRow label="Token 预算上限" value={team.budget_token_limit ? formatInteger(team.budget_token_limit) : '不限制'} />
            <DetailRow label="成本预算上限" value={team.budget_cost_limit ? formatMoney(team.budget_cost_limit) : '不限制'} />
            <DetailRow label="主管提示词" value={team.supervisor_prompt ?? '未配置'} />
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

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-background p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-primary" />
                <h2 className="text-sm font-semibold">Trace 关联</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">最新运行 Trace 与请求上下文。</p>
            </div>
            {latestRun?.trace_id ? (
              <Button asChild size="sm" variant="outline">
                <Link href={`/monitor/traces/${encodeURIComponent(latestRun.trace_id)}`}>查看 Trace</Link>
              </Button>
            ) : null}
          </div>
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <DetailRow label="最新运行 Trace" value={latestRun?.trace_id ?? '-'} />
            <DetailRow label="最新请求 ID" value={latestRun?.request_id ?? '-'} />
            <DetailRow label="运行状态" value={latestRun ? teamRunStatusLabel(latestRun.status) : '-'} />
            <DetailRow label="最近错误" value={latestRun?.error_message ?? '-'} />
          </div>
        </div>

        <div className="rounded-lg border bg-background p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                <h2 className="text-sm font-semibold">资源授权提示</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">团队运行会继续经过 RBAC、数据范围、Resource ACL 和安全策略校验。</p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link
                href={{
                  pathname: '/resource-acls/check',
                  query: {
                    permission_code: 'agent:team:run',
                    resource_id: team.id,
                    resource_type: 'AGENT_TEAM',
                  },
                }}
              >
                权限校验
              </Link>
            </Button>
          </div>
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <DetailRow label="资源类型" value="AGENT_TEAM" />
            <DetailRow label="资源 ID" value={team.id} />
            <DetailRow label="运行权限" value="agent:team:run" />
            <DetailRow label="授权入口" value="资源授权中心 / 权限校验" />
          </div>
        </div>
      </section>
    </main>
  );
}
