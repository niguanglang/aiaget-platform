'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, RotateCcw, Send, ShieldCheck, SlidersHorizontal, XCircle } from 'lucide-react';
import type {
  ChannelPublishApprovalInput,
  ChannelPublishApprovalStatus,
  ChannelPublishControl,
  ChannelPublishRolloutInput,
  ChannelPublishRolloutStatus,
  UpdateChannelPublishControlInput,
} from '@aiaget/shared-types';

import { ChannelCenterBackground } from '@/components/channels/channel-center-background';
import {
  ChannelActionConfirmDialog,
  ChannelAlert,
  DetailGrid,
  formatOptionalDateTime,
  useChannelOperationPermissions,
} from '@/components/channels/channel-operations-pages';
import { ChannelReleaseHeader, PanelTitle, ReleaseChannelEmpty, ReleaseChannelPicker } from '@/components/channels/channel-release-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  approveChannelPublish,
  getChannelPublishControl,
  getPublishChannelOverview,
  rejectChannelPublish,
  requestChannelPublishApproval,
  rollbackChannelPublish,
  updateChannelPublishControl,
  updateChannelRollout,
  type ApiClientError,
} from '@/lib/api-client';

type ReleaseControlActionTarget =
  | { channelId: string; channelName: string; input: UpdateChannelPublishControlInput; type: 'SAVE_CONTROL' }
  | { channelId: string; channelName: string; input: ChannelPublishApprovalInput; type: 'REQUEST_APPROVAL' }
  | { channelId: string; channelName: string; input: ChannelPublishApprovalInput; type: 'APPROVE' }
  | { channelId: string; channelName: string; input: ChannelPublishApprovalInput; type: 'REJECT' }
  | { channelId: string; channelName: string; input: ChannelPublishRolloutInput; type: 'UPDATE_ROLLOUT' }
  | { channelId: string; channelName: string; input: ChannelPublishApprovalInput; type: 'ROLLBACK' };

interface ControlForm {
  approval_note: string;
  approval_required: boolean;
}

export function ChannelReleaseControlContent() {
  const queryClient = useQueryClient();
  const permissions = useChannelOperationPermissions();
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [releaseControlActionTarget, setReleaseControlActionTarget] = useState<ReleaseControlActionTarget | null>(null);
  const [controlForm, setControlForm] = useState<ControlForm>({
    approval_note: '',
    approval_required: true,
  });
  const [approvalForm, setApprovalForm] = useState({ note: '' });
  const [rolloutForm, setRolloutForm] = useState({
    rollout_enabled: true,
    rollout_percentage: 20,
  });

  const overviewQuery = useQuery({ enabled: permissions.canView, queryKey: ['channel-release-control-channels'], queryFn: getPublishChannelOverview });
  const channels = overviewQuery.data?.channels ?? [];
  const selectedChannel = useMemo(() => channels.find((item) => item.id === selectedChannelId) ?? channels[0] ?? null, [channels, selectedChannelId]);
  const controlQuery = useQuery({
    enabled: permissions.canView && Boolean(selectedChannel),
    queryKey: ['channel-release-control-page', selectedChannel?.id],
    queryFn: () => getChannelPublishControl(selectedChannel?.id ?? ''),
  });
  const control = controlQuery.data ?? null;

  useEffect(() => {
    if (!control) return;
    setControlForm({
      approval_note: control.approval_note ?? '',
      approval_required: control.approval_required,
    });
    setRolloutForm({
      rollout_enabled: control.rollout_enabled,
      rollout_percentage: control.rollout_percentage,
    });
  }, [control]);

  const controlMutation = useMutation({
    mutationFn: ({ channelId, input }: { channelId: string; input: UpdateChannelPublishControlInput }) => updateChannelPublishControl(channelId, input),
    onSuccess: async (result, variables) => {
      setNotice('发布控制配置已保存。');
      setActionError(null);
      setReleaseControlActionTarget(null);
      await invalidateReleaseControlQueries(queryClient, variables.channelId);
      queryClient.setQueryData(['channel-release-control-page', variables.channelId], result);
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setActionError(error.message);
    },
  });
  const requestApprovalMutation = useMutation({
    mutationFn: ({ channelId, input }: { channelId: string; input: ChannelPublishApprovalInput }) => requestChannelPublishApproval(channelId, input),
    onSuccess: async (result, variables) => {
      setNotice('发布审批已申请。');
      setActionError(null);
      setReleaseControlActionTarget(null);
      await afterControlAction(queryClient, variables.channelId, result);
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setActionError(error.message);
    },
  });
  const approveMutation = useMutation({
    mutationFn: ({ channelId, input }: { channelId: string; input: ChannelPublishApprovalInput }) => approveChannelPublish(channelId, input),
    onSuccess: async (result, variables) => {
      setNotice('发布审批已通过。');
      setActionError(null);
      setReleaseControlActionTarget(null);
      await afterControlAction(queryClient, variables.channelId, result);
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setActionError(error.message);
    },
  });
  const rejectMutation = useMutation({
    mutationFn: ({ channelId, input }: { channelId: string; input: ChannelPublishApprovalInput }) => rejectChannelPublish(channelId, input),
    onSuccess: async (result, variables) => {
      setNotice('发布审批已拒绝。');
      setActionError(null);
      setReleaseControlActionTarget(null);
      await afterControlAction(queryClient, variables.channelId, result);
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setActionError(error.message);
    },
  });
  const rolloutMutation = useMutation({
    mutationFn: ({ channelId, input }: { channelId: string; input: ChannelPublishRolloutInput }) => updateChannelRollout(channelId, input),
    onSuccess: async (result, variables) => {
      setNotice('发布灰度已更新。');
      setActionError(null);
      setReleaseControlActionTarget(null);
      await afterControlAction(queryClient, variables.channelId, result);
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setActionError(error.message);
    },
  });
  const rollbackMutation = useMutation({
    mutationFn: ({ channelId, input }: { channelId: string; input: ChannelPublishApprovalInput }) => rollbackChannelPublish(channelId, input),
    onSuccess: async (result, variables) => {
      setNotice('发布已回滚到最近稳定配置。');
      setActionError(null);
      setReleaseControlActionTarget(null);
      await afterControlAction(queryClient, variables.channelId, result);
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setActionError(error.message);
    },
  });

  const actionPending =
    controlMutation.isPending
    || requestApprovalMutation.isPending
    || approveMutation.isPending
    || rejectMutation.isPending
    || rolloutMutation.isPending
    || rollbackMutation.isPending;

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <ChannelCenterBackground />
      <ChannelReleaseHeader
        badge="发布控制"
        description="发布渠道审批要求、审批决策、灰度比例和回滚动作。"
        refreshing={overviewQuery.isFetching || controlQuery.isFetching || actionPending}
        subtitle="/channels/release/control"
        title="发布控制"
        onRefresh={() => {
          void overviewQuery.refetch();
          void controlQuery.refetch();
        }}
      />
      <ChannelAlert message={notice} tone="ready" />
      <ChannelAlert message={actionError ?? (overviewQuery.isError || controlQuery.isError ? '发布控制加载失败。' : null)} tone="error" />
      <ReleaseChannelPicker channels={channels} selectedChannel={selectedChannel} onSelect={setSelectedChannelId} />
      {!selectedChannel ? (
        <ReleaseChannelEmpty />
      ) : !control ? (
        <Card className="p-5"><EmptyState description="发布控制数据暂不可用。" title="暂无发布控制" /></Card>
      ) : (
        <>
          <Card className="grid gap-4 p-5">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
              <PanelTitle helper="审批、灰度和回滚状态" title="控制状态" />
              <div className="flex flex-wrap gap-2">
                <StatusBadge tone={approvalStatusTone(control.approval_status)}>{approvalStatusLabel(control.approval_status)}</StatusBadge>
                <StatusBadge tone={rolloutStatusTone(control.rollout_status)}>{rolloutStatusLabel(control.rollout_status)}</StatusBadge>
                <StatusBadge tone={control.rollback_available ? 'degraded' : 'planned'}>{control.rollback_available ? '可回滚' : '不可回滚'}</StatusBadge>
              </div>
            </div>
            <DetailGrid
              items={[
                { label: '审批要求', value: control.approval_required ? '需要审批' : '无需审批' },
                { label: '审批状态', value: approvalStatusLabel(control.approval_status) },
                { label: '灰度状态', value: rolloutStatusLabel(control.rollout_status) },
                { label: '灰度比例', value: `${control.rollout_percentage}%` },
                { label: '申请人', value: control.requested_by ?? '-' },
                { label: '申请时间', value: formatOptionalDateTime(control.requested_at) },
                { label: '审批人', value: control.reviewed_by ?? '-' },
                { label: '审批时间', value: formatOptionalDateTime(control.reviewed_at) },
                { label: '最近回滚', value: formatOptionalDateTime(control.last_rollback_at) },
                { label: '更新时间', value: formatOptionalDateTime(control.updated_at) },
              ]}
            />
          </Card>

          <Card className="grid gap-4 p-5">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
              <PanelTitle helper="审批要求和默认说明" title="审批配置" />
              <Button
                disabled={!permissions.canManage || controlMutation.isPending}
                onClick={() => setReleaseControlActionTarget({ channelId: selectedChannel.id, channelName: selectedChannel.name, input: toControlInput(controlForm), type: 'SAVE_CONTROL' })}
                type="button"
                variant="outline"
              >
                <ShieldCheck className="size-4" />
                保存发布控制
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-[220px_1fr]">
              <label className="grid gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm">
                <span className="text-xs text-muted-foreground">审批要求</span>
                <select className="h-9 rounded-md border bg-background px-2" disabled={!permissions.canManage} onChange={(event) => setControlForm((form) => ({ ...form, approval_required: event.target.value === 'true' }))} value={String(controlForm.approval_required)}>
                  <option value="true">需要审批</option>
                  <option value="false">无需审批</option>
                </select>
              </label>
              <label className="grid gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm">
                <span className="text-xs text-muted-foreground">审批说明</span>
                <textarea
                  className="min-h-20 rounded-md border bg-background px-2 py-2"
                  disabled={!permissions.canManage}
                  onChange={(event) => setControlForm((form) => ({ ...form, approval_note: event.target.value }))}
                  placeholder="说明审批依据、发布窗口和风险控制要求"
                  value={controlForm.approval_note}
                />
              </label>
            </div>
            {!permissions.canManage ? <p className="text-xs text-muted-foreground">当前账号缺少 channel:publish:manage 权限，只能查看审批配置。</p> : null}
          </Card>

          <Card className="grid gap-4 p-5">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
              <PanelTitle helper="申请、通过和拒绝" title="审批流转" />
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={!permissions.canManage || !control.approval_required || requestApprovalMutation.isPending}
                  onClick={() => setReleaseControlActionTarget({ channelId: selectedChannel.id, channelName: selectedChannel.name, input: toApprovalInput(approvalForm), type: 'REQUEST_APPROVAL' })}
                  type="button"
                  variant="outline"
                >
                  <Send className="size-4" />
                  申请审批
                </Button>
                <Button
                  disabled={!permissions.canDeploy || control.approval_status !== 'PENDING' || approveMutation.isPending}
                  onClick={() => setReleaseControlActionTarget({ channelId: selectedChannel.id, channelName: selectedChannel.name, input: toApprovalInput(approvalForm), type: 'APPROVE' })}
                  type="button"
                  variant="outline"
                >
                  <CheckCircle2 className="size-4" />
                  审批通过
                </Button>
                <Button
                  disabled={!permissions.canDisable || control.approval_status !== 'PENDING' || rejectMutation.isPending}
                  onClick={() => setReleaseControlActionTarget({ channelId: selectedChannel.id, channelName: selectedChannel.name, input: toApprovalInput(approvalForm), type: 'REJECT' })}
                  type="button"
                  variant="outline"
                >
                  <XCircle className="size-4" />
                  审批拒绝
                </Button>
              </div>
            </div>
            <label className="grid gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm">
              <span className="text-xs text-muted-foreground">审批备注</span>
              <textarea
                className="min-h-20 rounded-md border bg-background px-2 py-2"
                disabled={!permissions.canManage && !permissions.canDeploy && !permissions.canDisable}
                onChange={(event) => setApprovalForm({ note: event.target.value })}
                placeholder="填写申请、通过、拒绝或回滚原因"
                value={approvalForm.note}
              />
            </label>
          </Card>

          <Card className="grid gap-4 p-5">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
              <PanelTitle helper="灰度比例和稳定配置" title="灰度与回滚" />
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={!permissions.canManage || rolloutMutation.isPending || (control.approval_required && control.approval_status !== 'APPROVED')}
                  onClick={() => setReleaseControlActionTarget({ channelId: selectedChannel.id, channelName: selectedChannel.name, input: toRolloutInput(rolloutForm), type: 'UPDATE_ROLLOUT' })}
                  type="button"
                  variant="outline"
                >
                  <SlidersHorizontal className="size-4" />
                  更新灰度
                </Button>
                <Button
                  disabled={!permissions.canDisable || !control.rollback_available || rollbackMutation.isPending}
                  onClick={() => setReleaseControlActionTarget({ channelId: selectedChannel.id, channelName: selectedChannel.name, input: toApprovalInput(approvalForm), type: 'ROLLBACK' })}
                  type="button"
                  variant="destructive"
                >
                  <RotateCcw className="size-4" />
                  回滚发布
                </Button>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-[220px_1fr]">
              <label className="grid gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm">
                <span className="text-xs text-muted-foreground">灰度开关</span>
                <select className="h-9 rounded-md border bg-background px-2" disabled={!permissions.canManage} onChange={(event) => setRolloutForm((form) => ({ ...form, rollout_enabled: event.target.value === 'true' }))} value={String(rolloutForm.rollout_enabled)}>
                  <option value="true">启用灰度</option>
                  <option value="false">关闭灰度</option>
                </select>
              </label>
              <label className="grid gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm">
                <span className="text-xs text-muted-foreground">灰度比例</span>
                <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                  <input
                    className="h-9 rounded-md border bg-background px-2"
                    disabled={!permissions.canManage}
                    max={100}
                    min={0}
                    onChange={(event) => setRolloutForm((form) => ({ ...form, rollout_percentage: clampInteger(event.target.value, 0, 100) }))}
                    type="number"
                    value={rolloutForm.rollout_percentage}
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </label>
            </div>
            <DetailGrid
              items={[
                { label: '最近稳定状态', value: control.last_stable_status ?? '-' },
                { label: '稳定配置快照', value: control.last_stable_config ? '已留存' : '未留存' },
                { label: '回滚人', value: control.last_rollback_by ?? '-' },
                { label: '回滚时间', value: formatOptionalDateTime(control.last_rollback_at) },
              ]}
            />
          </Card>
        </>
      )}
      {releaseControlActionTarget ? (
        <ChannelActionConfirmDialog
          body={buildActionBody(releaseControlActionTarget)}
          confirmLabel={actionConfirmLabel(releaseControlActionTarget.type)}
          onCancel={() => setReleaseControlActionTarget(null)}
          onConfirm={() => confirmReleaseControlAction(releaseControlActionTarget)}
          pending={actionPending}
          title={actionTitle(releaseControlActionTarget.type)}
          variant={releaseControlActionTarget.type === 'REJECT' || releaseControlActionTarget.type === 'ROLLBACK' ? 'destructive' : 'default'}
        />
      ) : null}
    </main>
  );

  function confirmReleaseControlAction(target: ReleaseControlActionTarget) {
    if (target.type === 'SAVE_CONTROL') {
      controlMutation.mutate({ channelId: target.channelId, input: target.input });
      return;
    }
    if (target.type === 'REQUEST_APPROVAL') {
      requestApprovalMutation.mutate({ channelId: target.channelId, input: target.input });
      return;
    }
    if (target.type === 'APPROVE') {
      approveMutation.mutate({ channelId: target.channelId, input: target.input });
      return;
    }
    if (target.type === 'REJECT') {
      rejectMutation.mutate({ channelId: target.channelId, input: target.input });
      return;
    }
    if (target.type === 'UPDATE_ROLLOUT') {
      rolloutMutation.mutate({ channelId: target.channelId, input: target.input });
      return;
    }
    rollbackMutation.mutate({ channelId: target.channelId, input: target.input });
  }
}

function toControlInput(form: ControlForm): UpdateChannelPublishControlInput {
  return {
    approval_note: form.approval_note.trim() || null,
    approval_required: form.approval_required,
  };
}

function toApprovalInput(form: { note: string }): ChannelPublishApprovalInput {
  return {
    note: form.note.trim() || null,
  };
}

function toRolloutInput(form: { rollout_enabled: boolean; rollout_percentage: number }): ChannelPublishRolloutInput {
  return {
    rollout_enabled: form.rollout_enabled,
    rollout_percentage: form.rollout_enabled ? form.rollout_percentage : 0,
  };
}

async function afterControlAction(queryClient: ReturnType<typeof useQueryClient>, channelId: string, result: ChannelPublishControl) {
  queryClient.setQueryData(['channel-release-control-page', channelId], result);
  await invalidateReleaseControlQueries(queryClient, channelId);
}

async function invalidateReleaseControlQueries(queryClient: ReturnType<typeof useQueryClient>, channelId: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['channel-release-control-page', channelId] }),
    queryClient.invalidateQueries({ queryKey: ['channel-release-control-channels'] }),
    queryClient.invalidateQueries({ queryKey: ['channel-release-pipeline-page', channelId] }),
    queryClient.invalidateQueries({ queryKey: ['channel-release-gate-page', channelId] }),
    queryClient.invalidateQueries({ queryKey: ['channel-release-automation-page', channelId] }),
    queryClient.invalidateQueries({ queryKey: ['channel-release-self-healing-page', channelId] }),
    queryClient.invalidateQueries({ queryKey: ['channel-release-report-page', channelId] }),
    queryClient.invalidateQueries({ queryKey: ['channel-release-pipeline-channels'] }),
    queryClient.invalidateQueries({ queryKey: ['channel-release-gate-channels'] }),
    queryClient.invalidateQueries({ queryKey: ['channel-release-automation-channels'] }),
    queryClient.invalidateQueries({ queryKey: ['channel-release-self-healing-channels'] }),
    queryClient.invalidateQueries({ queryKey: ['channel-release-report-channels'] }),
    queryClient.invalidateQueries({ queryKey: ['channel-release-scheduler'] }),
    queryClient.invalidateQueries({ queryKey: ['publish-channels'] }),
  ]);
}

function buildActionBody(target: ReleaseControlActionTarget) {
  if (target.type === 'SAVE_CONTROL') {
    return `确认保存发布渠道“${target.channelName}”的审批控制配置？新配置会影响后续审批要求、发布流水线和发布治理事件。`;
  }
  if (target.type === 'REQUEST_APPROVAL') {
    return `确认申请发布渠道“${target.channelName}”的发布审批？申请后渠道会进入待审批状态，审批通过前不能继续调整灰度比例。`;
  }
  if (target.type === 'APPROVE') {
    return `确认通过发布渠道“${target.channelName}”的发布审批？通过后渠道会进入可发布状态，并允许继续推进灰度。`;
  }
  if (target.type === 'REJECT') {
    return `确认拒绝发布渠道“${target.channelName}”的发布审批？拒绝后渠道会停用并关闭灰度。`;
  }
  if (target.type === 'UPDATE_ROLLOUT') {
    const percentage = target.input.rollout_enabled === false ? 0 : target.input.rollout_percentage ?? 0;
    return `确认将发布渠道“${target.channelName}”的灰度比例更新为 ${percentage}%？灰度比例会影响当前发布流量放行范围。`;
  }
  return `确认回滚发布渠道“${target.channelName}”到最近稳定配置？回滚会关闭当前灰度并恢复稳定发布状态。`;
}

function actionTitle(type: ReleaseControlActionTarget['type']) {
  const titles = {
    APPROVE: '确认审批通过',
    REJECT: '确认审批拒绝',
    REQUEST_APPROVAL: '确认申请审批',
    ROLLBACK: '确认回滚发布',
    SAVE_CONTROL: '确认保存发布控制',
    UPDATE_ROLLOUT: '确认更新灰度',
  } satisfies Record<ReleaseControlActionTarget['type'], string>;

  return titles[type];
}

function actionConfirmLabel(type: ReleaseControlActionTarget['type']) {
  const labels = {
    APPROVE: '审批通过',
    REJECT: '审批拒绝',
    REQUEST_APPROVAL: '申请审批',
    ROLLBACK: '回滚发布',
    SAVE_CONTROL: '确认保存',
    UPDATE_ROLLOUT: '更新灰度',
  } satisfies Record<ReleaseControlActionTarget['type'], string>;

  return labels[type];
}

function approvalStatusLabel(status: ChannelPublishApprovalStatus) {
  const labels = {
    APPROVED: '已通过',
    NOT_REQUIRED: '无需审批',
    PENDING: '待审批',
    REJECTED: '已拒绝',
  } satisfies Record<ChannelPublishApprovalStatus, string>;

  return labels[status];
}

function approvalStatusTone(status: ChannelPublishApprovalStatus) {
  if (status === 'APPROVED' || status === 'NOT_REQUIRED') return 'healthy' as const;
  if (status === 'PENDING') return 'degraded' as const;
  return 'unavailable' as const;
}

function rolloutStatusLabel(status: ChannelPublishRolloutStatus) {
  const labels = {
    CLOSED: '未灰度',
    FULL: '已全量',
    GRAY: '灰度中',
  } satisfies Record<ChannelPublishRolloutStatus, string>;

  return labels[status];
}

function rolloutStatusTone(status: ChannelPublishRolloutStatus) {
  if (status === 'FULL') return 'healthy' as const;
  if (status === 'GRAY') return 'degraded' as const;
  return 'planned' as const;
}

function clampInteger(value: string, min: number, max: number) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
}
