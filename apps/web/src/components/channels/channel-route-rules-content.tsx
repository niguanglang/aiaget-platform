'use client';

import type { ChannelRouteRuleItem } from '@aiaget/shared-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Power, PowerOff, Trash2 } from 'lucide-react';
import { useState } from 'react';

import {
  ChannelOperationRow,
  ChannelOperationsListPage,
  ChannelOperationStatusBadge,
  formatNumber,
  formatOptionalDateTime,
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

export function ChannelRouteRulesContent() {
  const queryClient = useQueryClient();
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const routeRuleStatusMutation = useMutation({
    mutationFn: ({ routeRuleId, nextStatus }: { routeRuleId: string; nextStatus: 'ACTIVE' | 'DISABLED' }) =>
      nextStatus === 'ACTIVE' ? enableChannelRouteRule(routeRuleId) : disableChannelRouteRule(routeRuleId),
    onSuccess: async (_, variables) => {
      setActionNotice(variables.nextStatus === 'ACTIVE' ? '路由规则已启用。' : '路由规则已停用。');
      setActionError(null);
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
      await queryClient.invalidateQueries({ queryKey: [routeRulesQueryKey] });
    },
    onError: (error: ApiClientError) => {
      setActionNotice(null);
      setActionError(error.message);
    },
  });

  return (
    <ChannelOperationsListPage
      activeRoute="route-rules"
      actionError={actionError}
      actionNotice={actionNotice}
      badge="路由规则"
      buildMetrics={(input) => buildRouteRuleMetrics(input.items, input.total)}
      description="维护入站和出站路由规则的优先级、匹配方式与目标类型。主列表按规则意图呈现，复杂匹配配置进入详情区域。"
      emptyDescription="当前没有路由规则。配置入站或出站规则后，渠道回调和消息发送会按优先级匹配。"
      emptyTitle="暂无路由规则"
      errorMessage="路由规则列表加载失败。"
      getItemId={(item) => item.id}
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
              {item.status === 'ACTIVE' ? (
                <Button
                  disabled={!permissions.canDisable || routeRuleStatusMutation.isPending}
                  onClick={() => routeRuleStatusMutation.mutate({ routeRuleId: item.id, nextStatus: 'DISABLED' })}
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
                  onClick={() => routeRuleStatusMutation.mutate({ routeRuleId: item.id, nextStatus: 'ACTIVE' })}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Power className="size-4" />
                  启用规则
                </Button>
              )}
              <Button disabled={!permissions.canManage || deleteMutation.isPending} onClick={() => deleteMutation.mutate(item.id)} size="sm" type="button" variant="outline">
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
  );
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
