'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ChannelCenterBackground } from '@/components/channels/channel-center-background';
import { ChannelAlert, ChannelFocusedHeader, useChannelOperationPermissions } from '@/components/channels/channel-operations-pages';
import { ChannelTemplateForm, type ChannelTemplateFormValues } from '@/components/channels/channel-template-route-forms';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { createChannelTemplate, listChannelProviders, type ApiClientError } from '@/lib/api-client';

const templatesQueryKey = 'channel-templates-focused-page';
const providersQueryKey = 'channel-template-form-providers';

export function ChannelTemplateCreateContent() {
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
    mutationFn: (values: ChannelTemplateFormValues) => createChannelTemplate(values),
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: [templatesQueryKey] });
      router.push('/channels/templates');
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
        activeRoute="templates"
        badge="新建消息模板"
        description="维护消息模板的编码、类型、语言、正文内容和内容结构。新增表单独立于列表页，保存后返回消息模板列表。"
        permissions={permissions}
        refreshing={providersQuery.isFetching || createMutation.isPending}
        subtitle="/channels/templates/create"
        title="新建消息模板"
        onRefresh={() => void providersQuery.refetch()}
      />

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/channels/templates">返回模板列表</Link>
        </Button>
      </div>

      <ChannelAlert message={actionError ?? (providersQuery.isError ? '渠道提供方加载失败，仍可先保存未绑定供应商的消息模板。' : null)} tone="error" />

      {!permissions.canManage ? (
        <Card className="p-5">
          <EmptyState description="当前账号缺少 channel:publish:manage 权限，无法新建消息模板。" title="无权新建消息模板" />
        </Card>
      ) : (
        <ChannelTemplateForm
          accounts={[]}
          loading={providersQuery.isLoading || createMutation.isPending}
          providers={providers}
          onCancel={() => router.push('/channels/templates')}
          onSubmit={(values) => createMutation.mutate(values)}
        />
      )}
    </main>
  );
}
