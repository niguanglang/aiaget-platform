'use client';

import type { ChannelAccountItem, ChannelTemplateItem, UpdateChannelTemplateInput } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { ChannelCenterBackground } from '@/components/channels/channel-center-background';
import { ChannelAlert, ChannelFocusedHeader, useChannelOperationPermissions } from '@/components/channels/channel-operations-pages';
import { ChannelTemplateForm, type ChannelTemplateFormValues } from '@/components/channels/channel-template-route-forms';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { getChannelTemplate, listChannelProviders, updateChannelTemplate, type ApiClientError } from '@/lib/api-client';

const templatesQueryKey = 'channel-templates-focused-page';
const templateDetailQueryKey = 'channel-template-detail';
const providersQueryKey = 'channel-template-form-providers';

type JsonObject = Record<string, unknown>;

export function ChannelTemplateEditContent({ templateId }: { templateId: string }) {
  const permissions = useChannelOperationPermissions();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [actionError, setActionError] = useState<string | null>(null);

  const templateQuery = useQuery({
    enabled: permissions.canView && Boolean(templateId),
    queryKey: [templateDetailQueryKey, templateId],
    queryFn: () => getChannelTemplate(templateId),
  });

  const providersQuery = useQuery({
    enabled: permissions.canManage,
    queryKey: [providersQueryKey],
    queryFn: () => listChannelProviders({ page: 1, page_size: 100 }),
  });

  const updateMutation = useMutation({
    mutationFn: (values: ChannelTemplateFormValues) => updateChannelTemplate(templateId, toUpdateChannelTemplateInput(values)),
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: [templatesQueryKey] });
      await queryClient.invalidateQueries({ queryKey: [templateDetailQueryKey, templateId] });
      router.push('/channels/templates');
    },
    onError: (error: ApiClientError) => {
      setActionError(error.message);
    },
  });

  const item = templateQuery.data ?? null;
  const initialValue = useMemo(() => (item ? templateToFormValues(item) : null), [item]);
  const accounts = useMemo(() => (item ? templateAccountOptions(item) : []), [item]);
  const providers = providersQuery.data?.items ?? [];

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <ChannelCenterBackground />
      <ChannelFocusedHeader
        activeRoute="templates"
        badge="编辑消息模板"
        description="维护归属供应商、模板内容、变量映射和第三方模板编号。"
        permissions={permissions}
        refreshing={templateQuery.isFetching || providersQuery.isFetching || updateMutation.isPending}
        subtitle="/channels/templates/:templateId/edit"
        title="编辑消息模板"
        onRefresh={() => {
          void templateQuery.refetch();
          void providersQuery.refetch();
        }}
      />

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/channels/templates">返回模板列表</Link>
        </Button>
      </div>

      <ChannelAlert
        message={actionError ?? (templateQuery.isError ? '消息模板详情加载失败。' : providersQuery.isError ? '渠道提供方加载失败，仍可保留原有供应商绑定。' : null)}
        tone="error"
      />

      {!permissions.canManage ? (
        <Card className="p-5">
          <EmptyState description="当前账号缺少 channel:publish:manage 权限，无法编辑消息模板。" title="无权编辑消息模板" />
        </Card>
      ) : templateQuery.isLoading ? (
        <Card className="grid gap-3 p-5">
          <div className="h-16 rounded-md border bg-muted/30" />
          <div className="h-80 rounded-md border bg-muted/30" />
        </Card>
      ) : !item || !initialValue ? (
        <Card className="p-5">
          <EmptyState description="消息模板不存在、已删除或当前账号没有权限查看。" title="无法加载消息模板" />
        </Card>
      ) : (
        <ChannelTemplateForm
          accounts={accounts}
          initialValue={initialValue}
          loading={providersQuery.isLoading || updateMutation.isPending}
          providers={providers}
          onCancel={() => router.push('/channels/templates')}
          onSubmit={(values) => updateMutation.mutate(values)}
        />
      )}
    </main>
  );
}

function templateToFormValues(item: ChannelTemplateItem): Partial<ChannelTemplateFormValues> {
  const metadata = isJsonObject(item.metadata) ? item.metadata : {};

  return {
    provider_id: item.provider_id ?? null,
    account_id: toStringOrNull(metadata.account_id),
    code: item.template_code ?? '',
    name: item.name,
    template_type: item.template_type ?? 'MESSAGE',
    locale: item.language ?? null,
    subject: toStringOrNull(metadata.subject),
    body: toStringOrNull(metadata.body),
    variables: toJsonObjectOrNull(metadata.variables),
    content_schema: toJsonObjectOrNull(metadata.content_schema),
    external_template_id: toStringOrNull(metadata.external_template_id),
    version: typeof item.version === 'number' ? item.version : Number(item.version) || 1,
    status: item.status as ChannelTemplateFormValues['status'],
  };
}

function templateAccountOptions(item: ChannelTemplateItem): ChannelAccountItem[] {
  const metadata = isJsonObject(item.metadata) ? item.metadata : {};
  const accountId = toStringOrNull(metadata.account_id);
  if (!accountId) return [];

  return [
    {
      id: accountId,
      account_name: toStringOrNull(metadata.account_name) ?? accountId,
      provider_id: item.provider_id ?? null,
      provider_code: item.provider_code ?? null,
      provider_name: item.provider_name ?? null,
      status: 'ACTIVE',
    },
  ];
}

function toUpdateChannelTemplateInput(values: ChannelTemplateFormValues): UpdateChannelTemplateInput {
  return {
    provider_id: values.provider_id,
    account_id: values.account_id,
    name: values.name,
    template_type: values.template_type,
    locale: values.locale,
    subject: values.subject,
    body: values.body,
    variables: values.variables,
    content_schema: values.content_schema,
    external_template_id: values.external_template_id,
    status: values.status,
  };
}

function isJsonObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toJsonObjectOrNull(value: unknown) {
  return isJsonObject(value) ? value : null;
}

function toStringOrNull(value: unknown) {
  return typeof value === 'string' ? value : null;
}
