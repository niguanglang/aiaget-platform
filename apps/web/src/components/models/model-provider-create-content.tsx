'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hasPermission } from '@aiaget/shared-types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { ProviderFormPanel, type ProviderFormValues } from '@/components/models/provider-form-panel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
    <main className="mx-auto grid max-w-[1680px] gap-5 px-4 py-5 lg:px-7">
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
        </div>
      </section>

      {!canWrite ? (
        <div className="rounded-xl border border-slate-200/80 bg-white/[0.9] p-6 text-sm text-muted-foreground shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
          当前账号没有新建供应商权限。
        </div>
      ) : (
        <Card className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/[0.9] shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
          <ProviderFormPanel
            error={formError}
            isPending={createMutation.isPending}
            mode="create"
            onClose={() => router.push('/models')}
            onSubmit={submitForm}
            presentation="page"
          />
        </Card>
      )}
    </main>
  );
}

function nullableText(value?: string) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}
