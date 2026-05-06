'use client';

import type { ChannelPublishJobItem } from '@aiaget/shared-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RotateCcw, XCircle } from 'lucide-react';
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
  cancelChannelPublishJob,
  listChannelPublishJobs,
  retryChannelPublishJob,
  type ApiClientError,
} from '@/lib/api-client';

const jobsQueryKey = 'channel-jobs-focused-page';

const jobStatusOptions = [
  { label: '待处理', value: 'PENDING' },
  { label: '运行中', value: 'RUNNING' },
  { label: '成功', value: 'SUCCESS' },
  { label: '失败', value: 'FAILED' },
  { label: '已跳过', value: 'SKIPPED' },
  { label: '已取消', value: 'CANCELED' },
  { label: '重试中', value: 'RETRYING' },
];

export function ChannelJobsContent() {
  const queryClient = useQueryClient();
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const cancelMutation = useMutation({
    mutationFn: cancelChannelPublishJob,
    onSuccess: async () => {
      setActionNotice('发布任务已取消。');
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: [jobsQueryKey] });
    },
    onError: (error: ApiClientError) => {
      setActionNotice(null);
      setActionError(error.message);
    },
  });

  const retryMutation = useMutation({
    mutationFn: retryChannelPublishJob,
    onSuccess: async () => {
      setActionNotice('重试任务已提交。');
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: [jobsQueryKey] });
    },
    onError: (error: ApiClientError) => {
      setActionNotice(null);
      setActionError(error.message);
    },
  });

  return (
    <ChannelOperationsListPage
      activeRoute="jobs"
      actionError={actionError}
      actionNotice={actionNotice}
      badge="发布任务"
      buildMetrics={(input) => buildJobMetrics(input.items, input.total)}
      description="跟踪渠道发布、推送和回调相关任务的任务进度、重试次数和错误原因。重试任务与取消任务需要执行权限。"
      emptyDescription="当前没有发布任务。触发渠道发布、模板同步或补偿发送后，任务会出现在这里。"
      emptyTitle="暂无发布任务"
      errorMessage="发布任务列表加载失败。"
      getItemId={(item) => item.id}
      listQuery={listChannelPublishJobs}
      providerFilterLabel="供应商/渠道"
      queryKey={jobsQueryKey}
      renderItem={({ item, onToggle, permissions, selected }) => (
        <ChannelOperationRow
          badges={
            <>
              <ChannelOperationStatusBadge status={item.status} />
              <StatusBadge tone="ready">{item.job_type ?? '发布任务'}</StatusBadge>
            </>
          }
          details={[
            { label: '任务编号', value: item.job_no ?? item.id },
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
          selected={selected}
          stats={[
            { label: '任务进度', value: formatJobProgress(item) },
            { label: '重试', value: formatNumber(item.retry_count ?? 0) },
          ]}
          subtitle={
            <span>
              任务进度：{formatJobProgress(item)} · 重试任务：{formatNumber(item.retry_count ?? 0)} 次 · 渠道：
              {item.channel_name ?? item.channel_id ?? '未绑定'}
            </span>
          }
          title={item.title ?? item.job_no ?? item.id}
          actions={
            <>
              <Button disabled={!permissions.canDeploy || !canCancelJob(item) || cancelMutation.isPending} onClick={() => cancelMutation.mutate(item.id)} size="sm" type="button" variant="outline">
                <XCircle className="size-4" />
                取消任务
              </Button>
              <Button disabled={!permissions.canDeploy || !canRetryJob(item) || retryMutation.isPending} onClick={() => retryMutation.mutate(item.id)} size="sm" type="button" variant="outline">
                <RotateCcw className="size-4" />
                重试任务
              </Button>
            </>
          }
          onToggle={onToggle}
        />
      )}
      statusOptions={jobStatusOptions}
      subtitle="/channels/jobs"
      title="发布任务"
    />
  );
}

function buildJobMetrics(items: ChannelPublishJobItem[], total: number): ChannelOperationMetric[] {
  const runningCount = items.filter((item) => item.status === 'RUNNING' || item.status === 'PENDING' || item.status === 'RETRYING').length;
  const failedCount = items.filter((item) => item.status === 'FAILED').length;
  const retryCount = items.reduce((sum, item) => sum + (item.retry_count ?? 0), 0);

  return [
    { label: '发布任务', value: formatNumber(total), helper: '当前筛选范围' },
    { label: '运行任务', value: formatNumber(runningCount), helper: '待处理/运行/重试' },
    { label: '失败任务', value: formatNumber(failedCount), helper: '可执行重试' },
    { label: '重试次数', value: formatNumber(retryCount), helper: '当前页累计' },
  ];
}

function formatJobProgress(item: ChannelPublishJobItem) {
  const progress = item.progress_percent ?? item.progress;
  if (typeof progress === 'number' && Number.isFinite(progress)) return `${Math.round(progress)}%`;
  if (typeof item.completed_count === 'number' && typeof item.total_count === 'number' && item.total_count > 0) {
    return `${formatNumber(item.completed_count)}/${formatNumber(item.total_count)}`;
  }

  return '-';
}

function canCancelJob(item: ChannelPublishJobItem) {
  return item.status === 'PENDING' || item.status === 'RUNNING' || item.status === 'RETRYING';
}

function canRetryJob(item: ChannelPublishJobItem) {
  return item.status === 'FAILED' || item.status === 'CANCELED';
}
