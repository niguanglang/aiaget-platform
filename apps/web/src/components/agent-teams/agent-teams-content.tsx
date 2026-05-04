'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  hasPermission,
  type AgentListItem,
  type AgentTeamDetail,
  type AgentTeamFeedbackItem,
  type AgentTeamFailurePolicy,
  type AgentTeamHandoffItem,
  type AgentTeamHandoffPolicy,
  type AgentTeamListItem,
  type AgentTeamMode,
  type AgentTeamRunSummary,
  type AgentTeamStepItem,
  type AgentTeamStatus,
  type ModelConfigItem,
} from '@aiaget/shared-types';
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Copy,
  Edit,
  GitBranch,
  Layers3,
  MessageSquare,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  X,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  approveAgentTeamHandoff,
  createAgentTeam,
  createAgentTeamFeedback,
  createAgentTeamHandoff,
  createAgentTeamMember,
  deleteAgentTeam,
  deleteAgentTeamMember,
  getAgentTeam,
  getAgentTeamOverview,
  getModelProvider,
  listAgentTeams,
  listAgents,
  listModelProviders,
  listUsers,
  rejectAgentTeamHandoff,
  startAgentTeamRun,
  updateAgentTeam,
  updateAgentTeamMember,
  type ApiClientError,
} from '@/lib/api-client';

const teamStatuses: AgentTeamStatus[] = ['DRAFT', 'ACTIVE', 'DISABLED', 'ARCHIVED'];
const teamModes: AgentTeamMode[] = ['SEQUENTIAL', 'PARALLEL', 'SUPERVISOR'];
const handoffPolicies: AgentTeamHandoffPolicy[] = ['AUTO', 'MANUAL', 'APPROVAL_REQUIRED'];
const failurePolicies: AgentTeamFailurePolicy[] = [
  'MATCH_HANDOFF_POLICY',
  'STOP_ON_REQUIRED_FAILURE',
  'WAIT_HUMAN_ON_REQUIRED_FAILURE',
  'CONTINUE_OPTIONAL',
];

interface TeamFormValues {
  name: string;
  code: string;
  description: string;
  owner_id: string;
  status: AgentTeamStatus;
  mode: AgentTeamMode;
  max_rounds: number;
  timeout_seconds: number;
  handoff_policy: AgentTeamHandoffPolicy;
  supervisor_model_id: string;
  supervisor_prompt: string;
  failure_policy: AgentTeamFailurePolicy;
  quality_gate_enabled: boolean;
  quality_threshold: number;
  budget_token_limit: number | '';
  budget_cost_limit: number | '';
}

interface MemberFormValues {
  agent_id: string;
  role: string;
  responsibility: string;
  execution_order: number;
  required: boolean;
  status: 'ACTIVE' | 'DISABLED';
}

interface ModelOption {
  id: string;
  label: string;
  model: string;
  provider_name?: string;
}

export function AgentTeamsContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [mode, setMode] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [teamForm, setTeamForm] = useState<TeamFormValues | null>(null);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState<MemberFormValues | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [runObjective, setRunObjective] = useState('');
  const [handoffReason, setHandoffReason] = useState('');
  const [handoffDecisionNote, setHandoffDecisionNote] = useState('');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const permissions = currentUser?.user.permissions ?? [];
  const isTenantAdmin = Boolean(currentUser?.user.roles.some((role) => role.code === 'tenant_admin'));
  const canManage = isTenantAdmin || hasPermission(permissions, 'agent:team:manage');
  const canRun = isTenantAdmin || hasPermission(permissions, 'agent:team:run');
  const canReviewHandoff = isTenantAdmin || hasPermission(permissions, 'security:approval:handle');

  const overviewQuery = useQuery({
    queryKey: ['agent-team-overview'],
    queryFn: getAgentTeamOverview,
  });
  const teamsQuery = useQuery({
    queryKey: ['agent-teams', keyword, status, mode, ownerId],
    queryFn: () =>
      listAgentTeams({
        page: 1,
        page_size: 20,
        keyword,
        status,
        mode,
        owner_id: ownerId,
      }),
  });
  const detailQuery = useQuery({
    enabled: Boolean(selectedTeamId),
    queryKey: ['agent-team', selectedTeamId],
    queryFn: () => getAgentTeam(selectedTeamId ?? ''),
  });
  const agentsQuery = useQuery({
    queryKey: ['agent-team-agent-options'],
    queryFn: () =>
      listAgents({
        page: 1,
        page_size: 100,
        status: 'PUBLISHED',
      }),
  });
  const ownersQuery = useQuery({
    queryKey: ['agent-team-owner-options'],
    queryFn: () =>
      listUsers({
        page: 1,
        page_size: 100,
        status: 'ACTIVE',
      }),
  });
  const modelProvidersQuery = useQuery({
    queryKey: ['agent-team-supervisor-model-options'],
    queryFn: () => listModelProviders({ page: 1, page_size: 100, status: 'ACTIVE' }),
  });
  const modelProviderDetailsQuery = useQuery({
    enabled: Boolean(modelProvidersQuery.data?.items.length),
    queryKey: ['agent-team-supervisor-model-provider-details', modelProvidersQuery.data?.items.map((provider) => provider.id).sort().join(',')],
    queryFn: async () => Promise.all((modelProvidersQuery.data?.items ?? []).map((provider) => getModelProvider(provider.id))),
  });

  const selectedTeam = detailQuery.data ?? null;
  const teams = teamsQuery.data?.items ?? [];
  const agents = agentsQuery.data?.items ?? [];
  const owners = ownersQuery.data?.items ?? [];
  const modelOptions = useMemo(() => flattenModelOptions(modelProviderDetailsQuery.data ?? []), [modelProviderDetailsQuery.data]);
  const latestRun = selectedTeam?.runs[0] ?? null;
  const selectedRun = selectedTeam?.runs.find((run) => run.id === selectedRunId) ?? latestRun ?? null;
  const selectedRunSteps = useMemo(
    () => filterStepsForRun(selectedTeam?.steps ?? [], selectedRun),
    [selectedTeam?.steps, selectedRun],
  );
  const selectedStep = selectedRunSteps.find((step) => step.id === selectedStepId) ?? selectedRunSteps[0] ?? null;

  const metrics = useMemo(() => {
    const overview = overviewQuery.data;
    return [
      { label: '协作团队', value: `${overview?.total ?? teamsQuery.data?.total ?? 0}`, helper: '租户范围' },
      { label: '启用团队', value: `${overview?.active_count ?? 0}`, helper: 'ACTIVE' },
      { label: '运行中', value: `${overview?.running_count ?? 0}`, helper: '队列与执行' },
      { label: '等待接管', value: `${overview?.waiting_human_count ?? 0}`, helper: '人工接力' },
    ];
  }, [overviewQuery.data, teamsQuery.data?.total]);

  useEffect(() => {
    setSelectedRunId(null);
    setSelectedStepId(null);
  }, [selectedTeamId]);

  useEffect(() => {
    if (!selectedTeam) return;
    const stillExists = selectedTeam.runs.some((run) => run.id === selectedRunId);
    if (!selectedRunId || !stillExists) {
      setSelectedRunId(selectedTeam.runs[0]?.id ?? null);
    }
  }, [selectedRunId, selectedTeam]);

  useEffect(() => {
    const stillExists = selectedRunSteps.some((step) => step.id === selectedStepId);
    if (!selectedStepId || !stillExists) {
      setSelectedStepId(selectedRunSteps[0]?.id ?? null);
    }
  }, [selectedRunSteps, selectedStepId]);

  const createTeamMutation = useMutation({
    mutationFn: createAgentTeam,
    onSuccess: async (team) => {
      await invalidateTeams();
      setSelectedTeamId(team.id);
      closeTeamForm();
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });
  const updateTeamMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: TeamFormValues }) => updateAgentTeam(id, toTeamInput(values)),
    onSuccess: async (team) => {
      await invalidateTeams(team.id);
      setSelectedTeamId(team.id);
      closeTeamForm();
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });
  const deleteTeamMutation = useMutation({
    mutationFn: deleteAgentTeam,
    onSuccess: async () => {
      await invalidateTeams();
      setSelectedTeamId(null);
    },
  });
  const createMemberMutation = useMutation({
    mutationFn: ({ teamId, values }: { teamId: string; values: MemberFormValues }) =>
      createAgentTeamMember(teamId, toMemberInput(values)),
    onSuccess: async (team) => {
      await invalidateTeams(team.id);
      closeMemberForm();
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });
  const updateMemberMutation = useMutation({
    mutationFn: ({ teamId, memberId, values }: { teamId: string; memberId: string; values: MemberFormValues }) =>
      updateAgentTeamMember(teamId, memberId, toMemberInput(values)),
    onSuccess: async (team) => {
      await invalidateTeams(team.id);
      closeMemberForm();
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });
  const deleteMemberMutation = useMutation({
    mutationFn: ({ teamId, memberId }: { teamId: string; memberId: string }) => deleteAgentTeamMember(teamId, memberId),
    onSuccess: async (team) => {
      await invalidateTeams(team.id);
    },
  });
  const startRunMutation = useMutation({
    mutationFn: ({ teamId, objective }: { teamId: string; objective: string }) =>
      startAgentTeamRun(teamId, { objective }),
    onSuccess: async (team) => {
      await invalidateTeams(team.id);
      setRunObjective('');
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });
  const handoffMutation = useMutation({
    mutationFn: ({ runId, reason }: { runId: string; reason: string }) =>
      createAgentTeamHandoff(runId, { reason, status: 'PENDING' }),
    onSuccess: async (team) => {
      await invalidateTeams(team.id);
      setHandoffReason('');
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });
  const approveHandoffMutation = useMutation({
    mutationFn: ({ handoffId, decisionNote }: { handoffId: string; decisionNote: string }) =>
      approveAgentTeamHandoff(handoffId, { decision_note: nullableText(decisionNote) }),
    onSuccess: async (team) => {
      await invalidateTeams(team.id);
      setHandoffDecisionNote('');
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });
  const rejectHandoffMutation = useMutation({
    mutationFn: ({ handoffId, decisionNote }: { handoffId: string; decisionNote: string }) =>
      rejectAgentTeamHandoff(handoffId, { decision_note: nullableText(decisionNote) }),
    onSuccess: async (team) => {
      await invalidateTeams(team.id);
      setHandoffDecisionNote('');
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });
  const feedbackMutation = useMutation({
    mutationFn: ({ runId, rating, comment }: { runId: string; rating: number; comment: string }) =>
      createAgentTeamFeedback(runId, { rating, comment: nullableText(comment) }),
    onSuccess: async () => {
      if (selectedTeamId) await invalidateTeams(selectedTeamId);
      setFeedbackComment('');
      setFeedbackRating(5);
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  async function invalidateTeams(teamId?: string) {
    await queryClient.invalidateQueries({ queryKey: ['agent-teams'] });
    await queryClient.invalidateQueries({ queryKey: ['agent-team-overview'] });
    if (teamId) await queryClient.invalidateQueries({ queryKey: ['agent-team', teamId] });
  }

  function openCreateTeam() {
    setFormError(null);
    setEditingTeamId(null);
    setTeamForm(defaultTeamForm());
  }

  function openEditTeam(team: AgentTeamDetail | AgentTeamListItem) {
    setFormError(null);
    setEditingTeamId(team.id);
    setTeamForm({
      name: team.name,
      code: team.code,
      description: team.description ?? '',
      owner_id: team.owner?.id ?? '',
      status: team.status,
      mode: team.mode,
      max_rounds: team.max_rounds,
      timeout_seconds: team.timeout_seconds,
      handoff_policy: team.handoff_policy,
      supervisor_model_id: team.supervisor_model_id ?? '',
      supervisor_prompt: team.supervisor_prompt ?? '',
      failure_policy: team.failure_policy,
      quality_gate_enabled: team.quality_gate_enabled,
      quality_threshold: team.quality_threshold,
      budget_token_limit: team.budget_token_limit ?? '',
      budget_cost_limit: team.budget_cost_limit ?? '',
    });
  }

  function closeTeamForm() {
    setFormError(null);
    setEditingTeamId(null);
    setTeamForm(null);
  }

  function submitTeamForm() {
    if (!teamForm) return;
    setFormError(null);

    if (editingTeamId) {
      updateTeamMutation.mutate({ id: editingTeamId, values: teamForm });
      return;
    }

    createTeamMutation.mutate(toTeamInput(teamForm));
  }

  function openCreateMember() {
    setFormError(null);
    setEditingMemberId(null);
    setMemberForm(defaultMemberForm(agents[0]));
  }

  function openEditMember(memberId: string) {
    const member = selectedTeam?.members.find((item) => item.id === memberId);
    if (!member) return;
    setFormError(null);
    setEditingMemberId(memberId);
    setMemberForm({
      agent_id: member.agent_id,
      role: member.role,
      responsibility: member.responsibility ?? '',
      execution_order: member.execution_order,
      required: member.required,
      status: member.status,
    });
  }

  function closeMemberForm() {
    setFormError(null);
    setEditingMemberId(null);
    setMemberForm(null);
  }

  function submitMemberForm() {
    if (!selectedTeam || !memberForm) return;
    setFormError(null);
    if (editingMemberId) {
      updateMemberMutation.mutate({ teamId: selectedTeam.id, memberId: editingMemberId, values: memberForm });
      return;
    }
    createMemberMutation.mutate({ teamId: selectedTeam.id, values: memberForm });
  }

  function clearFilters() {
    setKeyword('');
    setStatus('');
    setMode('');
    setOwnerId('');
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M63-1</StatusBadge>
            <StatusBadge tone="healthy">多 Agent 协作</StatusBadge>
            <StatusBadge tone="planned">Runtime 编排预留</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">Agent 协作中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            配置多 Agent 团队、成员职责、执行顺序、任务运行台账、接力记录和人工反馈。
          </p>
        </div>
        <Button disabled={!canManage} onClick={openCreateTeam}>
          <Plus className="size-4" />
          新建协作团队
        </Button>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-lg border bg-background">
          <div className="border-b p-4">
            <div className="grid gap-3">
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                <div>
                  <h2 className="text-sm font-semibold">协作团队</h2>
                  <p className="mt-1 text-sm text-muted-foreground">搜索、筛选、创建、编辑、归档团队并启动团队任务。</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  显示 {teams.length} / {teamsQuery.data?.total ?? 0}
                </div>
              </div>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_160px_180px_200px_auto]">
                <label className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
                  <Search className="size-4 text-muted-foreground" />
                  <input
                    className="min-w-0 flex-1 bg-transparent outline-none"
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="搜索名称、编码、描述"
                    value={keyword}
                  />
                </label>
                <select className="h-9 rounded-md border bg-background px-3 text-sm" onChange={(event) => setStatus(event.target.value)} value={status}>
                  <option value="">全部状态</option>
                  {teamStatuses.map((item) => (
                    <option key={item} value={item}>{teamStatusLabel(item)}</option>
                  ))}
                </select>
                <select className="h-9 rounded-md border bg-background px-3 text-sm" onChange={(event) => setMode(event.target.value)} value={mode}>
                  <option value="">全部模式</option>
                  {teamModes.map((item) => (
                    <option key={item} value={item}>{teamModeLabel(item)}</option>
                  ))}
                </select>
                <select className="h-9 rounded-md border bg-background px-3 text-sm" onChange={(event) => setOwnerId(event.target.value)} value={ownerId}>
                  <option value="">全部负责人</option>
                  {owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>{owner.name}</option>
                  ))}
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
            <div className="p-10 text-center">
              <div className="font-medium">暂无协作团队</div>
              <p className="mt-2 text-sm text-muted-foreground">新建团队并添加 Agent 成员后，可以启动团队任务。</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {['团队', '状态', '模式', '策略', '成员', '最近运行', '负责人', '更新时间', '操作'].map((column) => (
                      <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team) => (
                    <tr className="border-b last:border-0" key={team.id}>
                      <td className="px-4 py-3">
                        <button className="grid max-w-sm gap-1 text-left" onClick={() => setSelectedTeamId(team.id)} type="button">
                          <span className="font-medium">{team.name}</span>
                          <span className="text-xs text-muted-foreground">{team.code}</span>
                          {team.description ? <span className="line-clamp-1 text-xs text-muted-foreground">{team.description}</span> : null}
                        </button>
                      </td>
                      <td className="px-4 py-3"><StatusBadge tone={teamStatusTone(team.status)}>{teamStatusLabel(team.status)}</StatusBadge></td>
                      <td className="px-4 py-3 text-muted-foreground">{teamModeLabel(team.mode)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        <div>{failurePolicyLabel(team.failure_policy)}</div>
                        <div>{team.quality_gate_enabled ? `质量 ${team.quality_threshold.toFixed(2)}` : '质量未启用'}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{team.active_member_count} / {team.member_count}</td>
                      <td className="px-4 py-3 text-muted-foreground">{team.latest_run ? teamRunStatusLabel(team.latest_run.status) : '未运行'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{team.owner?.name ?? '-'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(team.updated_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button onClick={() => setSelectedTeamId(team.id)} size="sm" title="详情" variant="outline">
                            <GitBranch className="size-4" />
                          </Button>
                          <Button disabled={!canManage} onClick={() => openEditTeam(team)} size="sm" title="编辑" variant="outline">
                            <Edit className="size-4" />
                          </Button>
                          <Button disabled={!canManage} onClick={() => deleteTeamMutation.mutate(team.id)} size="sm" title="归档" variant="outline">
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="rounded-lg border bg-background p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">团队详情</h2>
              <p className="mt-1 text-sm text-muted-foreground">成员、运行、接力和反馈。</p>
            </div>
            {selectedTeamId ? (
              <Button onClick={() => setSelectedTeamId(null)} size="icon" variant="ghost">
                <X className="size-4" />
              </Button>
            ) : null}
          </div>

          {detailQuery.isLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">正在加载团队详情...</p>
          ) : selectedTeam ? (
            <div className="mt-4 grid gap-4">
              <div className="grid gap-2 text-sm">
                <DetailRow label="团队" value={`${selectedTeam.name} / ${selectedTeam.code}`} />
                <DetailRow label="状态" value={teamStatusLabel(selectedTeam.status)} />
                <DetailRow label="模式" value={teamModeLabel(selectedTeam.mode)} />
                <DetailRow label="接力策略" value={handoffPolicyLabel(selectedTeam.handoff_policy)} />
                <DetailRow label="Supervisor 模型" value={selectedTeam.supervisor_model_name ? `${selectedTeam.supervisor_model_name} / ${selectedTeam.supervisor_model ?? '-'}` : '使用成员模型兜底'} />
                <DetailRow label="失败策略" value={failurePolicyLabel(selectedTeam.failure_policy)} />
                <DetailRow label="质量门槛" value={selectedTeam.quality_gate_enabled ? `${selectedTeam.quality_threshold.toFixed(2)} 已启用` : '未启用'} />
                <DetailRow label="预算约束" value={formatTeamBudget(selectedTeam)} />
                <DetailRow label="负责人" value={selectedTeam.owner?.email ?? '-'} />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button disabled={!canManage} onClick={() => openEditTeam(selectedTeam)} size="sm" variant="outline">
                  <Edit className="size-4" />
                  编辑团队
                </Button>
                <Button disabled={!canManage} onClick={openCreateMember} size="sm" variant="outline">
                  <UserPlus className="size-4" />
                  添加成员
                </Button>
              </div>

              <section className="rounded-md border bg-muted/20 p-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">启动团队任务</h3>
                  <StatusBadge tone={canRun ? 'healthy' : 'planned'}>{canRun ? '可运行' : '无运行权限'}</StatusBadge>
                </div>
                <textarea
                  className="mt-3 min-h-24 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none"
                  onChange={(event) => setRunObjective(event.target.value)}
                  placeholder="输入团队任务目标"
                  value={runObjective}
                />
                <Button
                  className="mt-3 w-full"
                  disabled={!canRun || !runObjective.trim() || startRunMutation.isPending}
                  onClick={() => startRunMutation.mutate({ teamId: selectedTeam.id, objective: runObjective })}
                >
                  <Play className="size-4" />
                  启动任务
                </Button>
              </section>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">选择一个协作团队查看详情。</p>
          )}
        </aside>
      </section>

      {selectedTeam ? (
        <section className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">成员职责</h2>
              <span className="text-xs text-muted-foreground">{selectedTeam.members.length} 个成员</span>
            </div>
            <div className="mt-4 grid gap-3">
              {selectedTeam.members.length === 0 ? (
                <EmptyState description="添加已发布 Agent 后才能启动团队任务。" title="暂无成员" />
              ) : (
                selectedTeam.members.map((member) => (
                  <div className="rounded-md border bg-muted/20 p-3" key={member.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{member.agent_name}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{member.agent_code} · {member.role}</div>
                      </div>
                      <StatusBadge tone={member.status === 'ACTIVE' ? 'healthy' : 'planned'}>{member.status === 'ACTIVE' ? '启用' : '停用'}</StatusBadge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{member.responsibility ?? '未填写职责。'}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>顺序 {member.execution_order} · {member.required ? '必需' : '可选'}</span>
                      <div className="flex gap-2">
                        <Button disabled={!canManage} onClick={() => openEditMember(member.id)} size="sm" variant="outline">编辑</Button>
                        <Button disabled={!canManage} onClick={() => deleteMemberMutation.mutate({ teamId: selectedTeam.id, memberId: member.id })} size="sm" variant="outline">移除</Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <RunTraceWorkspace
            canRun={canRun}
            canReviewHandoff={canReviewHandoff}
            feedbackComment={feedbackComment}
            feedbackMutationPending={feedbackMutation.isPending}
            feedbackRating={feedbackRating}
            handoffApprovalPending={approveHandoffMutation.isPending}
            handoffDecisionNote={handoffDecisionNote}
            handoffRejectionPending={rejectHandoffMutation.isPending}
            handoffMutationPending={handoffMutation.isPending}
            handoffReason={handoffReason}
            onFeedbackCommentChange={setFeedbackComment}
            onFeedbackRatingChange={setFeedbackRating}
            onHandoffDecisionNoteChange={setHandoffDecisionNote}
            onReviewHandoff={(handoffId, action) => {
              const payload = { handoffId, decisionNote: handoffDecisionNote };
              if (action === 'approve') {
                approveHandoffMutation.mutate(payload);
              } else {
                rejectHandoffMutation.mutate(payload);
              }
            }}
            onHandoffReasonChange={setHandoffReason}
            onSaveFeedback={(runId) => feedbackMutation.mutate({ runId, rating: feedbackRating, comment: feedbackComment })}
            onSelectRun={setSelectedRunId}
            onSelectStep={setSelectedStepId}
            onSubmitHandoff={(runId) => handoffMutation.mutate({ runId, reason: handoffReason })}
            selectedRun={selectedRun}
            selectedRunId={selectedRunId}
            selectedStep={selectedStep}
            selectedStepId={selectedStepId}
            steps={selectedRunSteps}
            team={selectedTeam}
          />
        </section>
      ) : null}

      {formError ? <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{formError}</div> : null}

      {teamForm ? (
        <FormShell title={editingTeamId ? '编辑协作团队' : '新建协作团队'} onClose={closeTeamForm}>
          <TeamForm
            canEditCode={!editingTeamId}
            form={teamForm}
            isPending={createTeamMutation.isPending || updateTeamMutation.isPending}
            onChange={setTeamForm}
            onSubmit={submitTeamForm}
            modelOptions={modelOptions}
            owners={owners}
          />
        </FormShell>
      ) : null}

      {memberForm && selectedTeam ? (
        <FormShell title={editingMemberId ? '编辑团队成员' : '添加团队成员'} onClose={closeMemberForm}>
          <MemberForm
            agents={agents}
            form={memberForm}
            isPending={createMemberMutation.isPending || updateMemberMutation.isPending}
            onChange={setMemberForm}
            onSubmit={submitMemberForm}
          />
        </FormShell>
      ) : null}
    </main>
  );
}

function TeamForm({ canEditCode, form, isPending, modelOptions, onChange, onSubmit, owners }: {
  canEditCode: boolean;
  form: TeamFormValues;
  isPending: boolean;
  modelOptions: ModelOption[];
  onChange: (form: TeamFormValues) => void;
  onSubmit: () => void;
  owners: Array<{ id: string; name: string }>;
}) {
  return (
    <div className="grid gap-3">
      <TextField label="名称" onChange={(name) => onChange({ ...form, name })} value={form.name} />
      <TextField disabled={!canEditCode} label="编码" onChange={(code) => onChange({ ...form, code })} value={form.code} />
      <label className="grid gap-1 text-sm">
        <span className="text-muted-foreground">描述</span>
        <textarea className="min-h-24 rounded-md border bg-background px-3 py-2 outline-none" onChange={(event) => onChange({ ...form, description: event.target.value })} value={form.description} />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <SelectField label="状态" onChange={(status) => onChange({ ...form, status: status as AgentTeamStatus })} options={teamStatuses.map((item) => [item, teamStatusLabel(item)])} value={form.status} />
        <SelectField label="模式" onChange={(mode) => onChange({ ...form, mode: mode as AgentTeamMode })} options={teamModes.map((item) => [item, teamModeLabel(item)])} value={form.mode} />
        <SelectField label="接力策略" onChange={(policy) => onChange({ ...form, handoff_policy: policy as AgentTeamHandoffPolicy })} options={handoffPolicies.map((item) => [item, handoffPolicyLabel(item)])} value={form.handoff_policy} />
        <SelectField label="负责人" onChange={(owner_id) => onChange({ ...form, owner_id })} options={[['', '当前用户'], ...owners.map((owner) => [owner.id, owner.name] as [string, string])]} value={form.owner_id} />
        <NumberField label="最大轮次" min={1} onChange={(max_rounds) => onChange({ ...form, max_rounds })} value={form.max_rounds} />
        <NumberField label="超时秒数" min={30} onChange={(timeout_seconds) => onChange({ ...form, timeout_seconds })} value={form.timeout_seconds} />
      </div>
      <section className="grid gap-3 rounded-md border bg-muted/20 p-3">
        <div>
          <h3 className="text-sm font-semibold">Supervisor 策略</h3>
          <p className="mt-1 text-xs text-muted-foreground">用于主管调度模式，也会作为团队运行的统一策略约束。</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <SelectField
            label="Supervisor 模型"
            onChange={(supervisor_model_id) => onChange({ ...form, supervisor_model_id })}
            options={[['', modelOptions.length ? '使用成员模型兜底' : '暂无可用模型，使用成员模型兜底'], ...modelOptions.map((model) => [model.id, model.label] as [string, string])]}
            value={form.supervisor_model_id}
          />
          <SelectField label="失败策略" onChange={(failure_policy) => onChange({ ...form, failure_policy: failure_policy as AgentTeamFailurePolicy })} options={failurePolicies.map((item) => [item, failurePolicyLabel(item)])} value={form.failure_policy} />
          <NumberField label="质量阈值" max={1} min={0} onChange={(quality_threshold) => onChange({ ...form, quality_threshold })} step="0.05" value={form.quality_threshold} />
          <label className="flex items-end gap-2 text-sm">
            <input checked={form.quality_gate_enabled} onChange={(event) => onChange({ ...form, quality_gate_enabled: event.target.checked })} type="checkbox" />
            启用质量门槛
          </label>
        </div>
        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">调度提示词</span>
          <textarea className="min-h-24 rounded-md border bg-background px-3 py-2 outline-none" onChange={(event) => onChange({ ...form, supervisor_prompt: event.target.value })} placeholder="例如：优先调用审核 Agent，涉及高风险工具时必须等待人工接力。" value={form.supervisor_prompt} />
        </label>
      </section>
      <section className="grid gap-3 rounded-md border bg-muted/20 p-3">
        <div>
          <h3 className="text-sm font-semibold">预算约束</h3>
          <p className="mt-1 text-xs text-muted-foreground">达到 Token 或成本上限后，Runtime Supervisor 会停止后续调度并写入失败步骤。</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <OptionalNumberField label="Token 预算上限" min={1} onChange={(budget_token_limit) => onChange({ ...form, budget_token_limit })} value={form.budget_token_limit} />
          <OptionalNumberField label="成本预算上限" min={0} onChange={(budget_cost_limit) => onChange({ ...form, budget_cost_limit })} step="0.000001" value={form.budget_cost_limit} />
        </div>
      </section>
      <Button disabled={!form.name.trim() || !form.code.trim() || isPending} onClick={onSubmit}>
        保存团队
      </Button>
    </div>
  );
}

function MemberForm({ agents, form, isPending, onChange, onSubmit }: {
  agents: AgentListItem[];
  form: MemberFormValues;
  isPending: boolean;
  onChange: (form: MemberFormValues) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="grid gap-3">
      <SelectField label="Agent" onChange={(agent_id) => onChange({ ...form, agent_id })} options={agents.map((agent) => [agent.id, `${agent.name} / ${agent.code}`])} value={form.agent_id} />
      <TextField label="角色" onChange={(role) => onChange({ ...form, role })} value={form.role} />
      <label className="grid gap-1 text-sm">
        <span className="text-muted-foreground">职责</span>
        <textarea className="min-h-24 rounded-md border bg-background px-3 py-2 outline-none" onChange={(event) => onChange({ ...form, responsibility: event.target.value })} value={form.responsibility} />
      </label>
      <div className="grid gap-3 md:grid-cols-3">
        <NumberField label="执行顺序" min={0} onChange={(execution_order) => onChange({ ...form, execution_order })} value={form.execution_order} />
        <SelectField label="状态" onChange={(status) => onChange({ ...form, status: status as MemberFormValues['status'] })} options={[['ACTIVE', '启用'], ['DISABLED', '停用']]} value={form.status} />
        <label className="flex items-end gap-2 text-sm">
          <input checked={form.required} onChange={(event) => onChange({ ...form, required: event.target.checked })} type="checkbox" />
          必需成员
        </label>
      </div>
      <Button disabled={!form.agent_id || !form.role.trim() || isPending} onClick={onSubmit}>
        保存成员
      </Button>
    </div>
  );
}

function RunTraceWorkspace({
  canRun,
  canReviewHandoff,
  feedbackComment,
  feedbackMutationPending,
  feedbackRating,
  handoffApprovalPending,
  handoffDecisionNote,
  handoffRejectionPending,
  handoffMutationPending,
  handoffReason,
  onFeedbackCommentChange,
  onFeedbackRatingChange,
  onHandoffDecisionNoteChange,
  onHandoffReasonChange,
  onReviewHandoff,
  onSaveFeedback,
  onSelectRun,
  onSelectStep,
  onSubmitHandoff,
  selectedRun,
  selectedRunId,
  selectedStep,
  selectedStepId,
  steps,
  team,
}: {
  canRun: boolean;
  canReviewHandoff: boolean;
  feedbackComment: string;
  feedbackMutationPending: boolean;
  feedbackRating: number;
  handoffApprovalPending: boolean;
  handoffDecisionNote: string;
  handoffRejectionPending: boolean;
  handoffMutationPending: boolean;
  handoffReason: string;
  onFeedbackCommentChange: (value: string) => void;
  onFeedbackRatingChange: (value: number) => void;
  onHandoffDecisionNoteChange: (value: string) => void;
  onHandoffReasonChange: (value: string) => void;
  onReviewHandoff: (handoffId: string, action: 'approve' | 'reject') => void;
  onSaveFeedback: (runId: string) => void;
  onSelectRun: (runId: string) => void;
  onSelectStep: (stepId: string) => void;
  onSubmitHandoff: (runId: string) => void;
  selectedRun: AgentTeamRunSummary | null;
  selectedRunId: string | null;
  selectedStep: AgentTeamStepItem | null;
  selectedStepId: string | null;
  steps: AgentTeamStepItem[];
  team: AgentTeamDetail;
}) {
  const handoffs = filterHandoffsForRun(team.handoffs, selectedRun);
  const pendingHandoff = handoffs.find((handoff) => handoff.status === 'PENDING') ?? null;
  const feedback = filterFeedbackForRun(team.feedback, selectedRun);
  const traceHref = selectedRun?.trace_id ? `/monitor?keyword=${encodeURIComponent(selectedRun.trace_id)}` : null;

  return (
    <Card className="min-w-0 p-5">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Activity className="size-4 text-primary" />
            运行轨迹
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            选择一次团队运行，查看成员步骤、Trace、Token、成本、接力和人工反馈。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="ready">M63-1G</StatusBadge>
          <span className="text-xs text-muted-foreground">{team.runs.length} 次运行</span>
        </div>
      </div>

      {team.runs.length === 0 ? (
        <div className="mt-4">
          <EmptyState description="启动团队任务后，这里会显示运行选择器、步骤时间线和 Trace 入口。" title="暂无运行记录" />
        </div>
      ) : (
        <div className="mt-4 grid gap-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">运行记录</span>
              <select
                className="h-9 rounded-md border bg-background px-3 outline-none"
                onChange={(event) => onSelectRun(event.target.value)}
                value={selectedRunId ?? selectedRun?.id ?? ''}
              >
                {team.runs.map((run) => (
                  <option key={run.id} value={run.id}>
                    {formatDateTime(run.created_at)} / {teamRunStatusLabel(run.status)} / {shortText(run.objective, 32)}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex gap-2">
              {traceHref ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={traceHref}>
                    <ArrowUpRight className="size-4" />
                    监控追踪
                  </Link>
                </Button>
              ) : null}
              <Button disabled={!selectedRun?.trace_id} onClick={() => copyText(selectedRun?.trace_id)} size="sm" type="button" variant="outline">
                <Copy className="size-4" />
                复制 Trace
              </Button>
            </div>
          </div>

          {selectedRun ? (
            <>
              <RunSummaryPanel run={selectedRun} />
              <section className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.2fr)]">
                <StepTimeline
                  onSelectStep={onSelectStep}
                  selectedStepId={selectedStepId}
                  steps={steps}
                />
                <StepDetailPanel step={selectedStep} />
              </section>
              <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                <RunSignalPanel run={selectedRun} steps={steps} />
                <RunActionPanel
                  canRun={canRun}
                  feedbackComment={feedbackComment}
                  feedbackMutationPending={feedbackMutationPending}
                  feedbackRating={feedbackRating}
                  handoffMutationPending={handoffMutationPending}
                  handoffReason={handoffReason}
                  onFeedbackCommentChange={onFeedbackCommentChange}
                  onFeedbackRatingChange={onFeedbackRatingChange}
                  onHandoffReasonChange={onHandoffReasonChange}
                  onSaveFeedback={() => onSaveFeedback(selectedRun.id)}
                  onSubmitHandoff={() => onSubmitHandoff(selectedRun.id)}
                />
              </section>
              <HumanResumePanel
                approvalPending={handoffApprovalPending}
                canReview={canReviewHandoff}
                decisionNote={handoffDecisionNote}
                handoff={pendingHandoff}
                onDecisionNoteChange={onHandoffDecisionNoteChange}
                onReview={onReviewHandoff}
                rejectionPending={handoffRejectionPending}
                run={selectedRun}
              />
              <section className="grid gap-4 xl:grid-cols-2">
                <HandoffList handoffs={handoffs} />
                <FeedbackList feedback={feedback} />
              </section>
            </>
          ) : null}
        </div>
      )}
    </Card>
  );
}

function RunSummaryPanel({ run }: { run: AgentTeamRunSummary }) {
  const stepPercent = run.total_steps > 0 ? Math.round((run.completed_steps / run.total_steps) * 100) : 0;

  return (
    <div className="grid gap-3 rounded-md border bg-muted/20 p-3">
      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={teamRunStatusTone(run.status)}>{teamRunStatusLabel(run.status)}</StatusBadge>
            <span className="text-xs text-muted-foreground">{formatDateTime(run.created_at)}</span>
          </div>
          <p className="mt-2 text-sm leading-6">{run.objective}</p>
          {run.error_message ? (
            <p className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {run.error_message}
            </p>
          ) : null}
        </div>
        <div className="grid gap-1 text-xs text-muted-foreground md:text-right">
          <span>请求 {run.request_id ?? '-'}</span>
          <span className="font-mono">Trace {shortTraceId(run.trace_id)}</span>
        </div>
      </div>
      <div className="grid gap-2 md:grid-cols-5">
        <RunMetric label="完成度" value={`${stepPercent}%`} helper={`${run.completed_steps}/${run.total_steps} 步`} />
        <RunMetric label="失败步骤" value={`${run.failed_steps}`} helper="失败或终止步骤" />
        <RunMetric label="Token" value={formatInteger(run.total_tokens)} helper="团队汇总" />
        <RunMetric label="成本" value={formatMoney(run.total_cost)} helper="模型估算" />
        <RunMetric label="耗时" value={formatLatency(run.latency_ms)} helper={run.ended_at ? formatDateTime(run.ended_at) : '执行中'} />
      </div>
    </div>
  );
}

function StepTimeline({
  onSelectStep,
  selectedStepId,
  steps,
}: {
  onSelectStep: (stepId: string) => void;
  selectedStepId: string | null;
  steps: AgentTeamStepItem[];
}) {
  return (
    <div className="grid gap-3 rounded-md border bg-background/70 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Layers3 className="size-4 text-primary" />
          步骤时间线
        </div>
        <span className="text-xs text-muted-foreground">{steps.length} 个步骤</span>
      </div>
      {steps.length === 0 ? (
        <EmptyState description="当前运行还没有可展示的步骤。" title="暂无步骤" />
      ) : (
        <div className="grid gap-2">
          {steps.map((step, index) => {
            const selected = step.id === selectedStepId;
            return (
              <button
                className={[
                  'grid gap-2 rounded-md border px-3 py-3 text-left transition-colors',
                  selected ? 'border-primary/50 bg-primary/5' : 'bg-muted/20 hover:bg-muted/40',
                ].join(' ')}
                key={step.id}
                onClick={() => onSelectStep(step.id)}
                type="button"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full border bg-background text-xs text-muted-foreground">
                      {index + 1}
                    </span>
                    <span className="truncate font-medium">{step.title}</span>
                  </div>
                  <StatusBadge tone={teamStepStatusTone(step.status)}>{teamStepStatusLabel(step.status)}</StatusBadge>
                </div>
                <div className="line-clamp-2 text-sm text-muted-foreground">{step.output_summary ?? step.input_summary ?? '-'}</div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>{teamStepTypeLabel(step.step_type)}</span>
                  <span>{step.agent_name ?? '团队节点'}</span>
                  <span>{formatLatency(step.duration_ms)}</span>
                  <span>{formatInteger(step.total_tokens)} tokens</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StepDetailPanel({ step }: { step: AgentTeamStepItem | null }) {
  if (!step) {
    return (
      <div className="rounded-md border bg-background/70 p-4">
        <EmptyState description="选择步骤后可以查看输入、输出、子事件、知识引用、工具调用、模型调用和 Span 信息。" title="未选择步骤" />
      </div>
    );
  }

  const childSteps = step.child_steps ?? [];
  const references = step.references ?? [];
  const toolCalls = step.tool_calls ?? [];
  const modelCall = step.model_call ?? null;

  return (
    <div className="grid gap-4 rounded-md border bg-background/70 p-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={teamStepStatusTone(step.status)}>{teamStepStatusLabel(step.status)}</StatusBadge>
            <StatusBadge tone="planned">{teamStepTypeLabel(step.step_type)}</StatusBadge>
          </div>
          <h3 className="mt-2 text-base font-semibold">{step.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{step.agent_name ? `${step.agent_name} / ${step.agent_code}` : '团队级节点'}</p>
        </div>
        <div className="grid gap-1 text-xs text-muted-foreground md:text-right">
          <span>{formatDateTime(step.started_at)} - {formatDateTime(step.ended_at)}</span>
          <span>{formatLatency(step.duration_ms)}</span>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-4">
        <RunMetric label="输入 Token" value={formatInteger(step.prompt_tokens)} helper="prompt" />
        <RunMetric label="输出 Token" value={formatInteger(step.completion_tokens)} helper="completion" />
        <RunMetric label="总 Token" value={formatInteger(step.total_tokens)} helper="step total" />
        <RunMetric label="步骤成本" value={formatMoney(step.cost_total)} helper="cost total" />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <PayloadBlock title="输入摘要" value={step.input_summary} />
        <PayloadBlock title="输出摘要" value={step.output_summary} />
      </div>

      {step.error_message ? (
        <PayloadBlock destructive title="错误信息" value={step.error_message} />
      ) : null}

      <div className="grid gap-2 md:grid-cols-4">
        <RunMetric label="成员子事件" value={formatInteger(childSteps.length)} helper="prompt / rag / tool / response" />
        <RunMetric label="知识引用" value={formatInteger(references.length)} helper="RAG sources" />
        <RunMetric label="工具调用" value={formatInteger(toolCalls.length)} helper="Tool Gateway" />
        <RunMetric label="模型调用" value={modelCall ? '1' : '0'} helper={modelCall?.request_model ?? '未记录'} />
      </div>

      <ChildStepSection steps={childSteps} />

      <div className="grid gap-4 xl:grid-cols-2">
        <ReferenceSection references={references} />
        <ToolCallSection toolCalls={toolCalls} />
      </div>

      <ModelCallSection modelCall={modelCall} />

      <div className="grid gap-2 rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground md:grid-cols-3">
        <span className="break-all">Trace：{step.trace_id ?? '-'}</span>
        <span className="break-all">Span：{step.span_id ?? '-'}</span>
        <span className="break-all">父 Span：{step.parent_span_id ?? '-'}</span>
      </div>
    </div>
  );
}

function ChildStepSection({ steps }: { steps: NonNullable<AgentTeamStepItem['child_steps']> }) {
  return (
    <section className="grid gap-3 rounded-md border bg-muted/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold">成员内部事件</div>
        <StatusBadge tone={steps.length > 0 ? 'ready' : 'planned'}>{steps.length} 条</StatusBadge>
      </div>
      {steps.length === 0 ? (
        <p className="text-sm text-muted-foreground">当前团队步骤没有记录成员内部事件。</p>
      ) : (
        <div className="grid gap-2">
          {steps.map((childStep, index) => (
            <div className="grid gap-2 rounded-md border bg-background/75 px-3 py-3" key={childStep.id || `${childStep.type}-${index}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-2">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border bg-muted/40 text-xs text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{childStep.title}</div>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{childStep.summary || '-'}</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <StatusBadge tone={childStepStatusTone(childStep.status)}>{childStepStatusLabel(childStep.status)}</StatusBadge>
                  <StatusBadge tone="planned">{childStepTypeLabel(childStep.type)}</StatusBadge>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {childStep.request_model ? <span>模型 {childStep.request_model}</span> : null}
                {childStep.tool_name ? <span>工具 {childStep.tool_name}</span> : null}
                {childStep.retrieval_mode ? <span>检索 {childStep.retrieval_mode}</span> : null}
                {childStep.response_status ? <span>HTTP {childStep.response_status}</span> : null}
                {childStep.latency_ms !== null && childStep.latency_ms !== undefined ? <span>{formatLatency(childStep.latency_ms)}</span> : null}
                {childStep.total_tokens !== null && childStep.total_tokens !== undefined ? <span>{formatInteger(childStep.total_tokens)} tokens</span> : null}
                {childStep.item_count !== null && childStep.item_count !== undefined ? <span>{formatInteger(childStep.item_count)} 项</span> : null}
              </div>
              {(childStep.trace_id || childStep.span_id) ? (
                <div className="grid gap-1 rounded-md border bg-muted/20 px-2 py-2 text-xs text-muted-foreground md:grid-cols-2">
                  <span className="break-all">Trace：{childStep.trace_id ?? '-'}</span>
                  <span className="break-all">Span：{childStep.span_id ?? '-'}</span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ReferenceSection({ references }: { references: NonNullable<AgentTeamStepItem['references']> }) {
  return (
    <section className="grid gap-3 rounded-md border bg-muted/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold">知识引用</div>
        <StatusBadge tone={references.length > 0 ? 'ready' : 'planned'}>{references.length} 条</StatusBadge>
      </div>
      {references.length === 0 ? (
        <p className="text-sm text-muted-foreground">当前成员执行没有命中知识引用。</p>
      ) : (
        <div className="grid gap-2">
          {references.map((reference) => (
            <div className="rounded-md border bg-background/75 px-3 py-3" key={reference.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="truncate text-sm font-medium">{reference.title}</div>
                <StatusBadge tone="mock">{formatReferenceScore(reference.score)}</StatusBadge>
              </div>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{reference.snippet || '-'}</p>
              <div className="mt-2 text-xs text-muted-foreground">来源：{reference.source_type ?? '未知'}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ToolCallSection({ toolCalls }: { toolCalls: NonNullable<AgentTeamStepItem['tool_calls']> }) {
  return (
    <section className="grid gap-3 rounded-md border bg-muted/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold">工具调用</div>
        <StatusBadge tone={toolCalls.length > 0 ? 'ready' : 'planned'}>{toolCalls.length} 次</StatusBadge>
      </div>
      {toolCalls.length === 0 ? (
        <p className="text-sm text-muted-foreground">当前成员执行没有调用工具。</p>
      ) : (
        <div className="grid gap-2">
          {toolCalls.map((toolCall, index) => (
            <div className="rounded-md border bg-background/75 px-3 py-3" key={`${toolCall.tool_id ?? toolCall.tool_code}-${index}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{toolCall.tool_name}</div>
                  <div className="mt-1 break-all text-xs text-muted-foreground">{toolCall.tool_code}</div>
                </div>
                <StatusBadge tone={toolCallStatusTone(toolCall.status)}>{toolCallStatusLabel(toolCall.status)}</StatusBadge>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>{formatLatency(toolCall.latency_ms)}</span>
                <span>HTTP {toolCall.response_status ?? '-'}</span>
                {toolCall.approval_request_id ? <span className="break-all">审批 {toolCall.approval_request_id}</span> : null}
              </div>
              {toolCall.output_preview ? (
                <p className="mt-2 whitespace-pre-wrap break-words rounded-md border bg-muted/20 px-2 py-2 text-xs leading-5 text-muted-foreground">
                  {toolCall.output_preview}
                </p>
              ) : null}
              {toolCall.error_message ? (
                <p className="mt-2 whitespace-pre-wrap break-words rounded-md border border-destructive/30 bg-destructive/10 px-2 py-2 text-xs leading-5 text-destructive">
                  {toolCall.error_message}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ModelCallSection({ modelCall }: { modelCall: AgentTeamStepItem['model_call'] }) {
  return (
    <section className="grid gap-3 rounded-md border bg-muted/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold">模型调用</div>
        <StatusBadge tone={modelCall ? modelCallStatusTone(modelCall.status) : 'planned'}>
          {modelCall ? modelCallStatusLabel(modelCall.status) : '未记录'}
        </StatusBadge>
      </div>
      {!modelCall ? (
        <p className="text-sm text-muted-foreground">当前成员执行没有可用的模型调用摘要。</p>
      ) : (
        <div className="grid gap-3">
          <div className="grid gap-2 md:grid-cols-4">
            <RunMetric label="模型" value={modelCall.request_model || '-'} helper="request model" />
            <RunMetric label="总 Token" value={formatInteger(modelCall.total_tokens)} helper={`${formatInteger(modelCall.prompt_tokens)} / ${formatInteger(modelCall.completion_tokens)}`} />
            <RunMetric label="耗时" value={formatLatency(modelCall.latency_ms)} helper="model latency" />
            <RunMetric label="Trace" value={shortTraceId(modelCall.trace_id)} helper="model call" />
          </div>
          {modelCall.output_preview ? <PayloadBlock title="模型输出预览" value={modelCall.output_preview} /> : null}
          {modelCall.error_message ? <PayloadBlock destructive title="模型错误" value={modelCall.error_message} /> : null}
        </div>
      )}
    </section>
  );
}

function RunSignalPanel({ run, steps }: { run: AgentTeamRunSummary; steps: AgentTeamStepItem[] }) {
  const tokenSteps = steps.filter((step) => step.total_tokens > 0).length;
  const costSteps = steps.filter((step) => step.cost_total > 0).length;
  const modelLikeSteps = steps.filter((step) => step.step_type === 'AGENT_RUN').length;
  const traceHref = run.trace_id ? `/monitor?keyword=${encodeURIComponent(run.trace_id)}` : null;

  return (
    <div className="grid gap-3 rounded-md border bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <GitBranch className="size-4 text-primary" />
          事件与用量入口
        </div>
        <StatusBadge tone={run.trace_id ? 'healthy' : 'degraded'}>{run.trace_id ? 'Trace 已贯通' : '无 Trace'}</StatusBadge>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <RunMetric label="运行事件" value="1" helper="platform_event" />
        <RunMetric label="步骤用量" value={formatInteger(run.total_steps)} helper="workflow_steps" />
        <RunMetric label="Token 步骤" value={formatInteger(tokenSteps)} helper={`${formatInteger(run.total_tokens)} tokens`} />
        <RunMetric label="成本步骤" value={formatInteger(costSteps)} helper={formatMoney(run.total_cost)} />
      </div>
      <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
        <div className="rounded-md border bg-background/70 px-3 py-2">
          <div className="text-xs">模型执行</div>
          <div className="mt-1 font-medium text-foreground">{modelLikeSteps} 个 Agent 步骤</div>
        </div>
        <div className="rounded-md border bg-background/70 px-3 py-2">
          <div className="text-xs">请求链路</div>
          <div className="mt-1 break-all font-mono text-xs text-foreground">{run.request_id ?? '-'}</div>
        </div>
        <div className="rounded-md border bg-background/70 px-3 py-2">
          <div className="text-xs">追踪链路</div>
          <div className="mt-1 break-all font-mono text-xs text-foreground">{run.trace_id ?? '-'}</div>
        </div>
      </div>
      {traceHref ? (
        <Button asChild variant="outline">
          <Link href={traceHref}>
            <ArrowUpRight className="size-4" />
            打开监控中心查看同 Trace 事件
          </Link>
        </Button>
      ) : null}
    </div>
  );
}

function RunActionPanel({
  canRun,
  feedbackComment,
  feedbackMutationPending,
  feedbackRating,
  handoffMutationPending,
  handoffReason,
  onFeedbackCommentChange,
  onFeedbackRatingChange,
  onHandoffReasonChange,
  onSaveFeedback,
  onSubmitHandoff,
}: {
  canRun: boolean;
  feedbackComment: string;
  feedbackMutationPending: boolean;
  feedbackRating: number;
  handoffMutationPending: boolean;
  handoffReason: string;
  onFeedbackCommentChange: (value: string) => void;
  onFeedbackRatingChange: (value: number) => void;
  onHandoffReasonChange: (value: string) => void;
  onSaveFeedback: () => void;
  onSubmitHandoff: () => void;
}) {
  return (
    <div className="grid gap-3 rounded-md border bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">人工动作</h3>
        <StatusBadge tone={canRun ? 'healthy' : 'planned'}>{canRun ? '可操作' : '无权限'}</StatusBadge>
      </div>

      <div>
        <div className="text-sm font-medium">发起接力</div>
        <textarea
          className="mt-2 min-h-20 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none"
          onChange={(event) => onHandoffReasonChange(event.target.value)}
          placeholder="说明需要接力或人工接管的原因"
          value={handoffReason}
        />
        <Button
          className="mt-2 w-full"
          disabled={!canRun || !handoffReason.trim() || handoffMutationPending}
          onClick={onSubmitHandoff}
          variant="outline"
        >
          <GitBranch className="size-4" />
          提交接力
        </Button>
      </div>

      <div className="border-t pt-3">
        <div className="text-sm font-medium">记录反馈</div>
        <div className="mt-2 grid gap-2 sm:grid-cols-[96px_minmax(0,1fr)]">
          <select className="h-9 rounded-md border bg-background px-3 text-sm" onChange={(event) => onFeedbackRatingChange(Number(event.target.value))} value={feedbackRating}>
            {[5, 4, 3, 2, 1].map((item) => <option key={item} value={item}>{item} 分</option>)}
          </select>
          <input
            className="h-9 min-w-0 rounded-md border bg-background px-3 text-sm outline-none"
            onChange={(event) => onFeedbackCommentChange(event.target.value)}
            placeholder="反馈备注"
            value={feedbackComment}
          />
        </div>
        <Button
          className="mt-2 w-full"
          disabled={!canRun || feedbackMutationPending}
          onClick={onSaveFeedback}
          variant="outline"
        >
          <MessageSquare className="size-4" />
          保存反馈
        </Button>
      </div>
    </div>
  );
}

function HumanResumePanel({
  approvalPending,
  canReview,
  decisionNote,
  handoff,
  onDecisionNoteChange,
  onReview,
  rejectionPending,
  run,
}: {
  approvalPending: boolean;
  canReview: boolean;
  decisionNote: string;
  handoff: AgentTeamHandoffItem | null;
  onDecisionNoteChange: (value: string) => void;
  onReview: (handoffId: string, action: 'approve' | 'reject') => void;
  rejectionPending: boolean;
  run: AgentTeamRunSummary;
}) {
  const isWaiting = run.status === 'WAITING_HUMAN';
  const isPending = Boolean(handoff);
  const busy = approvalPending || rejectionPending;

  return (
    <div className="grid gap-3 rounded-md border bg-background/70 p-4 shadow-sm">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">人工介入</h3>
        </div>
        <StatusBadge tone={isWaiting ? 'degraded' : 'planned'}>
          {isWaiting ? '等待人工介入' : '无需人工介入'}
        </StatusBadge>
      </div>

      {!isWaiting ? (
        <p className="text-sm text-muted-foreground">当前运行没有暂停，不需要审批恢复。</p>
      ) : !isPending ? (
        <p className="text-sm text-muted-foreground">当前运行处于等待状态，但没有待处理接力记录。</p>
      ) : (
        <div className="grid gap-3">
          <div className="grid gap-2 rounded-md border bg-muted/20 p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">{handoff?.from_agent_name ?? '团队'} 到 {handoff?.to_agent_name ?? '人工处理'}</span>
              <StatusBadge tone="degraded">待审批</StatusBadge>
            </div>
            <p className="leading-6 text-muted-foreground">{handoff?.reason}</p>
            <div className="text-xs text-muted-foreground">创建时间：{formatDateTime(handoff?.created_at ?? null)}</div>
          </div>

          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">审批备注</span>
            <textarea
              className="min-h-20 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none"
              onChange={(event) => onDecisionNoteChange(event.target.value)}
              placeholder="填写通过或拒绝的处理说明"
              value={decisionNote}
            />
          </label>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              disabled={!canReview || busy || !handoff}
              onClick={() => handoff && onReview(handoff.id, 'approve')}
              type="button"
            >
              <CheckCircle2 className="size-4" />
              {approvalPending ? '恢复中' : '通过并继续'}
            </Button>
            <Button
              disabled={!canReview || busy || !handoff}
              onClick={() => handoff && onReview(handoff.id, 'reject')}
              type="button"
              variant="outline"
            >
              <XCircle className="size-4" />
              {rejectionPending ? '处理中' : '拒绝并结束'}
            </Button>
          </div>

          {!canReview ? (
            <p className="text-xs text-muted-foreground">当前账号无审批权限，需要 `security:approval:handle`。</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

function HandoffList({ handoffs }: { handoffs: AgentTeamHandoffItem[] }) {
  return (
    <div className="grid gap-3 rounded-md border bg-background/70 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">接力记录</h3>
        <span className="text-xs text-muted-foreground">{handoffs.length} 条</span>
      </div>
      {handoffs.length === 0 ? (
        <p className="text-sm text-muted-foreground">当前运行暂无接力记录。</p>
      ) : (
        <div className="grid gap-2">
          {handoffs.map((handoff) => (
            <div className="rounded-md border bg-muted/20 p-3" key={handoff.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">{handoff.from_agent_name ?? '团队'} 到 {handoff.to_agent_name ?? '人工处理'}</div>
                <StatusBadge tone={handoffStatusTone(handoff.status)}>{handoffStatusLabel(handoff.status)}</StatusBadge>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{handoff.reason}</p>
              {handoff.decision_note ? (
                <p className="mt-2 rounded-md border bg-background/70 px-3 py-2 text-xs text-muted-foreground">{handoff.decision_note}</p>
              ) : null}
              <div className="mt-2 text-xs text-muted-foreground">
                {handoff.decided_by?.name ?? '未决策'} · {formatDateTime(handoff.decided_at ?? handoff.created_at)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FeedbackList({ feedback }: { feedback: AgentTeamFeedbackItem[] }) {
  return (
    <div className="grid gap-3 rounded-md border bg-background/70 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">运行反馈</h3>
        <span className="text-xs text-muted-foreground">{feedback.length} 条</span>
      </div>
      {feedback.length === 0 ? (
        <p className="text-sm text-muted-foreground">当前运行暂无反馈。</p>
      ) : (
        <div className="grid gap-2">
          {feedback.map((item) => (
            <div className="rounded-md border bg-muted/20 p-3" key={item.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">{item.rating} 分</div>
                <span className="text-xs text-muted-foreground">{formatDateTime(item.created_at)}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.comment ?? '未填写备注。'}</p>
              <div className="mt-2 text-xs text-muted-foreground">{item.created_by?.name ?? '未知用户'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RunMetric({ helper, label, value }: { helper: string; label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background/75 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-base font-semibold">{value}</div>
      <div className="mt-1 truncate text-xs text-muted-foreground">{helper}</div>
    </div>
  );
}

function PayloadBlock({ destructive, title, value }: { destructive?: boolean; title: string; value: string | null }) {
  return (
    <div className={['grid gap-2 rounded-md border px-3 py-3', destructive ? 'border-destructive/30 bg-destructive/10' : 'bg-muted/20'].join(' ')}>
      <div className={['text-xs font-medium', destructive ? 'text-destructive' : 'text-muted-foreground'].join(' ')}>{title}</div>
      <div className={['whitespace-pre-wrap break-words text-sm leading-6', destructive ? 'text-destructive' : 'text-foreground'].join(' ')}>
        {value ?? '-'}
      </div>
    </div>
  );
}

function FormShell({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <section className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button onClick={onClose} size="icon" variant="ghost"><X className="size-4" /></Button>
        </div>
        {children}
      </div>
    </section>
  );
}

function TextField({ disabled, label, onChange, value }: { disabled?: boolean; label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input className="h-9 rounded-md border bg-background px-3 outline-none disabled:opacity-60" disabled={disabled} onChange={(event) => onChange(event.target.value)} value={value} />
    </label>
  );
}

function NumberField({ label, max, min, onChange, step, value }: { label: string; max?: number; min: number; onChange: (value: number) => void; step?: string; value: number }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input className="h-9 rounded-md border bg-background px-3 outline-none" max={max} min={min} onChange={(event) => onChange(Number(event.target.value))} step={step} type="number" value={value} />
    </label>
  );
}

function OptionalNumberField({ label, min, onChange, step, value }: { label: string; min: number; onChange: (value: number | '') => void; step?: string; value: number | '' }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input
        className="h-9 rounded-md border bg-background px-3 outline-none"
        min={min}
        onChange={(event) => onChange(event.target.value === '' ? '' : Number(event.target.value))}
        placeholder="不限制"
        step={step}
        type="number"
        value={value}
      />
    </label>
  );
}

function SelectField({ label, onChange, options, value }: { label: string; onChange: (value: string) => void; options: Array<[string, string]>; value: string }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <select className="h-9 rounded-md border bg-background px-3 outline-none" onChange={(event) => onChange(event.target.value)} value={value}>
        {options.map(([optionValue, label]) => <option key={optionValue || label} value={optionValue}>{label}</option>)}
      </select>
    </label>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-md border bg-muted/30 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="break-words font-medium">{value}</div>
    </div>
  );
}

function defaultTeamForm(): TeamFormValues {
  return {
    name: '',
    code: '',
    description: '',
    owner_id: '',
    status: 'DRAFT',
    mode: 'SEQUENTIAL',
    max_rounds: 3,
    timeout_seconds: 300,
    handoff_policy: 'AUTO',
    supervisor_model_id: '',
    supervisor_prompt: '',
    failure_policy: 'MATCH_HANDOFF_POLICY',
    quality_gate_enabled: false,
    quality_threshold: 0.75,
    budget_token_limit: '',
    budget_cost_limit: '',
  };
}

function defaultMemberForm(agent?: AgentListItem): MemberFormValues {
  return {
    agent_id: agent?.id ?? '',
    role: '执行专家',
    responsibility: '',
    execution_order: 1,
    required: true,
    status: 'ACTIVE',
  };
}

function toTeamInput(values: TeamFormValues) {
  return {
    name: values.name,
    code: values.code,
    description: nullableText(values.description),
    owner_id: values.owner_id || null,
    status: values.status,
    mode: values.mode,
    max_rounds: values.max_rounds,
    timeout_seconds: values.timeout_seconds,
    handoff_policy: values.handoff_policy,
    supervisor_model_id: values.supervisor_model_id || null,
    supervisor_prompt: nullableText(values.supervisor_prompt),
    failure_policy: values.failure_policy,
    quality_gate_enabled: values.quality_gate_enabled,
    quality_threshold: values.quality_threshold,
    budget_token_limit: values.budget_token_limit === '' ? null : values.budget_token_limit,
    budget_cost_limit: values.budget_cost_limit === '' ? null : values.budget_cost_limit,
  };
}

function toMemberInput(values: MemberFormValues) {
  return {
    agent_id: values.agent_id,
    role: values.role,
    responsibility: nullableText(values.responsibility),
    execution_order: values.execution_order,
    required: values.required,
    status: values.status,
  };
}

function nullableText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function filterStepsForRun(steps: AgentTeamStepItem[], run: AgentTeamRunSummary | null) {
  if (!run) return [];
  if (run.trace_id) {
    const traced = steps.filter((step) => step.trace_id === run.trace_id);
    if (traced.length > 0) return sortStepsAsc(traced);
  }

  return sortStepsAsc(steps).slice(0, Math.max(run.total_steps, 12));
}

function sortStepsAsc(steps: AgentTeamStepItem[]) {
  return [...steps].sort((left, right) => Date.parse(left.created_at) - Date.parse(right.created_at));
}

function filterHandoffsForRun(handoffs: AgentTeamHandoffItem[], run: AgentTeamRunSummary | null) {
  if (!run) return [];
  return [...handoffs].sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at));
}

function filterFeedbackForRun(feedback: AgentTeamFeedbackItem[], run: AgentTeamRunSummary | null) {
  if (!run) return [];
  return feedback
    .filter((item) => item.run_id === run.id)
    .sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at));
}

function flattenModelOptions(providers: Array<{ name: string; models?: ModelConfigItem[] }>): ModelOption[] {
  return providers.flatMap((provider) =>
    (provider.models ?? [])
      .filter((model) => model.status === 'ACTIVE')
      .map((model) => ({
        id: model.id,
        label: `${provider.name} / ${model.name || model.model}`,
        model: model.model,
        provider_name: provider.name,
      })),
  );
}

function teamStatusLabel(status: AgentTeamStatus) {
  return ({ DRAFT: '草稿', ACTIVE: '启用', DISABLED: '停用', ARCHIVED: '归档' } as const)[status];
}

function teamStatusTone(status: AgentTeamStatus) {
  return status === 'ACTIVE' ? 'healthy' : status === 'DRAFT' ? 'planned' : status === 'DISABLED' ? 'loading' : 'degraded';
}

function teamModeLabel(mode: AgentTeamMode) {
  return ({ SEQUENTIAL: '顺序执行', PARALLEL: '并行协作', SUPERVISOR: '主管调度' } as const)[mode];
}

function handoffPolicyLabel(policy: AgentTeamHandoffPolicy) {
  return ({ AUTO: '自动接力', MANUAL: '人工接力', APPROVAL_REQUIRED: '接力需审批' } as const)[policy];
}

function failurePolicyLabel(policy: AgentTeamFailurePolicy) {
  return ({
    MATCH_HANDOFF_POLICY: '跟随接力策略',
    STOP_ON_REQUIRED_FAILURE: '必选失败即终止',
    WAIT_HUMAN_ON_REQUIRED_FAILURE: '必选失败等人工',
    CONTINUE_OPTIONAL: '允许继续调度',
  } as const)[policy];
}

function formatTeamBudget(team: AgentTeamListItem) {
  const tokenLimit = team.budget_token_limit ? `${formatInteger(team.budget_token_limit)} Token` : 'Token 不限制';
  const costLimit = team.budget_cost_limit ? `${formatMoney(team.budget_cost_limit)}` : '成本不限制';
  return `${tokenLimit} / ${costLimit}`;
}

function teamRunStatusLabel(status: string) {
  return ({ QUEUED: '排队中', RUNNING: '运行中', WAITING_HUMAN: '等待接管', SUCCESS: '成功', FAILED: '失败', CANCELLED: '已取消' } as Record<string, string>)[status] ?? status;
}

function teamRunStatusTone(status: string) {
  if (status === 'SUCCESS') return 'healthy';
  if (status === 'FAILED' || status === 'CANCELLED') return 'unavailable';
  if (status === 'WAITING_HUMAN') return 'degraded';
  return 'planned';
}

function teamStepStatusLabel(status: string) {
  return ({ PENDING: '等待中', RUNNING: '运行中', SUCCESS: '成功', FAILED: '失败', SKIPPED: '跳过' } as Record<string, string>)[status] ?? status;
}

function teamStepStatusTone(status: string) {
  if (status === 'SUCCESS') return 'healthy';
  if (status === 'FAILED') return 'unavailable';
  if (status === 'SKIPPED') return 'loading';
  return 'planned';
}

function teamStepTypeLabel(type: string) {
  return ({ PLAN: '规划', AGENT_RUN: 'Agent 执行', HANDOFF: '接力', VERIFY: '校验', SUMMARY: '汇总' } as Record<string, string>)[type] ?? type;
}

function childStepStatusLabel(status: string) {
  return ({ done: '完成', failed: '失败', skipped: '跳过' } as Record<string, string>)[status] ?? status;
}

function childStepStatusTone(status: string) {
  if (status === 'done') return 'healthy';
  if (status === 'failed') return 'unavailable';
  return 'loading';
}

function childStepTypeLabel(type: string) {
  return ({ prompt: '提示词', tool: '工具', knowledge: '知识检索', response: '模型响应' } as Record<string, string>)[type] ?? type;
}

function toolCallStatusLabel(status: string) {
  return ({ SUCCESS: '成功', FAILED: '失败', APPROVAL_REQUIRED: '等待审批', REJECTED: '已拒绝' } as Record<string, string>)[status] ?? status;
}

function toolCallStatusTone(status: string) {
  if (status === 'SUCCESS') return 'healthy';
  if (status === 'APPROVAL_REQUIRED') return 'degraded';
  if (status === 'REJECTED' || status === 'FAILED') return 'unavailable';
  return 'planned';
}

function modelCallStatusLabel(status: string) {
  return ({ SUCCESS: '成功', FAILED: '失败' } as Record<string, string>)[status] ?? status;
}

function modelCallStatusTone(status: string) {
  return status === 'SUCCESS' ? 'healthy' : 'unavailable';
}

function formatReferenceScore(score: number | null | undefined) {
  if (score === null || score === undefined) return '无分数';
  return `相关度 ${score.toFixed(3)}`;
}

function handoffStatusLabel(status: string) {
  return ({ PENDING: '待处理', APPROVED: '已通过', REJECTED: '已拒绝', AUTO: '自动接力' } as Record<string, string>)[status] ?? status;
}

function handoffStatusTone(status: string) {
  if (status === 'APPROVED' || status === 'AUTO') return 'healthy';
  if (status === 'REJECTED') return 'unavailable';
  return 'degraded';
}

function formatInteger(value: number | null | undefined) {
  return new Intl.NumberFormat('zh-CN').format(value ?? 0);
}

function formatMoney(value: number | null | undefined) {
  return `$${new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 6,
    minimumFractionDigits: 0,
  }).format(value ?? 0)}`;
}

function formatLatency(value: number | null | undefined) {
  if (!value) return '0 ms';
  if (value < 1000) return `${Math.round(value)} ms`;
  return `${(value / 1000).toFixed(2)} s`;
}

function formatDateTime(value: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function shortTraceId(value: string | null | undefined) {
  if (!value) return '-';
  return value.length > 14 ? `${value.slice(0, 8)}...${value.slice(-6)}` : value;
}

function shortText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function copyText(value: string | null | undefined) {
  if (!value || typeof navigator === 'undefined') return;
  void navigator.clipboard?.writeText(value);
}
