'use client';

import type { ChannelRouteRuleItem } from '@aiaget/shared-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit, Plus, Power, PowerOff, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import {
  ChannelActionConfirmDialog,
  ChannelOperationRow,
  ChannelOperationsListPage,
  ChannelOperationStatusBadge,
  formatNumber,
  formatOptionalDateTime,
  useChannelOperationPermissions,
  type ChannelOperationMetric,
} from '@/components/channels/channel-operations-pages';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  deleteChannelRouteRule,
  disableChannelRouteRule,
  enableChannelRouteRule,
  listChannelRouteRules,
  type ApiClientError,
} from '@/lib/api-client';

const routeRulesQueryKey = 'channel-route-rules-focused-page';

const routeRuleStatusOptions = [
  { label: '启用', value: 'ACTIVE' },
  { label: '停用', value: 'DISABLED' },
  { label: '异常', value: 'ERROR' },
  { label: '草稿', value: 'DRAFT' },
];

type RouteRuleActionTarget = {
  action: 'enable' | 'disable' | 'delete';
  item: ChannelRouteRuleItem;
};

export function ChannelRouteRulesContent() {
  const queryClient = useQueryClient();
  const [routeRuleActionTarget, setRouteRuleActionTarget] = useState<RouteRuleActionTarget | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const routeRuleStatusMutation = useMutation({
    mutationFn: ({ routeRuleId, nextStatus }: { routeRuleId: string; nextStatus: 'ACTIVE' | 'DISABLED' }) =>
      nextStatus === 'ACTIVE' ? enableChannelRouteRule(routeRuleId) : disableChannelRouteRule(routeRuleId),
    onSuccess: async (_, variables) => {
      setActionNotice(variables.nextStatus === 'ACTIVE' ? '路由规则已启用。' : '路由规则已停用。');
      setActionError(null);
      setRouteRuleActionTarget(null);
      await queryClient.invalidateQueries({ queryKey: [routeRulesQueryKey] });
    },
    onError: (error: ApiClientError) => {
      setActionNotice(null);
      setActionError(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteChannelRouteRule,
    onSuccess: async () => {
      setActionNotice('路由规则已删除。');
      setActionError(null);
      setRouteRuleActionTarget(null);
      await queryClient.invalidateQueries({ queryKey: [routeRulesQueryKey] });
    },
    onError: (error: ApiClientError) => {
      setActionNotice(null);
      setActionError(error.message);
    },
  });

  return (
    <>
    <ChannelOperationsListPage
      activeRoute="route-rules"
      actionError={actionError}
      actionNotice={actionNotice}
      badge="路由规则"
      buildMetrics={(input) => buildRouteRuleMetrics(input.items, input.total)}
      description="入站和出站路由规则优先级、匹配方式与目标类型。"
      emptyDescription="暂无路由规则。"
      emptyTitle="暂无路由规则"
      errorMessage="路由规则列表加载失败。"
      getItemId={(item) => item.id}
      headerActions={
        <RouteRuleCreateButton />
      }
      listQuery={listChannelRouteRules}
      providerFilterLabel="供应商/渠道"
      queryKey={routeRulesQueryKey}
      renderItem={({ item, onToggle, permissions, selected }) => (
        <ChannelOperationRow
          badges={
            <>
              <ChannelOperationStatusBadge status={item.status} />
              <StatusBadge tone="mock">优先级 {item.priority ?? '-'}</StatusBadge>
            </>
          }
          details={[
            { label: '匹配方式', value: item.match_type ?? '未配置' },
            { label: '匹配值', value: item.match_value ?? '未配置' },
            { label: '目标类型', value: item.target_type ?? '未配置' },
            { label: '目标 ID', value: item.target_id ?? '未配置' },
            { label: '兜底目标', value: item.fallback_target ?? '未配置' },
            { label: '渠道提供方', value: item.provider_name ?? item.provider_id ?? '未绑定' },
            { label: '所属渠道', value: item.channel_name ?? item.channel_id ?? '未绑定发布渠道' },
            { label: '更新时间', value: formatOptionalDateTime(item.updated_at) },
          ]}
          selected={selected}
          stats={[
            { label: '匹配方式', value: item.match_type ?? '-' },
            { label: '目标类型', value: item.target_type ?? '-' },
          ]}
          subtitle={
            <span>
              匹配方式：{item.match_type ?? '未配置'} · 目标类型：{item.target_type ?? '未配置'} · 渠道提供方：
              {item.provider_name ?? item.provider_id ?? '未绑定'}
            </span>
          }
          title={item.name}
          actions={
            <>
              {permissions.canManage ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/channels/route-rules/${encodeURIComponent(item.id)}/edit`}>
                    <Edit className="size-4" />
                    编辑规则
                  </Link>
                </Button>
              ) : null}
              {item.status === 'ACTIVE' ? (
                <Button
                  disabled={!permissions.canDisable || routeRuleStatusMutation.isPending}
                  onClick={() => setRouteRuleActionTarget({ action: 'disable', item })}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <PowerOff className="size-4" />
                  停用规则
                </Button>
              ) : (
                <Button
                  disabled={!permissions.canManage || routeRuleStatusMutation.isPending}
                  onClick={() => setRouteRuleActionTarget({ action: 'enable', item })}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Power className="size-4" />
                  启用规则
                </Button>
              )}
              <Button disabled={!permissions.canManage || deleteMutation.isPending} onClick={() => setRouteRuleActionTarget({ action: 'delete', item })} size="sm" type="button" variant="outline">
                <Trash2 className="size-4" />
                删除规则
              </Button>
            </>
          }
          onToggle={onToggle}
        />
      )}
      statusOptions={routeRuleStatusOptions}
      subtitle="/channels/route-rules"
      title="路由规则"
    />
    {routeRuleActionTarget ? (
      <ChannelActionConfirmDialog
        body={getRouteRuleActionBody(routeRuleActionTarget)}
        confirmLabel={getRouteRuleActionConfirmLabel(routeRuleActionTarget.action)}
        onCancel={() => setRouteRuleActionTarget(null)}
        onConfirm={() => {
          if (routeRuleActionTarget.action === 'delete') {
            deleteMutation.mutate(routeRuleActionTarget.item.id);
            return;
          }

          routeRuleStatusMutation.mutate({
            routeRuleId: routeRuleActionTarget.item.id,
            nextStatus: routeRuleActionTarget.action === 'enable' ? 'ACTIVE' : 'DISABLED',
          });
        }}
        pending={routeRuleActionTarget.action === 'delete' ? deleteMutation.isPending : routeRuleStatusMutation.isPending}
        title={getRouteRuleActionTitle(routeRuleActionTarget.action)}
        variant={routeRuleActionTarget.action === 'delete' ? 'destructive' : 'default'}
      />
    ) : null}
    </>
  );
}

function RouteRuleCreateButton() {
  const permissions = useChannelOperationPermissions();

  if (!permissions.canManage) return null;

  return (
    <Button asChild>
      <Link href="/channels/route-rules/create">
        <Plus className="size-4" />
        新建路由规则
      </Link>
    </Button>
  );
}

function getRouteRuleActionTitle(action: RouteRuleActionTarget['action']) {
  if (action === 'enable') return '确认启用路由规则';
  if (action === 'disable') return '确认停用路由规则';

  return '确认删除路由规则';
}

function getRouteRuleActionConfirmLabel(action: RouteRuleActionTarget['action']) {
  if (action === 'enable') return '确认启用';
  if (action === 'disable') return '确认停用';

  return '确认删除';
}

function getRouteRuleActionBody(target: RouteRuleActionTarget) {
  if (target.action === 'enable') {
    return `确认启用路由规则“${target.item.name}”？启用后符合匹配条件的入站或出站流量会按该规则路由到目标渠道。`;
  }
  if (target.action === 'disable') {
    return `确认停用路由规则“${target.item.name}”？停用后符合匹配条件的流量将跳过该规则，可能落入后续规则或兜底目标。`;
  }

  return `确认删除路由规则“${target.item.name}”？删除会影响匹配方式、目标渠道和兜底链路，请确认相关流量已经迁移到其他规则。`;
}

function buildRouteRuleMetrics(items: ChannelRouteRuleItem[], total: number): ChannelOperationMetric[] {
  const activeCount = items.filter((item) => item.status === 'ACTIVE').length;
  const errorCount = items.filter((item) => item.status === 'ERROR').length;
  const matchedTargets = new Set(items.map((item) => item.target_type).filter(Boolean)).size;

  return [
    { label: '路由规则', value: formatNumber(total), helper: '当前筛选范围' },
    { label: '启用规则', value: formatNumber(activeCount), helper: '当前页 ACTIVE' },
    { label: '异常规则', value: formatNumber(errorCount), helper: '需检查匹配配置' },
    { label: '目标类型', value: formatNumber(matchedTargets), helper: '当前页去重统计' },
  ];
}
