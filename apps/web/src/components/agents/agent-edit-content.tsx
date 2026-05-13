'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission } from '@aiaget/shared-types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AgentFormPanel, type AgentFormValues } from '@/components/agents/agent-form-panel';
import { agentStatusLabel, agentStatusTone } from '@/components/agents/agent-status';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  getAgent,
  listAgentCategories,
  listUsers,
  updateAgent,
  type ApiClientError,
} from '@/lib/api-client';

export function AgentEditContent({ agentId }: { agentId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'agent:agent:manage'),
  );

  const agentQuery = useQuery({
    queryKey: ['agent', agentId],
    queryFn: () => getAgent(agentId),
  });
  const categoriesQuery = useQuery({
    queryKey: ['agent-categories'],
    queryFn: listAgentCategories,
  });
  const ownersQuery = useQuery({
    queryKey: ['agent-owners'],
    queryFn: () =>
      listUsers({
        page: 1,
        page_size: 100,
        status: 'ACTIVE',
      }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: AgentFormValues }) =>
      updateAgent(id, {
        name: values.name,
        description: nullableText(values.description),
        avatar_url: nullableText(values.avatar_url),
        category_id: nullableId(values.category_id),
        owner_id: nullableId(values.owner_id),
        status: values.status,
        temperature: values.temperature,
        max_context_tokens: values.max_context_tokens,
        enable_stream: values.enable_stream,
        enable_log: values.enable_log,
      }),
    onSuccess: async (agent) => {
      queryClient.setQueryData(['agent', agent.id], agent);
      await queryClient.invalidateQueries({ queryKey: ['agents'] });
      router.push(`/agents/${agent.id}`);
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  function submitForm(values: AgentFormValues) {
    setFormError(null);
    updateMutation.mutate({ id: agentId, values });
  }

  const agent = agentQuery.data;

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:px-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href={agent ? `/agents/${agent.id}` : '/agents'}>
              <ArrowLeft className="size-4" />
              {agent ? 'Agent 详情' : 'Agent 列表'}
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">编辑中</StatusBadge>
            {agent ? <StatusBadge tone={agentStatusTone(agent.status)}>{agentStatusLabel(agent.status)}</StatusBadge> : null}
            <StatusBadge tone={canWrite ? 'healthy' : 'degraded'}>{canWrite ? '可编辑' : '只读权限'}</StatusBadge>
          </div>
          <h1 className="break-words text-2xl font-semibold">{agent ? `编辑 ${agent.name}` : '编辑智能体'}</h1>
        </div>
      </section>

      {agentQuery.isLoading ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">正在加载智能体...</div>
      ) : agentQuery.isError || !agent ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-destructive">智能体加载失败。</div>
      ) : !canWrite ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
          当前账号没有编辑智能体权限。
        </div>
      ) : (
        <AgentFormPanel
          agent={agent}
          categories={categoriesQuery.data ?? []}
          error={formError}
          isPending={updateMutation.isPending}
          mode="edit"
          onClose={() => router.push(`/agents/${agent.id}`)}
          onSubmit={submitForm}
          owners={ownersQuery.data?.items ?? []}
          presentation="page"
        />
      )}
    </main>
  );
}

function nullableText(value?: string) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function nullableId(value?: string) {
  return value || null;
}
