'use client';

import type { ChannelPublishJobDetail, ChannelPublishJobTimelineItem } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, RefreshCw, RotateCcw, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import {
  ChannelActionConfirmDialog,
  ChannelAlert,
  ChannelFocusedHeader,
  DetailGrid,
  formatNumber,
  formatOptionalDateTime,
  useChannelOperationPermissions,
} from '@/components/channels/channel-operations-pages';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { cancelChannelPublishJob, getChannelPublishJob, retryChannelPublishJob, type ApiClientError } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const jobsQueryKey = 'channel-jobs-focused-page';
const jobDetailQueryKey = 'channel-publish-job-detail';

type JobActionTarget = {
  action: 'cancel' | 'retry';
  jobId: string;
  jobLabel: string;
};

export function ChannelJobDetailContent({ jobId }: { jobId: string }) {
  const permissions = useChannelOperationPermissions();
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [jobActionTarget, setJobActionTarget] = useState<JobActionTarget | null>(null);

  const detailQuery = useQuery({
    enabled: permissions.canView && Boolean(jobId),
    queryKey: [jobDetailQueryKey, jobId],
    queryFn: () => getChannelPublishJob(jobId),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelChannelPublishJob,
    onSuccess: async () => {
      setNotice('发布任务已取消。');
      setActionError(null);
      setJobActionTarget(null);
      await invalidateJobQueries(queryClient, jobId);
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setActionError(error.message);
    },
  });

  const retryMutation = useMutation({
    mutationFn: retryChannelPublishJob,
    onSuccess: async () => {
      setNotice('重试任务已提交。');
      setActionError(null);
      setJobActionTarget(null);
      await invalidateJobQueries(queryClient, jobId);
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setActionError(error.message);
    },
  });

  const item = detailQuery.data ?? null;

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <ChannelFocusedHeader
        activeRoute="jobs"
        badge="发布任务详情"
        description="发布任务执行状态、时间线、关联对象、载荷、结果和失败处理入口。"
        permissions={permissions}
        refreshing={detailQuery.isFetching || cancelMutation.isPending || retryMutation.isPending}
        subtitle="/channels/jobs/:jobId"
        title="发布任务详情"
        onRefresh={() => void detailQuery.refetch()}
      />

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/channels/jobs">返回发布任务列表</Link>
        </Button>
        <Button disabled={detailQuery.isFetching} onClick={() => void detailQuery.refetch()} type="button" variant="outline">
          <RefreshCw className={cn('size-4', detailQuery.isFetching && 'animate-spin')} />
          刷新详情
        </Button>
      </div>

      <ChannelAlert message={notice} tone="ready" />
      <ChannelAlert message={actionError ?? (detailQuery.isError ? '发布任务详情加载失败。' : null)} tone="error" />

      {!permissions.canView ? (
        <Card className="p-5">
          <EmptyState description="当前账号缺少 channel:publish:view 权限，无法查看发布任务详情。" title="无权查看发布任务详情" />
        </Card>
      ) : detailQuery.isLoading ? (
        <Card className="grid gap-3 p-5">
          <div className="h-24 rounded-md border bg-muted/30" />
          <div className="h-52 rounded-md border bg-muted/30" />
        </Card>
      ) : !item ? (
        <Card className="p-5">
          <EmptyState description="发布任务不存在、已清理或当前账号没有权限查看。" title="发布任务不可用" />
        </Card>
      ) : (
        <>
          <Card className="grid gap-4 p-5">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={jobStatusTone(item.status)}>{jobStatusLabel(item.status)}</StatusBadge>
                  <StatusBadge tone="ready">{item.job_type ?? '发布任务'}</StatusBadge>
                  {item.retry_count ? <StatusBadge tone="degraded">重试 {formatNumber(item.retry_count)}</StatusBadge> : null}
                </div>
                <h2 className="mt-3 text-xl font-semibold">{item.title ?? item.job_no ?? item.id}</h2>
                <p className="mt-2 max-w-4xl break-all text-sm leading-6 text-muted-foreground">{item.job_no ?? item.id}</p>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Button onClick={() => void navigator.clipboard?.writeText(item.job_no ?? item.id)} type="button" variant="outline">
                  <Copy className="size-4" />
                  复制任务编号
                </Button>
                <Button
                  disabled={!permissions.canDisable || !canCancelJob(item) || cancelMutation.isPending}
                  onClick={() => setJobActionTarget({ action: 'cancel', jobId: item.id, jobLabel: item.title ?? item.job_no ?? item.id })}
                  type="button"
                  variant="outline"
                >
                  <XCircle className="size-4" />
                  取消任务
                </Button>
                <Button
                  disabled={!permissions.canManage || !canRetryJob(item) || retryMutation.isPending}
                  onClick={() => setJobActionTarget({ action: 'retry', jobId: item.id, jobLabel: item.title ?? item.job_no ?? item.id })}
                  type="button"
                  variant="outline"
                >
                  <RotateCcw className={cn('size-4', retryMutation.isPending && 'animate-spin')} />
                  重试任务
                </Button>
              </div>
            </div>
          </Card>

          <Card className="grid gap-4 p-5">
            <h2 className="text-sm font-semibold">任务基础信息</h2>
            <DetailGrid
              items={[
                { label: '任务 ID', value: item.id },
                { label: '任务编号', value: item.job_no ?? '未记录' },
                { label: '任务类型', value: item.job_type ?? '未记录' },
                { label: '任务进度', value: formatJobProgress(item) },
                { label: '渠道提供方', value: item.provider_name ?? item.provider_id ?? '未绑定' },
                { label: '发布渠道', value: item.channel_name ?? item.channel_id ?? '未绑定' },
                { label: '账号凭据', value: item.account_name ?? item.account_id ?? '未绑定' },
                { label: '消息模板', value: item.template_name ?? item.template_id ?? '未绑定' },
                { label: '计划时间', value: formatOptionalDateTime(item.scheduled_at) },
                { label: '开始时间', value: formatOptionalDateTime(item.started_at) },
                { label: '结束时间', value: formatOptionalDateTime(item.finished_at) },
                { label: '错误原因', value: item.error_message ?? '暂无错误' },
              ]}
            />
          </Card>

          <Card className="grid gap-4 p-5">
            <h2 className="text-sm font-semibold">任务时间线</h2>
            <JobTimeline timeline={item.timeline ?? []} />
          </Card>

          <section className="grid gap-4 xl:grid-cols-2">
            <JsonBlock title="执行载荷" value={item.payload ?? null} />
            <JsonBlock title="执行结果" value={item.result ?? null} />
          </section>
        </>
      )}

      {jobActionTarget ? (
        <ChannelActionConfirmDialog
          body={
            jobActionTarget.action === 'cancel'
              ? `确认取消发布任务“${jobActionTarget.jobLabel}”？取消后该任务的后续发布步骤将停止执行，已完成步骤不会自动回滚。`
              : `确认重试发布任务“${jobActionTarget.jobLabel}”？重试会重新提交失败或已取消的发布任务，并可能再次触发关联渠道投递。`
          }
          confirmLabel={jobActionTarget.action === 'cancel' ? '确认取消' : '确认重试'}
          onCancel={() => setJobActionTarget(null)}
          onConfirm={() => {
            if (jobActionTarget.action === 'cancel') {
              cancelMutation.mutate(jobActionTarget.jobId);
              return;
            }
            retryMutation.mutate(jobActionTarget.jobId);
          }}
          pending={jobActionTarget.action === 'cancel' ? cancelMutation.isPending : retryMutation.isPending}
          title={jobActionTarget.action === 'cancel' ? '确认取消发布任务' : '确认重试发布任务'}
          variant={jobActionTarget.action === 'cancel' ? 'destructive' : 'default'}
        />
      ) : null}
    </main>
  );
}

async function invalidateJobQueries(queryClient: ReturnType<typeof useQueryClient>, jobId: string) {
  await queryClient.invalidateQueries({ queryKey: [jobsQueryKey] });
  await queryClient.invalidateQueries({ queryKey: [jobDetailQueryKey, jobId] });
}

function JobTimeline({ timeline }: { timeline: ChannelPublishJobTimelineItem[] }) {
  if (timeline.length === 0) {
    return <EmptyState description="当前任务没有时间线记录。" title="暂无任务时间线" />;
  }

  return (
    <div className="grid gap-3">
      {timeline.map((item, index) => (
        <div className="grid gap-2 rounded-md border bg-muted/20 p-3" key={`${item.label}-${index}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-medium">{item.label}</div>
            <StatusBadge tone={jobStatusTone(item.status)}>{jobStatusLabel(item.status)}</StatusBadge>
          </div>
          <div className="text-xs text-muted-foreground">{formatOptionalDateTime(item.occurred_at)}</div>
          <p className="text-sm leading-6 text-muted-foreground">{item.description ?? '无说明'}</p>
        </div>
      ))}
    </div>
  );
}

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <Card className="grid gap-3 p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      <pre className="max-h-96 overflow-auto rounded-md border bg-slate-950 px-3 py-3 text-xs leading-6 text-slate-100">
        {value === null || value === undefined ? '无' : typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
      </pre>
    </Card>
  );
}

function formatJobProgress(item: ChannelPublishJobDetail) {
  const progress = item.progress_percent ?? item.progress;
  if (typeof progress === 'number' && Number.isFinite(progress)) return `${Math.round(progress)}%`;
  if (typeof item.completed_count === 'number' && typeof item.total_count === 'number' && item.total_count > 0) {
    return `${formatNumber(item.completed_count)}/${formatNumber(item.total_count)}`;
  }

  return '-';
}

function canCancelJob(item: ChannelPublishJobDetail) {
  return item.status === 'PENDING' || item.status === 'RUNNING' || item.status === 'RETRYING';
}

function canRetryJob(item: ChannelPublishJobDetail) {
  return item.status === 'FAILED' || item.status === 'CANCELED';
}

function jobStatusLabel(status: string) {
  const labels: Record<string, string> = {
    CANCELED: '已取消',
    FAILED: '失败',
    PENDING: '待处理',
    RETRYING: '重试中',
    RUNNING: '运行中',
    SKIPPED: '已跳过',
    SUCCESS: '成功',
  };

  return labels[status] ?? status;
}

function jobStatusTone(status: string) {
  if (status === 'SUCCESS') return 'healthy' as const;
  if (status === 'FAILED' || status === 'CANCELED') return 'unavailable' as const;
  if (status === 'PENDING' || status === 'RUNNING' || status === 'RETRYING') return 'degraded' as const;

  return 'planned' as const;
}
