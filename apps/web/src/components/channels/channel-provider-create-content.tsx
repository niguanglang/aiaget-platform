'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ChannelProviderForm, type ChannelProviderFormValues } from '@/components/channels/channel-provider-account-forms';
import { normalizeProviderFormValues } from '@/components/channels/channel-provider-form-values';
import { ChannelAlert, ChannelFocusedHeader, useChannelOperationPermissions } from '@/components/channels/channel-operations-pages';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { createChannelProvider, type ApiClientError } from '@/lib/api-client';

export function ChannelProviderCreateContent() {
  const permissions = useChannelOperationPermissions();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [actionError, setActionError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (values: ChannelProviderFormValues) => createChannelProvider(normalizeProviderFormValues(values)),
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ['channel-providers-focused-page'] });
      router.push('/channels/providers');
    },
    onError: (error: ApiClientError) => {
      setActionError(error.message);
    },
  });

  return (
    <main className="mx-auto grid max-w-[1680px] gap-5 rounded-xl border border-slate-200/80 bg-white/[0.9] px-4 py-5 shadow-sm lg:px-6">
      <ChannelFocusedHeader
        activeRoute="providers"
        badge="新建渠道提供方"
        permissions={permissions}
        refreshing={createMutation.isPending}
        title="新建渠道提供方"
        onRefresh={() => setActionError(null)}
      />

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/channels/providers">返回提供方列表</Link>
        </Button>
      </div>

      <ChannelAlert message={actionError} tone="error" />

      {!permissions.canManage ? (
        <Card className="p-5">
          <EmptyState title="无权新建渠道提供方" />
        </Card>
      ) : (
        <ChannelProviderForm
          loading={createMutation.isPending}
          onCancel={() => router.push('/channels/providers')}
          onSubmit={(values) => createMutation.mutate(values)}
        />
      )}
    </main>
  );
}
