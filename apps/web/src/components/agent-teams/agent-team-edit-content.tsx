'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission } from '@aiaget/shared-types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AgentTeamFormPanel, buildTeamInput, type AgentTeamFormValues } from '@/components/agent-teams/agent-team-form-panel';
import { ErrorPanel, LoadingPanel, teamStatusLabel, teamStatusTone } from '@/components/agent-teams/agent-teams-shared';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { getAgentTeam, listUsers, updateAgentTeam, type ApiClientError } from '@/lib/api-client';

export function AgentTeamEditContent({ teamId }: { teamId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const permissions = currentUser?.user.permissions ?? [];
  const isTenantAdmin = Boolean(currentUser?.user.roles.some((role) => role.code === 'tenant_admin'));
  const canManage = isTenantAdmin || hasPermission(permissions, 'agent:team:manage');

  const teamQuery = useQuery({
    queryKey: ['agent-team', teamId],
    queryFn: () => getAgentTeam(teamId),
  });
  const ownersQuery = useQuery({
    queryKey: ['agent-team-owner-options'],
    queryFn: () => listUsers({ page: 1, page_size: 100, status: 'ACTIVE' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: AgentTeamFormValues }) => {
      const input = buildTeamInput(values);
      return updateAgentTeam(id, {
        name: input.name,
        description: input.description,
        owner_id: input.owner_id,
        status: input.status,
        mode: input.mode,
        max_rounds: input.max_rounds,
        timeout_seconds: input.timeout_seconds,
        handoff_policy: input.handoff_policy,
        supervisor_prompt: input.supervisor_prompt,
        failure_policy: input.failure_policy,
        quality_gate_enabled: input.quality_gate_enabled,
        quality_threshold: input.quality_threshold,
        budget_token_limit: input.budget_token_limit,
        budget_cost_limit: input.budget_cost_limit,
      });
    },
    onSuccess: async (team) => {
      queryClient.setQueryData(['agent-team', team.id], team);
      await queryClient.invalidateQueries({ queryKey: ['agent-teams'] });
      router.push(`/agent-teams/${team.id}`);
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  function submitForm(values: AgentTeamFormValues) {
    setFormError(null);
    updateMutation.mutate({ id: teamId, values });
  }

  const team = teamQuery.data;

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:px-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href={team ? `/agent-teams/${team.id}` : '/agent-teams'}>
              <ArrowLeft className="size-4" />
              {team ? '团队详情' : 'Agent 团队'}
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">编辑页</StatusBadge>
            {team ? <StatusBadge tone={teamStatusTone(team.status)}>{teamStatusLabel(team.status)}</StatusBadge> : null}
            <StatusBadge tone={canManage ? 'healthy' : 'degraded'}>{canManage ? '可编辑' : '只读权限'}</StatusBadge>
          </div>
          <h1 className="break-words text-2xl font-semibold">{team ? `编辑协作团队：${team.name}` : '编辑协作团队'}</h1>
        </div>
      </section>

      {teamQuery.isLoading ? (
        <LoadingPanel text="正在加载协作团队..." />
      ) : teamQuery.isError || !team ? (
        <ErrorPanel text="协作团队加载失败。" />
      ) : !canManage ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">当前账号没有编辑 Agent 团队权限。</div>
      ) : (
        <AgentTeamFormPanel
          error={formError}
          isPending={updateMutation.isPending}
          mode="edit"
          onCancel={() => router.push(`/agent-teams/${team.id}`)}
          onSubmit={submitForm}
          owners={ownersQuery.data?.items ?? []}
          team={team}
        />
      )}
    </main>
  );
}
