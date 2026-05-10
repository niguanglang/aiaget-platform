'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AgentTeamRunReportArchiveApprovalItem,
  ApprovalAuditArchiveApprovalDetail,
  ApprovalAuditArchiveApprovalItem,
  CustomerSuccessOpportunityCloseWonReportArchiveApprovalItem,
  SecurityOperationAlertNotificationStatus,
  SecurityOperationAlertNotificationArchiveApprovalItem,
  SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalItem,
  SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalItem,
} from '@aiaget/shared-types';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import {
  ApprovalAuditTimeline,
  ApprovalPageShell,
  archiveApprovalLabel,
  archiveApprovalTone,
  CardSection,
  DecisionActions,
  DetailRow,
  EmptyApprovalSelection,
  ErrorBanner,
  formatBytes,
  formatDateTime,
  LoadingBlock,
  useApprovalCanHandle,
} from '@/components/approvals/approval-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  approveAgentTeamRunReportArchiveApproval,
  approveApprovalAuditArchiveApproval,
  approveCustomerSuccessOpportunityCloseWonReportArchiveApproval,
  approveSecurityOperationAlertNotificationArchiveApproval,
  approveSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApproval,
  approveSecurityOperationAlertSlaDeadLetterAuditArchiveApproval,
  getApprovalAuditArchiveApproval,
  getApprovalAuditArchiveApprovalOverview,
  listAgentTeamRunReportArchiveApprovals,
  listApprovalAuditArchiveApprovals,
  listCustomerSuccessOpportunityCloseWonReportArchiveApprovals,
  listSecurityOperationAlertNotificationArchiveApprovals,
  listSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovals,
  listSecurityOperationAlertSlaDeadLetterAuditArchiveApprovals,
  rejectAgentTeamRunReportArchiveApproval,
  rejectApprovalAuditArchiveApproval,
  rejectCustomerSuccessOpportunityCloseWonReportArchiveApproval,
  rejectSecurityOperationAlertNotificationArchiveApproval,
  rejectSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApproval,
  rejectSecurityOperationAlertSlaDeadLetterAuditArchiveApproval,
} from '@/lib/api-client';

type ArchiveSource = 'APPROVAL_AUDIT' | 'OPERATION_ALERT' | 'RECOVERY_AUDIT' | 'SLA_DEAD_LETTER' | 'AGENT_TEAM_REPORT' | 'CUSTOMER_SUCCESS_REPORT';
type NotificationArchiveFilterFields = {
  status_filter?: SecurityOperationAlertNotificationStatus | null;
  alert_category?: string | null;
  alert_category_label?: string | null;
  keyword?: string | null;
};
type ArchiveApprovalItem = {
  id: string;
  source: ArchiveSource;
  sourceLabel: string;
  archiveId: string;
  archiveKey: string;
  archiveFileName: string;
  archiveSizeBytes: number;
  status: ApprovalAuditArchiveApprovalItem['status'];
  reason: string | null;
  statusFilter: SecurityOperationAlertNotificationStatus | null;
  alertCategory: string | null;
  alertCategoryLabel: string | null;
  keyword: string | null;
  requestedBy: { name: string; email: string } | null;
  reviewedBy: { name: string; email: string } | null;
  requestedAt: string;
  reviewedAt: string | null;
};

const sourceOptions: Array<{ label: string; value: ArchiveSource | '' }> = [
  { label: '全部来源', value: '' },
  { label: '审批审计归档', value: 'APPROVAL_AUDIT' },
  { label: '安全告警归档', value: 'OPERATION_ALERT' },
  { label: '自愈恢复审计', value: 'RECOVERY_AUDIT' },
  { label: 'SLA 死信审计', value: 'SLA_DEAD_LETTER' },
  { label: 'Agent 团队报告', value: 'AGENT_TEAM_REPORT' },
  { label: '客户成功复盘', value: 'CUSTOMER_SUCCESS_REPORT' },
];
const notificationArchiveStatusLabels = {
  SENT: '已发送',
  PARTIAL: '部分成功',
  SKIPPED: '已跳过',
  FAILED: '失败',
} as const;
const notificationArchiveCategoryFallbackLabels: Record<string, string> = {
  CUSTOMER_SUCCESS_CLOSE_WON_REPORT_ARCHIVE_DELETE: '客户成功复盘归档删除',
};

export function ArchiveDeletionApprovalsContent() {
  const queryClient = useQueryClient();
  const canWrite = useApprovalCanHandle();
  const [sourceFilter, setSourceFilter] = useState<ArchiveSource | ''>('');
  const [selectedApproval, setSelectedApproval] = useState<ArchiveApprovalItem | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const overviewQuery = useQuery({
    queryKey: ['approval-audit-archive-approval-overview'],
    queryFn: getApprovalAuditArchiveApprovalOverview,
  });
  const approvalAuditQuery = useQuery({
    queryKey: ['approval-audit-archive-approvals'],
    queryFn: listApprovalAuditArchiveApprovals,
  });
  const operationAlertQuery = useQuery({
    queryKey: ['security-operation-alert-notification-archive-approvals'],
    queryFn: listSecurityOperationAlertNotificationArchiveApprovals,
  });
  const recoveryAuditQuery = useQuery({
    queryKey: ['security-operation-alert-notification-task-recovery-audit-archive-approvals'],
    queryFn: listSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovals,
  });
  const slaDeadLetterQuery = useQuery({
    queryKey: ['security-operation-alert-sla-dead-letter-audit-archive-approvals'],
    queryFn: listSecurityOperationAlertSlaDeadLetterAuditArchiveApprovals,
  });
  const agentTeamReportQuery = useQuery({
    queryKey: ['agent-team-run-report-archive-approvals'],
    queryFn: listAgentTeamRunReportArchiveApprovals,
  });
  const customerSuccessReportQuery = useQuery({
    queryKey: ['customer-success-close-won-report-archive-approvals'],
    queryFn: listCustomerSuccessOpportunityCloseWonReportArchiveApprovals,
  });

  const approvals = useMemo(() => {
    const items = [
      ...(approvalAuditQuery.data ?? []).map((item) => toArchiveApprovalItem(item, 'APPROVAL_AUDIT', '审批审计归档')),
      ...(operationAlertQuery.data ?? []).map((item) => toArchiveApprovalItem(item, 'OPERATION_ALERT', '安全告警归档')),
      ...(recoveryAuditQuery.data ?? []).map((item) => toArchiveApprovalItem(item, 'RECOVERY_AUDIT', '自愈恢复审计')),
      ...(slaDeadLetterQuery.data ?? []).map((item) => toArchiveApprovalItem(item, 'SLA_DEAD_LETTER', 'SLA 死信审计')),
      ...(agentTeamReportQuery.data ?? []).map((item) => toArchiveApprovalItem(item, 'AGENT_TEAM_REPORT', 'Agent 团队报告')),
      ...(customerSuccessReportQuery.data ?? []).map((item) => toArchiveApprovalItem(item, 'CUSTOMER_SUCCESS_REPORT', '客户成功复盘')),
    ];

    return items.sort((left, right) => new Date(right.requestedAt).getTime() - new Date(left.requestedAt).getTime());
  }, [agentTeamReportQuery.data, approvalAuditQuery.data, customerSuccessReportQuery.data, operationAlertQuery.data, recoveryAuditQuery.data, slaDeadLetterQuery.data]);
  const visibleApprovals = sourceFilter ? approvals.filter((item) => item.source === sourceFilter) : approvals;
  const activeApproval = selectedApproval ?? visibleApprovals[0] ?? null;

  const selectedApprovalAuditDetailQuery = useQuery({
    enabled: activeApproval?.source === 'APPROVAL_AUDIT',
    queryKey: ['approval-audit-archive-approval', activeApproval?.id],
    queryFn: () => getApprovalAuditArchiveApproval(activeApproval?.id ?? ''),
  });

  useEffect(() => {
    setDecisionNote('');
    setActionError(null);
  }, [activeApproval?.id]);

  useEffect(() => {
    if (selectedApproval && sourceFilter && selectedApproval.source !== sourceFilter) {
      setSelectedApproval(null);
    }
  }, [selectedApproval, sourceFilter]);

  const approveMutation = useMutation({
    mutationFn: (approval: ArchiveApprovalItem) => approveArchiveApproval(approval, decisionNote.trim() || null),
    onSuccess: async () => {
      await invalidateArchiveApprovalQueries(queryClient);
      setDecisionNote('');
      setActionError(null);
    },
    onError: (error) => setActionError(error.message),
  });
  const rejectMutation = useMutation({
    mutationFn: (approval: ArchiveApprovalItem) => rejectArchiveApproval(approval, decisionNote.trim() || null),
    onSuccess: async () => {
      await invalidateArchiveApprovalQueries(queryClient);
      setDecisionNote('');
      setActionError(null);
    },
    onError: (error) => setActionError(error.message),
  });

  const pendingCount = approvals.filter((item) => item.status === 'PENDING').length;
  const approvedCount = approvals.filter((item) => item.status === 'APPROVED').length;
  const rejectedCount = approvals.filter((item) => item.status === 'REJECTED').length;
  const appliedCount = approvals.filter((item) => item.status === 'APPLIED').length;
  const loading =
    approvalAuditQuery.isLoading ||
    operationAlertQuery.isLoading ||
    recoveryAuditQuery.isLoading ||
    slaDeadLetterQuery.isLoading ||
    agentTeamReportQuery.isLoading ||
    customerSuccessReportQuery.isLoading;
  const hasError =
    approvalAuditQuery.isError ||
    operationAlertQuery.isError ||
    recoveryAuditQuery.isError ||
    slaDeadLetterQuery.isError ||
    agentTeamReportQuery.isError ||
    customerSuccessReportQuery.isError ||
    overviewQuery.isError;

  return (
    <ApprovalPageShell>
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href="/approvals">
              <ArrowLeft className="size-4" />
              审批中心
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">归档删除审批</StatusBadge>
            <StatusBadge tone={canWrite ? 'healthy' : 'planned'}>{canWrite ? '可处理' : '查看模式'}</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">归档删除审批</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            汇总审批审计、安全死信、自愈恢复审计和 Agent 团队报告归档删除审批，删除类操作批准后才会生效。
          </p>
        </div>
        <Button
          onClick={() => {
            void overviewQuery.refetch();
            void approvalAuditQuery.refetch();
            void operationAlertQuery.refetch();
            void recoveryAuditQuery.refetch();
            void slaDeadLetterQuery.refetch();
            void agentTeamReportQuery.refetch();
            void customerSuccessReportQuery.refetch();
            void selectedApprovalAuditDetailQuery.refetch();
          }}
          type="button"
          variant="outline"
        >
          <RefreshCw className="size-4" />
          刷新数据
        </Button>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard helper="全部删除来源" label="待审批" value={`${pendingCount || overviewQuery.data?.pending_count || 0}`} />
        <MetricCard helper="等待生效或已决策" label="已通过" value={`${approvedCount || overviewQuery.data?.approved_count || 0}`} />
        <MetricCard helper="保留归档" label="已拒绝" value={`${rejectedCount || overviewQuery.data?.rejected_count || 0}`} />
        <MetricCard helper="对象已删除" label="已生效" value={`${appliedCount || overviewQuery.data?.applied_count || 0}`} />
        <MetricCard helper="当前筛选" label="显示条目" value={`${visibleApprovals.length}`} />
      </section>

      <ErrorBanner message={actionError ?? (hasError ? '部分归档删除审批加载失败，请刷新或进入来源页面查看。' : null)} />

      <section className="grid min-w-0 gap-4 xl:grid-cols-[1.12fr_0.88fr]">
        <CardSection description="按来源查看不同归档删除审批，支持在同一页面完成基础处理。" title="归档删除审批队列">
          <div className="grid gap-2 border-b p-4 md:grid-cols-[220px_auto]">
            <select
              className="h-9 rounded-md border bg-background/80 px-3 text-sm"
              onChange={(event) => setSourceFilter(event.target.value as ArchiveSource | '')}
              value={sourceFilter}
            >
              {sourceOptions.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="flex h-9 items-center rounded-md border bg-muted/25 px-3 text-sm text-muted-foreground">
              审批审计 / 安全告警 / 自愈恢复 / SLA 死信 / Agent 团队报告 / 客户成功复盘
            </div>
          </div>
          {loading ? (
            <LoadingBlock>正在加载归档删除审批...</LoadingBlock>
          ) : visibleApprovals.length === 0 ? (
            <EmptyState description="当前来源下没有归档删除审批。" title="暂无归档删除审批" />
          ) : (
            <ArchiveDeletionApprovalTable approvals={visibleApprovals} onSelect={setSelectedApproval} />
          )}
        </CardSection>

        <ArchiveDeletionApprovalDetailPanel
          activeApproval={activeApproval}
          canWrite={canWrite}
          decisionNote={decisionNote}
          detail={selectedApprovalAuditDetailQuery.data ?? null}
          detailLoading={selectedApprovalAuditDetailQuery.isLoading}
          onApprove={(approval) => approveMutation.mutate(approval)}
          onChangeDecisionNote={setDecisionNote}
          onReject={(approval) => rejectMutation.mutate(approval)}
          pending={approveMutation.isPending || rejectMutation.isPending}
        />
      </section>
    </ApprovalPageShell>
  );
}

function ArchiveDeletionApprovalTable({
  approvals,
  onSelect,
}: {
  approvals: ArchiveApprovalItem[];
  onSelect: (approval: ArchiveApprovalItem) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            {['时间', '来源', '归档文件', '审批状态', '申请人', '对象路径', '原因'].map((column) => (
              <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {approvals.map((approval) => (
            <tr
              className="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/25"
              key={`${approval.source}:${approval.id}`}
              onClick={() => onSelect(approval)}
            >
              <td className="px-4 py-3 text-muted-foreground">{formatDateTime(approval.requestedAt)}</td>
              <td className="px-4 py-3">
                <StatusBadge tone="planned">{approval.sourceLabel}</StatusBadge>
              </td>
              <td className="px-4 py-3">
                <div className="font-medium">{approval.archiveFileName}</div>
                <div className="text-xs text-muted-foreground">{formatBytes(approval.archiveSizeBytes)}</div>
                <ArchiveFilterSummary approval={approval} compact />
              </td>
              <td className="px-4 py-3">
                <StatusBadge tone={archiveApprovalTone(approval.status)}>{archiveApprovalLabel(approval.status)}</StatusBadge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{approval.requestedBy?.email ?? '-'}</td>
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{approval.archiveKey}</td>
              <td className="px-4 py-3">
                <div className="line-clamp-1 text-muted-foreground">{approval.reason ?? '归档删除审批'}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ArchiveDeletionApprovalDetailPanel({
  activeApproval,
  canWrite,
  decisionNote,
  detail,
  detailLoading,
  onApprove,
  onChangeDecisionNote,
  onReject,
  pending,
}: {
  activeApproval: ArchiveApprovalItem | null;
  canWrite: boolean;
  decisionNote: string;
  detail: ApprovalAuditArchiveApprovalDetail | null;
  detailLoading: boolean;
  onApprove: (approval: ArchiveApprovalItem) => void;
  onChangeDecisionNote: (value: string) => void;
  onReject: (approval: ArchiveApprovalItem) => void;
  pending: boolean;
}) {
  return (
    <Card className="grid gap-4 p-5">
      <div>
        <h2 className="text-sm font-semibold">归档删除审批详情</h2>
        <p className="mt-1 text-sm text-muted-foreground">删除归档属于高危操作，批准后才会从对象存储移除文件。</p>
      </div>

      {!activeApproval ? (
        <EmptyApprovalSelection description="从左侧选择一条归档删除审批查看详情。" title="未选择审批请求" />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={archiveApprovalTone(activeApproval.status)}>{archiveApprovalLabel(activeApproval.status)}</StatusBadge>
            <StatusBadge tone="degraded">高危删除</StatusBadge>
            <StatusBadge tone="planned">{activeApproval.sourceLabel}</StatusBadge>
          </div>

          <div className="grid gap-3 text-sm">
            <DetailRow label="归档文件" value={activeApproval.archiveFileName} />
            <DetailRow label="对象路径" value={activeApproval.archiveKey} />
            <DetailRow label="文件大小" value={formatBytes(activeApproval.archiveSizeBytes)} />
            <DetailRow label="申请人" value={activeApproval.requestedBy ? `${activeApproval.requestedBy.name} (${activeApproval.requestedBy.email})` : '-'} />
            <DetailRow label="审批人" value={activeApproval.reviewedBy ? `${activeApproval.reviewedBy.name} (${activeApproval.reviewedBy.email})` : '-'} />
            <DetailRow label="申请时间" value={formatDateTime(activeApproval.requestedAt)} />
            <DetailRow label="审批时间" value={formatDateTime(activeApproval.reviewedAt)} />
          </div>

          {activeApproval.reason ? (
            <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">申请原因：</span>
              {activeApproval.reason}
            </div>
          ) : null}

          <ArchiveFilterSummary approval={activeApproval} />

          <div className="grid gap-3 rounded-lg border border-border/70 bg-muted/15 p-3">
            <div className="text-sm font-medium">上下文入口</div>
            <div className="flex flex-wrap gap-2">
              {activeApproval.source === 'APPROVAL_AUDIT' ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/approval-audits/events/${activeApproval.id}`}>打开审批审计</Link>
                </Button>
              ) : null}
              {activeApproval.source === 'OPERATION_ALERT' ? (
                <Button asChild size="sm" variant="outline">
                  <Link href="/security/alerts">打开安全告警</Link>
                </Button>
              ) : null}
              {activeApproval.source === 'RECOVERY_AUDIT' ? (
                <Button asChild size="sm" variant="outline">
                  <Link href="/security/recovery">打开自愈恢复</Link>
                </Button>
              ) : null}
              {activeApproval.source === 'SLA_DEAD_LETTER' ? (
                <Button asChild size="sm" variant="outline">
                  <Link href="/security/alerts">打开 SLA 死信</Link>
                </Button>
              ) : null}
              {activeApproval.source === 'AGENT_TEAM_REPORT' ? (
                <Button asChild size="sm" variant="outline">
                  <Link href="/agent-teams/report-archives">打开报告归档</Link>
                </Button>
              ) : null}
              {activeApproval.source === 'CUSTOMER_SUCCESS_REPORT' ? (
                <Button asChild size="sm" variant="outline">
                  <Link href="/customer-success-opportunities">打开续约机会</Link>
                </Button>
              ) : null}
              <Button asChild size="sm" variant="outline">
                <Link href="/storage">打开文件存储</Link>
              </Button>
            </div>
          </div>

          {activeApproval.source === 'APPROVAL_AUDIT' && detailLoading ? (
            <div className="rounded-lg border bg-muted/20 px-4 py-8 text-sm text-muted-foreground">正在加载审批审计归档详情...</div>
          ) : detail?.audit_timeline ? (
            <ApprovalAuditTimeline events={detail.audit_timeline} />
          ) : (
            <div className="rounded-md border bg-muted/15 px-3 py-3 text-sm text-muted-foreground">
              当前来源仅提供列表级归档删除审批数据，可在对应来源页面查看完整审计上下文。
            </div>
          )}

          <DecisionActions
            approveLabel="批准删除"
            canWrite={canWrite}
            decisionNote={decisionNote}
            disabled={activeApproval.status !== 'PENDING'}
            onApprove={() => onApprove(activeApproval)}
            onChangeDecisionNote={onChangeDecisionNote}
            onReject={() => onReject(activeApproval)}
            pending={pending}
            placeholder="补充审批备注，例如删除原因确认、保留要求或拒绝原因..."
            rejectLabel="拒绝删除"
          />
        </>
      )}
    </Card>
  );
}

function toArchiveApprovalItem(
  item:
    | ApprovalAuditArchiveApprovalItem
    | SecurityOperationAlertNotificationArchiveApprovalItem
    | SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalItem
    | SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalItem
    | AgentTeamRunReportArchiveApprovalItem
    | CustomerSuccessOpportunityCloseWonReportArchiveApprovalItem,
  source: ArchiveSource,
  sourceLabel: string,
): ArchiveApprovalItem {
  return {
    id: item.id,
    source,
    sourceLabel,
    archiveId: item.archive_id,
    archiveKey: item.archive_key,
    archiveFileName: item.archive_file_name,
    archiveSizeBytes: item.archive_size_bytes,
    status: item.status,
    reason: item.reason,
    ...archiveApprovalFilterContext(item),
    requestedBy: item.requested_by,
    reviewedBy: item.reviewed_by,
    requestedAt: item.requested_at,
    reviewedAt: item.reviewed_at,
  };
}

function ArchiveFilterSummary({ approval, compact = false }: { approval: ArchiveApprovalItem; compact?: boolean }) {
  const items = archiveFilterSummary(approval);
  if (items.length === 0) return null;

  if (compact) {
    return (
      <div className="mt-2 flex max-w-[320px] flex-wrap gap-1.5">
        {items.map((item) => (
          <span className="rounded-md border bg-muted/30 px-2 py-1 text-xs text-muted-foreground" key={item.label}>
            {item.label}：{item.value}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-2 rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground md:grid-cols-3">
      {items.map((item) => (
        <span key={item.label}>{item.label}：{item.value}</span>
      ))}
    </div>
  );
}

function archiveFilterSummary(approval: ArchiveApprovalItem) {
  const statusLabel = approval.statusFilter ? notificationArchiveStatusLabels[approval.statusFilter] : null;
  const sourceLabel = approval.alertCategoryLabel ?? notificationArchiveCategoryLabel(approval.alertCategory);
  return [
    sourceLabel ? { label: '筛选来源', value: sourceLabel } : null,
    statusLabel ? { label: '筛选状态', value: statusLabel } : null,
    approval.keyword ? { label: '筛选关键词', value: approval.keyword } : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));
}

function notificationArchiveCategoryLabel(category: string | null) {
  if (!category) return null;
  return notificationArchiveCategoryFallbackLabels[category] ?? category;
}

function archiveApprovalFilterContext(
  item:
    | ApprovalAuditArchiveApprovalItem
    | SecurityOperationAlertNotificationArchiveApprovalItem
    | SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalItem
    | SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalItem
    | AgentTeamRunReportArchiveApprovalItem
    | CustomerSuccessOpportunityCloseWonReportArchiveApprovalItem,
) {
  const filter = item as NotificationArchiveFilterFields;
  return {
    statusFilter: filter.status_filter ?? null,
    alertCategory: filter.alert_category ?? null,
    alertCategoryLabel: filter.alert_category_label ?? null,
    keyword: filter.keyword ?? null,
  };
}

function approveArchiveApproval(approval: ArchiveApprovalItem, decisionNote: string | null) {
  const input = { decision_note: decisionNote };

  if (approval.source === 'OPERATION_ALERT') {
    return approveSecurityOperationAlertNotificationArchiveApproval(approval.id, input);
  }
  if (approval.source === 'RECOVERY_AUDIT') {
    return approveSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApproval(approval.id, input);
  }
  if (approval.source === 'SLA_DEAD_LETTER') {
    return approveSecurityOperationAlertSlaDeadLetterAuditArchiveApproval(approval.id, input);
  }
  if (approval.source === 'AGENT_TEAM_REPORT') {
    return approveAgentTeamRunReportArchiveApproval(approval.id, input);
  }
  if (approval.source === 'CUSTOMER_SUCCESS_REPORT') {
    return approveCustomerSuccessOpportunityCloseWonReportArchiveApproval(approval.id, input);
  }
  return approveApprovalAuditArchiveApproval(approval.id, input);
}

function rejectArchiveApproval(approval: ArchiveApprovalItem, decisionNote: string | null) {
  const input = { decision_note: decisionNote };

  if (approval.source === 'OPERATION_ALERT') {
    return rejectSecurityOperationAlertNotificationArchiveApproval(approval.id, input);
  }
  if (approval.source === 'RECOVERY_AUDIT') {
    return rejectSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApproval(approval.id, input);
  }
  if (approval.source === 'SLA_DEAD_LETTER') {
    return rejectSecurityOperationAlertSlaDeadLetterAuditArchiveApproval(approval.id, input);
  }
  if (approval.source === 'AGENT_TEAM_REPORT') {
    return rejectAgentTeamRunReportArchiveApproval(approval.id, input);
  }
  if (approval.source === 'CUSTOMER_SUCCESS_REPORT') {
    return rejectCustomerSuccessOpportunityCloseWonReportArchiveApproval(approval.id, input);
  }
  return rejectApprovalAuditArchiveApproval(approval.id, input);
}

function invalidateArchiveApprovalQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['approval-audit-archive-approval-overview'] }),
    queryClient.invalidateQueries({ queryKey: ['approval-audit-archive-approvals'] }),
    queryClient.invalidateQueries({ queryKey: ['approval-audit-archives'] }),
    queryClient.invalidateQueries({ queryKey: ['approval-audit-overview'] }),
    queryClient.invalidateQueries({ queryKey: ['security-operation-alert-notification-archive-approvals'] }),
    queryClient.invalidateQueries({ queryKey: ['security-operation-alert-notification-task-recovery-audit-archive-approvals'] }),
    queryClient.invalidateQueries({ queryKey: ['security-operation-alert-sla-dead-letter-audit-archive-approvals'] }),
    queryClient.invalidateQueries({ queryKey: ['agent-team-run-report-archive-approvals'] }),
    queryClient.invalidateQueries({ queryKey: ['agent-team-run-report-archives'] }),
    queryClient.invalidateQueries({ queryKey: ['customer-success-close-won-report-archive-approvals'] }),
    queryClient.invalidateQueries({ queryKey: ['customer-success-opportunity-close-won-report-archives'] }),
    queryClient.invalidateQueries({ queryKey: ['security-center-overview'] }),
  ]);
}
