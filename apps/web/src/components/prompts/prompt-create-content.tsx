'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission } from '@aiaget/shared-types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { PromptCenterBackground } from '@/components/prompts/prompt-center-background';
import { PromptFormPanel, type PromptFormValues } from '@/components/prompts/prompt-form-panel';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { createPromptTemplate, listUsers, type ApiClientError } from '@/lib/api-client';

export function PromptCreateContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'prompt:template:manage'),
  );

  const ownersQuery = useQuery({
    queryKey: ['prompt-owners'],
    queryFn: () => listUsers({ page: 1, page_size: 100, status: 'ACTIVE' }),
  });

  const createMutation = useMutation({
    mutationFn: createPromptTemplate,
    onSuccess: async (prompt) => {
      await queryClient.invalidateQueries({ queryKey: ['prompt-templates'] });
      queryClient.setQueryData(['prompt-template', prompt.id], prompt);
      router.push(`/prompts/${prompt.id}`);
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  function submitForm(values: PromptFormValues) {
    setFormError(null);
    createMutation.mutate({
      name: values.name,
      code: values.code,
      type: values.type,
      content: values.content,
      description: nullableText(values.description),
      owner_id: nullableId(values.owner_id),
    });
  }

  return (
    <main className="relative mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:px-6">
      <PromptCenterBackground />

      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href="/prompts">
              <ArrowLeft className="size-4" />
              提示词中心
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">新增页</StatusBadge>
            <StatusBadge tone={canWrite ? 'healthy' : 'degraded'}>{canWrite ? '可编辑' : '只读权限'}</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">新建提示词</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            录入提示词基础资料和初始内容。变量、版本、渲染测试、真实模型测试和 Agent 引用在详情页维护。
          </p>
        </div>
      </section>

      {!canWrite ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
          当前账号没有新建提示词权限。
        </div>
      ) : (
        <PromptFormPanel
          error={formError}
          isPending={createMutation.isPending}
          mode="create"
          onClose={() => router.push('/prompts')}
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
