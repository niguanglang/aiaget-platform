'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ChannelProviderForm, type ChannelProviderFormValues } from '@/components/channels/channel-provider-account-forms';
import {
  normalizeProviderFormValues,
  providerToFormValues,
  toUpdateChannelProviderInput,
} from '@/components/channels/channel-provider-form-values';
import { ChannelAlert, ChannelFocusedHeader, useChannelOperationPermissions } from '@/components/channels/channel-operations-pages';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { getChannelProvider, updateChannelProvider, type ApiClientError } from '@/lib/api-client';

export function ChannelProviderEditContent({ providerId }: { providerId: string }) {
  const permissions = useChannelOperationPermissions();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [actionError, setActionError] = useState<string | null>(null);

  const providerQuery = useQuery({
    enabled: permissions.canView && Boolean(providerId),
    queryKey: ['channel-provider-detail', providerId],
    queryFn: () => getChannelProvider(providerId),
  });

  const updateMutation = useMutation({
    mutationFn: (values: ChannelProviderFormValues) => {
      const input = normalizeProviderFormValues(values);
      return updateChannelProvider(providerId, toUpdateChannelProviderInput(input));
    },
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ['channel-providers-focused-page'] });
      await queryClient.invalidateQueries({ queryKey: ['channel-provider-detail', providerId] });
      router.push('/channels/providers');
    },
    onError: (error: ApiClientError) => {
      setActionError(error.message);
    },
  });

  const item = providerQuery.data ?? null;

  return (
    <main className="mx-auto grid max-w-[1680px] gap-5 rounded-xl border border-slate-200/80 bg-white/[0.9] px-4 py-5 shadow-sm lg:px-6">
      <ChannelFocusedHeader
        activeRoute="providers"
        badge="编辑渠道提供方"
        permissions={permissions}
        refreshing={providerQuery.isFetching || updateMutation.isPending}
        title="编辑渠道提供方"
        onRefresh={() => void providerQuery.refetch()}
      />

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/channels/providers">返回提供方列表</Link>
        </Button>
      </div>

      <ChannelAlert message={actionError ?? (providerQuery.isError ? '渠道提供方详情加载失败。' : null)} tone="error" />

      {!permissions.canManage ? (
        <Card className="p-5">
          <EmptyState title="无权编辑渠道提供方" />
        </Card>
      ) : providerQuery.isLoading ? (
        <Card className="grid gap-3 p-5">
          <div className="h-16 rounded-md border bg-muted/30" />
          <div className="h-80 rounded-md border bg-muted/30" />
        </Card>
      ) : !item ? (
        <Card className="p-5">
          <EmptyState title="无法加载渠道提供方" />
        </Card>
      ) : (
        <ChannelProviderForm
          initialValue={providerToFormValues(item)}
          loading={updateMutation.isPending}
          onCancel={() => router.push('/channels/providers')}
          onSubmit={(values) => updateMutation.mutate(values)}
        />
      )}
    </main>
  );
}
