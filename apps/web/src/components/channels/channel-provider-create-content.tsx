'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ChannelCenterBackground } from '@/components/channels/channel-center-background';
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
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <ChannelCenterBackground />
      <ChannelFocusedHeader
        activeRoute="providers"
        badge="新建渠道提供方"
        description="渠道提供方基础接入、鉴权方式、能力列表和扩展配置。"
        permissions={permissions}
        refreshing={createMutation.isPending}
        subtitle="/channels/providers/create"
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
          <EmptyState description="当前账号缺少 channel:publish:manage 权限，无法新建渠道提供方。" title="无权新建渠道提供方" />
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
