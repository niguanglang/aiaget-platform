'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hasPermission } from '@aiaget/shared-types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { ModelCenterBackground } from '@/components/models/model-center-background';
import { ProviderFormPanel, type ProviderFormValues } from '@/components/models/provider-form-panel';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { createModelProvider, type ApiClientError } from '@/lib/api-client';

export function ModelProviderCreateContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'model:config:manage'),
  );

  const createMutation = useMutation({
    mutationFn: createModelProvider,
    onSuccess: async (provider) => {
      await queryClient.invalidateQueries({ queryKey: ['model-providers'] });
      queryClient.setQueryData(['model-provider', provider.id], provider);
      router.push(`/models/${provider.id}`);
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  function submitForm(values: ProviderFormValues) {
    setFormError(null);
    createMutation.mutate({
      name: values.name,
      code: values.code,
      provider_type: values.provider_type,
      base_url: values.base_url,
      description: nullableText(values.description),
      is_default: values.is_default,
    });
  }

  return (
    <main className="relative mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:px-6">
      <ModelCenterBackground />

      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href="/models">
              <ArrowLeft className="size-4" />
              模型中心
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">新增页</StatusBadge>
            <StatusBadge tone={canWrite ? 'healthy' : 'degraded'}>{canWrite ? '可编辑' : '只读权限'}</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">新建供应商</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            录入供应商名称、类型、基础 URL 和默认标记。模型、密钥和调用测试在供应商详情页维护。
          </p>
        </div>
      </section>

      {!canWrite ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
          当前账号没有新建供应商权限。
        </div>
      ) : (
        <ProviderFormPanel
          error={formError}
          isPending={createMutation.isPending}
          mode="create"
          onClose={() => router.push('/models')}
          onSubmit={submitForm}
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
