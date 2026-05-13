'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission } from '@aiaget/shared-types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { KnowledgeCenterBackground } from '@/components/knowledge/knowledge-center-background';
import { KnowledgeFormPanel, type KnowledgeFormValues } from '@/components/knowledge/knowledge-form-panel';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  createKnowledgeBase,
  listUsers,
  type ApiClientError,
} from '@/lib/api-client';

export function KnowledgeCreateContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'knowledge:base:manage'),
  );

  const ownersQuery = useQuery({
    queryKey: ['knowledge-owners'],
    queryFn: () => listUsers({ page: 1, page_size: 100, status: 'ACTIVE' }),
  });

  const createMutation = useMutation({
    mutationFn: createKnowledgeBase,
    onSuccess: async (base) => {
      await queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] });
      await queryClient.invalidateQueries({ queryKey: ['knowledge-overview'] });
      router.push(`/knowledge/${base.id}`);
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  function submitForm(values: KnowledgeFormValues) {
    setFormError(null);
    createMutation.mutate({
      name: values.name,
      code: values.code,
      visibility: values.visibility,
      description: nullableText(values.description),
      owner_id: nullableId(values.owner_id),
    });
  }

  return (
    <main className="relative mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:px-6">
      <KnowledgeCenterBackground />

      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href="/knowledge">
              <ArrowLeft className="size-4" />
              知识库中心
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">新增页</StatusBadge>
            <StatusBadge tone={canWrite ? 'healthy' : 'degraded'}>{canWrite ? '可编辑' : '只读权限'}</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">新建知识库</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            录入知识库名称、编码、可见范围和负责人。保存后可补充文档、重建索引并进行检索测试。
          </p>
        </div>
      </section>

      {!canWrite ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
          当前账号没有新建知识库权限。
        </div>
      ) : (
        <KnowledgeFormPanel
          error={formError}
          isPending={createMutation.isPending}
          mode="create"
          onClose={() => router.push('/knowledge')}
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
