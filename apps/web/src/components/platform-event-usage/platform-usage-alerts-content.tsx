'use client';

import type { PlatformEventWindow, PlatformUsageAlertAction } from '@aiaget/shared-types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertTriangle, GitBranch } from 'lucide-react';
import { useState } from 'react';

import {
  Notice,
  parsePlatformUsageWindow,
  PlatformUsageConfirmDialog,
  PlatformUsageHeader,
  PlatformUsageSummaryCards,
  platformUsageWindows,
  UsageAlertList,
  UsageAnomalyCard,
} from '@/components/platform-event-usage/platform-usage-shared';
import { Button } from '@/components/ui/button';
import {
  detectPlatformUsageAnomalies,
  getPlatformUsageOverview,
  listPlatformUsageAlerts,
  notifyPlatformUsageAlert,
  rebuildPlatformUsageRollups,
  updatePlatformUsageAlert,
} from '@/lib/api-client';
import { cn } from '@/lib/utils';

type PlatformUsageActionTarget =
  | { type: 'detect-anomalies'; window: PlatformEventWindow }
  | { type: 'rebuild-rollups'; window: PlatformEventWindow }
  | { alertId: string; title: string; type: 'notify-alert' }
  | { action: PlatformUsageAlertAction; alertId: string; title: string; type: 'update-alert' };

export function PlatformUsageAlertsContent() {
  const [windowValue, setWindowValue] = useState<PlatformEventWindow>(() => parsePlatformUsageWindow(null));
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [anomalyOverview, setAnomalyOverview] = useState<Awaited<ReturnType<typeof detectPlatformUsageAnomalies>> | null>(null);
  const [platformUsageActionTarget, setPlatformUsageActionTarget] = useState<PlatformUsageActionTarget | null>(null);

  const overviewQuery = useQuery({
    queryKey: ['platform-usage-alerts-overview', windowValue],
    queryFn: () => getPlatformUsageOverview({ window: windowValue }),
  });
  const alertsQuery = useQuery({
    queryKey: ['platform-usage-alerts-page', windowValue],
    queryFn: () => listPlatformUsageAlerts({ window: windowValue }),
  });
  const rebuildRollupsMutation = useMutation({
    mutationFn: () => rebuildPlatformUsageRollups({ window: windowValue }),
    onMutate: () => setNotice(null),
    onSuccess: async (result) => {
      setNotice({ tone: 'success', message: `Rollup 已重建 ${result.rebuilt_count} 个汇总桶。` });
      setPlatformUsageActionTarget(null);
      await Promise.all([overviewQuery.refetch(), alertsQuery.refetch()]);
    },
    onError: () => setNotice({ tone: 'error', message: 'Rollup 重建失败。' }),
  });
  const detectAnomaliesMutation = useMutation({
    mutationFn: () => detectPlatformUsageAnomalies({ window: windowValue }),
    onMutate: () => setNotice(null),
    onSuccess: async (result) => {
      setAnomalyOverview(result);
      setNotice({
        tone: result.summary.anomaly_count > 0 ? 'error' : 'success',
        message: result.summary.anomaly_count > 0 ? `检测到 ${result.summary.anomaly_count} 条用量异常信号。` : '用量异常检测完成，当前窗口未发现异常信号。',
      });
      setPlatformUsageActionTarget(null);
      await Promise.all([overviewQuery.refetch(), alertsQuery.refetch()]);
    },
    onError: () => setNotice({ tone: 'error', message: '用量异常检测失败。' }),
  });
  const updateAlertMutation = useMutation({
    mutationFn: ({ action, alertId }: { action: PlatformUsageAlertAction; alertId: string }) => updatePlatformUsageAlert(alertId, { action }),
    onSuccess: async (_, variables) => {
      const actionLabels: Record<PlatformUsageAlertAction, string> = { ACKNOWLEDGE: '确认', ESCALATE: '升级', CLOSE: '关闭' };
      setNotice({ tone: 'success', message: `告警已${actionLabels[variables.action]}。` });
      setPlatformUsageActionTarget(null);
      await Promise.all([alertsQuery.refetch(), overviewQuery.refetch()]);
    },
    onError: () => setNotice({ tone: 'error', message: '告警状态更新失败。' }),
  });
  const notifyAlertMutation = useMutation({
    mutationFn: ({ alertId }: { alertId: string }) => notifyPlatformUsageAlert(alertId, { channels: ['IN_APP', 'WEBHOOK'] }),
    onSuccess: async (result) => {
      setNotice({ tone: result.status === 'FAILED' ? 'error' : 'success', message: result.message });
      setPlatformUsageActionTarget(null);
      await Promise.all([alertsQuery.refetch(), overviewQuery.refetch()]);
    },
    onError: () => setNotice({ tone: 'error', message: '告警通知投递失败。' }),
  });

  function confirmPlatformUsageAction() {
    if (!platformUsageActionTarget) return;
    if (platformUsageActionTarget.type === 'detect-anomalies') {
      detectAnomaliesMutation.mutate();
      return;
    }
    if (platformUsageActionTarget.type === 'rebuild-rollups') {
      rebuildRollupsMutation.mutate();
      return;
    }
    if (platformUsageActionTarget.type === 'notify-alert') {
      notifyAlertMutation.mutate({ alertId: platformUsageActionTarget.alertId });
      return;
    }
    updateAlertMutation.mutate({ action: platformUsageActionTarget.action, alertId: platformUsageActionTarget.alertId });
  }

  const pending =
    detectAnomaliesMutation.isPending ||
    rebuildRollupsMutation.isPending ||
    updateAlertMutation.isPending ||
    notifyAlertMutation.isPending;

  return (
    <main className="mx-auto grid max-w-[1680px] gap-6 rounded-xl border border-slate-200/80 bg-white/[0.9] p-4 shadow-sm lg:p-6">
      <PlatformUsageHeader
        badge="用量告警"
        refreshing={overviewQuery.isFetching || alertsQuery.isFetching}
        title="用量告警"
        onRefresh={() => {
          void overviewQuery.refetch();
          void alertsQuery.refetch();
        }}
      >
        <div className="flex flex-wrap gap-2">
          <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setWindowValue(event.target.value as PlatformEventWindow)} value={windowValue}>
            {platformUsageWindows.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <Button disabled={detectAnomaliesMutation.isPending} onClick={() => setPlatformUsageActionTarget({ type: 'detect-anomalies', window: windowValue })} type="button" variant="outline">
            <AlertTriangle className={cn('size-4', detectAnomaliesMutation.isPending && 'animate-pulse')} />
            {detectAnomaliesMutation.isPending ? '正在检测' : '检测异常'}
          </Button>
          <Button disabled={rebuildRollupsMutation.isPending} onClick={() => setPlatformUsageActionTarget({ type: 'rebuild-rollups', window: windowValue })} type="button" variant="outline">
            <GitBranch className={cn('size-4', rebuildRollupsMutation.isPending && 'animate-pulse')} />
            {rebuildRollupsMutation.isPending ? '正在重建' : '重建 Rollup'}
          </Button>
        </div>
      </PlatformUsageHeader>
      <Notice message={overviewQuery.isError || alertsQuery.isError ? '用量告警数据加载失败。' : notice?.message ?? null} tone={notice?.tone ?? 'error'} />
      <PlatformUsageSummaryCards loading={overviewQuery.isLoading} overview={overviewQuery.data ?? null} windowValue={windowValue} />
      <UsageAnomalyCard detecting={detectAnomaliesMutation.isPending} overview={anomalyOverview} />
      <UsageAlertList
        items={alertsQuery.data?.items ?? []}
        loading={alertsQuery.isLoading}
        notifying={notifyAlertMutation.isPending}
        pendingAction={updateAlertMutation.variables?.action ?? null}
        pendingAlertId={updateAlertMutation.variables?.alertId ?? null}
        pendingNotifyAlertId={notifyAlertMutation.variables?.alertId ?? null}
        updating={updateAlertMutation.isPending}
        onAction={(alert, action) => setPlatformUsageActionTarget({ action, alertId: alert.alert_id, title: alert.title, type: 'update-alert' })}
        onNotify={(alert) => setPlatformUsageActionTarget({ alertId: alert.alert_id, title: alert.title, type: 'notify-alert' })}
      />
      {platformUsageActionTarget ? (
        <PlatformUsageConfirmDialog
          body={platformUsageActionConfirmBody(platformUsageActionTarget)}
          confirmLabel={platformUsageActionConfirmLabel(platformUsageActionTarget)}
          onCancel={() => setPlatformUsageActionTarget(null)}
          onConfirm={confirmPlatformUsageAction}
          pending={pending}
          title={platformUsageActionConfirmTitle(platformUsageActionTarget)}
        />
      ) : null}
    </main>
  );
}

function platformUsageActionConfirmTitle(target: PlatformUsageActionTarget) {
  if (target.type === 'detect-anomalies') return '确认检测用量异常';
  if (target.type === 'rebuild-rollups') return '确认重建 Rollup';
  if (target.type === 'notify-alert') return '确认通知用量告警';
  return '确认更新告警状态';
}

function platformUsageActionConfirmLabel(target: PlatformUsageActionTarget) {
  if (target.type === 'detect-anomalies') return '确认检测';
  if (target.type === 'rebuild-rollups') return '确认重建';
  if (target.type === 'notify-alert') return '确认通知';
  return '确认更新';
}

function platformUsageActionConfirmBody(target: PlatformUsageActionTarget) {
  if (target.type === 'detect-anomalies') return `确认检测 ${target.window} 窗口内的用量异常？系统会基于 Rollup 和历史基线生成异常信号，并刷新告警队列。`;
  if (target.type === 'rebuild-rollups') return `确认重建 ${target.window} 窗口的 Rollup 汇总？系统会重新聚合平台事件和用量账本，可能影响当前告警、趋势和成本汇总。`;
  if (target.type === 'notify-alert') return `确认通知用量告警「${target.title}」？系统会向站内和 Webhook 目标重新投递告警通知，并记录通知审计事件。`;
  const actionLabels: Record<PlatformUsageAlertAction, string> = { ACKNOWLEDGE: '确认', ESCALATE: '升级', CLOSE: '关闭' };
  return `确认将用量告警「${target.title}」状态更新为「${actionLabels[target.action]}」？该操作会写入告警生命周期并刷新监控、审计和安全视图。`;
}
