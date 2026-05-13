'use client';

import type {
  SecurityOperationAlertNotificationArchiveApprovalItem,
  SecurityOperationAlertNotificationArchiveItem,
  SecurityOperationAlertNotificationArchiveListResult,
  SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalItem,
  SecurityOperationAlertNotificationTaskRecoveryAuditArchiveItem,
  SecurityOperationAlertNotificationTaskRecoveryAuditArchiveListResult,
  SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalItem,
  SecurityOperationAlertSlaDeadLetterAuditArchiveItem,
  SecurityOperationAlertSlaDeadLetterAuditArchiveListResult,
} from '@aiaget/shared-types';
import { hasPermission } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, ArrowRight, Download, FileArchive, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { SecurityPolicyBackground } from '@/components/security/security-policy-background';
import {
  LoadingRows,
  PageError,
  RefreshButton,
  SecurityConfirmDialog,
  SecurityWorkspaceHeader,
  approvalStatusLabel,
  approvalStatusTone,
  formatBytes,
  formatDateTime,
  formatNumber,
} from '@/components/security/security-page-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  deleteSecurityOperationAlertNotificationArchive,
  deleteSecurityOperationAlertNotificationTaskRecoveryAuditArchive,
  deleteSecurityOperationAlertSlaDeadLetterAuditArchive,
  getSecurityOperationAlertNotificationArchiveApprovalOverview,
  getSecurityOperationAlertNotificationArchiveDownloadUrl,
  getSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalOverview,
  getSecurityOperationAlertNotificationTaskRecoveryAuditArchiveDownloadUrl,
  getSecurityOperationAlertSlaDeadLetterAuditArchiveApprovalOverview,
  getSecurityOperationAlertSlaDeadLetterAuditArchiveDownloadUrl,
  listSecurityOperationAlertNotificationArchiveApprovals,
  listSecurityOperationAlertNotificationArchives,
  listSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovals,
  listSecurityOperationAlertNotificationTaskRecoveryAuditArchives,
  listSecurityOperationAlertSlaDeadLetterAuditArchiveApprovals,
  listSecurityOperationAlertSlaDeadLetterAuditArchives,
  type ApiClientError,
} from '@/lib/api-client';

type ArchiveSource = 'notifications' | 'recovery' | 'sla';

type ArchiveItem =
  | SecurityOperationAlertNotificationArchiveItem
  | SecurityOperationAlertNotificationTaskRecoveryAuditArchiveItem
  | SecurityOperationAlertSlaDeadLetterAuditArchiveItem;

type ArchiveListResult =
  | SecurityOperationAlertNotificationArchiveListResult
  | SecurityOperationAlertNotificationTaskRecoveryAuditArchiveListResult
  | SecurityOperationAlertSlaDeadLetterAuditArchiveListResult;

type ArchiveApprovalItem =
  | SecurityOperationAlertNotificationArchiveApprovalItem
  | SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalItem
  | SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalItem;

type NotificationArchiveFilterContext = Pick<
  SecurityOperationAlertNotificationArchiveItem,
  'status_filter' | 'alert_category' | 'alert_category_label' | 'keyword'
>;

type NotificationArchiveApprovalFilterContext = Pick<
  SecurityOperationAlertNotificationArchiveApprovalItem,
  'status_filter' | 'alert_category' | 'alert_category_label' | 'keyword'
>;

type NotificationArchiveFieldLedgerContext = Pick<
  SecurityOperationAlertNotificationArchiveItem,
  'has_export_field_ledger' | 'exported_field_count' | 'notification_archive_filter_field_count'
>;

type NotificationArchiveApprovalFieldLedgerContext = Pick<
  SecurityOperationAlertNotificationArchiveApprovalItem,
  'has_export_field_ledger' | 'exported_field_count' | 'notification_archive_filter_field_count'
>;

type ArchiveDeleteTarget = {
  archiveId: string;
  fileName: string;
  source: ArchiveSource;
  sourceLabel: string;
};

const archiveSources: Array<{
  value: ArchiveSource;
  label: string;
  description: string;
  queryKey: string;
}> = [
  {
    value: 'notifications',
    label: '告警通知归档',
    description: '安全运营告警通知投递结果和通知审计 CSV。',
    queryKey: 'security-archive-governance-notification',
  },
  {
    value: 'recovery',
    label: '自愈审计归档',
    description: '通知任务自愈建议、恢复动作和处理审计归档。',
    queryKey: 'security-archive-governance-recovery',
  },
  {
    value: 'sla',
    label: 'SLA 死信归档',
    description: 'SLA 自动升级失败、死信处置和补偿审计归档。',
    queryKey: 'security-archive-governance-sla',
  },
];
const archiveSourceByValue = archiveSources.reduce(
  (acc, source) => {
    acc[source.value] = source;
    return acc;
  },
  {} as Record<ArchiveSource, (typeof archiveSources)[number]>,
);
const notificationArchiveStatusLabels = {
  SENT: '已发送',
  PARTIAL: '部分成功',
  SKIPPED: '已跳过',
  FAILED: '失败',
} as const;
const notificationArchiveCategoryFallbackLabels = {
  CUSTOMER_SUCCESS_CLOSE_WON_REPORT_ARCHIVE_DELETE: '客户成功复盘归档删除',
} as const;

export function SecurityArchivesContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [activeSource, setActiveSource] = useState<ArchiveSource>('notifications');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [archiveDeleteTarget, setArchiveDeleteTarget] = useState<ArchiveDeleteTarget | null>(null);

  const permissions = currentUser?.user.permissions ?? [];
  const isTenantAdmin = Boolean(currentUser?.user.roles.some((role) => role.code === 'tenant_admin'));
  const canViewApprovals = isTenantAdmin || hasPermission(permissions, 'security:approval:view');
  const canHandleApprovals = isTenantAdmin || hasPermission(permissions, 'security:approval:handle');

  const notificationArchivesQuery = useQuery({
    enabled: canViewApprovals,
    queryKey: ['security-archive-governance-notification-archives'],
    queryFn: listSecurityOperationAlertNotificationArchives,
  });
  const recoveryArchivesQuery = useQuery({
    enabled: canViewApprovals,
    queryKey: ['security-archive-governance-recovery-archives'],
    queryFn: listSecurityOperationAlertNotificationTaskRecoveryAuditArchives,
  });
  const slaArchivesQuery = useQuery({
    enabled: canViewApprovals,
    queryKey: ['security-archive-governance-sla-archives'],
    queryFn: listSecurityOperationAlertSlaDeadLetterAuditArchives,
  });

  const notificationApprovalOverviewQuery = useQuery({
    enabled: canViewApprovals,
    queryKey: ['security-archive-governance-notification-approval-overview'],
    queryFn: getSecurityOperationAlertNotificationArchiveApprovalOverview,
  });
  const recoveryApprovalOverviewQuery = useQuery({
    enabled: canViewApprovals,
    queryKey: ['security-archive-governance-recovery-approval-overview'],
    queryFn: getSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalOverview,
  });
  const slaApprovalOverviewQuery = useQuery({
    enabled: canViewApprovals,
    queryKey: ['security-archive-governance-sla-approval-overview'],
    queryFn: getSecurityOperationAlertSlaDeadLetterAuditArchiveApprovalOverview,
  });

  const notificationApprovalsQuery = useQuery({
    enabled: canViewApprovals,
    queryKey: ['security-archive-governance-notification-approvals'],
    queryFn: listSecurityOperationAlertNotificationArchiveApprovals,
  });
  const recoveryApprovalsQuery = useQuery({
    enabled: canViewApprovals,
    queryKey: ['security-archive-governance-recovery-approvals'],
    queryFn: listSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovals,
  });
  const slaApprovalsQuery = useQuery({
    enabled: canViewApprovals,
    queryKey: ['security-archive-governance-sla-approvals'],
    queryFn: listSecurityOperationAlertSlaDeadLetterAuditArchiveApprovals,
  });

  const activeMeta = archiveSourceByValue[activeSource];
  const activeArchivesQuery = {
    notifications: notificationArchivesQuery,
    recovery: recoveryArchivesQuery,
    sla: slaArchivesQuery,
  }[activeSource];
  const activeApprovalsQuery = {
    notifications: notificationApprovalsQuery,
    recovery: recoveryApprovalsQuery,
    sla: slaApprovalsQuery,
  }[activeSource];
  const activeApprovalOverviewQuery = {
    notifications: notificationApprovalOverviewQuery,
    recovery: recoveryApprovalOverviewQuery,
    sla: slaApprovalOverviewQuery,
  }[activeSource];

  const allArchiveQueries = [notificationArchivesQuery, recoveryArchivesQuery, slaArchivesQuery];
  const allApprovalQueries = [notificationApprovalsQuery, recoveryApprovalsQuery, slaApprovalsQuery];
  const allApprovalOverviewQueries = [
    notificationApprovalOverviewQuery,
    recoveryApprovalOverviewQuery,
    slaApprovalOverviewQuery,
  ];
  const anyFetching = [...allArchiveQueries, ...allApprovalQueries, ...allApprovalOverviewQueries].some(
    (query) => query.isFetching,
  );

  const sourceSummaries = useMemo(
    () => ({
      notifications: buildSourceSummary(notificationArchivesQuery.data, notificationApprovalsQuery.data),
      recovery: buildSourceSummary(recoveryArchivesQuery.data, recoveryApprovalsQuery.data),
      sla: buildSourceSummary(slaArchivesQuery.data, slaApprovalsQuery.data),
    }),
    [
      notificationArchivesQuery.data,
      notificationApprovalsQuery.data,
      recoveryArchivesQuery.data,
      recoveryApprovalsQuery.data,
      slaArchivesQuery.data,
      slaApprovalsQuery.data,
    ],
  );

  const activeArchives = activeArchivesQuery.data?.items ?? [];
  const activeApprovals = activeApprovalsQuery.data ?? [];
  const activeSummary = sourceSummaries[activeSource];
  const activeApprovalOverview = activeApprovalOverviewQuery.data;

  const downloadMutation = useMutation({
    mutationFn: ({ archiveId, source }: { archiveId: string; source: ArchiveSource }) => {
      if (source === 'notifications') return getSecurityOperationAlertNotificationArchiveDownloadUrl(archiveId);
      if (source === 'recovery') return getSecurityOperationAlertNotificationTaskRecoveryAuditArchiveDownloadUrl(archiveId);
      return getSecurityOperationAlertSlaDeadLetterAuditArchiveDownloadUrl(archiveId);
    },
    onSuccess: (result) => {
      setActionError(null);
      setActionNotice('下载链接已生成，文件将在新窗口打开。');
      window.open(result.url, '_blank', 'noopener,noreferrer');
    },
    onError: (error: ApiClientError) => {
      setActionNotice(null);
      setActionError(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ archiveId, source }: { archiveId: string; source: ArchiveSource }) => {
      if (source === 'notifications') return deleteSecurityOperationAlertNotificationArchive(archiveId);
      if (source === 'recovery') return deleteSecurityOperationAlertNotificationTaskRecoveryAuditArchive(archiveId);
      return deleteSecurityOperationAlertSlaDeadLetterAuditArchive(archiveId);
    },
    onSuccess: async (result) => {
      setActionError(null);
      setArchiveDeleteTarget(null);
      setActionNotice(`归档删除已提交审批，审批 ID：${result.approval_id}。`);
      await invalidateArchiveQueries(queryClient);
    },
    onError: (error: ApiClientError) => {
      setActionNotice(null);
      setActionError(error.message);
    },
  });

  function refreshAll() {
    for (const query of [...allArchiveQueries, ...allApprovalQueries, ...allApprovalOverviewQueries]) {
      void query.refetch();
    }
  }

  function confirmArchiveDelete() {
    if (!archiveDeleteTarget) return;
    deleteMutation.mutate({ archiveId: archiveDeleteTarget.archiveId, source: archiveDeleteTarget.source });
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <SecurityPolicyBackground />

      <SecurityWorkspaceHeader
        actions={
          <>
            <RefreshButton loading={anyFetching} onClick={refreshAll} />
            <Button asChild variant="outline">
              <Link href="/approvals/archive-deletions">
                <ArrowRight className="size-4" />
                删除审批
              </Link>
            </Button>
          </>
        }
        badge="归档"
        description="告警通知、自愈审计、SLA 死信。"
        title="归档治理"
      />

      {!canViewApprovals ? (
        <PageError>当前账号无安全审批查看权限，归档治理需要 security:approval:view 或租户管理员角色。</PageError>
      ) : null}
      {canViewApprovals && !canHandleApprovals ? (
        <PageError>当前账号可查看归档和删除审批，但审批处理入口保持只读。</PageError>
      ) : null}
      {actionNotice ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {actionNotice}
        </div>
      ) : null}
      {actionError ? <PageError>{actionError}</PageError> : null}

      <section className="grid gap-3 md:grid-cols-3">
        {archiveSources.map((source) => {
          const summary = sourceSummaries[source.value];
          const selected = activeSource === source.value;

          return (
            <button
              className={`rounded-lg border bg-background/80 p-4 text-left shadow-sm transition hover:border-primary/40 hover:bg-muted/20 ${
                selected ? 'border-primary/50 ring-2 ring-primary/10' : ''
              }`}
              key={source.value}
              onClick={() => setActiveSource(source.value)}
              type="button"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileArchive className="size-4 text-muted-foreground" />
                  <span className="font-medium">{source.label}</span>
                </div>
                <StatusBadge tone={summary.pendingCount > 0 ? 'degraded' : 'healthy'}>
                  待审 {formatNumber(summary.pendingCount)}
                </StatusBadge>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{source.description}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span>文件 {formatNumber(summary.archiveCount)}</span>
                <span>容量 {formatBytes(summary.totalSizeBytes)}</span>
              </div>
            </button>
          );
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard helper={activeMeta.label} label="归档文件" value={formatNumber(activeSummary.archiveCount)} />
        <MetricCard helper="对象存储容量" label="归档容量" value={formatBytes(activeSummary.totalSizeBytes)} />
        <MetricCard
          helper="等待审批处理"
          label="删除待审"
          value={formatNumber(activeApprovalOverview?.pending_count ?? activeSummary.pendingCount)}
        />
        <MetricCard
          helper="审批通过并已应用"
          label="删除生效"
          value={formatNumber(activeApprovalOverview?.applied_count ?? activeSummary.appliedCount)}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="min-w-0 overflow-hidden">
          <div className="border-b p-5">
            <div className="flex items-center gap-2">
              <Archive className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">{activeMeta.label}</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">删除申请进入审批。</p>
          </div>
          {!canViewApprovals ? (
            <EmptyState description="需要 security:approval:view 或租户管理员角色。" title="无权查看归档文件" />
          ) : activeArchivesQuery.isError ? (
            <div className="p-4">
              <PageError>归档文件加载失败。</PageError>
            </div>
          ) : activeArchivesQuery.isLoading ? (
            <LoadingRows count={5} />
          ) : activeArchives.length === 0 ? (
            <EmptyState description="暂无归档文件。" title="暂无归档文件" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {['文件', '目录', '大小', '更新时间', '操作'].map((column) => (
                      <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeArchives.map((archive) => (
                    <ArchiveRow
                      archive={archive}
                      canDelete={canHandleApprovals}
                      deleting={deleteMutation.isPending}
                      downloading={downloadMutation.isPending}
                      key={archive.id}
                      onDelete={() =>
                        setArchiveDeleteTarget({
                          archiveId: archive.id,
                          fileName: archive.file_name,
                          source: activeSource,
                          sourceLabel: activeMeta.label,
                        })
                      }
                      onDownload={() => downloadMutation.mutate({ archiveId: archive.id, source: activeSource })}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <div className="border-b p-5">
            <div className="flex items-center gap-2">
              <Trash2 className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">删除审批</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">来源、申请人、处理状态。</p>
          </div>
          {!canViewApprovals ? (
            <EmptyState description="需要 security:approval:view 或租户管理员角色。" title="无权查看删除审批" />
          ) : activeApprovalsQuery.isError ? (
            <div className="p-4">
              <PageError>删除审批加载失败。</PageError>
            </div>
          ) : activeApprovalsQuery.isLoading ? (
            <LoadingRows count={5} />
          ) : activeApprovals.length === 0 ? (
            <EmptyState description="暂无归档删除审批。" title="暂无删除审批" />
          ) : (
            <div className="divide-y">
              {activeApprovals.map((approval) => (
                <ApprovalRow approval={approval} canHandle={canHandleApprovals} key={approval.id} />
              ))}
            </div>
          )}
        </Card>
      </section>
      {archiveDeleteTarget ? (
        <SecurityConfirmDialog
          body={`确认申请删除归档「${archiveDeleteTarget.fileName}」？该文件属于${archiveDeleteTarget.sourceLabel}，操作会进入删除审批流程，审批通过后才会清理对象存储文件。`}
          confirmLabel="确认申请"
          onCancel={() => setArchiveDeleteTarget(null)}
          onConfirm={confirmArchiveDelete}
          pending={deleteMutation.isPending}
          title="确认申请删除归档"
        />
      ) : null}
    </main>
  );
}

function ArchiveRow({
  archive,
  canDelete,
  deleting,
  downloading,
  onDelete,
  onDownload,
}: {
  archive: ArchiveItem;
  canDelete: boolean;
  deleting: boolean;
  downloading: boolean;
  onDelete: () => void;
  onDownload: () => void;
}) {
  const filterSummary = archiveFilterSummary(archive);
  const fieldLedgerSummary = archiveFieldLedgerSummary(archive);

  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-3">
        <div className="font-medium">{archive.file_name}</div>
        <div className="mt-1 max-w-[360px] truncate font-mono text-xs text-muted-foreground">{archive.key}</div>
        <div className="mt-1 text-xs text-muted-foreground">ETag：{archive.etag ?? '暂无'}</div>
        {filterSummary.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {filterSummary.map((item) => (
              <span className="rounded-md border bg-muted/30 px-2 py-1 text-xs text-muted-foreground" key={item.label}>
                {item.label}：{item.value}
              </span>
            ))}
          </div>
        ) : null}
        {fieldLedgerSummary.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {fieldLedgerSummary.map((item) => (
              <span className="rounded-md border border-primary/20 bg-primary/5 px-2 py-1 text-xs text-primary" key={item.label}>
                {item.label}：{item.value}
              </span>
            ))}
          </div>
        ) : null}
      </td>
      <td className="px-4 py-3 text-muted-foreground">{archive.folder}</td>
      <td className="px-4 py-3 text-muted-foreground">{formatBytes(archive.size_bytes)}</td>
      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(archive.last_modified)}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <Button disabled={downloading} onClick={onDownload} size="sm" type="button" variant="outline">
            <Download className="size-4" />
            下载
          </Button>
          <Button disabled={!canDelete || deleting} onClick={onDelete} size="sm" type="button" variant="outline">
            <Trash2 className="size-4" />
            申请删除
          </Button>
        </div>
      </td>
    </tr>
  );
}

function ApprovalRow({
  approval,
  canHandle,
}: {
  approval: ArchiveApprovalItem;
  canHandle: boolean;
}) {
  const filterSummary = archiveFilterSummary(approval);
  const fieldLedgerSummary = archiveFieldLedgerSummary(approval);

  return (
    <div className="grid gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={approvalStatusTone(approval.status)}>{approvalStatusLabel(approval.status)}</StatusBadge>
            {!canHandle ? <StatusBadge tone="planned">只读</StatusBadge> : null}
            <span className="font-medium">{approval.archive_file_name}</span>
          </div>
          <div className="mt-1 max-w-full truncate font-mono text-xs text-muted-foreground">{approval.archive_key}</div>
        </div>
        <div className="text-sm text-muted-foreground">{formatBytes(approval.archive_size_bytes)}</div>
      </div>
      <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
        <span>申请人：{approval.requested_by?.name ?? '系统'}</span>
        <span>审批人：{approval.reviewed_by?.name ?? '暂无'}</span>
        <span>申请时间：{formatDateTime(approval.requested_at)}</span>
        <span>审批时间：{formatDateTime(approval.reviewed_at)}</span>
      </div>
      {filterSummary.length > 0 ? (
        <div className="grid gap-2 rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground md:grid-cols-3">
          {filterSummary.map((item) => (
            <span key={item.label}>{item.label}：{item.value}</span>
          ))}
        </div>
      ) : null}
      {fieldLedgerSummary.length > 0 ? (
        <div className="grid gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary md:grid-cols-3">
          {fieldLedgerSummary.map((item) => (
            <span key={item.label}>{item.label}：{item.value}</span>
          ))}
        </div>
      ) : null}
      {approval.reason ? <p className="rounded-md bg-muted/30 px-3 py-2 text-sm text-muted-foreground">{approval.reason}</p> : null}
    </div>
  );
}

function archiveFieldLedgerSummary(item: ArchiveItem | ArchiveApprovalItem) {
  if (!hasNotificationArchiveFieldLedgerContext(item) || !item.has_export_field_ledger) return [];

  return [
    { label: '通知归档字段账本', value: '已保留' },
    item.exported_field_count > 0 ? { label: '导出字段', value: `${formatNumber(item.exported_field_count)} 项` } : null,
    item.notification_archive_filter_field_count > 0
      ? { label: '归档筛选字段', value: `${formatNumber(item.notification_archive_filter_field_count)} 项` }
      : null,
  ].filter((entry): entry is { label: string; value: string } => Boolean(entry));
}

function archiveFilterSummary(item: ArchiveItem | ArchiveApprovalItem) {
  if (!hasNotificationArchiveFilterContext(item)) return [];

  const sourceLabel = item.alert_category_label || notificationArchiveCategoryLabel(item.alert_category);
  const statusLabel = item.status_filter ? notificationArchiveStatusLabels[item.status_filter] : null;

  return [
    sourceLabel ? { label: '筛选来源', value: sourceLabel } : null,
    item.status_filter && statusLabel ? { label: '筛选状态', value: statusLabel } : null,
    item.keyword ? { label: '筛选关键词', value: item.keyword } : null,
  ].filter((entry): entry is { label: string; value: string } => Boolean(entry));
}

function hasNotificationArchiveFilterContext(
  item: ArchiveItem | ArchiveApprovalItem,
): item is (ArchiveItem & NotificationArchiveFilterContext) | (ArchiveApprovalItem & NotificationArchiveApprovalFilterContext) {
  return 'status_filter' in item || 'alert_category_label' in item || 'keyword' in item;
}

function hasNotificationArchiveFieldLedgerContext(
  item: ArchiveItem | ArchiveApprovalItem,
): item is
  | (ArchiveItem & NotificationArchiveFieldLedgerContext)
  | (ArchiveApprovalItem & NotificationArchiveApprovalFieldLedgerContext) {
  return 'has_export_field_ledger' in item;
}

function notificationArchiveCategoryLabel(value: string | null) {
  if (!value) return null;
  return notificationArchiveCategoryFallbackLabels[value as keyof typeof notificationArchiveCategoryFallbackLabels] ?? value;
}

function buildSourceSummary(archives: ArchiveListResult | undefined, approvals: ArchiveApprovalItem[] | undefined) {
  return {
    archiveCount: archives?.summary.archive_count ?? archives?.items.length ?? 0,
    totalSizeBytes: archives?.summary.total_size_bytes ?? 0,
    pendingCount: approvals?.filter((approval) => approval.status === 'PENDING').length ?? 0,
    appliedCount: approvals?.filter((approval) => approval.status === 'APPLIED').length ?? 0,
  };
}

async function invalidateArchiveQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['security-archive-governance-notification-archives'] }),
    queryClient.invalidateQueries({ queryKey: ['security-archive-governance-recovery-archives'] }),
    queryClient.invalidateQueries({ queryKey: ['security-archive-governance-sla-archives'] }),
    queryClient.invalidateQueries({ queryKey: ['security-archive-governance-notification-approval-overview'] }),
    queryClient.invalidateQueries({ queryKey: ['security-archive-governance-recovery-approval-overview'] }),
    queryClient.invalidateQueries({ queryKey: ['security-archive-governance-sla-approval-overview'] }),
    queryClient.invalidateQueries({ queryKey: ['security-archive-governance-notification-approvals'] }),
    queryClient.invalidateQueries({ queryKey: ['security-archive-governance-recovery-approvals'] }),
    queryClient.invalidateQueries({ queryKey: ['security-archive-governance-sla-approvals'] }),
  ]);
}
