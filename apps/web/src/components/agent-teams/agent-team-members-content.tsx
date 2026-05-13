'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission, type AgentListItem, type AgentTeamMemberItem } from '@aiaget/shared-types';
import { ArrowLeft, Edit, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { AgentTeamConfirmDialog } from '@/components/agent-teams/agent-team-confirm-dialog';
import { ErrorPanel, LoadingPanel, nullableText } from '@/components/agent-teams/agent-teams-shared';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  createAgentTeamMember,
  deleteAgentTeamMember,
  getAgentTeam,
  listAgents,
  updateAgentTeamMember,
  type ApiClientError,
} from '@/lib/api-client';

interface MemberFormValues {
  agent_id: string;
  role: string;
  responsibility: string;
  execution_order: number;
  required: boolean;
  status: 'ACTIVE' | 'DISABLED';
}

export function AgentTeamMembersContent({ teamId }: { teamId: string }) {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [memberForm, setMemberForm] = useState<MemberFormValues | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberDeleteTarget, setMemberDeleteTarget] = useState<AgentTeamMemberItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const permissions = currentUser?.user.permissions ?? [];
  const isTenantAdmin = Boolean(currentUser?.user.roles.some((role) => role.code === 'tenant_admin'));
  const canManage = isTenantAdmin || hasPermission(permissions, 'agent:team:manage');

  const teamQuery = useQuery({
    queryKey: ['agent-team', teamId],
    queryFn: () => getAgentTeam(teamId),
  });
  const agentsQuery = useQuery({
    queryKey: ['agent-team-agent-options'],
    queryFn: () => listAgents({ page: 1, page_size: 100, status: 'PUBLISHED' }),
  });

  const createMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: MemberFormValues }) => createAgentTeamMember(id, toMemberInput(values)),
    onSuccess: async (team) => {
      queryClient.setQueryData(['agent-team', team.id], team);
      await queryClient.invalidateQueries({ queryKey: ['agent-teams'] });
      closeForm();
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, memberId, values }: { id: string; memberId: string; values: MemberFormValues }) => updateAgentTeamMember(id, memberId, toMemberUpdateInput(values)),
    onSuccess: async (team) => {
      queryClient.setQueryData(['agent-team', team.id], team);
      await queryClient.invalidateQueries({ queryKey: ['agent-teams'] });
      closeForm();
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });
  const deleteMutation = useMutation({
    mutationFn: ({ id, memberId }: { id: string; memberId: string }) => deleteAgentTeamMember(id, memberId),
    onSuccess: async (team) => {
      queryClient.setQueryData(['agent-team', team.id], team);
      await queryClient.invalidateQueries({ queryKey: ['agent-teams'] });
      setMemberDeleteTarget(null);
    },
  });

  const team = teamQuery.data;
  const agents = agentsQuery.data?.items ?? [];
  const members = useMemo(
    () => [...(team?.members ?? [])].sort((left, right) => left.execution_order - right.execution_order),
    [team?.members],
  );

  function openCreateForm() {
    setFormError(null);
    setEditingMemberId(null);
    setMemberForm(defaultMemberForm(agents[0]));
  }

  function openEditForm(member: AgentTeamMemberItem) {
    setFormError(null);
    setEditingMemberId(member.id);
    setMemberForm({
      agent_id: member.agent_id,
      role: member.role,
      responsibility: member.responsibility ?? '',
      execution_order: member.execution_order,
      required: member.required,
      status: member.status,
    });
  }

  function closeForm() {
    setMemberForm(null);
    setEditingMemberId(null);
    setFormError(null);
  }

  function submitForm() {
    if (!memberForm) return;
    setFormError(null);
    if (editingMemberId) {
      updateMutation.mutate({ id: teamId, memberId: editingMemberId, values: memberForm });
    } else {
      createMutation.mutate({ id: teamId, values: memberForm });
    }
  }

  if (teamQuery.isLoading) {
    return <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6"><LoadingPanel text="正在加载团队成员..." /></main>;
  }

  if (teamQuery.isError || !team) {
    return (
      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-6 lg:px-6">
        <Button asChild className="w-fit" variant="outline"><Link href="/agent-teams"><ArrowLeft className="size-4" />返回</Link></Button>
        <ErrorPanel text="团队成员加载失败。" />
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline"><Link href={`/agent-teams/${teamId}`}><ArrowLeft className="size-4" />团队详情</Link></Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">成员管理</StatusBadge>
            <StatusBadge tone={canManage ? 'healthy' : 'degraded'}>{canManage ? '可编辑' : '只读权限'}</StatusBadge>
          </div>
          <h1 className="break-words text-2xl font-semibold">{team.name} · 成员管理</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">成员职责、执行顺序、必选状态和启停状态。</p>
        </div>
        <Button disabled={!canManage} onClick={openCreateForm} type="button">
          <Plus className="size-4" />
          添加成员
        </Button>
      </section>

      <section className="rounded-lg border bg-background">
        <div className="border-b p-4">
          <h2 className="text-sm font-semibold">成员列表</h2>
          <p className="mt-1 text-sm text-muted-foreground">当前 {team.active_member_count} 个启用成员，共 {team.member_count} 个成员。</p>
        </div>

        {members.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">暂无成员。添加已发布 Agent 后才能启动团队任务。</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {['Agent', '角色', '职责', '顺序', '必选', '状态', '操作'].map((column) => <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>{column}</th>)}
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr className="border-b last:border-0" key={member.id}>
                    <td className="px-4 py-3"><div className="font-medium">{member.agent_name}</div><div className="text-xs text-muted-foreground">{member.agent_code}</div></td>
                    <td className="px-4 py-3 text-muted-foreground">{member.role}</td>
                    <td className="px-4 py-3 text-muted-foreground">{member.responsibility ?? '-'}</td>
                    <td className="px-4 py-3">{member.execution_order}</td>
                    <td className="px-4 py-3">{member.required ? '是' : '否'}</td>
                    <td className="px-4 py-3"><StatusBadge tone={member.status === 'ACTIVE' ? 'healthy' : 'loading'}>{member.status === 'ACTIVE' ? '启用' : '停用'}</StatusBadge></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button disabled={!canManage} onClick={() => openEditForm(member)} size="sm" title="编辑" variant="outline"><Edit className="size-4" /></Button>
                        <Button disabled={!canManage || deleteMutation.isPending} onClick={() => setMemberDeleteTarget(member)} size="sm" title="删除" variant="destructive"><Trash2 className="size-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {memberForm ? (
        <section className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">{editingMemberId ? '编辑团队成员' : '添加团队成员'}</h2>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm font-medium">Agent
                <select className="h-10 rounded-md border bg-background px-3 text-sm" disabled={Boolean(editingMemberId)} onChange={(event) => setMemberForm({ ...memberForm, agent_id: event.target.value })} value={memberForm.agent_id}>
                  <option value="">选择已发布 Agent</option>
                  {agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name} ({agent.code})</option>)}
                </select>
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <TextField label="角色" onChange={(value) => setMemberForm({ ...memberForm, role: value })} value={memberForm.role} />
                <NumberField label="执行顺序" min={1} onChange={(value) => setMemberForm({ ...memberForm, execution_order: value })} value={memberForm.execution_order} />
              </div>
              <label className="grid gap-2 text-sm font-medium">职责
                <textarea className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm outline-none" onChange={(event) => setMemberForm({ ...memberForm, responsibility: event.target.value })} value={memberForm.responsibility} />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm"><input checked={memberForm.required} onChange={(event) => setMemberForm({ ...memberForm, required: event.target.checked })} type="checkbox" />必选成员</label>
                <label className="grid gap-2 text-sm font-medium">状态
                  <select className="h-10 rounded-md border bg-background px-3 text-sm" onChange={(event) => setMemberForm({ ...memberForm, status: event.target.value as MemberFormValues['status'] })} value={memberForm.status}>
                    <option value="ACTIVE">启用</option>
                    <option value="DISABLED">停用</option>
                  </select>
                </label>
              </div>
              {formError ? <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{formError}</div> : null}
              <div className="flex justify-end gap-2 border-t pt-4">
                <Button onClick={closeForm} type="button" variant="outline">取消</Button>
                <Button disabled={!memberForm.agent_id || !memberForm.role || createMutation.isPending || updateMutation.isPending} onClick={submitForm} type="button">保存成员</Button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {memberDeleteTarget ? (
        <AgentTeamConfirmDialog
          body={`确认移除成员「${memberDeleteTarget.agent_name}」？后续团队运行将不再调度该 Agent。`}
          confirmLabel="确认移除"
          onCancel={() => setMemberDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate({ id: teamId, memberId: memberDeleteTarget.id })}
          pending={deleteMutation.isPending}
          title="移除团队成员？"
        />
      ) : null}
    </main>
  );
}

function defaultMemberForm(agent?: AgentListItem): MemberFormValues {
  return { agent_id: agent?.id ?? '', role: '执行专家', responsibility: '', execution_order: 1, required: true, status: 'ACTIVE' };
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

function toMemberUpdateInput(values: MemberFormValues) {
  return {
    role: values.role,
    responsibility: nullableText(values.responsibility),
    execution_order: values.execution_order,
    required: values.required,
    status: values.status,
  };
}

function TextField({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium">{label}
      <input className="h-10 rounded-md border bg-background px-3 text-sm outline-none" onChange={(event) => onChange(event.target.value)} value={value} />
    </label>
  );
}

function NumberField({ label, min, onChange, value }: { label: string; min: number; onChange: (value: number) => void; value: number }) {
  return (
    <label className="grid gap-2 text-sm font-medium">{label}
      <input className="h-10 rounded-md border bg-background px-3 text-sm outline-none" min={min} onChange={(event) => onChange(Number(event.target.value))} type="number" value={value} />
    </label>
  );
}
