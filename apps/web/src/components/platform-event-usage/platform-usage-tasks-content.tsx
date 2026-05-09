'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { MonitorCenterBackground } from '@/components/monitor/monitor-center-background';
import {
  Notice,
  PlatformUsageConfirmDialog,
  PlatformUsageHeader,
  UsageTaskOverviewCard,
} from '@/components/platform-event-usage/platform-usage-shared';
import {
  getPlatformUsageAlertNotificationTaskOverview,
  runPlatformUsageAlertNotificationAutoRetry,
} from '@/lib/api-client';

export function PlatformUsageTasksContent() {
  const [taskRunTarget, setTaskRunTarget] = useState<'auto-retry' | null>(null);
  const taskQuery = useQuery({
    queryKey: ['platform-usage-alert-notification-task-page'],
    queryFn: () => getPlatformUsageAlertNotificationTaskOverview(),
  });
  const runTaskMutation = useMutation({
    mutationFn: () => runPlatformUsageAlertNotificationAutoRetry(),
    onSuccess: async () => {
      setTaskRunTarget(null);
      await taskQuery.refetch();
    },
  });

  function confirmTaskRun() {
    if (!taskRunTarget) return;
    runTaskMutation.mutate();
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <MonitorCenterBackground />
      <PlatformUsageHeader
        badge="重试任务"
        description="查看平台用量告警通知自动重试任务的调度状态、策略来源和最近执行结果。"
        refreshing={taskQuery.isFetching}
        title="告警通知自动重试任务"
        onRefresh={() => void taskQuery.refetch()}
      />
      <Notice message={taskQuery.isError || runTaskMutation.isError ? '自动重试任务数据加载或执行失败。' : null} tone="error" />
      <UsageTaskOverviewCard
        loading={taskQuery.isLoading}
        overview={taskQuery.data ?? null}
        running={runTaskMutation.isPending}
        onRunAutoRetry={() => setTaskRunTarget('auto-retry')}
      />
      {taskRunTarget ? (
        <PlatformUsageConfirmDialog
          body="确认运行自动重试任务？系统会扫描失败或部分成功的告警通知投递，满足退避和最大重试次数后追加重试事件，并刷新任务执行结果。"
          confirmLabel="确认运行"
          onCancel={() => setTaskRunTarget(null)}
          onConfirm={confirmTaskRun}
          pending={runTaskMutation.isPending}
          title="确认运行自动重试任务"
        />
      ) : null}
    </main>
  );
}
