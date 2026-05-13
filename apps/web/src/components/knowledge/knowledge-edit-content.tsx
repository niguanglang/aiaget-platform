'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission } from '@aiaget/shared-types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { KnowledgeFormPanel, type KnowledgeFormValues } from '@/components/knowledge/knowledge-form-panel';
import { knowledgeStatusLabel, knowledgeStatusTone, knowledgeVisibilityLabel } from '@/components/knowledge/knowledge-status';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { getKnowledgeBase, listUsers, updateKnowledgeBase, type ApiClientError } from '@/lib/api-client';

export function KnowledgeEditContent({ knowledgeId }: { knowledgeId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'knowledge:base:manage'),
  );

  const baseQuery = useQuery({
    queryKey: ['knowledge-base', knowledgeId],
    queryFn: () => getKnowledgeBase(knowledgeId),
  });
  const ownersQuery = useQuery({
    queryKey: ['knowledge-owners'],
    queryFn: () => listUsers({ page: 1, page_size: 100, status: 'ACTIVE' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: KnowledgeFormValues }) =>
      updateKnowledgeBase(id, toUpdateInput(values)),
    onSuccess: async (base) => {
      queryClient.setQueryData(['knowledge-base', base.id], base);
      await queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] });
      await queryClient.invalidateQueries({ queryKey: ['knowledge-overview'] });
      router.push(`/knowledge/${base.id}`);
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  const base = baseQuery.data ?? null;
  const owners = ownersQuery.data?.items ?? [];

  function submitForm(values: KnowledgeFormValues) {
    setFormError(null);
    updateMutation.mutate({ id: knowledgeId, values });
  }

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:px-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href={base ? `/knowledge/${base.id}` : '/knowledge'}>
              <ArrowLeft className="size-4" />
              {base ? '返回知识详情' : '返回知识库'}
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">编辑页</StatusBadge>
            {base ? <StatusBadge tone={knowledgeStatusTone(base.status)}>{knowledgeStatusLabel(base.status)}</StatusBadge> : null}
            {base ? <StatusBadge tone="planned">{knowledgeVisibilityLabel(base.visibility)}</StatusBadge> : null}
            <StatusBadge tone={canWrite ? 'healthy' : 'degraded'}>{canWrite ? '可编辑' : '只读权限'}</StatusBadge>
          </div>
          <h1 className="break-words text-2xl font-semibold">{base ? `编辑 ${base.name}` : '编辑知识库'}</h1>
        </div>
      </section>

      {baseQuery.isLoading ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">正在加载知识库...</div>
      ) : baseQuery.isError || !base ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-destructive">知识库加载失败。</div>
      ) : !canWrite ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
          当前账号没有编辑知识库权限。
        </div>
      ) : (
        <KnowledgeFormPanel
          base={base}
          error={formError}
          isPending={updateMutation.isPending}
          mode="edit"
          onClose={() => router.push(`/knowledge/${base.id}`)}
          onSubmit={submitForm}
          owners={owners}
          presentation="page"
        />
      )}
    </main>
  );
}

function toUpdateInput(values: KnowledgeFormValues) {
  return {
    name: values.name,
    visibility: values.visibility,
    status: values.status,
    description: nullableText(values.description),
    owner_id: nullableId(values.owner_id),
  };
}

function nullableText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function nullableId(value?: string) {
  return value || null;
}
