'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChannelReleaseSelfHealingPolicyInput } from '@aiaget/shared-types';
import { ShieldCheck } from 'lucide-react';

import { ChannelCenterBackground } from '@/components/channels/channel-center-background';
import { ChannelActionConfirmDialog, ChannelAlert, DetailGrid, formatNumber, formatOptionalDateTime, formatPercent, useChannelOperationPermissions } from '@/components/channels/channel-operations-pages';
import { ChannelReleaseHeader, PanelTitle, ReleaseChannelEmpty, ReleaseChannelPicker } from '@/components/channels/channel-release-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { getChannelReleaseSelfHealing, getPublishChannelOverview, runChannelReleaseSelfHealing, updateChannelReleaseSelfHealing, type ApiClientError } from '@/lib/api-client';

type SelfHealingPolicyForm = Required<ChannelReleaseSelfHealingPolicyInput>;

export function ChannelReleaseSelfHealingContent() {
  const queryClient = useQueryClient();
  const permissions = useChannelOperationPermissions();
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [releaseSelfHealingActionTarget, setReleaseSelfHealingActionTarget] = useState<{ channelId: string; channelName: string } | null>(null);
  const [releaseSelfHealingPolicyActionTarget, setReleaseSelfHealingPolicyActionTarget] = useState<{ channelId: string; channelName: string; input: ChannelReleaseSelfHealingPolicyInput } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selfHealingPolicyForm, setSelfHealingPolicyForm] = useState<SelfHealingPolicyForm>({
    auto_rollback_enabled: false,
    cooldown_minutes: 30,
    dry_run: true,
    enabled: false,
    max_error_requests: 10,
    min_allowed_rate: 90,
    observation_window_hours: 24,
  });
  const overviewQuery = useQuery({ enabled: permissions.canView, queryKey: ['channel-release-self-healing-channels'], queryFn: getPublishChannelOverview });
  const channels = overviewQuery.data?.channels ?? [];
  const selectedChannel = useMemo(() => channels.find((item) => item.id === selectedChannelId) ?? channels[0] ?? null, [channels, selectedChannelId]);
  const selfHealingQuery = useQuery({
    enabled: permissions.canView && Boolean(selectedChannel),
    queryKey: ['channel-release-self-healing-page', selectedChannel?.id],
    queryFn: () => getChannelReleaseSelfHealing(selectedChannel?.id ?? ''),
  });
  const policyMutation = useMutation({
    mutationFn: ({ channelId, input }: { channelId: string; input: ChannelReleaseSelfHealingPolicyInput }) => updateChannelReleaseSelfHealing(channelId, input),
    onSuccess: async (result, variables) => {
      setNotice('自愈策略已保存。');
      setActionError(null);
      setReleaseSelfHealingPolicyActionTarget(null);
      setSelfHealingPolicyForm(policyToForm(result.policy));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['channel-release-self-healing-page', variables.channelId] }),
        queryClient.invalidateQueries({ queryKey: ['channel-release-control-page', variables.channelId] }),
        queryClient.invalidateQueries({ queryKey: ['channel-release-automation-page', variables.channelId] }),
        queryClient.invalidateQueries({ queryKey: ['channel-release-gate-page', variables.channelId] }),
        queryClient.invalidateQueries({ queryKey: ['channel-release-pipeline-page', variables.channelId] }),
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
  const runMutation = useMutation({
    mutationFn: runChannelReleaseSelfHealing,
    onSuccess: async (_result, channelId) => {
      setNotice('自愈任务已运行。');
      setActionError(null);
      setReleaseSelfHealingActionTarget(null);
      await queryClient.invalidateQueries({ queryKey: ['channel-release-self-healing-page', channelId] });
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setActionError(error.message);
    },
  });
  const selfHealing = selfHealingQuery.data ?? null;
  const evaluation = selfHealing?.evaluation ?? null;

  useEffect(() => {
    if (selfHealing?.policy) setSelfHealingPolicyForm(policyToForm(selfHealing.policy));
  }, [selfHealing?.policy]);

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <ChannelCenterBackground />
      <ChannelReleaseHeader
        badge="发布自愈"
        description="自愈结论、回滚建议、异常指标和自愈策略。"
        refreshing={overviewQuery.isFetching || selfHealingQuery.isFetching || runMutation.isPending || policyMutation.isPending}
        subtitle="/channels/release/self-healing"
        title="发布自愈"
        onRefresh={() => {
          void overviewQuery.refetch();
          void selfHealingQuery.refetch();
        }}
      />
      <ChannelAlert message={notice} tone="ready" />
      <ChannelAlert message={actionError ?? (overviewQuery.isError || selfHealingQuery.isError ? '发布自愈加载失败。' : null)} tone="error" />
      <ReleaseChannelPicker channels={channels} selectedChannel={selectedChannel} onSelect={setSelectedChannelId} />
      {!selectedChannel ? (
        <ReleaseChannelEmpty />
      ) : !selfHealing || !evaluation ? (
        <Card className="p-5"><EmptyState description="发布自愈数据暂不可用。" title="暂无自愈结论" /></Card>
      ) : (
        <>
          <Card className="grid gap-4 p-5">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <PanelTitle helper="错误请求、放行率和回滚条件" title="自愈结论" />
              <Button
                disabled={!permissions.canDeploy || runMutation.isPending}
                onClick={() => setReleaseSelfHealingActionTarget({ channelId: selectedChannel.id, channelName: selectedChannel.name })}
                type="button"
                variant="outline"
              >
                <ShieldCheck className="size-4" />
                运行自愈
              </Button>
            </div>
            <DetailGrid items={[
              { label: '自愈结论', value: evaluation.decision },
              { label: '建议回滚', value: evaluation.rollback_recommended ? '是' : '否' },
              { label: '可回滚', value: evaluation.rollback_available ? '是' : '否' },
              { label: '工作流后端', value: selfHealing.workflow_backend ?? '-' },
              { label: 'Workflow ID', value: selfHealing.workflow_id ?? '-' },
              { label: 'Workflow Run ID', value: selfHealing.workflow_run_id ?? '-' },
              { label: '原因', value: evaluation.reason },
              { label: '评估时间', value: formatOptionalDateTime(evaluation.evaluated_at) },
            ]} />
          </Card>
          <Card className="grid gap-4 p-5">
            <PanelTitle helper="错误请求和门禁指标" title="自愈指标" />
            <DetailGrid items={[
              { label: '评估数', value: formatNumber(evaluation.metrics.evaluated_count) },
              { label: '放行率', value: formatPercent(evaluation.metrics.allowed_rate) },
              { label: '阻断数', value: formatNumber(evaluation.metrics.blocked_count) },
              { label: '错误请求', value: formatNumber(evaluation.metrics.error_request_count) },
            ]} />
          </Card>
          <Card className="grid gap-4 p-5">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
              <PanelTitle helper="自愈开关、演练模式、回滚阈值、观测窗口和冷却时间" title="自愈策略配置" />
              <Button
                disabled={!permissions.canManage || policyMutation.isPending}
                onClick={() => setReleaseSelfHealingPolicyActionTarget({ channelId: selectedChannel.id, channelName: selectedChannel.name, input: selfHealingPolicyForm })}
                type="button"
                variant="outline"
              >
                保存自愈策略
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <BooleanPolicyField disabled={!permissions.canManage} label="策略启用" onChange={(value) => setSelfHealingPolicyForm((form) => ({ ...form, enabled: value }))} value={selfHealingPolicyForm.enabled} />
              <BooleanPolicyField disabled={!permissions.canManage} label="演练模式" onChange={(value) => setSelfHealingPolicyForm((form) => ({ ...form, dry_run: value }))} value={selfHealingPolicyForm.dry_run} />
              <BooleanPolicyField disabled={!permissions.canManage} label="自动回滚" onChange={(value) => setSelfHealingPolicyForm((form) => ({ ...form, auto_rollback_enabled: value }))} value={selfHealingPolicyForm.auto_rollback_enabled} />
              <NumberPolicyField disabled={!permissions.canManage} label="最大错误请求" max={100000} min={0} onChange={(value) => setSelfHealingPolicyForm((form) => ({ ...form, max_error_requests: value }))} value={selfHealingPolicyForm.max_error_requests} />
              <NumberPolicyField disabled={!permissions.canManage} label="最小放行率" max={100} min={0} onChange={(value) => setSelfHealingPolicyForm((form) => ({ ...form, min_allowed_rate: value }))} suffix="%" value={selfHealingPolicyForm.min_allowed_rate} />
              <NumberPolicyField disabled={!permissions.canManage} label="观测窗口" max={168} min={1} onChange={(value) => setSelfHealingPolicyForm((form) => ({ ...form, observation_window_hours: value }))} suffix="小时" value={selfHealingPolicyForm.observation_window_hours} />
              <NumberPolicyField disabled={!permissions.canManage} label="冷却时间" max={1440} min={1} onChange={(value) => setSelfHealingPolicyForm((form) => ({ ...form, cooldown_minutes: value }))} suffix="分钟" value={selfHealingPolicyForm.cooldown_minutes} />
            </div>
            {!permissions.canManage ? <p className="text-xs text-muted-foreground">当前账号缺少 channel:publish:manage 权限，只能查看自愈策略。</p> : null}
          </Card>
          <Card className="grid gap-4 p-5">
            <PanelTitle helper="Runtime / Temporal 追踪标识" title="最近自愈运行" />
            {!selfHealing.last_run ? <EmptyState description="当前没有自愈运行记录。" title="暂无最近运行" /> : (
              <DetailGrid items={[
                { label: '运行 ID', value: selfHealing.last_run.run_id },
                { label: '自愈结论', value: selfHealing.last_run.decision },
                { label: '是否回滚', value: selfHealing.last_run.rolled_back ? '是' : '否' },
                { label: '工作流后端', value: selfHealing.last_run.workflow_backend ?? '-' },
                { label: 'Workflow ID', value: selfHealing.last_run.workflow_id ?? '-' },
                { label: 'Workflow Run ID', value: selfHealing.last_run.workflow_run_id ?? '-' },
                { label: '原因', value: selfHealing.last_run.reason },
                { label: '完成时间', value: formatOptionalDateTime(selfHealing.last_run.finished_at) },
              ]} />
            )}
          </Card>
        </>
      )}
      {releaseSelfHealingActionTarget ? (
        <ChannelActionConfirmDialog
          body={`确认为发布渠道“${releaseSelfHealingActionTarget.channelName}”运行自愈？系统会检查该渠道错误请求、放行率和回滚条件，可能产生回滚建议或自愈记录，影响范围仅限此渠道。`}
          confirmLabel="确认运行"
          onCancel={() => setReleaseSelfHealingActionTarget(null)}
          onConfirm={() => runMutation.mutate(releaseSelfHealingActionTarget.channelId)}
          pending={runMutation.isPending}
          title="确认运行自愈"
        />
      ) : null}
      {releaseSelfHealingPolicyActionTarget ? (
        <ChannelActionConfirmDialog
          body={`确认保存发布渠道“${releaseSelfHealingPolicyActionTarget.channelName}”的自愈策略？新阈值会影响后续自愈判断、回滚建议和发布治理事件。`}
          confirmLabel="确认保存"
          onCancel={() => setReleaseSelfHealingPolicyActionTarget(null)}
          onConfirm={() => policyMutation.mutate({ channelId: releaseSelfHealingPolicyActionTarget.channelId, input: releaseSelfHealingPolicyActionTarget.input })}
          pending={policyMutation.isPending}
          title="确认保存自愈策略"
        />
      ) : null}
    </main>
  );
}

function BooleanPolicyField({ disabled, label, onChange, value }: { disabled: boolean; label: string; onChange: (value: boolean) => void; value: boolean }) {
  return (
    <label className="grid gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm">
      <span className="text-xs text-muted-foreground">{label}</span>
      <select className="h-9 rounded-md border bg-background px-2" disabled={disabled} onChange={(event) => onChange(event.target.value === 'true')} value={String(value)}>
        <option value="true">启用</option>
        <option value="false">停用</option>
      </select>
    </label>
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

function policyToForm(policy: {
  auto_rollback_enabled: boolean;
  cooldown_minutes: number;
  dry_run: boolean;
  enabled: boolean;
  max_error_requests: number;
  min_allowed_rate: number;
  observation_window_hours: number;
}): SelfHealingPolicyForm {
  return {
    auto_rollback_enabled: policy.auto_rollback_enabled,
    cooldown_minutes: policy.cooldown_minutes,
    dry_run: policy.dry_run,
    enabled: policy.enabled,
    max_error_requests: policy.max_error_requests,
    min_allowed_rate: policy.min_allowed_rate,
    observation_window_hours: policy.observation_window_hours,
  };
}
