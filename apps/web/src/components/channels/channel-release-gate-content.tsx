'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChannelReleaseGatePolicyInput } from '@aiaget/shared-types';
import { Activity } from 'lucide-react';

import { ChannelCenterBackground } from '@/components/channels/channel-center-background';
import {
  ChannelActionConfirmDialog,
  ChannelAlert,
  DetailGrid,
  formatNumber,
  formatOptionalDateTime,
  formatPercent,
  useChannelOperationPermissions,
} from '@/components/channels/channel-operations-pages';
import { ChannelReleaseHeader, PanelTitle, ReleaseChannelEmpty, ReleaseChannelPicker } from '@/components/channels/channel-release-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { evaluateChannelReleaseGate, getChannelReleaseGate, getPublishChannelOverview, updateChannelReleaseGate, type ApiClientError } from '@/lib/api-client';

type GatePolicyForm = Required<ChannelReleaseGatePolicyInput>;

export function ChannelReleaseGateContent() {
  const queryClient = useQueryClient();
  const permissions = useChannelOperationPermissions();
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [releaseGateActionTarget, setReleaseGateActionTarget] = useState<{ channelId: string; channelName: string } | null>(null);
  const [releaseGatePolicyActionTarget, setReleaseGatePolicyActionTarget] = useState<{ channelId: string; channelName: string; input: ChannelReleaseGatePolicyInput } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [gatePolicyForm, setGatePolicyForm] = useState<GatePolicyForm>({
    auto_promote_enabled: false,
    enabled: true,
    max_blocked_count: 20,
    min_allowed_rate: 80,
    min_evaluated_count: 50,
    observation_window_hours: 24,
  });
  const overviewQuery = useQuery({ enabled: permissions.canView, queryKey: ['channel-release-gate-channels'], queryFn: getPublishChannelOverview });
  const channels = overviewQuery.data?.channels ?? [];
  const selectedChannel = useMemo(() => channels.find((item) => item.id === selectedChannelId) ?? channels[0] ?? null, [channels, selectedChannelId]);
  const gateQuery = useQuery({
    enabled: permissions.canView && Boolean(selectedChannel),
    queryKey: ['channel-release-gate-page', selectedChannel?.id],
    queryFn: () => getChannelReleaseGate(selectedChannel?.id ?? ''),
  });
  const policyMutation = useMutation({
    mutationFn: ({ channelId, input }: { channelId: string; input: ChannelReleaseGatePolicyInput }) => updateChannelReleaseGate(channelId, input),
    onSuccess: async (result, variables) => {
      setNotice('门禁策略已保存。');
      setActionError(null);
      setReleaseGatePolicyActionTarget(null);
      setGatePolicyForm(policyToForm(result.policy));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['channel-release-gate-page', variables.channelId] }),
        queryClient.invalidateQueries({ queryKey: ['channel-release-control-page', variables.channelId] }),
        queryClient.invalidateQueries({ queryKey: ['channel-release-pipeline-page', variables.channelId] }),
        queryClient.invalidateQueries({ queryKey: ['channel-release-automation-page', variables.channelId] }),
        queryClient.invalidateQueries({ queryKey: ['channel-release-control-channels'] }),
        queryClient.invalidateQueries({ queryKey: ['channel-release-pipeline-channels'] }),
        queryClient.invalidateQueries({ queryKey: ['channel-release-gate-channels'] }),
        queryClient.invalidateQueries({ queryKey: ['channel-release-automation-channels'] }),
        queryClient.invalidateQueries({ queryKey: ['channel-release-self-healing-channels'] }),
        queryClient.invalidateQueries({ queryKey: ['channel-release-reports-channels'] }),
      ]);
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setActionError(error.message);
    },
  });
  const evaluateMutation = useMutation({
    mutationFn: evaluateChannelReleaseGate,
    onSuccess: async (_result, channelId) => {
      setNotice('门禁评估已完成。');
      setActionError(null);
      setReleaseGateActionTarget(null);
      await queryClient.invalidateQueries({ queryKey: ['channel-release-gate-page', channelId] });
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setActionError(error.message);
    },
  });
  const gate = gateQuery.data ?? null;
  const evaluation = gate?.evaluation ?? null;

  useEffect(() => {
    if (gate?.policy) setGatePolicyForm(policyToForm(gate.policy));
  }, [gate?.policy]);

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <ChannelCenterBackground />
      <ChannelReleaseHeader
        badge="发布观测门禁"
        description="门禁结论、观测指标和门禁策略。"
        refreshing={overviewQuery.isFetching || gateQuery.isFetching || evaluateMutation.isPending || policyMutation.isPending}
        subtitle="/channels/release/gate"
        title="发布观测门禁"
        onRefresh={() => {
          void overviewQuery.refetch();
          void gateQuery.refetch();
        }}
      />
      <ChannelAlert message={notice} tone="ready" />
      <ChannelAlert message={actionError ?? (overviewQuery.isError || gateQuery.isError ? '发布观测门禁加载失败。' : null)} tone="error" />
      <ReleaseChannelPicker channels={channels} selectedChannel={selectedChannel} onSelect={setSelectedChannelId} />
      {!selectedChannel ? (
        <ReleaseChannelEmpty />
      ) : !gate || !evaluation ? (
        <Card className="p-5"><EmptyState description="发布观测门禁数据暂不可用。" title="暂无门禁结论" /></Card>
      ) : (
        <>
          <Card className="grid gap-4 p-5">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <PanelTitle helper="灰度观测结论" title="门禁结论" />
              <Button
                disabled={!permissions.canDeploy || evaluateMutation.isPending}
                onClick={() => setReleaseGateActionTarget({ channelId: selectedChannel.id, channelName: selectedChannel.name })}
                type="button"
                variant="outline"
              >
                <Activity className="size-4" />
                评估门禁
              </Button>
            </div>
            <DetailGrid items={[
              { label: '门禁结论', value: evaluation.decision },
              { label: '是否可全量', value: evaluation.eligible_for_full_release ? '是' : '否' },
              { label: '原因', value: evaluation.reason },
              { label: '评估时间', value: formatOptionalDateTime(evaluation.evaluated_at) },
            ]} />
          </Card>
          <Card className="grid gap-4 p-5">
            <PanelTitle helper="放行、阻断和旁路指标" title="观测指标" />
            <DetailGrid items={[
              { label: '评估数', value: formatNumber(evaluation.metrics.evaluated_count) },
              { label: '放行数', value: formatNumber(evaluation.metrics.allowed_count) },
              { label: '阻断数', value: formatNumber(evaluation.metrics.blocked_count) },
              { label: '旁路数', value: formatNumber(evaluation.metrics.bypass_count) },
              { label: '放行率', value: formatPercent(evaluation.metrics.allowed_rate) },
            ]} />
          </Card>
          <Card className="grid gap-4 p-5">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
              <PanelTitle helper="门禁开关、阈值和样本量" title="门禁策略配置" />
              <Button
                disabled={!permissions.canManage || policyMutation.isPending}
                onClick={() => setReleaseGatePolicyActionTarget({ channelId: selectedChannel.id, channelName: selectedChannel.name, input: gatePolicyForm })}
                type="button"
                variant="outline"
              >
                保存门禁策略
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <label className="grid gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm">
                <span className="text-xs text-muted-foreground">策略启用</span>
                <select className="h-9 rounded-md border bg-background px-2" disabled={!permissions.canManage} onChange={(event) => setGatePolicyForm((form) => ({ ...form, enabled: event.target.value === 'true' }))} value={String(gatePolicyForm.enabled)}>
                  <option value="true">启用</option>
                  <option value="false">停用</option>
                </select>
              </label>
              <NumberPolicyField disabled={!permissions.canManage} label="最小评估数" max={100000} min={1} onChange={(value) => setGatePolicyForm((form) => ({ ...form, min_evaluated_count: value }))} value={gatePolicyForm.min_evaluated_count} />
              <NumberPolicyField disabled={!permissions.canManage} label="最小放行率" max={100} min={0} onChange={(value) => setGatePolicyForm((form) => ({ ...form, min_allowed_rate: value }))} suffix="%" value={gatePolicyForm.min_allowed_rate} />
              <NumberPolicyField disabled={!permissions.canManage} label="最大阻断数" max={100000} min={0} onChange={(value) => setGatePolicyForm((form) => ({ ...form, max_blocked_count: value }))} value={gatePolicyForm.max_blocked_count} />
              <label className="grid gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm">
                <span className="text-xs text-muted-foreground">后续自动推进</span>
                <select className="h-9 rounded-md border bg-background px-2" disabled={!permissions.canManage} onChange={(event) => setGatePolicyForm((form) => ({ ...form, auto_promote_enabled: event.target.value === 'true' }))} value={String(gatePolicyForm.auto_promote_enabled)}>
                  <option value="true">启用</option>
                  <option value="false">停用</option>
                </select>
              </label>
              <NumberPolicyField disabled={!permissions.canManage} label="观测窗口" max={168} min={1} onChange={(value) => setGatePolicyForm((form) => ({ ...form, observation_window_hours: value }))} suffix="小时" value={gatePolicyForm.observation_window_hours} />
            </div>
            {!permissions.canManage ? <p className="text-xs text-muted-foreground">当前账号缺少 channel:publish:manage 权限，只能查看门禁策略。</p> : null}
          </Card>
        </>
      )}
      {releaseGateActionTarget ? (
        <ChannelActionConfirmDialog
          body={`确认评估发布渠道“${releaseGateActionTarget.channelName}”的观测门禁？系统会重新计算该渠道当前灰度观测指标、门禁结论和是否可推进全量，影响范围仅限此渠道。`}
          confirmLabel="确认评估"
          onCancel={() => setReleaseGateActionTarget(null)}
          onConfirm={() => evaluateMutation.mutate(releaseGateActionTarget.channelId)}
          pending={evaluateMutation.isPending}
          title="确认评估门禁"
        />
      ) : null}
      {releaseGatePolicyActionTarget ? (
        <ChannelActionConfirmDialog
          body={`确认保存发布渠道“${releaseGatePolicyActionTarget.channelName}”的门禁策略？新阈值会影响后续门禁评估、自动推进判断和发布治理事件。`}
          confirmLabel="确认保存"
          onCancel={() => setReleaseGatePolicyActionTarget(null)}
          onConfirm={() => policyMutation.mutate({ channelId: releaseGatePolicyActionTarget.channelId, input: releaseGatePolicyActionTarget.input })}
          pending={policyMutation.isPending}
          title="确认保存门禁策略"
        />
      ) : null}
    </main>
  );
}

function NumberPolicyField({
  disabled,
  label,
  max,
  min,
  onChange,
  suffix,
  value,
}: {
  disabled: boolean;
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  suffix?: string;
  value: number;
}) {
  return (
    <label className="grid gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="grid grid-cols-[1fr_auto] items-center gap-2">
        <input
          className="h-9 rounded-md border bg-background px-2"
          disabled={disabled}
          max={max}
          min={min}
          onChange={(event) => onChange(clampInteger(event.target.value, min, max))}
          type="number"
          value={value}
        />
        {suffix ? <span className="text-xs text-muted-foreground">{suffix}</span> : null}
      </div>
    </label>
  );
}

function clampInteger(value: string, min: number, max: number) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
}

function policyToForm(policy: { auto_promote_enabled: boolean; enabled: boolean; max_blocked_count: number; min_allowed_rate: number; min_evaluated_count: number; observation_window_hours: number }): GatePolicyForm {
  return {
    auto_promote_enabled: policy.auto_promote_enabled,
    enabled: policy.enabled,
    max_blocked_count: policy.max_blocked_count,
    min_allowed_rate: policy.min_allowed_rate,
    min_evaluated_count: policy.min_evaluated_count,
    observation_window_hours: policy.observation_window_hours,
  };
}
