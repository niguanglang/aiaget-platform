'use client';

import type { PlatformEventWindow, PlatformUsageAlertNotificationStatus } from '@aiaget/shared-types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { MonitorCenterBackground } from '@/components/monitor/monitor-center-background';
import {
  Notice,
  parsePlatformUsageWindow,
  PlatformUsageConfirmDialog,
  PlatformUsageHeader,
  platformUsageWindows,
  UsageNotificationList,
} from '@/components/platform-event-usage/platform-usage-shared';
import {
  listPlatformUsageAlertNotifications,
  retryPlatformUsageAlertNotification,
} from '@/lib/api-client';

export function PlatformUsageNotificationsContent() {
  const [windowValue, setWindowValue] = useState<PlatformEventWindow>(() => parsePlatformUsageWindow(null));
  const [notificationStatus, setNotificationStatus] = useState<PlatformUsageAlertNotificationStatus | ''>('');
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [notificationRetryTarget, setNotificationRetryTarget] = useState<{ alertId: string; notificationEventId: string; status: PlatformUsageAlertNotificationStatus } | null>(null);

  const notificationsQuery = useQuery({
    queryKey: ['platform-usage-notifications-page', windowValue, notificationStatus],
    queryFn: () => listPlatformUsageAlertNotifications({ window: windowValue, status: notificationStatus || undefined }),
  });
  const retryNotificationMutation = useMutation({
    mutationFn: ({ notificationEventId }: { notificationEventId: string }) => retryPlatformUsageAlertNotification(notificationEventId),
    onSuccess: async (result) => {
      setNotice({ tone: result.status === 'FAILED' ? 'error' : 'success', message: `重试完成：${result.message}` });
      setNotificationRetryTarget(null);
      await notificationsQuery.refetch();
    },
    onError: () => setNotice({ tone: 'error', message: '告警通知重试失败。' }),
  });

  function confirmNotificationRetry() {
    if (!notificationRetryTarget) return;
    retryNotificationMutation.mutate({ notificationEventId: notificationRetryTarget.notificationEventId });
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <MonitorCenterBackground />
      <PlatformUsageHeader
        badge="通知审计"
        description="统一查看告警通知投递结果、Webhook 响应和失败重试链路。"
        refreshing={notificationsQuery.isFetching}
        title="告警通知投递审计"
        onRefresh={() => void notificationsQuery.refetch()}
      >
        <div className="flex flex-wrap gap-2">
          <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setWindowValue(event.target.value as PlatformEventWindow)} value={windowValue}>
            {platformUsageWindows.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setNotificationStatus(event.target.value as PlatformUsageAlertNotificationStatus | '')} value={notificationStatus}>
            <option value="">全部状态</option>
            <option value="SENT">已投递</option>
            <option value="PARTIAL">部分成功</option>
            <option value="SKIPPED">已跳过</option>
            <option value="FAILED">失败</option>
          </select>
        </div>
      </PlatformUsageHeader>
      <Notice message={notificationsQuery.isError ? '通知投递记录加载失败。' : notice?.message ?? null} tone={notice?.tone ?? 'error'} />
      <UsageNotificationList
        items={notificationsQuery.data?.items ?? []}
        loading={notificationsQuery.isLoading}
        pendingNotificationEventId={retryNotificationMutation.variables?.notificationEventId ?? null}
        retrying={retryNotificationMutation.isPending}
        onRetry={(notification) =>
          setNotificationRetryTarget({
            alertId: notification.alert_id,
            notificationEventId: notification.notification_event_id,
            status: notification.status,
          })
        }
      />
      {notificationRetryTarget ? (
        <PlatformUsageConfirmDialog
          body={`确认重试告警通知「${notificationRetryTarget.notificationEventId}」？系统会重新投递关联告警 ${notificationRetryTarget.alertId} 的站内和 Webhook 通知，并记录新的投递审计事件。`}
          confirmLabel="确认重试"
          onCancel={() => setNotificationRetryTarget(null)}
          onConfirm={confirmNotificationRetry}
          pending={retryNotificationMutation.isPending}
          title="确认重试告警通知"
        />
      ) : null}
    </main>
  );
}
