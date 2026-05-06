'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission } from '@aiaget/shared-types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AgentFormPanel, type AgentFormValues } from '@/components/agents/agent-form-panel';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  createAgent,
  listAgentCategories,
  listUsers,
  type ApiClientError,
} from '@/lib/api-client';

export function AgentCreateContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'agent:agent:manage'),
  );

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
  const createMutation = useMutation({
    mutationFn: createAgent,
    onSuccess: async (agent) => {
      await queryClient.invalidateQueries({ queryKey: ['agents'] });
      router.push(`/agents/${agent.id}`);
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  function submitForm(values: AgentFormValues) {
    setFormError(null);
    createMutation.mutate({
      name: values.name,
      code: values.code,
      description: nullableText(values.description),
      avatar_url: nullableText(values.avatar_url),
      category_id: nullableId(values.category_id),
      owner_id: nullableId(values.owner_id),
      temperature: values.temperature,
      max_context_tokens: values.max_context_tokens,
      enable_stream: values.enable_stream,
      enable_log: values.enable_log,
    });
  }

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:px-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href="/agents">
              <ArrowLeft className="size-4" />
              Agent 列表
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">新增页</StatusBadge>
            <StatusBadge tone={canWrite ? 'healthy' : 'degraded'}>{canWrite ? '可编辑' : '只读权限'}</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">新建智能体</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            录入基础资料、负责人和运行默认值。模型、提示词、知识库和工具绑定在详情页维护。
          </p>
        </div>
      </section>

      {!canWrite ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
          当前账号没有新建智能体权限。
        </div>
      ) : (
        <AgentFormPanel
          categories={categoriesQuery.data ?? []}
          error={formError}
          isPending={createMutation.isPending}
          mode="create"
          onClose={() => router.push('/agents')}
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
