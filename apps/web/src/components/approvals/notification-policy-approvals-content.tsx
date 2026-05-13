'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SystemSettingSnapshotItem, SystemSettingSnapshotApprovalStatus } from '@aiaget/shared-types';
import { ArrowLeft, RefreshCw, Search } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  ApprovalAuditTimeline,
  ApprovalPageShell,
  CardSection,
  DecisionActions,
  DetailRow,
  EmptyApprovalSelection,
  ErrorBanner,
  formatDateTime,
  LoadingBlock,
  notificationPolicyImpactLabel,
  notificationPolicyImpactTone,
  notificationPolicySettingLabel,
  PreviewCard,
  settingStatusLabel,
  snapshotActionLabel,
  snapshotActionTone,
  snapshotApprovalLabel,
  snapshotApprovalTone,
  useApprovalCanHandle,
} from '@/components/approvals/approval-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  approveNotificationPolicyApproval,
  getNotificationPolicyApproval,
  getNotificationPolicyApprovalOverview,
  listNotificationPolicyApprovals,
  rejectNotificationPolicyApproval,
} from '@/lib/api-client';

const notificationApprovalStatuses: SystemSettingSnapshotApprovalStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];

export function NotificationPolicyApprovalsContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const canWrite = useApprovalCanHandle();
  const [keyword, setKeyword] = useState('');
  const [statusValue, setStatusValue] = useState<SystemSettingSnapshotApprovalStatus | ''>('PENDING');
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const overviewQuery = useQuery({
    queryKey: ['notification-policy-approval-overview'],
    queryFn: getNotificationPolicyApprovalOverview,
  });
  const approvalsQuery = useQuery({
    queryKey: ['notification-policy-approvals', keyword, statusValue],
    queryFn: () =>
      listNotificationPolicyApprovals({
        page: 1,
        page_size: 40,
        keyword,
        status: statusValue || undefined,
      }),
  });

  const approvals = approvalsQuery.data?.items ?? [];
  const activeApprovalId = selectedApprovalId ?? searchParams.get('requestId') ?? approvals[0]?.id ?? null;

  const selectedApprovalQuery = useQuery({
    enabled: Boolean(activeApprovalId),
    queryKey: ['notification-policy-approval', activeApprovalId],
    queryFn: () => getNotificationPolicyApproval(activeApprovalId ?? ''),
  });

  useEffect(() => {
    setDecisionNote('');
    setActionError(null);
  }, [activeApprovalId]);

  const approveMutation = useMutation({
    mutationFn: (snapshotId: string) => approveNotificationPolicyApproval(snapshotId, { decision_note: decisionNote.trim() || null }),
    onSuccess: async (detail) => {
      queryClient.setQueryData(['notification-policy-approval', detail.id], detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['notification-policy-approval-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['notification-policy-approvals'] }),
        queryClient.invalidateQueries({ queryKey: ['notification-policy-snapshots'] }),
        queryClient.invalidateQueries({ queryKey: ['system-settings'] }),
        queryClient.invalidateQueries({ queryKey: ['security-center-overview'] }),
      ]);
      setDecisionNote('');
      setActionError(null);
    },
    onError: (error) => setActionError(error.message),
  });

  const rejectMutation = useMutation({
    mutationFn: (snapshotId: string) => rejectNotificationPolicyApproval(snapshotId, { decision_note: decisionNote.trim() || null }),
    onSuccess: async (detail) => {
      queryClient.setQueryData(['notification-policy-approval', detail.id], detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['notification-policy-approval-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['notification-policy-approvals'] }),
        queryClient.invalidateQueries({ queryKey: ['notification-policy-snapshots'] }),
        queryClient.invalidateQueries({ queryKey: ['security-center-overview'] }),
      ]);
      setDecisionNote('');
      setActionError(null);
    },
    onError: (error) => setActionError(error.message),
  });

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
            <StatusBadge tone="ready">通知策略审批</StatusBadge>
            <StatusBadge tone={canWrite ? 'healthy' : 'planned'}>{canWrite ? '可处理' : '查看模式'}</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">通知策略审批</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            审核高影响通知策略变更，批准后才会写入系统参数并影响后台通知任务。
          </p>
        </div>
        <Button
          onClick={() => {
            void overviewQuery.refetch();
            void approvalsQuery.refetch();
            void selectedApprovalQuery.refetch();
          }}
          type="button"
          variant="outline"
        >
          <RefreshCw className="size-4" />
          刷新数据
        </Button>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard helper="策略队列" label="待审批" value={`${overviewQuery.data?.pending_count ?? 0}`} />
        <MetricCard helper="累计记录" label="已通过" value={`${overviewQuery.data?.approved_count ?? 0}`} />
        <MetricCard helper="累计记录" label="已拒绝" value={`${overviewQuery.data?.rejected_count ?? 0}`} />
        <MetricCard helper="需安全决策" label="高影响待审" value={`${overviewQuery.data?.high_impact_pending_count ?? 0}`} />
      </section>

      <ErrorBanner message={actionError} />

      <section className="grid min-w-0 gap-4 xl:grid-cols-[1.12fr_0.88fr]">
        <CardSection description="按策略名称、编码、影响说明和审批状态筛选高影响策略变更。" title="通知策略审批队列">
          <NotificationPolicyFilters
            keyword={keyword}
            onChangeKeyword={setKeyword}
            onChangeStatus={setStatusValue}
            onReset={() => {
              setKeyword('');
              setStatusValue('PENDING');
            }}
            statusValue={statusValue}
          />
          {approvalsQuery.isError ? (
            <LoadingBlock>通知策略审批列表加载失败。</LoadingBlock>
          ) : approvalsQuery.isLoading ? (
            <LoadingBlock>正在加载通知策略审批队列...</LoadingBlock>
          ) : approvals.length === 0 ? (
            <EmptyState description="当前筛选条件下没有通知策略审批。" title="暂无通知策略审批" />
          ) : (
            <NotificationPolicyApprovalTable approvals={approvals} onSelect={setSelectedApprovalId} />
          )}
        </CardSection>

        <NotificationPolicyApprovalDetailPanel
          canWrite={canWrite}
          decisionNote={decisionNote}
          detail={selectedApprovalQuery.data ?? null}
          loading={selectedApprovalQuery.isLoading}
          onApprove={(snapshotId) => approveMutation.mutate(snapshotId)}
          onChangeDecisionNote={setDecisionNote}
          onReject={(snapshotId) => rejectMutation.mutate(snapshotId)}
          pending={approveMutation.isPending || rejectMutation.isPending}
        />
      </section>
    </ApprovalPageShell>
  );
}

function NotificationPolicyFilters({
  keyword,
  onChangeKeyword,
  onChangeStatus,
  onReset,
  statusValue,
}: {
  keyword: string;
  onChangeKeyword: (value: string) => void;
  onChangeStatus: (value: SystemSettingSnapshotApprovalStatus | '') => void;
  onReset: () => void;
  statusValue: SystemSettingSnapshotApprovalStatus | '';
}) {
  return (
    <div className="grid gap-2 border-b p-4 md:grid-cols-2 xl:grid-cols-[1fr_160px_160px_auto]">
      <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
        <Search className="size-4 text-muted-foreground" />
        <input
          className="min-w-0 flex-1 bg-transparent outline-none"
          onChange={(event) => onChangeKeyword(event.target.value)}
          placeholder="搜索策略名称、编码、影响说明"
          value={keyword}
        />
      </label>
      <select
        className="h-9 rounded-md border bg-background/80 px-3 text-sm"
        onChange={(event) => onChangeStatus(event.target.value as SystemSettingSnapshotApprovalStatus | '')}
        value={statusValue}
      >
        <option value="">全部状态</option>
        {notificationApprovalStatuses.map((status) => (
          <option key={status} value={status}>
            {snapshotApprovalLabel(status)}
          </option>
        ))}
      </select>
      <div className="flex h-9 items-center rounded-md border bg-muted/25 px-3 text-sm text-muted-foreground">高影响策略</div>
      <Button onClick={onReset} type="button" variant="outline">
        清空
      </Button>
    </div>
  );
}

function NotificationPolicyApprovalTable({
  approvals,
  onSelect,
}: {
  approvals: SystemSettingSnapshotItem[];
  onSelect: (snapshotId: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            {['时间', '策略', '动作', '审批状态', '影响', '申请人', '变更内容'].map((column) => (
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
              key={approval.id}
              onClick={() => onSelect(approval.id)}
            >
              <td className="px-4 py-3 text-muted-foreground">{formatDateTime(approval.created_at)}</td>
              <td className="px-4 py-3">
                <div className="font-medium">{approval.setting_name}</div>
                <div className="text-xs text-muted-foreground">{notificationPolicySettingLabel(approval.setting_key)}</div>
              </td>
              <td className="px-4 py-3">
                <StatusBadge tone={snapshotActionTone(approval.action)}>{snapshotActionLabel(approval.action)}</StatusBadge>
              </td>
              <td className="px-4 py-3">
                <StatusBadge tone={snapshotApprovalTone(approval.approval_status)}>
                  {snapshotApprovalLabel(approval.approval_status)}
                </StatusBadge>
              </td>
              <td className="px-4 py-3">
                {approval.impact_level ? (
                  <StatusBadge tone={notificationPolicyImpactTone(approval.impact_level)}>
                    {notificationPolicyImpactLabel(approval.impact_level)}
                  </StatusBadge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{approval.created_by?.email ?? '-'}</td>
              <td className="px-4 py-3">
                <div className="line-clamp-1 font-medium">{approval.impact_summary ?? '通知策略高影响变更审批'}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {settingStatusLabel(approval.previous_status)} → {settingStatusLabel(approval.next_status)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NotificationPolicyApprovalDetailPanel({
  canWrite,
  decisionNote,
  detail,
  loading,
  onApprove,
  onChangeDecisionNote,
  onReject,
  pending,
}: {
  canWrite: boolean;
  decisionNote: string;
  detail: SystemSettingSnapshotItem | null;
  loading: boolean;
  onApprove: (snapshotId: string) => void;
  onChangeDecisionNote: (value: string) => void;
  onReject: (snapshotId: string) => void;
  pending: boolean;
}) {
  return (
    <Card className="grid gap-4 p-5">
      <div>
        <h2 className="text-sm font-semibold">通知策略审批详情</h2>
        <p className="mt-1 text-sm text-muted-foreground">核对高影响通知策略变更，批准后才会写入系统参数。</p>
      </div>

      {loading ? (
        <div className="rounded-lg border bg-muted/20 px-4 py-8 text-sm text-muted-foreground">正在加载通知策略审批详情...</div>
      ) : !detail ? (
        <EmptyApprovalSelection description="选择一条通知策略审批。" title="未选择审批请求" />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={snapshotApprovalTone(detail.approval_status)}>
              {snapshotApprovalLabel(detail.approval_status)}
            </StatusBadge>
            <StatusBadge tone={snapshotActionTone(detail.action)}>{snapshotActionLabel(detail.action)}</StatusBadge>
            {detail.impact_level ? (
              <StatusBadge tone={notificationPolicyImpactTone(detail.impact_level)}>
                {notificationPolicyImpactLabel(detail.impact_level)}
              </StatusBadge>
            ) : null}
          </div>

          <div className="grid gap-3 text-sm">
            <DetailRow label="策略名称" value={detail.setting_name} />
            <DetailRow label="策略编码" value={detail.setting_key} />
            <DetailRow label="策略说明" value={notificationPolicySettingLabel(detail.setting_key)} />
            <DetailRow label="快照版本" value={`v${detail.version}`} />
            <DetailRow label="申请人" value={detail.created_by ? `${detail.created_by.name} (${detail.created_by.email})` : '-'} />
            <DetailRow label="申请时间" value={formatDateTime(detail.created_at)} />
            <DetailRow label="审批请求" value={detail.approval_request_id} />
            <DetailRow label="回滚来源" value={detail.rollback_from_snapshot_id} />
          </div>

          <div className="grid gap-3 rounded-lg border border-border/70 bg-muted/15 p-3">
            <div className="text-sm font-medium">上下文链接</div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/settings">打开设置中心</Link>
              </Button>
              {detail.rollback_from_snapshot_id ? <StatusBadge tone="mock">回滚审批</StatusBadge> : <StatusBadge tone="planned">参数变更</StatusBadge>}
            </div>
          </div>

          {detail.impact_summary ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <span className="font-medium">影响说明：</span>
              {detail.impact_summary}
            </div>
          ) : null}

          <div className="grid gap-3 rounded-lg border bg-muted/15 p-3">
            <div className="text-sm font-medium">状态变化</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailRow label="当前状态" value={settingStatusLabel(detail.previous_status)} />
              <DetailRow label="目标状态" value={settingStatusLabel(detail.next_status)} />
            </div>
          </div>

          <PreviewCard title="变更前值" value={detail.previous_value} />
          <PreviewCard title="变更后值" value={detail.next_value} />
          <ApprovalAuditTimeline events={detail.audit_timeline} />

          <DecisionActions
            approveLabel="批准并生效"
            canWrite={canWrite}
            decisionNote={decisionNote}
            disabled={detail.approval_status !== 'PENDING'}
            onApprove={() => onApprove(detail.id)}
            onChangeDecisionNote={onChangeDecisionNote}
            onReject={() => onReject(detail.id)}
            pending={pending}
            placeholder="补充审批备注，例如影响确认、拒绝原因或观察要求..."
            rejectLabel="拒绝变更"
          />
        </>
      )}
    </Card>
  );
}
