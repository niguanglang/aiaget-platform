'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission, type AgentTeamListItem } from '@aiaget/shared-types';
import { Edit, Eye, FileArchive, ListChecks, Plus, Search, Trash2, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { AgentTeamConfirmDialog } from '@/components/agent-teams/agent-team-confirm-dialog';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  formatDateTime,
  handoffPolicyLabel,
  teamModeLabel,
  teamModes,
  teamRunStatusLabel,
  teamRunStatusTone,
  teamStatusLabel,
  teamStatuses,
  teamStatusTone,
} from '@/components/agent-teams/agent-teams-shared';
import { deleteAgentTeam, getAgentTeamOverview, listAgentTeams, listUsers } from '@/lib/api-client';

export function AgentTeamsContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [mode, setMode] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AgentTeamListItem | null>(null);

  const permissions = currentUser?.user.permissions ?? [];
  const isTenantAdmin = Boolean(currentUser?.user.roles.some((role) => role.code === 'tenant_admin'));
  const canManage = isTenantAdmin || hasPermission(permissions, 'agent:team:manage');

  const overviewQuery = useQuery({
    queryKey: ['agent-team-overview'],
    queryFn: getAgentTeamOverview,
  });
  const teamsQuery = useQuery({
    queryKey: ['agent-teams', keyword, status, mode, ownerId],
    queryFn: () => listAgentTeams({ page: 1, page_size: 20, keyword, status, mode, owner_id: ownerId }),
  });
  const ownersQuery = useQuery({
    queryKey: ['agent-team-owner-options'],
    queryFn: () => listUsers({ page: 1, page_size: 100, status: 'ACTIVE' }),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteAgentTeam,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['agent-teams'] }),
        queryClient.invalidateQueries({ queryKey: ['agent-team-overview'] }),
      ]);
      setDeleteTarget(null);
    },
  });

  const teams = teamsQuery.data?.items ?? [];
  const owners = ownersQuery.data?.items ?? [];
  const overview = overviewQuery.data;

  function clearFilters() {
    setKeyword('');
    setStatus('');
    setMode('');
    setOwnerId('');
  }

  function formatQualityGate(team: AgentTeamListItem) {
    return team.quality_gate_enabled ? `开启，阈值 ${Math.round(team.quality_threshold * 100)}%` : '关闭';
  }

  function formatBudgetSummary(team: AgentTeamListItem) {
    const tokenLimit = team.budget_token_limit ? `${new Intl.NumberFormat('zh-CN').format(team.budget_token_limit)} Token` : 'Token 不限';
    const costLimit = team.budget_cost_limit ? `$${new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 6 }).format(team.budget_cost_limit)}` : '成本不限';
    return `${tokenLimit} / ${costLimit}`;
  }

  return (
    <main className="mx-auto grid max-w-[1680px] gap-6 px-4 py-6 lg:px-6">
      <section className="rounded-xl border border-slate-200/80 bg-white/[0.9] p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <StatusBadge tone="ready">Agent 团队</StatusBadge>
              <StatusBadge tone="healthy">列表总览</StatusBadge>
              <StatusBadge tone="planned">运行记录</StatusBadge>
            </div>
            <h1 className="text-2xl font-semibold">Agent 协作中心</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/agent-teams/report-archives">
                <FileArchive className="size-4" />
                报告归档
              </Link>
            </Button>
            {canManage ? (
              <Button asChild>
                <Link href="/agent-teams/create">
                  <Plus className="size-4" />
                  新建协作团队
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
        <div className="mt-5 grid gap-3 text-sm md:grid-cols-4">
          <div><span className="text-muted-foreground">协作团队</span><div className="mt-1 text-xl font-semibold">{overview?.total ?? teamsQuery.data?.total ?? 0}</div></div>
          <div><span className="text-muted-foreground">启用团队</span><div className="mt-1 text-xl font-semibold">{overview?.active_count ?? 0}</div></div>
          <div><span className="text-muted-foreground">运行中</span><div className="mt-1 text-xl font-semibold">{overview?.running_count ?? 0}</div></div>
          <div><span className="text-muted-foreground">等待接管</span><div className="mt-1 text-xl font-semibold">{overview?.waiting_human_count ?? 0}</div></div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200/80 bg-white/[0.9]">
        <div className="border-b p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <h2 className="text-sm font-semibold">协作团队</h2>
              <div className="text-sm text-muted-foreground">显示 {teams.length} / {teamsQuery.data?.total ?? 0}</div>
            </div>

            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_180px_180px_220px_auto]">
              <label className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
                <Search className="size-4 text-muted-foreground" />
                <input className="min-w-0 flex-1 bg-transparent outline-none" onChange={(event) => setKeyword(event.target.value)} value={keyword} />
              </label>
              <select className="h-9 rounded-md border bg-background px-3 text-sm" onChange={(event) => setStatus(event.target.value)} value={status}>
                <option value="">全部状态</option>
                {teamStatuses.map((item) => <option key={item} value={item}>{teamStatusLabel(item)}</option>)}
              </select>
              <select className="h-9 rounded-md border bg-background px-3 text-sm" onChange={(event) => setMode(event.target.value)} value={mode}>
                <option value="">全部模式</option>
                {teamModes.map((item) => <option key={item} value={item}>{teamModeLabel(item)}</option>)}
              </select>
              <select className="h-9 rounded-md border bg-background px-3 text-sm" onChange={(event) => setOwnerId(event.target.value)} value={ownerId}>
                <option value="">全部负责人</option>
                {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
              </select>
              <Button onClick={clearFilters} type="button" variant="outline">清空</Button>
            </div>
          </div>
        </div>

        {teamsQuery.isError ? (
          <div className="p-6 text-sm text-destructive">协作团队加载失败。</div>
        ) : teamsQuery.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">正在加载协作团队...</div>
        ) : teams.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">无数据</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1240px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {['团队', '状态', '模式', '接力策略', '策略摘要', '成员', '最近运行', '负责人', '更新时间', '操作'].map((column) => (
                    <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <tr className="border-b last:border-0" key={team.id}>
                    <td className="px-4 py-3">
                      <Link className="grid max-w-sm gap-1 transition-colors hover:text-blue-700" href={`/agent-teams/${team.id}`}>
                        <span className="font-medium">{team.name}</span>
                        <span className="text-xs text-muted-foreground">{team.code}</span>
                        {team.description ? <span className="line-clamp-1 text-xs text-muted-foreground">{team.description}</span> : null}
                      </Link>
                    </td>
                    <td className="px-4 py-3"><StatusBadge tone={teamStatusTone(team.status)}>{teamStatusLabel(team.status)}</StatusBadge></td>
                    <td className="px-4 py-3 text-muted-foreground">{teamModeLabel(team.mode)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{handoffPolicyLabel(team.handoff_policy)}</td>
                    <td className="px-4 py-3">
                      <div className="grid min-w-44 gap-1 text-xs text-muted-foreground">
                        <span className="line-clamp-1"><span className="text-foreground">主管模型</span> {team.supervisor_model_name ?? '未指定'}</span>
                        <span><span className="text-foreground">质检门禁</span> {formatQualityGate(team)}</span>
                        <span className="line-clamp-1"><span className="text-foreground">预算概要</span> {formatBudgetSummary(team)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{team.active_member_count} / {team.member_count}</td>
                    <td className="px-4 py-3">
                      {team.latest_run ? (
                        <div className="grid gap-1">
                          <StatusBadge tone={teamRunStatusTone(team.latest_run.status)}>{teamRunStatusLabel(team.latest_run.status)}</StatusBadge>
                          <span className="line-clamp-1 text-xs text-muted-foreground">{team.latest_run.objective}</span>
                        </div>
                      ) : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{team.owner?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(team.updated_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button asChild size="sm" title="详情" variant="outline"><Link href={`/agent-teams/${team.id}`}><Eye className="size-4" /></Link></Button>
                        <Button asChild size="sm" title="成员" variant="outline"><Link href={`/agent-teams/${team.id}/members`}><UsersRound className="size-4" /></Link></Button>
                        <Button asChild size="sm" title="运行记录" variant="outline"><Link href={`/agent-teams/${team.id}/runs`}><ListChecks className="size-4" /></Link></Button>
                        {canManage ? (
                          <>
                            <Button asChild size="sm" title="编辑" variant="outline"><Link href={`/agent-teams/${team.id}/edit`}><Edit className="size-4" /></Link></Button>
                            <Button onClick={() => setDeleteTarget(team)} size="sm" title="删除" variant="destructive"><Trash2 className="size-4" /></Button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {deleteTarget ? (
        <AgentTeamConfirmDialog
          body={`确认删除「${deleteTarget.name}」？该操作会移除团队配置，并影响成员、运行记录入口和后续协作任务。`}
          confirmLabel="确认删除"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          pending={deleteMutation.isPending}
          title="删除协作团队？"
        />
      ) : null}
    </main>
  );
}
