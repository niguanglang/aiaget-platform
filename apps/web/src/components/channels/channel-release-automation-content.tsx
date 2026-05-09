'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChannelReleaseAutomationPolicyInput } from '@aiaget/shared-types';
import { Play } from 'lucide-react';

import { ChannelCenterBackground } from '@/components/channels/channel-center-background';
import { ChannelActionConfirmDialog, ChannelAlert, DetailGrid, formatNumber, formatOptionalDateTime, useChannelOperationPermissions } from '@/components/channels/channel-operations-pages';
import { ChannelReleaseHeader, PanelTitle, ReleaseChannelEmpty, ReleaseChannelPicker } from '@/components/channels/channel-release-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { getChannelReleaseAutomation, getPublishChannelOverview, runChannelReleaseAutomation, updateChannelReleaseAutomation, type ApiClientError } from '@/lib/api-client';

type AutomationPolicyForm = Required<ChannelReleaseAutomationPolicyInput>;

export function ChannelReleaseAutomationContent() {
  const queryClient = useQueryClient();
  const permissions = useChannelOperationPermissions();
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [releaseAutomationActionTarget, setReleaseAutomationActionTarget] = useState<{ channelId: string; channelName: string } | null>(null);
  const [releaseAutomationPolicyActionTarget, setReleaseAutomationPolicyActionTarget] = useState<{ channelId: string; channelName: string; input: ChannelReleaseAutomationPolicyInput } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [automationPolicyForm, setAutomationPolicyForm] = useState<AutomationPolicyForm>({
    dry_run: true,
    enabled: false,
    max_runs_per_day: 5,
    min_interval_minutes: 30,
    require_auto_promote_policy: true,
  });
  const overviewQuery = useQuery({ enabled: permissions.canView, queryKey: ['channel-release-automation-channels'], queryFn: getPublishChannelOverview });
  const channels = overviewQuery.data?.channels ?? [];
  const selectedChannel = useMemo(() => channels.find((item) => item.id === selectedChannelId) ?? channels[0] ?? null, [channels, selectedChannelId]);
  const automationQuery = useQuery({
    enabled: permissions.canView && Boolean(selectedChannel),
    queryKey: ['channel-release-automation-page', selectedChannel?.id],
    queryFn: () => getChannelReleaseAutomation(selectedChannel?.id ?? ''),
  });
  const policyMutation = useMutation({
    mutationFn: ({ channelId, input }: { channelId: string; input: ChannelReleaseAutomationPolicyInput }) => updateChannelReleaseAutomation(channelId, input),
    onSuccess: async (result, variables) => {
      setNotice('推进策略已保存。');
      setActionError(null);
      setReleaseAutomationPolicyActionTarget(null);
      setAutomationPolicyForm(policyToForm(result.policy));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['channel-release-automation-page', variables.channelId] }),
        queryClient.invalidateQueries({ queryKey: ['channel-release-control-page', variables.channelId] }),
        queryClient.invalidateQueries({ queryKey: ['channel-release-gate-page', variables.channelId] }),
        queryClient.invalidateQueries({ queryKey: ['channel-release-pipeline-page', variables.channelId] }),
        queryClient.invalidateQueries({ queryKey: ['channel-release-self-healing-page', variables.channelId] }),
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
    mutationFn: runChannelReleaseAutomation,
    onSuccess: async (_result, channelId) => {
      setNotice('自动推进已运行。');
      setActionError(null);
      setReleaseAutomationActionTarget(null);
      await queryClient.invalidateQueries({ queryKey: ['channel-release-automation-page', channelId] });
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setActionError(error.message);
    },
  });
  const automation = automationQuery.data ?? null;

  useEffect(() => {
    if (automation?.policy) setAutomationPolicyForm(policyToForm(automation.policy));
  }, [automation?.policy]);

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <ChannelCenterBackground />
      <ChannelReleaseHeader
        badge="自动推进"
        description="查看并配置自动推进策略、运行状态、最近决策和频控，并可手动运行自动推进。"
        refreshing={overviewQuery.isFetching || automationQuery.isFetching || runMutation.isPending || policyMutation.isPending}
        subtitle="/channels/release/automation"
        title="自动推进"
        onRefresh={() => {
          void overviewQuery.refetch();
          void automationQuery.refetch();
        }}
      />
      <ChannelAlert message={notice} tone="ready" />
      <ChannelAlert message={actionError ?? (overviewQuery.isError || automationQuery.isError ? '自动推进加载失败。' : null)} tone="error" />
      <ReleaseChannelPicker channels={channels} selectedChannel={selectedChannel} onSelect={setSelectedChannelId} />
      {!selectedChannel ? (
        <ReleaseChannelEmpty />
      ) : !automation ? (
        <Card className="p-5"><EmptyState description="自动推进数据暂不可用。" title="暂无自动推进" /></Card>
      ) : (
        <>
          <Card className="grid gap-4 p-5">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <PanelTitle helper="基于门禁结论和频控策略推进发布。" title="自动推进状态" />
              <Button
                disabled={!permissions.canDeploy || runMutation.isPending}
                onClick={() => setReleaseAutomationActionTarget({ channelId: selectedChannel.id, channelName: selectedChannel.name })}
                type="button"
                variant="outline"
              >
                <Play className="size-4" />
                运行自动推进
              </Button>
            </div>
            <DetailGrid items={[
              { label: '策略启用', value: automation.policy.enabled ? '启用' : '停用' },
              { label: '运行中', value: automation.running ? '是' : '否' },
              { label: '今日运行', value: formatNumber(automation.today_run_count) },
              { label: '最近决策', value: automation.last_run?.decision ?? '暂无' },
              { label: '工作流模式', value: automation.workflow_mode ?? '-' },
              { label: '下次可运行', value: formatOptionalDateTime(automation.next_allowed_at) },
            ]} />
          </Card>
          <Card className="grid gap-4 p-5">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
              <PanelTitle helper="配置自动推进开关、门禁依赖、频控和干跑模式。" title="推进策略配置" />
              <Button
                disabled={!permissions.canManage || policyMutation.isPending}
                onClick={() => setReleaseAutomationPolicyActionTarget({ channelId: selectedChannel.id, channelName: selectedChannel.name, input: automationPolicyForm })}
                type="button"
                variant="outline"
              >
                保存推进策略
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <BooleanPolicyField disabled={!permissions.canManage} label="策略启用" onChange={(value) => setAutomationPolicyForm((form) => ({ ...form, enabled: value }))} value={automationPolicyForm.enabled} />
              <BooleanPolicyField disabled={!permissions.canManage} label="要求自动放行" onChange={(value) => setAutomationPolicyForm((form) => ({ ...form, require_auto_promote_policy: value }))} value={automationPolicyForm.require_auto_promote_policy} />
              <BooleanPolicyField disabled={!permissions.canManage} label="干跑模式" onChange={(value) => setAutomationPolicyForm((form) => ({ ...form, dry_run: value }))} value={automationPolicyForm.dry_run} />
              <NumberPolicyField disabled={!permissions.canManage} label="最小间隔" max={1440} min={1} onChange={(value) => setAutomationPolicyForm((form) => ({ ...form, min_interval_minutes: value }))} suffix="分钟" value={automationPolicyForm.min_interval_minutes} />
              <NumberPolicyField disabled={!permissions.canManage} label="每日最大运行" max={100} min={1} onChange={(value) => setAutomationPolicyForm((form) => ({ ...form, max_runs_per_day: value }))} value={automationPolicyForm.max_runs_per_day} />
              <div className="grid gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm">
                <span className="text-xs text-muted-foreground">更新时间</span>
                <span className="flex min-h-9 items-center text-foreground">{formatOptionalDateTime(automation.policy.updated_at)}</span>
              </div>
            </div>
            {!permissions.canManage ? <p className="text-xs text-muted-foreground">当前账号缺少 channel:publish:manage 权限，只能查看推进策略。</p> : null}
          </Card>
          <Card className="grid gap-4 p-5">
            <PanelTitle helper="最近一次自动推进结果。" title="最近决策" />
            {!automation.last_run ? <EmptyState description="当前没有自动推进运行记录。" title="暂无最近决策" /> : (
              <DetailGrid items={[
                { label: '运行 ID', value: automation.last_run.run_id },
                { label: '决策', value: automation.last_run.decision },
                { label: '是否推进', value: automation.last_run.promoted ? '是' : '否' },
                { label: '门禁结论', value: automation.last_run.gate_decision },
                { label: '原因', value: automation.last_run.reason },
                { label: '完成时间', value: formatOptionalDateTime(automation.last_run.finished_at) },
              ]} />
            )}
          </Card>
        </>
      )}
      {releaseAutomationActionTarget ? (
        <ChannelActionConfirmDialog
          body={`确认为发布渠道“${releaseAutomationActionTarget.channelName}”运行自动推进？系统会基于当前门禁结论和频控策略尝试推进该渠道发布批次，影响范围仅限此渠道。`}
          confirmLabel="确认运行"
          onCancel={() => setReleaseAutomationActionTarget(null)}
          onConfirm={() => runMutation.mutate(releaseAutomationActionTarget.channelId)}
          pending={runMutation.isPending}
          title="确认运行自动推进"
        />
      ) : null}
      {releaseAutomationPolicyActionTarget ? (
        <ChannelActionConfirmDialog
          body={`确认保存发布渠道“${releaseAutomationPolicyActionTarget.channelName}”的推进策略？新策略会影响后续自动推进判断、频控窗口和发布治理事件。`}
          confirmLabel="确认保存"
          onCancel={() => setReleaseAutomationPolicyActionTarget(null)}
          onConfirm={() => policyMutation.mutate({ channelId: releaseAutomationPolicyActionTarget.channelId, input: releaseAutomationPolicyActionTarget.input })}
          pending={policyMutation.isPending}
          title="确认保存推进策略"
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

function policyToForm(policy: { dry_run: boolean; enabled: boolean; max_runs_per_day: number; min_interval_minutes: number; require_auto_promote_policy: boolean }): AutomationPolicyForm {
  return {
    dry_run: policy.dry_run,
    enabled: policy.enabled,
    max_runs_per_day: policy.max_runs_per_day,
    min_interval_minutes: policy.min_interval_minutes,
    require_auto_promote_policy: policy.require_auto_promote_policy,
  };
}
