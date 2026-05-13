'use client';

import type { ChannelAccountItem, ChannelRouteRuleItem, UpdateChannelRouteRuleInput } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { ChannelCenterBackground } from '@/components/channels/channel-center-background';
import { ChannelAlert, ChannelFocusedHeader, useChannelOperationPermissions } from '@/components/channels/channel-operations-pages';
import { ChannelRouteRuleForm, type ChannelRouteRuleFormValues } from '@/components/channels/channel-template-route-forms';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import {
  getChannelRouteRule,
  listAgents,
  listChannelAccounts,
  listChannelProviders,
  updateChannelRouteRule,
  type ApiClientError,
} from '@/lib/api-client';

const routeRulesQueryKey = 'channel-route-rules-focused-page';
const routeRuleDetailQueryKey = 'channel-route-rule-detail';
const providersQueryKey = 'channel-providers-for-route-rule-edit';
const accountsQueryKey = 'channel-accounts-for-route-rule-edit';
const agentsQueryKey = 'channel-agents-for-route-rule-edit';

export function ChannelRouteRuleEditContent({ routeRuleId }: { routeRuleId: string }) {
  const permissions = useChannelOperationPermissions();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [actionError, setActionError] = useState<string | null>(null);

  const routeRuleQuery = useQuery({
    enabled: permissions.canManage && Boolean(routeRuleId),
    queryKey: [routeRuleDetailQueryKey, routeRuleId],
    queryFn: () => getChannelRouteRule(routeRuleId),
  });

  const providersQuery = useQuery({
    enabled: permissions.canManage,
    queryKey: [providersQueryKey],
    queryFn: () => listChannelProviders({ page: 1, page_size: 100 }),
  });

  const accountsQuery = useQuery({
    enabled: permissions.canManage,
    queryKey: [accountsQueryKey],
    queryFn: () => listChannelAccounts({ page: 1, page_size: 100 }),
  });

  const agentsQuery = useQuery({
    enabled: permissions.canManage,
    queryKey: [agentsQueryKey],
    queryFn: () => listAgents({ page: 1, page_size: 100, status: 'PUBLISHED' }),
  });

  const updateMutation = useMutation({
    mutationFn: (values: ChannelRouteRuleFormValues) => updateChannelRouteRule(routeRuleId, toUpdateChannelRouteRuleInput(values)),
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: [routeRulesQueryKey] });
      await queryClient.invalidateQueries({ queryKey: [routeRuleDetailQueryKey, routeRuleId] });
      router.push('/channels/route-rules');
    },
    onError: (error: ApiClientError) => {
      setActionError(error.message);
    },
  });

  const item = routeRuleQuery.data ?? null;
  const providers = providersQuery.data?.items ?? [];
  const accounts = useMemo(() => routeRuleAccountOptions(item, accountsQuery.data?.items ?? []), [accountsQuery.data?.items, item]);
  const agents = agentsQuery.data?.items ?? [];
  const loading = routeRuleQuery.isLoading || providersQuery.isLoading || accountsQuery.isLoading || agentsQuery.isLoading;

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <ChannelCenterBackground />
      <ChannelFocusedHeader
        activeRoute="route-rules"
        badge="编辑路由规则"
        description="匹配条件、目标配置、优先级、兜底策略和启停状态。"
        permissions={permissions}
        refreshing={routeRuleQuery.isFetching || providersQuery.isFetching || accountsQuery.isFetching || agentsQuery.isFetching || updateMutation.isPending}
        subtitle="/channels/route-rules/:routeRuleId/edit"
        title="编辑路由规则"
        onRefresh={() => {
          if (!permissions.canManage) return;
          void routeRuleQuery.refetch();
          void providersQuery.refetch();
          void accountsQuery.refetch();
          void agentsQuery.refetch();
        }}
      />

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/channels/route-rules">返回路由规则列表</Link>
        </Button>
      </div>

      <ChannelAlert
        message={
          actionError ??
          (routeRuleQuery.isError || providersQuery.isError || accountsQuery.isError || agentsQuery.isError ? '路由规则详情或表单选项加载失败。' : null)
        }
        tone="error"
      />

      {!permissions.canManage ? (
        <Card className="p-5">
          <EmptyState description="当前账号缺少 channel:publish:manage 权限，无法编辑路由规则。" title="无权编辑路由规则" />
        </Card>
      ) : loading ? (
        <Card className="grid gap-3 p-5">
          <div className="h-16 rounded-md border bg-muted/30" />
          <div className="h-96 rounded-md border bg-muted/30" />
        </Card>
      ) : !item ? (
        <Card className="p-5">
          <EmptyState description="路由规则不存在、已删除或当前账号没有权限查看。" title="无法加载路由规则" />
        </Card>
      ) : (
        <ChannelRouteRuleForm
          accounts={accounts}
          agents={agents}
          initialValue={routeRuleToFormValues(item)}
          loading={updateMutation.isPending}
          providers={providers}
          onCancel={() => router.push('/channels/route-rules')}
          onSubmit={(values) => updateMutation.mutate(values)}
        />
      )}
    </main>
  );
}

function routeRuleToFormValues(item: ChannelRouteRuleItem): Partial<ChannelRouteRuleFormValues> {
  const metadata = toRecord(item.metadata);
  const status = item.status as ChannelRouteRuleFormValues['status'];

  return {
    agent_id: toNullableString(metadata.agent_id),
    provider_id: item.provider_id ?? null,
    account_id: toNullableString(metadata.account_id),
    code: toStringValue(metadata.code),
    name: item.name,
    priority: item.priority ?? 100,
    status,
    direction: (toStringValue(metadata.direction) || 'INBOUND') as ChannelRouteRuleFormValues['direction'],
    match_type: item.match_type ?? 'JSON',
    match_config: toNullableRecord(metadata.match_config),
    target_type: item.target_type ?? 'AGENT',
    target_config: toNullableRecord(metadata.target_config),
    clear_agent: false,
  };
}

function routeRuleAccountOptions(item: ChannelRouteRuleItem | null, accounts: ChannelAccountItem[]): ChannelAccountItem[] {
  if (!item) return accounts;

  const metadata = toRecord(item.metadata);
  const accountId = toNullableString(metadata.account_id);
  if (!accountId || accounts.some((account) => account.id === accountId)) return accounts;

  return [
    ...accounts,
    {
      id: accountId,
      account_name: toNullableString(metadata.account_name) ?? accountId,
      provider_id: item.provider_id ?? null,
      provider_code: toNullableString(metadata.provider_code),
      provider_name: item.provider_name ?? null,
      status: 'ACTIVE',
    },
  ];
}

function toUpdateChannelRouteRuleInput(values: ChannelRouteRuleFormValues): UpdateChannelRouteRuleInput {
  return {
    agent_id: values.agent_id,
    provider_id: values.provider_id,
    account_id: values.account_id,
    name: values.name,
    priority: values.priority,
    status: values.status,
    direction: values.direction,
    match_type: values.match_type,
    match_config: values.match_config,
    target_type: values.target_type,
    target_config: values.target_config,
    clear_agent: values.clear_agent,
  };
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || Array.isArray(value) || typeof value !== 'object') return {};

  return value as Record<string, unknown>;
}

function toNullableRecord(value: unknown): Record<string, unknown> | null {
  if (!value || Array.isArray(value) || typeof value !== 'object') return null;

  return value as Record<string, unknown>;
}

function toNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function toStringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
