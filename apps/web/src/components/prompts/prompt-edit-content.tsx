'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission } from '@aiaget/shared-types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { PromptFormPanel, type PromptFormValues } from '@/components/prompts/prompt-form-panel';
import { promptStatusLabel, promptStatusTone, promptTypeLabel } from '@/components/prompts/prompt-status';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { getPromptTemplate, listUsers, updatePromptTemplate, type ApiClientError } from '@/lib/api-client';

export function PromptEditContent({ promptId }: { promptId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'prompt:template:manage'),
  );

  const promptQuery = useQuery({
    queryKey: ['prompt-template', promptId],
    queryFn: () => getPromptTemplate(promptId),
  });
  const ownersQuery = useQuery({
    queryKey: ['prompt-owners'],
    queryFn: () => listUsers({ page: 1, page_size: 100, status: 'ACTIVE' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: PromptFormValues }) =>
      updatePromptTemplate(id, {
        name: values.name,
        type: values.type,
        status: values.status,
        content: values.content,
        description: nullableText(values.description),
        owner_id: nullableId(values.owner_id),
      }),
    onSuccess: async (prompt) => {
      queryClient.setQueryData(['prompt-template', prompt.id], prompt);
      await queryClient.invalidateQueries({ queryKey: ['prompt-templates'] });
      router.push(`/prompts/${prompt.id}`);
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  const prompt = promptQuery.data ?? null;
  const owners = ownersQuery.data?.items ?? [];

  function submitForm(values: PromptFormValues) {
    setFormError(null);
    updateMutation.mutate({ id: promptId, values });
  }

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:px-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href={prompt ? `/prompts/${prompt.id}` : '/prompts'}>
              <ArrowLeft className="size-4" />
              {prompt ? '返回提示词详情' : '返回提示词中心'}
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">编辑中</StatusBadge>
            {prompt ? <StatusBadge tone={promptStatusTone(prompt.status)}>{promptStatusLabel(prompt.status)}</StatusBadge> : null}
            {prompt ? <StatusBadge tone="planned">{promptTypeLabel(prompt.type)}</StatusBadge> : null}
            <StatusBadge tone={canWrite ? 'healthy' : 'degraded'}>{canWrite ? '可编辑' : '只读权限'}</StatusBadge>
          </div>
          <h1 className="break-words text-2xl font-semibold">{prompt ? `编辑 ${prompt.name}` : '编辑提示词'}</h1>
        </div>
      </section>

      {promptQuery.isLoading ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">正在加载提示词...</div>
      ) : promptQuery.isError || !prompt ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-destructive">提示词加载失败。</div>
      ) : !canWrite ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
          当前账号没有编辑提示词权限。
        </div>
      ) : (
        <PromptFormPanel
          error={formError}
          isPending={updateMutation.isPending}
          mode="edit"
          onClose={() => router.push(`/prompts/${prompt.id}`)}
          onSubmit={submitForm}
          owners={owners}
          presentation="page"
          prompt={prompt}
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
