'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  hasPermission,
  type NotificationPolicyAuditOverview,
  type NotificationPolicyChangePreview,
  type SystemSettingItem,
} from '@aiaget/shared-types';
import { ArrowLeft, ArrowRight, BellRing, History, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { formatDateTime } from '@/components/agents/agent-status';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  ConfirmDialog,
  DetailRow,
  SystemSettingCard,
  formatSettingDraftValue,
  notificationPolicySettingLabel,
  parseSettingDraftValue,
} from '@/components/settings/settings-shared';
import {
  getNotificationPolicyAudit,
  listSystemSettings,
  previewNotificationPolicySettingChange,
  resetSystemSetting,
  updateSystemSetting,
  type ApiClientError,
} from '@/lib/api-client';

export function NotificationPolicyContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [settingDrafts, setSettingDrafts] = useState<Record<string, string>>({});
  const [settingStatuses, setSettingStatuses] = useState<Record<string, 'ACTIVE' | 'DISABLED'>>({});
  const [settingErrors, setSettingErrors] = useState<Record<string, string>>({});
  const [settingSuccessId, setSettingSuccessId] = useState<string | null>(null);
  const [resetSettingTarget, setResetSettingTarget] = useState<SystemSettingItem | null>(null);
  const [notificationPolicyPreviews, setNotificationPolicyPreviews] = useState<Record<string, NotificationPolicyChangePreview | null>>({});
  const [notificationPolicyPreviewErrors, setNotificationPolicyPreviewErrors] = useState<Record<string, string>>({});

  const permissions = currentUser?.user.permissions ?? [];
  const isTenantAdmin = Boolean(currentUser?.user.roles.some((role) => role.code === 'tenant_admin'));
  const canManageSettings = Boolean(isTenantAdmin || hasPermission(permissions, 'system:settings:manage'));

  const notificationSettingsQuery = useQuery({
    queryKey: ['system-settings', 'NOTIFICATION', ''],
    queryFn: () => listSystemSettings({ category: 'NOTIFICATION', status: '' }),
  });
  const notificationPolicyAuditQuery = useQuery({
    queryKey: ['notification-policy-audit'],
    queryFn: getNotificationPolicyAudit,
  });

  const notificationSettings = notificationSettingsQuery.data ?? [];
  const audit = notificationPolicyAuditQuery.data;

  const metrics = useMemo(
    () => [
      { label: '通知参数', value: `${notificationSettings.length}`, helper: 'NOTIFICATION 分类' },
      { label: '启用参数', value: `${notificationSettings.filter((setting) => setting.status === 'ACTIVE').length}`, helper: '当前有效' },
      { label: '近 7 天变更', value: `${audit?.summary.change_count ?? 0}`, helper: '审计统计' },
      { label: '最近变更', value: audit?.summary.latest_change_at ? formatDateTime(audit.summary.latest_change_at) : '暂无', helper: '通知策略' },
    ],
    [audit, notificationSettings],
  );

  const updateSettingMutation = useMutation({
    mutationFn: ({ setting, value, status }: { setting: SystemSettingItem; value: unknown; status: 'ACTIVE' | 'DISABLED' }) =>
      updateSystemSetting(setting.id, { value, status }),
    onSuccess: async (setting) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['system-settings'] }),
        queryClient.invalidateQueries({ queryKey: ['system-settings-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['notification-policy-audit'] }),
        queryClient.invalidateQueries({ queryKey: ['notification-policy-snapshots'] }),
        queryClient.invalidateQueries({ queryKey: ['notification-policy-approval-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['notification-policy-approvals'] }),
        queryClient.invalidateQueries({ queryKey: ['security-center-overview'] }),
      ]);
      setSettingErrors((current) => ({ ...current, [setting.id]: '' }));
      setSettingSuccessId(setting.id);
      setNotificationPolicyPreviews((current) => ({ ...current, [setting.id]: null }));
    },
    onError: (error: ApiClientError, variables) => {
      setSettingSuccessId(null);
      setSettingErrors((current) => ({ ...current, [variables.setting.id]: error.message }));
    },
  });

  const previewNotificationPolicyMutation = useMutation({
    mutationFn: ({ setting, value, status }: { setting: SystemSettingItem; value: unknown; status: 'ACTIVE' | 'DISABLED' }) =>
      previewNotificationPolicySettingChange(setting.id, { value, status }),
    onSuccess: (preview, variables) => {
      setNotificationPolicyPreviews((current) => ({ ...current, [variables.setting.id]: preview }));
      setNotificationPolicyPreviewErrors((current) => ({ ...current, [variables.setting.id]: '' }));
    },
    onError: (error: ApiClientError, variables) => {
      setNotificationPolicyPreviews((current) => ({ ...current, [variables.setting.id]: null }));
      setNotificationPolicyPreviewErrors((current) => ({ ...current, [variables.setting.id]: error.message }));
    },
  });

  const resetSettingMutation = useMutation({
    mutationFn: resetSystemSetting,
    onSuccess: async (setting) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['system-settings'] }),
        queryClient.invalidateQueries({ queryKey: ['system-settings-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['notification-policy-audit'] }),
        queryClient.invalidateQueries({ queryKey: ['notification-policy-snapshots'] }),
        queryClient.invalidateQueries({ queryKey: ['notification-policy-approval-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['notification-policy-approvals'] }),
        queryClient.invalidateQueries({ queryKey: ['security-center-overview'] }),
      ]);
      setSettingDrafts((current) => ({ ...current, [setting.id]: formatSettingDraftValue(setting) }));
      setSettingStatuses((current) => ({ ...current, [setting.id]: setting.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE' }));
      setSettingErrors((current) => ({ ...current, [setting.id]: '' }));
      setNotificationPolicyPreviews((current) => ({ ...current, [setting.id]: null }));
      setSettingSuccessId(setting.id);
      setResetSettingTarget(null);
    },
    onError: (error: ApiClientError) => {
      if (!resetSettingTarget) return;
      setSettingErrors((current) => ({ ...current, [resetSettingTarget.id]: error.message }));
    },
  });

  function submitSetting(setting: SystemSettingItem) {
    const parsed = parseSettingDraftValue(setting, settingDrafts[setting.id] ?? formatSettingDraftValue(setting));
    if (!parsed.ok) {
      setSettingSuccessId(null);
      setSettingErrors((current) => ({ ...current, [setting.id]: parsed.message }));
      return;
    }

    setSettingErrors((current) => ({ ...current, [setting.id]: '' }));
    updateSettingMutation.mutate({
      setting,
      value: parsed.value,
      status: settingStatuses[setting.id] ?? (setting.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE'),
    });
  }

  function previewSetting(setting: SystemSettingItem) {
    const parsed = parseSettingDraftValue(setting, settingDrafts[setting.id] ?? formatSettingDraftValue(setting));
    if (!parsed.ok) {
      setSettingSuccessId(null);
      setNotificationPolicyPreviews((current) => ({ ...current, [setting.id]: null }));
      setNotificationPolicyPreviewErrors((current) => ({ ...current, [setting.id]: parsed.message }));
      return;
    }

    previewNotificationPolicyMutation.mutate({
      setting,
      value: parsed.value,
      status: settingStatuses[setting.id] ?? (setting.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE'),
    });
  }

  function updateSettingDraft(setting: SystemSettingItem, value: string) {
    setSettingDrafts((current) => ({ ...current, [setting.id]: value }));
    setNotificationPolicyPreviews((current) => ({ ...current, [setting.id]: null }));
    setNotificationPolicyPreviewErrors((current) => ({ ...current, [setting.id]: '' }));
  }

  function updateSettingStatus(setting: SystemSettingItem, value: 'ACTIVE' | 'DISABLED') {
    setSettingStatuses((current) => ({ ...current, [setting.id]: value }));
    setNotificationPolicyPreviews((current) => ({ ...current, [setting.id]: null }));
    setNotificationPolicyPreviewErrors((current) => ({ ...current, [setting.id]: '' }));
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href="/settings">
              <ArrowLeft className="size-4" />
              系统设置
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">通知策略</StatusBadge>
            <StatusBadge tone={canManageSettings ? 'healthy' : 'planned'}>{canManageSettings ? '可编辑' : '只读'}</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">通知策略配置</h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/settings/notification-policy/snapshots">
            <History className="size-4" />
            版本快照
          </Link>
        </Button>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />)}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <Card className="grid gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">通知策略参数</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">保存前可预览变更影响，高影响策略由后端进入安全审批。</p>
            </div>
            <StatusBadge tone="planned">NOTIFICATION</StatusBadge>
          </div>
          {notificationSettingsQuery.isError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">通知策略参数加载失败。</div>
          ) : notificationSettingsQuery.isLoading ? (
            <div className="grid gap-3">
              {Array.from({ length: 4 }).map((_, index) => <div className="h-36 rounded-md border bg-muted/30" key={index} />)}
            </div>
          ) : notificationSettings.length === 0 ? (
            <EmptyState description="当前租户暂无通知策略参数。" title="暂无通知策略" />
          ) : (
            <div className="grid gap-3">
              {notificationSettings.map((setting) => (
                <SystemSettingCard
                  canManage={canManageSettings}
                  draftValue={settingDrafts[setting.id] ?? formatSettingDraftValue(setting)}
                  error={settingErrors[setting.id]}
                  isPending={updateSettingMutation.isPending && updateSettingMutation.variables?.setting.id === setting.id}
                  key={setting.id}
                  preview={notificationPolicyPreviews[setting.id]}
                  previewError={notificationPolicyPreviewErrors[setting.id]}
                  previewLoading={previewNotificationPolicyMutation.isPending && previewNotificationPolicyMutation.variables?.setting.id === setting.id}
                  setting={setting}
                  statusValue={settingStatuses[setting.id] ?? (setting.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE')}
                  success={settingSuccessId === setting.id}
                  successMessage="通知策略已保存，高影响变更会按后端审批规则生效。"
                  onDraftChange={(value) => updateSettingDraft(setting, value)}
                  onPreview={() => previewSetting(setting)}
                  onReset={() => setResetSettingTarget(setting)}
                  onSave={() => submitSetting(setting)}
                  onStatusChange={(value) => updateSettingStatus(setting, value)}
                />
              ))}
            </div>
          )}
        </Card>

        <Card className="h-fit p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BellRing className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">通知策略审计</h2>
            </div>
            {audit ? <StatusBadge tone="planned">近 7 天</StatusBadge> : null}
          </div>
          <NotificationPolicyAuditPanel audit={audit} isError={notificationPolicyAuditQuery.isError} isLoading={notificationPolicyAuditQuery.isLoading} />
          <Button asChild className="mt-4 w-full" variant="outline">
            <Link href="/settings/notification-policy/snapshots">
              查看快照和回滚
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </Card>
      </section>

      {resetSettingTarget ? (
        <ConfirmDialog
          body={`这会把 ${resetSettingTarget.name} 恢复为默认值，并重新启用该参数。`}
          confirmLabel="恢复默认"
          pending={resetSettingMutation.isPending}
          title="恢复默认参数？"
          onCancel={() => setResetSettingTarget(null)}
          onConfirm={() => resetSettingMutation.mutate(resetSettingTarget.id)}
        />
      ) : null}
    </main>
  );
}

function NotificationPolicyAuditPanel({
  audit,
  isError,
  isLoading,
}: {
  audit?: NotificationPolicyAuditOverview;
  isError: boolean;
  isLoading: boolean;
}) {
  if (isError) {
    return <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">通知策略审计加载失败。</div>;
  }

  if (isLoading) {
    return <p className="mt-3 text-sm text-muted-foreground">正在加载审计记录...</p>;
  }

  if (!audit || audit.recent_changes.length === 0) {
    return <p className="mt-3 text-sm leading-6 text-muted-foreground">近 7 天暂无通知策略变更记录。</p>;
  }

  return (
    <div className="mt-3 grid gap-3">
      <div className="grid grid-cols-3 gap-2 text-sm">
        <DetailRow label="变更次数" value={`${audit.summary.change_count}`} />
        <DetailRow label="成功" value={`${audit.summary.success_count}`} />
        <DetailRow label="失败" value={`${audit.summary.failed_count}`} />
      </div>
      <div className="grid gap-2">
        {audit.recent_changes.slice(0, 8).map((item) => (
          <div className="rounded-md border bg-background px-3 py-2 text-xs" key={item.id}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{notificationPolicySettingLabel(item.setting_key)}</span>
              <StatusBadge tone={item.status_code >= 400 ? 'unavailable' : 'healthy'}>{item.status_code}</StatusBadge>
            </div>
            <div className="mt-1 text-muted-foreground">
              {item.user_name ?? item.user_email ?? '系统'} · {formatDateTime(item.occurred_at)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
