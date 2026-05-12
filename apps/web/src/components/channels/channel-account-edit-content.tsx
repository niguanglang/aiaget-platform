'use client';

import type { ChannelAccountItem, UpdateChannelAccountInput } from '@aiaget/shared-types';
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
import { getChannelAccount, listChannelProviders, updateChannelAccount, type ApiClientError } from '@/lib/api-client';

const accountsQueryKey = 'channel-accounts-focused-page';
const accountDetailQueryKey = 'channel-account-detail';
const providersQueryKey = 'channel-providers-for-account-form';

export function ChannelAccountEditContent({ accountId }: { accountId: string }) {
  const permissions = useChannelOperationPermissions();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [actionError, setActionError] = useState<string | null>(null);

  const accountQuery = useQuery({
    enabled: permissions.canManage && Boolean(accountId),
    queryKey: [accountDetailQueryKey, accountId],
    queryFn: () => getChannelAccount(accountId),
  });

  const providersQuery = useQuery({
    enabled: permissions.canManage,
    queryKey: [providersQueryKey],
    queryFn: () => listChannelProviders({ page: 1, page_size: 100 }),
  });

  const updateMutation = useMutation({
    mutationFn: (values: ChannelAccountFormValues) => updateChannelAccount(accountId, toUpdateChannelAccountInput(values)),
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: [accountsQueryKey] });
      await queryClient.invalidateQueries({ queryKey: [accountDetailQueryKey, accountId] });
      router.push('/channels/accounts');
    },
    onError: (error: ApiClientError) => {
      setActionError(error.message);
    },
  });

  const item = accountQuery.data ?? null;
  const providers = providersQuery.data?.items ?? [];

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <ChannelCenterBackground />
      <ChannelFocusedHeader
        activeRoute="accounts"
        badge="编辑账号凭据"
        description="维护外部账号、密钥、状态、运行环境和扩展配置。"
        permissions={permissions}
        refreshing={accountQuery.isFetching || providersQuery.isFetching || updateMutation.isPending}
        subtitle="/channels/accounts/:accountId/edit"
        title="编辑账号凭据"
        onRefresh={() => {
          void accountQuery.refetch();
          void providersQuery.refetch();
        }}
      />

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/channels/accounts">返回账号凭据列表</Link>
        </Button>
      </div>

      <ChannelAlert
        message={actionError ?? (accountQuery.isError ? '账号凭据详情加载失败。' : providersQuery.isError ? '渠道提供方列表加载失败。' : null)}
        tone="error"
      />

      {!permissions.canManage ? (
        <Card className="p-5">
          <EmptyState description="当前账号缺少 channel:publish:manage 权限，无法编辑账号凭据。" title="无权编辑账号凭据" />
        </Card>
      ) : accountQuery.isLoading || providersQuery.isLoading ? (
        <Card className="grid gap-3 p-5">
          <div className="h-16 rounded-md border bg-muted/30" />
          <div className="h-80 rounded-md border bg-muted/30" />
        </Card>
      ) : !item ? (
        <Card className="p-5">
          <EmptyState description="账号凭据不存在、已删除或当前账号没有权限查看。" title="无法加载账号凭据" />
        </Card>
      ) : (
        <ChannelAccountForm
          initialValue={accountToFormValues(item)}
          loading={updateMutation.isPending}
          providers={providers}
          onCancel={() => router.push('/channels/accounts')}
          onSubmit={(values) => updateMutation.mutate(values)}
        />
      )}
    </main>
  );
}

function accountToFormValues(item: ChannelAccountItem): Partial<ChannelAccountFormValues> {
  const metadata = item.metadata ?? {};

  return {
    provider_id: item.provider_id ?? '',
    code: item.account_key ?? getMetadataString(metadata, 'code') ?? '',
    name: item.account_name,
    external_account_id: getMetadataString(metadata, 'external_account_id'),
    secret: '',
    config: getMetadataRecord(metadata, 'config'),
    description: getMetadataString(metadata, 'description'),
    status: item.status as ChannelAccountFormValues['status'],
  };
}

function toUpdateChannelAccountInput(values: ChannelAccountFormValues): UpdateChannelAccountInput {
  return {
    name: values.name,
    external_account_id: values.external_account_id,
    ...(values.secret?.trim() ? { secret: values.secret } : {}),
    config: values.config,
    description: values.description,
    status: values.status,
  };
}

function getMetadataString(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === 'string' ? value : null;
}

function getMetadataRecord(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}
