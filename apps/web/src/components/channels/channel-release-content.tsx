'use client';

import type {
  ChannelReleaseAutomationOverview,
  ChannelReleaseGateOverview,
  ChannelReleasePipeline,
  ChannelReleaseReport,
  ChannelReleaseSchedulerOverview,
  ChannelReleaseSelfHealingOverview,
  PublishChannelListItem,
} from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Play } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ChannelCenterBackground } from '@/components/channels/channel-center-background';
import {
  ChannelAlert,
  ChannelFocusedHeader,
  ChannelMetricGrid,
  DetailGrid,
  formatNumber,
  formatOptionalDateTime,
  formatPercent,
  useChannelOperationPermissions,
  type ChannelOperationMetric,
} from '@/components/channels/channel-operations-pages';
import {
  publishChannelHealthLabel,
  publishChannelHealthTone,
  publishChannelStatusLabel,
  publishChannelStatusTone,
  publishChannelTypeLabel,
} from '@/components/channels/channel-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  getChannelReleaseAutomation,
  getChannelReleaseGate,
  getChannelReleasePipeline,
  getChannelReleaseReport,
  getChannelReleaseSchedulerOverview,
  getChannelReleaseSelfHealing,
  getPublishChannelOverview,
  runChannelReleaseSchedulerOnce,
  type ApiClientError,
} from '@/lib/api-client';
import { cn } from '@/lib/utils';

export function ChannelReleaseContent() {
  const queryClient = useQueryClient();
  const permissions = useChannelOperationPermissions();
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const overviewQuery = useQuery({
    enabled: permissions.canView,
    queryKey: ['channel-release-focused-overview'],
    queryFn: getPublishChannelOverview,
  });

  const schedulerQuery = useQuery({
    enabled: permissions.canView,
    queryKey: ['channel-release-focused-scheduler'],
    queryFn: getChannelReleaseSchedulerOverview,
  });

  const channels = overviewQuery.data?.channels ?? [];
  const selectedChannel = useMemo(() => {
    if (selectedChannelId) return channels.find((item) => item.id === selectedChannelId) ?? channels[0] ?? null;
    return channels[0] ?? null;
  }, [channels, selectedChannelId]);

  const pipelineQuery = useQuery({
    enabled: permissions.canView && Boolean(selectedChannel),
    queryKey: ['channel-release-focused-pipeline', selectedChannel?.id],
    queryFn: () => getChannelReleasePipeline(selectedChannel?.id ?? ''),
  });

  const gateQuery = useQuery({
    enabled: permissions.canView && Boolean(selectedChannel),
    queryKey: ['channel-release-focused-gate', selectedChannel?.id],
    queryFn: () => getChannelReleaseGate(selectedChannel?.id ?? ''),
  });

  const automationQuery = useQuery({
    enabled: permissions.canView && Boolean(selectedChannel),
    queryKey: ['channel-release-focused-automation', selectedChannel?.id],
    queryFn: () => getChannelReleaseAutomation(selectedChannel?.id ?? ''),
  });

  const selfHealingQuery = useQuery({
    enabled: permissions.canView && Boolean(selectedChannel),
    queryKey: ['channel-release-focused-self-healing', selectedChannel?.id],
    queryFn: () => getChannelReleaseSelfHealing(selectedChannel?.id ?? ''),
  });

  const reportQuery = useQuery({
    enabled: permissions.canView && Boolean(selectedChannel),
    queryKey: ['channel-release-focused-report', selectedChannel?.id],
    queryFn: () => getChannelReleaseReport(selectedChannel?.id ?? ''),
  });

  const runSchedulerMutation = useMutation({
    mutationFn: runChannelReleaseSchedulerOnce,
    onSuccess: async () => {
      setNotice('发布巡检调度已执行。');
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ['channel-release-focused-scheduler'] });
      await queryClient.invalidateQueries({ queryKey: ['channel-release-focused-pipeline'] });
      await queryClient.invalidateQueries({ queryKey: ['channel-release-focused-gate'] });
      await queryClient.invalidateQueries({ queryKey: ['channel-release-focused-automation'] });
      await queryClient.invalidateQueries({ queryKey: ['channel-release-focused-self-healing'] });
      await queryClient.invalidateQueries({ queryKey: ['channel-release-focused-report'] });
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setActionError(error.message);
    },
  });

  const metrics = buildReleaseMetrics(channels, schedulerQuery.data);
  const loading =
    overviewQuery.isLoading ||
    schedulerQuery.isLoading ||
    pipelineQuery.isLoading ||
    gateQuery.isLoading ||
    automationQuery.isLoading ||
    selfHealingQuery.isLoading ||
    reportQuery.isLoading;

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <ChannelCenterBackground />
      <ChannelFocusedHeader
        activeRoute="release"
        badge="发布治理"
        description="将发布控制、发布流水线、观测门禁、自动推进、自愈和发布复盘从渠道总览中拆出，形成独立的发布治理工作台。"
        permissions={permissions}
        refreshing={overviewQuery.isFetching || schedulerQuery.isFetching}
        subtitle="/channels/release"
        title="发布治理"
        onRefresh={() => {
          void overviewQuery.refetch();
          void schedulerQuery.refetch();
          void pipelineQuery.refetch();
          void gateQuery.refetch();
          void automationQuery.refetch();
          void selfHealingQuery.refetch();
          void reportQuery.refetch();
        }}
      />

      <ChannelAlert message={notice} tone="ready" />
      <ChannelAlert
        message={actionError ?? (overviewQuery.isError || schedulerQuery.isError ? '发布治理概览加载失败。' : null)}
        tone="error"
      />

      {!permissions.canView ? (
        <Card className="p-5">
          <EmptyState description="当前账号缺少 channel:publish:view 权限，无法查看发布治理。" title="无权查看发布治理" />
        </Card>
      ) : (
        <>
          <ChannelMetricGrid loading={loading} metrics={metrics} />
          <Card className="grid gap-4 p-5">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-sm font-semibold">治理渠道选择</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  选择一个发布渠道查看发布流水线、门禁结论、自动推进、自愈和复盘摘要。
                </p>
              </div>
              <Button
                disabled={!permissions.canDeploy || runSchedulerMutation.isPending}
                onClick={() => runSchedulerMutation.mutate()}
                type="button"
                variant="outline"
              >
                <Play className={cn('size-4', runSchedulerMutation.isPending && 'animate-pulse')} />
                运行发布巡检
              </Button>
            </div>
            {channels.length === 0 ? (
              <EmptyState description="当前没有可治理的发布渠道。请先创建发布渠道。" title="暂无发布渠道" />
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {channels.map((channel) => (
                  <button
                    className={cn(
                      'min-w-60 rounded-md border bg-background/90 p-3 text-left transition-colors hover:bg-muted/20',
                      selectedChannel?.id === channel.id && 'border-primary/50 bg-primary/5',
                    )}
                    key={channel.id}
                    onClick={() => setSelectedChannelId(channel.id)}
                    type="button"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone="ready">{publishChannelTypeLabel(channel.channel)}</StatusBadge>
                      <StatusBadge tone={publishChannelStatusTone(channel.status)}>{publishChannelStatusLabel(channel.status)}</StatusBadge>
                      <StatusBadge tone={publishChannelHealthTone(channel.health_status)}>{publishChannelHealthLabel(channel.health_status)}</StatusBadge>
                    </div>
                    <div className="mt-2 text-sm font-semibold">{channel.name}</div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">{channel.agent?.name ?? '未绑定 Agent'}</div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          <section className="grid gap-4 xl:grid-cols-2">
            <ReleasePipelineSummary pipeline={pipelineQuery.data ?? null} selectedChannel={selectedChannel} />
            <ReleaseGateSummary gate={gateQuery.data ?? null} />
            <ReleaseAutomationSummary automation={automationQuery.data ?? null} />
            <ReleaseSelfHealingSummary selfHealing={selfHealingQuery.data ?? null} />
          </section>

          <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <ReleaseSchedulerSummary overview={schedulerQuery.data ?? null} />
            <ReleaseReportSummary report={reportQuery.data ?? null} />
          </section>
        </>
      )}
    </main>
  );
}

function ReleasePipelineSummary({
  pipeline,
  selectedChannel,
}: {
  pipeline: ChannelReleasePipeline | null;
  selectedChannel: PublishChannelListItem | null;
}) {
  return (
    <Card className="grid gap-4 p-5">
      <PanelTitle helper="发布批次、灰度、全量和回滚/中止步骤。" title="发布流水线" />
      {!selectedChannel ? (
        <EmptyState description="先选择一个发布渠道查看发布流水线。" title="未选择渠道" />
      ) : !pipeline ? (
        <EmptyState description="发布流水线数据暂不可用。" title="暂无发布流水线" />
      ) : (
        <>
          <DetailGrid
            items={[
              { label: '当前批次', value: pipeline.current_batch?.title ?? '无进行中批次' },
              { label: '批次状态', value: pipeline.current_batch?.status ?? 'IDLE' },
              { label: '目标灰度', value: pipeline.current_batch ? `${pipeline.current_batch.target_rollout_percentage}%` : '-' },
              { label: '更新时间', value: formatOptionalDateTime(pipeline.updated_at) },
            ]}
          />
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
        </>
      )}
    </Card>
  );
}

function ReleaseGateSummary({ gate }: { gate: ChannelReleaseGateOverview | null }) {
  const evaluation = gate?.evaluation ?? null;
  return (
    <Card className="grid gap-4 p-5">
      <PanelTitle helper="根据灰度观测指标决定是否可推进全量。" title="发布观测门禁" />
      {!evaluation ? (
        <EmptyState description="发布观测门禁数据暂不可用。" title="暂无门禁结论" />
      ) : (
        <DetailGrid
          items={[
            { label: '门禁结论', value: evaluation.decision },
            { label: '是否可全量', value: evaluation.eligible_for_full_release ? '是' : '否' },
            { label: '放行率', value: formatPercent(evaluation.metrics.allowed_rate) },
            { label: '阻断数', value: formatNumber(evaluation.metrics.blocked_count) },
            { label: '评估时间', value: formatOptionalDateTime(evaluation.evaluated_at) },
            { label: '原因', value: evaluation.reason },
          ]}
        />
      )}
    </Card>
  );
}

function ReleaseAutomationSummary({ automation }: { automation: ChannelReleaseAutomationOverview | null }) {
  return (
    <Card className="grid gap-4 p-5">
      <PanelTitle helper="基于门禁结论和执行频控自动推进发布。" title="自动推进" />
      {!automation ? (
        <EmptyState description="自动推进数据暂不可用。" title="暂无自动推进" />
      ) : (
        <DetailGrid
          items={[
            { label: '策略启用', value: automation.policy.enabled ? '启用' : '停用' },
            { label: '运行中', value: automation.running ? '是' : '否' },
            { label: '今日运行', value: formatNumber(automation.today_run_count) },
            { label: '最近决策', value: automation.last_run?.decision ?? '暂无' },
            { label: '工作流模式', value: automation.workflow_mode ?? '-' },
            { label: '下次可运行', value: formatOptionalDateTime(automation.next_allowed_at) },
          ]}
        />
      )}
    </Card>
  );
}

function ReleaseSelfHealingSummary({ selfHealing }: { selfHealing: ChannelReleaseSelfHealingOverview | null }) {
  const evaluation = selfHealing?.evaluation ?? null;
  return (
    <Card className="grid gap-4 p-5">
      <PanelTitle helper="根据错误请求与放行率判断是否建议回滚或执行自愈。" title="发布自愈" />
      {!selfHealing || !evaluation ? (
        <EmptyState description="发布自愈数据暂不可用。" title="暂无自愈结论" />
      ) : (
        <DetailGrid
          items={[
            { label: '自愈策略', value: selfHealing.policy.enabled ? '启用' : '停用' },
            { label: '自愈结论', value: evaluation.decision },
            { label: '建议回滚', value: evaluation.rollback_recommended ? '是' : '否' },
            { label: '可回滚', value: evaluation.rollback_available ? '是' : '否' },
            { label: '错误请求', value: formatNumber(evaluation.metrics.error_request_count) },
            { label: '最近运行', value: selfHealing.last_run?.decision ?? '暂无' },
          ]}
        />
      )}
    </Card>
  );
}

function ReleaseSchedulerSummary({ overview }: { overview: ChannelReleaseSchedulerOverview | null }) {
  return (
    <Card className="grid gap-4 p-5">
      <PanelTitle helper="定时扫描自动推进和自愈候选渠道。" title="发布巡检调度" />
      {!overview ? (
        <EmptyState description="发布巡检调度数据暂不可用。" title="暂无调度概览" />
      ) : (
        <DetailGrid
          items={[
            { label: '调度状态', value: overview.scheduler_enabled ? '启用' : '停用' },
            { label: '运行中', value: overview.running ? '是' : '否' },
            { label: '总渠道', value: formatNumber(overview.summary.total_channels) },
            { label: '自动推进候选', value: formatNumber(overview.summary.automation_enabled_channel_count) },
            { label: '自愈候选', value: formatNumber(overview.summary.self_healing_enabled_channel_count) },
            { label: '最近巡检', value: formatOptionalDateTime(overview.last_tick_at) },
          ]}
        />
      )}
    </Card>
  );
}

function ReleaseReportSummary({ report }: { report: ChannelReleaseReport | null }) {
  return (
    <Card className="grid gap-4 p-5">
      <PanelTitle helper="发布复盘报告摘要，完整快照对比后续独立迁移。" title="发布复盘报告" />
      {!report ? (
        <EmptyState description="发布复盘报告数据暂不可用。" title="暂无复盘报告" />
      ) : (
        <>
          <DetailGrid
            items={[
              { label: '渠道', value: report.channel_name },
              { label: '结论', value: report.summary.conclusion },
              { label: '事件等级', value: report.summary.incident_level },
              { label: '健康状态', value: publishChannelHealthLabel(report.summary.health_status) },
              { label: '发布状态', value: publishChannelStatusLabel(report.summary.publish_status) },
              { label: '窗口', value: `${report.report_window_hours} 小时` },
            ]}
          />
          <div className="grid gap-2">
            {report.risks.slice(0, 4).map((risk) => (
              <div className="rounded-md border bg-muted/20 p-3" key={risk.title}>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium">{risk.title}</div>
                  <StatusBadge tone={risk.severity === 'CRITICAL' ? 'unavailable' : risk.severity === 'WARN' ? 'degraded' : 'ready'}>
                    {risk.severity}
                  </StatusBadge>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{risk.recommendation}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

function PanelTitle({ helper, title }: { helper: string; title: string }) {
  return (
    <div>
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{helper}</p>
    </div>
  );
}

function buildReleaseMetrics(
  channels: PublishChannelListItem[],
  scheduler: ChannelReleaseSchedulerOverview | null | undefined,
): ChannelOperationMetric[] {
  const activeCount = channels.filter((item) => item.status === 'ACTIVE').length;
  const errorCount = channels.filter((item) => item.status === 'ERROR').length;

  return [
    { label: '治理渠道', value: formatNumber(channels.length), helper: '发布渠道范围' },
    { label: '启用渠道', value: formatNumber(activeCount), helper: 'ACTIVE' },
    { label: '异常渠道', value: formatNumber(errorCount), helper: 'ERROR' },
    {
      label: '活跃批次',
      value: formatNumber(scheduler?.summary.active_batch_channel_count),
      helper: `可回滚 ${formatNumber(scheduler?.summary.rollback_ready_channel_count)}`,
    },
  ];
}

function releaseStatusLabel(status: string) {
  const labels: Record<string, string> = {
    CURRENT: '当前',
    DONE: '完成',
    FAILED: '失败',
    SKIPPED: '跳过',
    WAITING: '等待',
  };

  return labels[status] ?? status;
}

function releaseStatusTone(status: string) {
  if (status === 'DONE') return 'healthy' as const;
  if (status === 'CURRENT') return 'loading' as const;
  if (status === 'FAILED') return 'unavailable' as const;
  if (status === 'SKIPPED') return 'planned' as const;

  return 'mock' as const;
}
