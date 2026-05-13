'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Play } from 'lucide-react';
import { useState } from 'react';

import { ChannelCenterBackground } from '@/components/channels/channel-center-background';
import { ChannelActionConfirmDialog, ChannelAlert, DetailGrid, formatNumber, formatOptionalDateTime, useChannelOperationPermissions } from '@/components/channels/channel-operations-pages';
import { ChannelReleaseHeader, PanelTitle } from '@/components/channels/channel-release-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { getChannelReleaseSchedulerOverview, runChannelReleaseSchedulerOnce, type ApiClientError } from '@/lib/api-client';

export function ChannelReleaseSchedulerContent() {
  const queryClient = useQueryClient();
  const permissions = useChannelOperationPermissions();
  const [releaseSchedulerActionTarget, setReleaseSchedulerActionTarget] = useState<'run-release-scheduler' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const schedulerQuery = useQuery({ enabled: permissions.canView, queryKey: ['channel-release-scheduler-page'], queryFn: getChannelReleaseSchedulerOverview });
  const runMutation = useMutation({
    mutationFn: runChannelReleaseSchedulerOnce,
    onSuccess: async () => {
      setNotice('发布巡检已运行。');
      setActionError(null);
      setReleaseSchedulerActionTarget(null);
      await queryClient.invalidateQueries({ queryKey: ['channel-release-scheduler-page'] });
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setActionError(error.message);
    },
  });
  const overview = schedulerQuery.data ?? null;

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <ChannelCenterBackground />
      <ChannelReleaseHeader
        badge="发布巡检调度"
        description="发布巡检调度状态、候选渠道、工作流模式和最近运行结果。"
        refreshing={schedulerQuery.isFetching || runMutation.isPending}
        subtitle="/channels/release/scheduler"
        title="发布巡检调度"
        onRefresh={() => void schedulerQuery.refetch()}
      />
      <ChannelAlert message={notice} tone="ready" />
      <ChannelAlert message={actionError ?? (schedulerQuery.isError ? '发布巡检调度加载失败。' : null)} tone="error" />
      <Card className="grid gap-4 p-5">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <PanelTitle helper="自动推进和自愈候选扫描" title="调度状态" />
          <Button disabled={!permissions.canDeploy || runMutation.isPending} onClick={() => setReleaseSchedulerActionTarget('run-release-scheduler')} type="button" variant="outline">
            <Play className="size-4" />
            运行发布巡检
          </Button>
        </div>
        {!overview ? <EmptyState description="发布巡检调度数据暂不可用。" title="暂无调度概览" /> : (
          <DetailGrid items={[
            { label: '调度状态', value: overview.scheduler_enabled ? '启用' : '停用' },
            { label: '运行中', value: overview.running ? '是' : '否' },
            { label: '最近巡检', value: formatOptionalDateTime(overview.last_tick_at) },
            { label: '下次间隔', value: overview.next_tick_after_seconds === null ? '未计划' : `${overview.next_tick_after_seconds} 秒` },
            { label: '自动推进模式', value: overview.workflow_modes.automation },
            { label: '自愈模式', value: overview.workflow_modes.self_healing },
          ]} />
        )}
      </Card>
      {overview ? (
        <>
          <Card className="grid gap-4 p-5">
            <PanelTitle helper="候选渠道范围" title="候选摘要" />
            <DetailGrid items={[
              { label: '总渠道', value: formatNumber(overview.summary.total_channels) },
              { label: '自动推进候选', value: formatNumber(overview.summary.automation_enabled_channel_count) },
              { label: '自愈候选', value: formatNumber(overview.summary.self_healing_enabled_channel_count) },
              { label: '活跃批次渠道', value: formatNumber(overview.summary.active_batch_channel_count) },
              { label: '可回滚渠道', value: formatNumber(overview.summary.rollback_ready_channel_count) },
            ]} />
          </Card>
          <Card className="grid gap-4 p-5">
            <PanelTitle helper="调度运行结果" title="最近运行" />
            {!overview.last_run ? <EmptyState description="当前没有调度运行记录。" title="暂无最近运行" /> : (
              <>
                <DetailGrid items={[
                  { label: '运行 ID', value: overview.last_run.run_id },
                  { label: '运行状态', value: overview.last_run.status },
                  { label: '扫描渠道', value: formatNumber(overview.last_run.scanned_channel_count) },
                  { label: '派发数量', value: formatNumber(overview.last_run.dispatched_count) },
                  { label: '成功数量', value: formatNumber(overview.last_run.success_count) },
                  { label: '失败数量', value: formatNumber(overview.last_run.failed_count) },
                ]} />
                <div className="grid gap-2">
                  {overview.last_run.results.slice(0, 8).map((item, index) => (
                    <div className="grid gap-3 rounded-md border bg-muted/20 p-3 lg:grid-cols-[1fr_auto]" key={`${item.channel_id}-${item.task}-${index}`}>
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{item.channel_name}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{item.task} · {item.decision ?? '无决策'}</div>
                        <div className="mt-2 grid gap-1 text-xs text-muted-foreground md:grid-cols-3">
                          <span>工作流后端：{item.workflow_backend ?? '-'}</span>
                          <span>Workflow ID：{item.workflow_id ?? '-'}</span>
                          <span>Workflow Run ID：{item.workflow_run_id ?? '-'}</span>
                        </div>
                      </div>
                      <StatusBadge tone={item.status === 'SUCCESS' ? 'healthy' : item.status === 'FAILED' ? 'unavailable' : 'planned'}>{item.status}</StatusBadge>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </>
      ) : null}
      {releaseSchedulerActionTarget ? (
        <ChannelActionConfirmDialog
          body="确认立即运行一次发布巡检？系统会扫描自动推进和自愈候选渠道，并可能派发对应治理任务，影响范围为当前发布治理调度范围。"
          confirmLabel="确认运行"
          onCancel={() => setReleaseSchedulerActionTarget(null)}
          onConfirm={() => runMutation.mutate()}
          pending={runMutation.isPending}
          title="确认运行发布巡检"
        />
      ) : null}
    </main>
  );
}
