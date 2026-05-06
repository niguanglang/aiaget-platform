'use client';

import type { ChannelAccountItem, ChannelProviderItem } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Power, PowerOff, Trash2 } from 'lucide-react';
import { useState } from 'react';

import {
  ChannelOperationRow,
  ChannelOperationsListPage,
  channelReadinessLabel,
  credentialRotationLabel,
  formatNumber,
  formatOptionalDateTime,
  formatPercent,
  ChannelOperationStatusBadge,
  type ChannelOperationMetric,
} from '@/components/channels/channel-operations-pages';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  deleteChannelAccount,
  disableChannelAccount,
  enableChannelAccount,
  listChannelAccounts,
  listChannelProviders,
  type ApiClientError,
} from '@/lib/api-client';

const accountsQueryKey = 'channel-accounts-focused-page';
const providersQueryKey = 'channel-providers-for-accounts-page';

const accountStatusOptions = [
  { label: '启用', value: 'ACTIVE' },
  { label: '停用', value: 'DISABLED' },
  { label: '异常', value: 'ERROR' },
  { label: '已过期', value: 'EXPIRED' },
];

export function ChannelAccountsContent() {
  const queryClient = useQueryClient();
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const providersQuery = useQuery({ queryKey: [providersQueryKey], queryFn: () => listChannelProviders({ page: 1, page_size: 100 }) });

  const accountStatusMutation = useMutation({
    mutationFn: ({ accountId, nextStatus }: { accountId: string; nextStatus: 'ACTIVE' | 'DISABLED' }) =>
      nextStatus === 'ACTIVE' ? enableChannelAccount(accountId) : disableChannelAccount(accountId),
    onSuccess: async (_, variables) => {
      setActionNotice(variables.nextStatus === 'ACTIVE' ? '账号凭据已启用。' : '账号凭据已停用。');
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: [accountsQueryKey] });
    },
    onError: (error: ApiClientError) => {
      setActionNotice(null);
      setActionError(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteChannelAccount,
    onSuccess: async () => {
      setActionNotice('账号凭据已删除。');
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: [accountsQueryKey] });
    },
    onError: (error: ApiClientError) => {
      setActionNotice(null);
      setActionError(error.message);
    },
  });

  const providers = providersQuery.data?.items ?? [];

  return (
    <ChannelOperationsListPage
      activeRoute="accounts"
      actionError={actionError ?? (providersQuery.isError ? '渠道提供方加载失败，账号列表仍可单独查看。' : null)}
      actionNotice={actionNotice}
      badge="账号凭据"
      buildMetrics={(input) => buildAccountMetrics(input.items, input.total, providers)}
      description="集中查看渠道提供方与账号凭据，主列表只展示账号归属、环境、状态和轮换风险；凭据轮换和删除等低频动作收进详情。"
      emptyDescription="当前没有渠道账号。请先配置渠道提供方，再新增账号凭据。"
      emptyTitle="暂无账号凭据"
      errorMessage="账号凭据列表加载失败。"
      getItemId={(item) => item.id}
      listQuery={listChannelAccounts}
      queryKey={accountsQueryKey}
      renderItem={({ item, onToggle, permissions, selected }) => (
        <ChannelOperationRow
          badges={
            <>
              <ChannelOperationStatusBadge status={item.status} />
              <StatusBadge tone="ready">{item.provider_name ?? item.provider_code ?? '未绑定提供方'}</StatusBadge>
            </>
          }
          details={[
            { label: '渠道提供方', value: item.provider_name ?? item.provider_code ?? '未绑定' },
            { label: '账号 Key', value: item.account_key ?? '未配置' },
            { label: '所属渠道', value: item.channel_name ?? item.channel_id ?? '未绑定发布渠道' },
            { label: '负责人', value: item.owner ?? '未设置' },
            { label: '运行环境', value: item.environment ?? '未设置' },
            { label: '接入就绪', value: channelReadinessLabel(item.readiness) },
            { label: '凭据轮换', value: credentialRotationLabel(item.credential_rotation) },
            { label: '最近使用', value: formatOptionalDateTime(item.last_used_at) },
            { label: '更新时间', value: formatOptionalDateTime(item.updated_at) },
          ]}
          selected={selected}
          stats={[{ label: '环境', value: item.environment ?? '默认' }]}
          subtitle={
            <span>
              渠道提供方：{item.provider_name ?? item.provider_code ?? '未绑定'} · 凭据轮换：{credentialRotationLabel(item.credential_rotation)} ·
              接入就绪：{channelReadinessLabel(item.readiness)}
            </span>
          }
          title={item.account_name}
          actions={
            <>
              {item.status === 'ACTIVE' ? (
                <Button
                  disabled={!permissions.canDisable || accountStatusMutation.isPending}
                  onClick={() => accountStatusMutation.mutate({ accountId: item.id, nextStatus: 'DISABLED' })}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <PowerOff className="size-4" />
                  停用账号
                </Button>
              ) : (
                <Button
                  disabled={!permissions.canManage || accountStatusMutation.isPending}
                  onClick={() => accountStatusMutation.mutate({ accountId: item.id, nextStatus: 'ACTIVE' })}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Power className="size-4" />
                  启用账号
                </Button>
              )}
              <Button disabled={!permissions.canManage || deleteMutation.isPending} onClick={() => deleteMutation.mutate(item.id)} size="sm" type="button" variant="outline">
                <Trash2 className="size-4" />
                删除账号
              </Button>
            </>
          }
          onToggle={onToggle}
        />
      )}
      statusOptions={accountStatusOptions}
      subtitle="/channels/accounts"
      title="账号凭据"
    />
  );
}

function buildAccountMetrics(items: ChannelAccountItem[], total: number, providers: ChannelProviderItem[]): ChannelOperationMetric[] {
  const activeAccounts = items.filter((item) => item.status === 'ACTIVE').length;
  const expiredAccounts = items.filter((item) => item.status === 'EXPIRED').length;
  const configuredProviders = providers.filter((item) => item.status === 'ACTIVE').length;
  const averageProviderSuccessRate =
    providers.length > 0 ? providers.reduce((sum, item) => sum + (item.success_rate_24h ?? 0), 0) / providers.length : null;

  return [
    { label: '账号凭据', value: formatNumber(total), helper: '当前筛选范围' },
    { label: '启用账号', value: formatNumber(activeAccounts), helper: '当前页 ACTIVE' },
    { label: '过期账号', value: formatNumber(expiredAccounts), helper: '需要轮换凭据' },
    { label: '渠道提供方', value: formatNumber(configuredProviders), helper: `平均成功率 ${formatPercent(averageProviderSuccessRate)}` },
  ];
}
