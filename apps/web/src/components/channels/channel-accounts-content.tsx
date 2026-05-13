'use client';

import type { ChannelAccountItem, ChannelProviderItem } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Plus, Power, PowerOff, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import {
  ChannelActionConfirmDialog,
  ChannelOperationRow,
  ChannelOperationsListPage,
  channelReadinessLabel,
  credentialRotationLabel,
  formatNumber,
  formatOptionalDateTime,
  formatPercent,
  ChannelOperationStatusBadge,
  useChannelOperationPermissions,
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

type AccountActionTarget = {
  action: 'enable' | 'disable' | 'delete';
  item: ChannelAccountItem;
};

export function ChannelAccountsContent() {
  const permissions = useChannelOperationPermissions();
  const queryClient = useQueryClient();
  const [accountActionTarget, setAccountActionTarget] = useState<AccountActionTarget | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const providersQuery = useQuery({ queryKey: [providersQueryKey], queryFn: () => listChannelProviders({ page: 1, page_size: 100 }) });

  const accountStatusMutation = useMutation({
    mutationFn: ({ accountId, nextStatus }: { accountId: string; nextStatus: 'ACTIVE' | 'DISABLED' }) =>
      nextStatus === 'ACTIVE' ? enableChannelAccount(accountId) : disableChannelAccount(accountId),
    onSuccess: async (_, variables) => {
      setActionNotice(variables.nextStatus === 'ACTIVE' ? '账号凭据已启用。' : '账号凭据已停用。');
      setActionError(null);
      setAccountActionTarget(null);
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
      setAccountActionTarget(null);
      await queryClient.invalidateQueries({ queryKey: [accountsQueryKey] });
    },
    onError: (error: ApiClientError) => {
      setActionNotice(null);
      setActionError(error.message);
    },
  });

  const providers = providersQuery.data?.items ?? [];

  return (
    <>
    <ChannelOperationsListPage
      activeRoute="accounts"
      actionError={actionError ?? (providersQuery.isError ? '渠道提供方加载失败，账号列表仍可单独查看。' : null)}
      actionNotice={actionNotice}
      badge="账号凭据"
      buildMetrics={(input) => buildAccountMetrics(input.items, input.total, providers)}
      description="集中查看渠道提供方与账号凭据，跟进账号归属、运行环境、启停状态、接入就绪和凭据轮换风险。"
      emptyDescription="当前没有渠道账号。请先配置渠道提供方，再新增账号凭据。"
      emptyTitle="暂无账号凭据"
      errorMessage="账号凭据列表加载失败。"
      getItemId={(item) => item.id}
      headerActions={
        permissions.canManage ? (
          <Button asChild>
            <Link href="/channels/accounts/create">
              <Plus className="size-4" />
              新建账号凭据
            </Link>
          </Button>
        ) : null
      }
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
              {permissions.canManage ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/channels/accounts/${encodeURIComponent(item.id)}/edit`}>
                    <Edit className="size-4" />
                    编辑账号
                  </Link>
                </Button>
              ) : null}
              {item.status === 'ACTIVE' ? (
                <Button
                  disabled={!permissions.canDisable || accountStatusMutation.isPending}
                  onClick={() => setAccountActionTarget({ action: 'disable', item })}
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
                  onClick={() => setAccountActionTarget({ action: 'enable', item })}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Power className="size-4" />
                  启用账号
                </Button>
              )}
              <Button disabled={!permissions.canManage || deleteMutation.isPending} onClick={() => setAccountActionTarget({ action: 'delete', item })} size="sm" type="button" variant="outline">
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
    {accountActionTarget ? (
      <ChannelActionConfirmDialog
        body={getAccountActionBody(accountActionTarget)}
        confirmLabel={getAccountActionConfirmLabel(accountActionTarget.action)}
        onCancel={() => setAccountActionTarget(null)}
        onConfirm={() => {
          if (accountActionTarget.action === 'delete') {
            deleteMutation.mutate(accountActionTarget.item.id);
            return;
          }

          accountStatusMutation.mutate({
            accountId: accountActionTarget.item.id,
            nextStatus: accountActionTarget.action === 'enable' ? 'ACTIVE' : 'DISABLED',
          });
        }}
        pending={accountActionTarget.action === 'delete' ? deleteMutation.isPending : accountStatusMutation.isPending}
        title={getAccountActionTitle(accountActionTarget.action)}
        variant={accountActionTarget.action === 'delete' ? 'destructive' : 'default'}
      />
    ) : null}
    </>
  );
}

function getAccountActionTitle(action: AccountActionTarget['action']) {
  if (action === 'enable') return '确认启用账号凭据';
  if (action === 'disable') return '确认停用账号凭据';

  return '确认删除账号凭据';
}

function getAccountActionConfirmLabel(action: AccountActionTarget['action']) {
  if (action === 'enable') return '确认启用';
  if (action === 'disable') return '确认停用';

  return '确认删除';
}

function getAccountActionBody(target: AccountActionTarget) {
  if (target.action === 'enable') {
    return `确认启用账号凭据“${target.item.account_name}”？启用后该账号可被渠道提供方、模板和路由规则选中参与消息发送。`;
  }
  if (target.action === 'disable') {
    return `确认停用账号凭据“${target.item.account_name}”？停用后依赖该账号的发送任务和路由命中将无法继续使用这组凭据。`;
  }

  return `确认删除账号凭据“${target.item.account_name}”？删除会影响关联渠道、模板发送和路由规则，请确认业务已经切换到其他账号或不再使用。`;
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
