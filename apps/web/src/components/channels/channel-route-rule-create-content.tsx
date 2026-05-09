'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ChannelCenterBackground } from '@/components/channels/channel-center-background';
import { ChannelAlert, ChannelFocusedHeader, useChannelOperationPermissions } from '@/components/channels/channel-operations-pages';
import { ChannelRouteRuleForm, type ChannelRouteRuleFormValues } from '@/components/channels/channel-template-route-forms';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { createChannelRouteRule, listAgents, listChannelAccounts, listChannelProviders, type ApiClientError } from '@/lib/api-client';

const routeRulesQueryKey = 'channel-route-rules-focused-page';
const providersQueryKey = 'channel-providers-for-route-rule-create';
const accountsQueryKey = 'channel-accounts-for-route-rule-create';
const agentsQueryKey = 'channel-agents-for-route-rule-create';

export function ChannelRouteRuleCreateContent() {
  const permissions = useChannelOperationPermissions();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [actionError, setActionError] = useState<string | null>(null);

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

  const createMutation = useMutation({
    mutationFn: (values: ChannelRouteRuleFormValues) => createChannelRouteRule(values),
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: [routeRulesQueryKey] });
      router.push('/channels/route-rules');
    },
    onError: (error: ApiClientError) => {
      setActionError(error.message);
    },
  });

  const providers = providersQuery.data?.items ?? [];
  const accounts = accountsQuery.data?.items ?? [];
  const agents = agentsQuery.data?.items ?? [];
  const loadingOptions = providersQuery.isLoading || accountsQuery.isLoading || agentsQuery.isLoading;

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <ChannelCenterBackground />
      <ChannelFocusedHeader
        activeRoute="route-rules"
        badge="新建路由规则"
        description="配置渠道路由规则的匹配条件、优先级、关联对象和目标投递策略。新增表单独立于列表页，保存后返回路由规则列表。"
        permissions={permissions}
        refreshing={providersQuery.isFetching || accountsQuery.isFetching || agentsQuery.isFetching || createMutation.isPending}
        subtitle="/channels/route-rules/create"
        title="新建路由规则"
        onRefresh={() => {
          if (!permissions.canManage) return;
          void providersQuery.refetch();
          void accountsQuery.refetch();
          void agentsQuery.refetch();
          setActionError(null);
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
          (providersQuery.isError || accountsQuery.isError || agentsQuery.isError
            ? '路由规则表单选项加载失败，请检查渠道提供方、账号凭据或智能体接口权限。'
            : null)
        }
        tone="error"
      />

      {!permissions.canManage ? (
        <Card className="p-5">
          <EmptyState description="当前账号缺少 channel:publish:manage 权限，无法新建路由规则。" title="无权新建路由规则" />
        </Card>
      ) : loadingOptions ? (
        <Card className="grid gap-3 p-5">
          <div className="h-16 rounded-md border bg-muted/30" />
          <div className="h-96 rounded-md border bg-muted/30" />
        </Card>
      ) : (
        <ChannelRouteRuleForm
          accounts={accounts}
          agents={agents}
          loading={createMutation.isPending}
          providers={providers}
          onCancel={() => router.push('/channels/route-rules')}
          onSubmit={(values) => createMutation.mutate(values)}
        />
      )}
    </main>
  );
}
