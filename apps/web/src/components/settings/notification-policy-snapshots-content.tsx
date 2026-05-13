'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission, type NotificationPolicySnapshotOverview, type SystemSettingSnapshotItem } from '@aiaget/shared-types';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

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
  formatSnapshotValue,
  settingStatusLabels,
  snapshotActionLabel,
  snapshotActionTone,
  snapshotApprovalLabel,
  snapshotApprovalTone,
} from '@/components/settings/settings-shared';
import { listNotificationPolicySnapshots, rollbackNotificationPolicySnapshot, type ApiClientError } from '@/lib/api-client';

export function NotificationPolicySnapshotsContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [rollbackTarget, setRollbackTarget] = useState<SystemSettingSnapshotItem | null>(null);
  const [rollbackError, setRollbackError] = useState<string | null>(null);

  const permissions = currentUser?.user.permissions ?? [];
  const isTenantAdmin = Boolean(currentUser?.user.roles.some((role) => role.code === 'tenant_admin'));
  const canManageSettings = Boolean(isTenantAdmin || hasPermission(permissions, 'system:settings:manage'));

  const snapshotsQuery = useQuery({
    queryKey: ['notification-policy-snapshots'],
    queryFn: listNotificationPolicySnapshots,
  });

  const rollbackMutation = useMutation({
    mutationFn: (snapshot: SystemSettingSnapshotItem) =>
      rollbackNotificationPolicySnapshot(snapshot.id, {
        note: '设置中心手动回滚通知策略快照',
      }),
    onSuccess: async () => {
      setRollbackTarget(null);
      setRollbackError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['system-settings'] }),
        queryClient.invalidateQueries({ queryKey: ['system-settings-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['notification-policy-audit'] }),
        queryClient.invalidateQueries({ queryKey: ['notification-policy-snapshots'] }),
        queryClient.invalidateQueries({ queryKey: ['notification-policy-approval-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['notification-policy-approvals'] }),
        queryClient.invalidateQueries({ queryKey: ['security-center-overview'] }),
      ]);
    },
    onError: (error: ApiClientError) => setRollbackError(error.message),
  });

  const snapshots = snapshotsQuery.data;

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href="/settings/notification-policy">
              <ArrowLeft className="size-4" />
              通知策略配置
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">版本快照</StatusBadge>
            <StatusBadge tone={canManageSettings ? 'healthy' : 'planned'}>{canManageSettings ? '可回滚' : '只读'}</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">通知策略快照</h1>
        </div>
      </section>

      {rollbackError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{rollbackError}</div>
      ) : null}

      <SnapshotMetrics snapshots={snapshots} />

      <Card className="grid gap-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">版本记录</h2>
          {snapshots ? <StatusBadge tone="planned">审批预留</StatusBadge> : null}
        </div>
        {snapshotsQuery.isError ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">版本快照加载失败。</div>
        ) : snapshotsQuery.isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, index) => <div className="h-32 rounded-md border bg-muted/30" key={index} />)}
          </div>
        ) : !snapshots || snapshots.recent_snapshots.length === 0 ? (
          <EmptyState description="暂无通知策略版本快照，保存或恢复默认后会自动生成。" title="暂无快照" />
        ) : (
          <div className="grid gap-3">
            {snapshots.recent_snapshots.map((snapshot) => (
              <SnapshotCard
                canManage={canManageSettings}
                key={snapshot.id}
                pending={rollbackMutation.isPending && rollbackMutation.variables?.id === snapshot.id}
                snapshot={snapshot}
                onRollback={setRollbackTarget}
              />
            ))}
          </div>
        )}
      </Card>

      {rollbackTarget ? (
        <ConfirmDialog
          body={`这会把 ${rollbackTarget.setting_name} 回滚到 v${rollbackTarget.version} 变更前的值，并生成一条新的回滚快照。`}
          confirmLabel="确认回滚"
          pending={rollbackMutation.isPending}
          title="回滚通知策略？"
          onCancel={() => setRollbackTarget(null)}
          onConfirm={() => rollbackMutation.mutate(rollbackTarget)}
        />
      ) : null}
    </main>
  );
}

function SnapshotMetrics({ snapshots }: { snapshots?: NotificationPolicySnapshotOverview }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard helper="版本记录" label="快照数" value={`${snapshots?.summary.snapshot_count ?? 0}`} />
      <MetricCard helper="操作记录" label="回滚数" value={`${snapshots?.summary.rollback_count ?? 0}`} />
      <MetricCard helper="审批预留" label="预留数" value={`${snapshots?.summary.approval_reserved_count ?? 0}`} />
      <MetricCard helper="最近快照" label="最近更新" value={snapshots?.summary.latest_snapshot_at ? formatDateTime(snapshots.summary.latest_snapshot_at) : '暂无'} />
    </section>
  );
}

function SnapshotCard({
  canManage,
  pending,
  snapshot,
  onRollback,
}: {
  canManage: boolean;
  pending: boolean;
  snapshot: SystemSettingSnapshotItem;
  onRollback: (snapshot: SystemSettingSnapshotItem) => void;
}) {
  return (
    <div className="grid gap-4 rounded-md border bg-background p-4 text-sm lg:grid-cols-[1fr_220px]">
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="mock">v{snapshot.version}</StatusBadge>
          <StatusBadge tone={snapshotActionTone(snapshot.action)}>{snapshotActionLabel(snapshot.action)}</StatusBadge>
          <StatusBadge tone={snapshotApprovalTone(snapshot.approval_status)}>{snapshotApprovalLabel(snapshot.approval_status)}</StatusBadge>
        </div>
        <div>
          <div className="font-medium">{snapshot.setting_name}</div>
          <div className="mt-1 font-mono text-xs text-muted-foreground">{snapshot.setting_key}</div>
        </div>
        <div className="grid gap-2 rounded-md bg-muted/30 p-3 text-xs text-muted-foreground md:grid-cols-2">
          <div>状态：{settingStatusLabels[snapshot.previous_status]} &gt; {settingStatusLabels[snapshot.next_status]}</div>
          <div className="break-all">值：{formatSnapshotValue(snapshot.previous_value)} &gt; {formatSnapshotValue(snapshot.next_value)}</div>
        </div>
        {snapshot.impact_summary ? <p className="text-sm leading-6 text-muted-foreground">{snapshot.impact_summary}</p> : null}
      </div>
      <div className="grid content-between gap-3 rounded-md border bg-muted/15 p-3">
        <div className="grid gap-2 text-sm">
          <DetailRow label="创建人" value={snapshot.created_by?.name ?? '系统'} />
          <DetailRow label="创建时间" value={formatDateTime(snapshot.created_at)} />
          <DetailRow label="已回滚" value={`${snapshot.rollback_count} 次`} />
        </div>
        <Button disabled={!canManage || pending} onClick={() => onRollback(snapshot)} type="button" variant="outline">
          <RotateCcw className="size-4" />
          {pending ? '回滚中' : '回滚'}
        </Button>
      </div>
    </div>
  );
}
