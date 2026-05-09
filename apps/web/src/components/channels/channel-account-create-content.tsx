'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ChannelCenterBackground } from '@/components/channels/channel-center-background';
import { ChannelAccountForm, type ChannelAccountFormValues } from '@/components/channels/channel-provider-account-forms';
import { ChannelAlert, ChannelFocusedHeader, useChannelOperationPermissions } from '@/components/channels/channel-operations-pages';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { createChannelAccount, listChannelProviders, type ApiClientError } from '@/lib/api-client';

const accountsQueryKey = 'channel-accounts-focused-page';
const providersQueryKey = 'channel-providers-for-account-form';

export function ChannelAccountCreateContent() {
  const permissions = useChannelOperationPermissions();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [actionError, setActionError] = useState<string | null>(null);

  const providersQuery = useQuery({
    enabled: permissions.canManage,
    queryKey: [providersQueryKey],
    queryFn: () => listChannelProviders({ page: 1, page_size: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (values: ChannelAccountFormValues) => createChannelAccount(values),
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: [accountsQueryKey] });
      router.push('/channels/accounts');
    },
    onError: (error: ApiClientError) => {
      setActionError(error.message);
    },
  });

  const providers = providersQuery.data?.items ?? [];

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <ChannelCenterBackground />
      <ChannelFocusedHeader
        activeRoute="accounts"
        badge="新建账号凭据"
        description="选择渠道提供方并维护外部账号、密钥和扩展配置。新增表单独立于列表页，保存后返回账号凭据列表。"
        permissions={permissions}
        refreshing={providersQuery.isFetching || createMutation.isPending}
        subtitle="/channels/accounts/create"
        title="新建账号凭据"
        onRefresh={() => void providersQuery.refetch()}
      />

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/channels/accounts">返回账号凭据列表</Link>
        </Button>
      </div>

      <ChannelAlert message={actionError ?? (providersQuery.isError ? '渠道提供方列表加载失败。' : null)} tone="error" />

      {!permissions.canManage ? (
        <Card className="p-5">
          <EmptyState description="当前账号缺少 channel:publish:manage 权限，无法新建账号凭据。" title="无权新建账号凭据" />
        </Card>
      ) : providersQuery.isLoading ? (
        <Card className="grid gap-3 p-5">
          <div className="h-16 rounded-md border bg-muted/30" />
          <div className="h-80 rounded-md border bg-muted/30" />
        </Card>
      ) : (
        <ChannelAccountForm
          loading={createMutation.isPending}
          providers={providers}
          onCancel={() => router.push('/channels/accounts')}
          onSubmit={(values) => createMutation.mutate(values)}
        />
      )}
    </main>
  );
}
