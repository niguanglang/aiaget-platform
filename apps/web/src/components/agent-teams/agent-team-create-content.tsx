'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission } from '@aiaget/shared-types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AgentTeamFormPanel, buildTeamInput, type AgentTeamFormValues } from '@/components/agent-teams/agent-team-form-panel';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { createAgentTeam, listUsers, type ApiClientError } from '@/lib/api-client';

export function AgentTeamCreateContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const permissions = currentUser?.user.permissions ?? [];
  const isTenantAdmin = Boolean(currentUser?.user.roles.some((role) => role.code === 'tenant_admin'));
  const canManage = isTenantAdmin || hasPermission(permissions, 'agent:team:manage');

  const ownersQuery = useQuery({
    queryKey: ['agent-team-owner-options'],
    queryFn: () => listUsers({ page: 1, page_size: 100, status: 'ACTIVE' }),
  });

  const createMutation = useMutation({
    mutationFn: createAgentTeam,
    onSuccess: async (team) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['agent-teams'] }),
        queryClient.invalidateQueries({ queryKey: ['agent-team-overview'] }),
      ]);
      router.push(`/agent-teams/${team.id}`);
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  function submitForm(values: AgentTeamFormValues) {
    setFormError(null);
    createMutation.mutate(buildTeamInput(values));
  }

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:px-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href="/agent-teams">
              <ArrowLeft className="size-4" />
              Agent 团队
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">新增页</StatusBadge>
            <StatusBadge tone={canManage ? 'healthy' : 'degraded'}>{canManage ? '可编辑' : '只读权限'}</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">新建协作团队</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            录入团队基础资料、协作模式和运行约束。保存后可配置成员并发起团队任务。
          </p>
        </div>
      </section>

      {!canManage ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">当前账号没有新建 Agent 团队权限。</div>
      ) : (
        <AgentTeamFormPanel
          error={formError}
          isPending={createMutation.isPending}
          mode="create"
          onCancel={() => router.push('/agent-teams')}
          onSubmit={submitForm}
          owners={ownersQuery.data?.items ?? []}
        />
      )}
    </main>
  );
}
