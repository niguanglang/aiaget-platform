'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission } from '@aiaget/shared-types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { ModelCenterBackground } from '@/components/models/model-center-background';
import { modelProviderStatusLabel, modelProviderTypeLabel, modelStatusTone } from '@/components/models/model-status';
import { ProviderFormPanel, type ProviderFormValues } from '@/components/models/provider-form-panel';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { getModelProvider, updateModelProvider, type ApiClientError } from '@/lib/api-client';

export function ModelProviderEditContent({ providerId }: { providerId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'model:config:manage'),
  );

  const providerQuery = useQuery({
    queryKey: ['model-provider', providerId],
    queryFn: () => getModelProvider(providerId),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: ProviderFormValues }) =>
      updateModelProvider(id, {
        name: values.name,
        provider_type: values.provider_type,
        base_url: values.base_url,
        description: nullableText(values.description),
        is_default: values.is_default,
      }),
    onSuccess: async (provider) => {
      queryClient.setQueryData(['model-provider', provider.id], provider);
      await queryClient.invalidateQueries({ queryKey: ['model-providers'] });
      router.push(`/models/${provider.id}`);
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  const provider = providerQuery.data ?? null;

  function submitForm(values: ProviderFormValues) {
    setFormError(null);
    updateMutation.mutate({ id: providerId, values });
  }

  return (
    <main className="relative mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:px-6">
      <ModelCenterBackground />

      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href={provider ? `/models/${provider.id}` : '/models'}>
              <ArrowLeft className="size-4" />
              {provider ? '返回供应商详情' : '返回模型中心'}
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">编辑中</StatusBadge>
            {provider ? <StatusBadge tone={modelStatusTone(provider.status)}>{modelProviderStatusLabel(provider.status)}</StatusBadge> : null}
            {provider ? <StatusBadge tone="planned">{modelProviderTypeLabel(provider.provider_type)}</StatusBadge> : null}
            <StatusBadge tone={canWrite ? 'healthy' : 'degraded'}>{canWrite ? '可编辑' : '只读权限'}</StatusBadge>
          </div>
          <h1 className="break-words text-2xl font-semibold">{provider ? `编辑 ${provider.name}` : '编辑供应商'}</h1>
        </div>
      </section>

      {providerQuery.isLoading ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">正在加载供应商...</div>
      ) : providerQuery.isError || !provider ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-destructive">供应商加载失败。</div>
      ) : !canWrite ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
          当前账号没有编辑供应商权限。
        </div>
      ) : (
        <ProviderFormPanel
          error={formError}
          isPending={updateMutation.isPending}
          mode="edit"
          onClose={() => router.push(`/models/${provider.id}`)}
          onSubmit={submitForm}
          provider={provider}
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
