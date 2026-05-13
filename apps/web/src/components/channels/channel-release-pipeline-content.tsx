'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, CheckCircle2, Play } from 'lucide-react';
import type { ChannelReleaseBatchInput } from '@aiaget/shared-types';

import { ChannelCenterBackground } from '@/components/channels/channel-center-background';
import {
  ChannelActionConfirmDialog,
  ChannelAlert,
  DetailGrid,
  formatOptionalDateTime,
  useChannelOperationPermissions,
} from '@/components/channels/channel-operations-pages';
import {
  ChannelReleaseHeader,
  PanelTitle,
  ReleaseChannelEmpty,
  ReleaseChannelPicker,
  releaseStatusLabel,
  releaseStatusTone,
} from '@/components/channels/channel-release-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  abortChannelReleaseBatch,
  getChannelReleasePipeline,
  getPublishChannelOverview,
  markChannelReleaseFull,
  startChannelReleaseBatch,
  type ApiClientError,
} from '@/lib/api-client';

type ReleasePipelineActionTarget =
  | { channelId: string; channelName: string; input: ChannelReleaseBatchInput; type: 'START' }
  | { channelId: string; channelName: string; input: ChannelReleaseBatchInput; type: 'MARK_FULL' }
  | { channelId: string; channelName: string; input: ChannelReleaseBatchInput; type: 'ABORT' };

export function ChannelReleasePipelineContent() {
  const queryClient = useQueryClient();
  const permissions = useChannelOperationPermissions();
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [releasePipelineActionTarget, setReleasePipelineActionTarget] = useState<ReleasePipelineActionTarget | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [batchForm, setBatchForm] = useState({
    note: '',
    target_rollout_percentage: 20,
    title: '',
  });
  const overviewQuery = useQuery({ enabled: permissions.canView, queryKey: ['channel-release-pipeline-channels'], queryFn: getPublishChannelOverview });
  const channels = overviewQuery.data?.channels ?? [];
  const selectedChannel = useMemo(
    () => channels.find((item) => item.id === selectedChannelId) ?? channels[0] ?? null,
    [channels, selectedChannelId],
  );
  const pipelineQuery = useQuery({
    enabled: permissions.canView && Boolean(selectedChannel),
    queryKey: ['channel-release-pipeline-page', selectedChannel?.id],
    queryFn: () => getChannelReleasePipeline(selectedChannel?.id ?? ''),
  });
  const pipeline = pipelineQuery.data ?? null;
  const startMutation = useMutation({
    mutationFn: ({ channelId, input }: { channelId: string; input: ChannelReleaseBatchInput }) => startChannelReleaseBatch(channelId, input),
    onSuccess: async (_result, variables) => {
      setNotice('发布批次已创建。');
      setActionError(null);
      setReleasePipelineActionTarget(null);
      setBatchForm({ note: '', target_rollout_percentage: 20, title: '' });
      await invalidateReleasePipelineQueries(queryClient, variables.channelId);
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setActionError(error.message);
    },
  });
  const fullMutation = useMutation({
    mutationFn: ({ channelId, input }: { channelId: string; input: ChannelReleaseBatchInput }) => markChannelReleaseFull(channelId, input),
    onSuccess: async (_result, variables) => {
      setNotice('发布批次已标记为全量。');
      setActionError(null);
      setReleasePipelineActionTarget(null);
      await invalidateReleasePipelineQueries(queryClient, variables.channelId);
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setActionError(error.message);
    },
  });
  const abortMutation = useMutation({
    mutationFn: ({ channelId, input }: { channelId: string; input: ChannelReleaseBatchInput }) => abortChannelReleaseBatch(channelId, input),
    onSuccess: async (_result, variables) => {
      setNotice('发布批次已终止。');
      setActionError(null);
      setReleasePipelineActionTarget(null);
      await invalidateReleasePipelineQueries(queryClient, variables.channelId);
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setActionError(error.message);
    },
  });
  const actionPending = startMutation.isPending || fullMutation.isPending || abortMutation.isPending;
  const currentBatch = pipeline?.current_batch ?? null;

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <ChannelCenterBackground />
      <ChannelReleaseHeader
        badge="发布流水线"
        description="发布步骤、当前批次、最近批次和轻量发布批次。"
        refreshing={overviewQuery.isFetching || pipelineQuery.isFetching || actionPending}
        subtitle="/channels/release/pipeline"
        title="发布流水线"
        onRefresh={() => {
          void overviewQuery.refetch();
          void pipelineQuery.refetch();
        }}
      />
      <ChannelAlert message={notice} tone="ready" />
      <ChannelAlert message={actionError ?? (overviewQuery.isError || pipelineQuery.isError ? '发布流水线加载失败。' : null)} tone="error" />
      <ReleaseChannelPicker channels={channels} selectedChannel={selectedChannel} onSelect={setSelectedChannelId} />
      {!selectedChannel ? (
        <ReleaseChannelEmpty />
      ) : !pipeline ? (
        <Card className="p-5"><EmptyState description="发布流水线数据暂不可用。" title="暂无发布流水线" /></Card>
      ) : (
        <>
          <Card className="grid gap-4 p-5">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
              <PanelTitle helper="发布批次和更新时间" title="流水线概览" />
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={!permissions.canDeploy || !currentBatch || currentBatch.status === 'FULL' || actionPending}
                  onClick={() => setReleasePipelineActionTarget({ channelId: selectedChannel.id, channelName: selectedChannel.name, input: { note: batchForm.note || null }, type: 'MARK_FULL' })}
                  type="button"
                  variant="outline"
                >
                  <CheckCircle2 className="size-4" />
                  标记全量
                </Button>
                <Button
                  disabled={!permissions.canDisable || !currentBatch || ['ABORTED', 'FULL', 'ROLLED_BACK'].includes(currentBatch.status) || actionPending}
                  onClick={() => setReleasePipelineActionTarget({ channelId: selectedChannel.id, channelName: selectedChannel.name, input: { note: batchForm.note || null }, type: 'ABORT' })}
                  type="button"
                  variant="outline"
                >
                  <Ban className="size-4" />
                  终止批次
                </Button>
              </div>
            </div>
            <DetailGrid
              items={[
                { label: '当前批次', value: currentBatch?.title ?? '无进行中批次' },
                { label: '批次状态', value: currentBatch?.status ?? 'IDLE' },
                { label: '目标灰度', value: currentBatch ? `${currentBatch.target_rollout_percentage}%` : '-' },
                { label: '更新时间', value: formatOptionalDateTime(pipeline.updated_at) },
              ]}
            />
          </Card>
          <Card className="grid gap-4 p-5">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
              <PanelTitle helper="轻量发布批次" title="新建发布批次" />
              <Button
                disabled={!permissions.canManage || actionPending}
                onClick={() => setReleasePipelineActionTarget({ channelId: selectedChannel.id, channelName: selectedChannel.name, input: toBatchInput(batchForm), type: 'START' })}
                type="button"
                variant="outline"
              >
                <Play className="size-4" />
                新建发布批次
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-[1.3fr_0.7fr]">
              <label className="grid gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm">
                <span className="text-xs text-muted-foreground">批次标题</span>
                <input
                  className="h-9 rounded-md border bg-background px-2"
                  disabled={!permissions.canManage}
                  onChange={(event) => setBatchForm((form) => ({ ...form, title: event.target.value }))}
                  placeholder="例如：飞书渠道灰度发布批次"
                  value={batchForm.title}
                />
              </label>
              <label className="grid gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm">
                <span className="text-xs text-muted-foreground">目标灰度</span>
                <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                  <input
                    className="h-9 rounded-md border bg-background px-2"
                    disabled={!permissions.canManage}
                    max={100}
                    min={1}
                    onChange={(event) => setBatchForm((form) => ({ ...form, target_rollout_percentage: clampInteger(event.target.value, 1, 100) }))}
                    type="number"
                    value={batchForm.target_rollout_percentage}
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </label>
              <label className="grid gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm md:col-span-2">
                <span className="text-xs text-muted-foreground">发布备注</span>
                <textarea
                  className="min-h-20 rounded-md border bg-background px-2 py-2"
                  disabled={!permissions.canManage}
                  onChange={(event) => setBatchForm((form) => ({ ...form, note: event.target.value }))}
                  placeholder="说明本次发布范围、风险和回滚条件"
                  value={batchForm.note}
                />
              </label>
            </div>
            {!permissions.canManage ? <p className="text-xs text-muted-foreground">当前账号缺少 channel:publish:manage 权限，只能查看发布批次。</p> : null}
          </Card>
          <Card className="grid gap-4 p-5">
            <PanelTitle helper="批次、审批、灰度、全量和回滚" title="发布步骤" />
            <div className="grid gap-2">
              {pipeline.steps.map((step) => (
                <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/20 px-3 py-2" key={step.key}>
                  <div>
                    <div className="text-sm font-medium">{step.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{step.description}</div>
                  </div>
                  <StatusBadge tone={releaseStatusTone(step.status)}>{releaseStatusLabel(step.status)}</StatusBadge>
                </div>
              ))}
            </div>
          </Card>
          <Card className="grid gap-4 p-5">
            <PanelTitle helper="发布批次历史" title="最近批次" />
            {pipeline.recent_batches.length === 0 ? <EmptyState description="当前渠道暂无历史批次。" title="暂无最近批次" /> : (
              <div className="grid gap-2">
                {pipeline.recent_batches.map((batch) => (
                  <div className="rounded-md border bg-muted/20 p-3" key={batch.batch_id}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-semibold">{batch.title}</div>
                      <StatusBadge tone={batch.status === 'FULL' ? 'healthy' : batch.status === 'ABORTED' || batch.status === 'ROLLED_BACK' ? 'unavailable' : 'degraded'}>{batch.status}</StatusBadge>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">目标灰度 {batch.target_rollout_percentage}% · 开始 {formatOptionalDateTime(batch.started_at)}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
      {releasePipelineActionTarget ? (
        <ChannelActionConfirmDialog
          body={buildActionBody(releasePipelineActionTarget)}
          confirmLabel={releasePipelineActionTarget.type === 'START' ? '确认创建' : releasePipelineActionTarget.type === 'MARK_FULL' ? '确认全量' : '确认终止'}
          onCancel={() => setReleasePipelineActionTarget(null)}
          onConfirm={() => {
            if (releasePipelineActionTarget.type === 'START') {
              startMutation.mutate({ channelId: releasePipelineActionTarget.channelId, input: releasePipelineActionTarget.input });
              return;
            }
            if (releasePipelineActionTarget.type === 'MARK_FULL') {
              fullMutation.mutate({ channelId: releasePipelineActionTarget.channelId, input: releasePipelineActionTarget.input });
              return;
            }
            abortMutation.mutate({ channelId: releasePipelineActionTarget.channelId, input: releasePipelineActionTarget.input });
          }}
          pending={actionPending}
          title={releasePipelineActionTarget.type === 'START' ? '确认创建发布批次' : releasePipelineActionTarget.type === 'MARK_FULL' ? '确认标记全量' : '确认终止发布批次'}
        />
      ) : null}
    </main>
  );
}

function toBatchInput(form: { note: string; target_rollout_percentage: number; title: string }): ChannelReleaseBatchInput {
  return {
    note: form.note.trim() || null,
    target_rollout_percentage: form.target_rollout_percentage,
    title: form.title.trim() || null,
  };
}

function buildActionBody(target: ReleasePipelineActionTarget) {
  if (target.type === 'START') {
    return `确认在发布渠道“${target.channelName}”创建发布批次？系统会开启新的轻量发布流水线，并影响后续门禁、自动推进、自愈和复盘报告。`;
  }
  if (target.type === 'MARK_FULL') {
    return `确认将发布渠道“${target.channelName}”的当前批次标记为全量？系统会把发布控制推进到 100%，并记录发布治理事件。`;
  }
  return `确认终止发布渠道“${target.channelName}”的当前发布批次？终止后该批次不再继续推进，后续需要创建新批次才能重新发布。`;
}

function clampInteger(value: string, min: number, max: number) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
}

async function invalidateReleasePipelineQueries(queryClient: ReturnType<typeof useQueryClient>, channelId: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['channel-release-pipeline-page', channelId] }),
    queryClient.invalidateQueries({ queryKey: ['channel-release-control-page', channelId] }),
    queryClient.invalidateQueries({ queryKey: ['channel-release-gate-page', channelId] }),
    queryClient.invalidateQueries({ queryKey: ['channel-release-automation-page', channelId] }),
    queryClient.invalidateQueries({ queryKey: ['channel-release-self-healing-page', channelId] }),
    queryClient.invalidateQueries({ queryKey: ['channel-release-report-page', channelId] }),
    queryClient.invalidateQueries({ queryKey: ['channel-release-control-channels'] }),
    queryClient.invalidateQueries({ queryKey: ['channel-release-pipeline-channels'] }),
    queryClient.invalidateQueries({ queryKey: ['channel-release-gate-channels'] }),
    queryClient.invalidateQueries({ queryKey: ['channel-release-automation-channels'] }),
    queryClient.invalidateQueries({ queryKey: ['channel-release-self-healing-channels'] }),
    queryClient.invalidateQueries({ queryKey: ['channel-release-reports-channels'] }),
  ]);
}
