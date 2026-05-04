'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  type ApprovalAuditArchiveApprovalDetail,
  type ApprovalAuditArchiveApprovalItem,
  type ApprovalAuditEventItem,
  type ApprovalAuditArchiveApprovalStatus,
  hasPermission,
  type SystemSettingSnapshotApprovalStatus,
  type SystemSettingSnapshotItem,
  type ToolApprovalStatus,
  type ToolCallTriggerSource,
} from '@aiaget/shared-types';
import { motion } from 'motion/react';
import { Archive, CheckCheck, GitBranch, Search, Settings2, ShieldAlert, Wrench, X } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import {
  approvalStatusLabel,
  approvalStatusTone,
  executionStatusLabel,
  executionStatusTone,
  formatDateTime,
  formatLatency,
  triggerSourceLabel,
} from '@/components/approvals/approval-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  ApiClientError,
  approveNotificationPolicyApproval,
  approveApprovalAuditArchiveApproval,
  approveToolApproval,
  getApprovalAuditArchiveApproval,
  getApprovalAuditArchiveApprovalOverview,
  getNotificationPolicyApproval,
  getNotificationPolicyApprovalOverview,
  getToolApproval,
  getToolApprovalOverview,
  listApprovalAuditArchiveApprovals,
  listNotificationPolicyApprovals,
  listToolApprovals,
  rejectApprovalAuditArchiveApproval,
  rejectNotificationPolicyApproval,
  rejectToolApproval,
} from '@/lib/api-client';

const approvalStatuses: ToolApprovalStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];
const notificationApprovalStatuses: SystemSettingSnapshotApprovalStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];
const triggerSources: ToolCallTriggerSource[] = ['TEST', 'RUNTIME'];
type ApprovalType = 'TOOL' | 'NOTIFICATION_POLICY' | 'ARCHIVE_DELETE';

export function ApprovalContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();
  const [approvalType, setApprovalType] = useState<ApprovalType>('TOOL');
  const [keyword, setKeyword] = useState('');
  const [statusValue, setStatusValue] = useState<ToolApprovalStatus | ''>('PENDING');
  const [notificationStatusValue, setNotificationStatusValue] = useState<SystemSettingSnapshotApprovalStatus | ''>('PENDING');
  const [triggerSource, setTriggerSource] = useState<ToolCallTriggerSource | ''>('');
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);
  const [selectedNotificationApprovalId, setSelectedNotificationApprovalId] = useState<string | null>(null);
  const [selectedArchiveApprovalId, setSelectedArchiveApprovalId] = useState<string | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'security:approval:handle'),
  );

  const overviewQuery = useQuery({
    queryKey: ['tool-approval-overview'],
    queryFn: getToolApprovalOverview,
  });

  const notificationOverviewQuery = useQuery({
    queryKey: ['notification-policy-approval-overview'],
    queryFn: getNotificationPolicyApprovalOverview,
  });

  const archiveApprovalOverviewQuery = useQuery({
    queryKey: ['approval-audit-archive-approval-overview'],
    queryFn: getApprovalAuditArchiveApprovalOverview,
  });

  const approvalsQuery = useQuery({
    enabled: approvalType === 'TOOL',
    queryKey: ['tool-approvals', keyword, statusValue, triggerSource],
    queryFn: () =>
      listToolApprovals({
        page: 1,
        page_size: 40,
        keyword,
        status: statusValue || undefined,
        trigger_source: triggerSource || undefined,
      }),
  });

  const notificationApprovalsQuery = useQuery({
    enabled: approvalType === 'NOTIFICATION_POLICY',
    queryKey: ['notification-policy-approvals', keyword, notificationStatusValue],
    queryFn: () =>
      listNotificationPolicyApprovals({
        page: 1,
        page_size: 40,
        keyword,
        status: notificationStatusValue || undefined,
      }),
  });

  const archiveApprovalsQuery = useQuery({
    enabled: approvalType === 'ARCHIVE_DELETE',
    queryKey: ['approval-audit-archive-approvals'],
    queryFn: listApprovalAuditArchiveApprovals,
  });

  const approvals = approvalsQuery.data?.items ?? [];
  const notificationApprovals = notificationApprovalsQuery.data?.items ?? [];
  const archiveApprovals = archiveApprovalsQuery.data ?? [];
  const requestedApprovalId = searchParams.get('requestId');
  const requestedType = searchParams.get('type');
  const activeApprovalId = selectedApprovalId ?? requestedApprovalId ?? approvals[0]?.id ?? null;
  const activeNotificationApprovalId =
    selectedNotificationApprovalId ??
    (requestedType === 'notification-policy' ? requestedApprovalId : null) ??
    notificationApprovals[0]?.id ??
    null;
  const activeArchiveApprovalId = selectedArchiveApprovalId ?? archiveApprovals[0]?.id ?? null;

  const selectedApprovalQuery = useQuery({
    enabled: approvalType === 'TOOL' && Boolean(activeApprovalId),
    queryKey: ['tool-approval', activeApprovalId],
    queryFn: () => getToolApproval(activeApprovalId ?? ''),
  });

  const selectedNotificationApprovalQuery = useQuery({
    enabled: approvalType === 'NOTIFICATION_POLICY' && Boolean(activeNotificationApprovalId),
    queryKey: ['notification-policy-approval', activeNotificationApprovalId],
    queryFn: () => getNotificationPolicyApproval(activeNotificationApprovalId ?? ''),
  });

  const selectedArchiveApprovalQuery = useQuery({
    enabled: approvalType === 'ARCHIVE_DELETE' && Boolean(activeArchiveApprovalId),
    queryKey: ['approval-audit-archive-approval', activeArchiveApprovalId],
    queryFn: () => getApprovalAuditArchiveApproval(activeArchiveApprovalId ?? ''),
  });

  useEffect(() => {
    setDecisionNote('');
    setActionError(null);
  }, [activeApprovalId, activeArchiveApprovalId, activeNotificationApprovalId, approvalType]);

  const metrics = useMemo(() => {
    if (approvalType === 'ARCHIVE_DELETE') {
      const overview = archiveApprovalOverviewQuery.data;
      if (!overview) return [];

      return [
        { label: '待审批', value: `${overview.pending_count}`, helper: '归档删除' },
        { label: '已通过', value: `${overview.approved_count}`, helper: '等待生效或已决策' },
        { label: '已拒绝', value: `${overview.rejected_count}`, helper: '保留归档' },
        { label: '已生效', value: `${overview.applied_count}`, helper: '对象已删除' },
      ];
    }

    if (approvalType === 'NOTIFICATION_POLICY') {
      const overview = notificationOverviewQuery.data;
      if (!overview) return [];

      return [
        { label: '待审批', value: `${overview.pending_count}`, helper: '策略队列' },
        { label: '已通过', value: `${overview.approved_count}`, helper: '累计记录' },
        { label: '已拒绝', value: `${overview.rejected_count}`, helper: '累计记录' },
        { label: '高影响待审', value: `${overview.high_impact_pending_count}`, helper: '需安全决策' },
      ];
    }

    const overview = overviewQuery.data;
    if (!overview) return [];

    return [
      { label: '待审批', value: `${overview.pending_count}`, helper: '当前队列' },
      { label: '已通过', value: `${overview.approved_count}`, helper: '累计记录' },
      { label: '已拒绝', value: `${overview.rejected_count}`, helper: '累计记录' },
      { label: '运行时待审批', value: `${overview.runtime_pending_count}`, helper: '会话触发' },
      { label: '测试待审批', value: `${overview.test_pending_count}`, helper: '工具测试' },
    ];
  }, [approvalType, archiveApprovalOverviewQuery.data, notificationOverviewQuery.data, overviewQuery.data]);

  const approveMutation = useMutation({
    mutationFn: (approvalId: string) => approveToolApproval(approvalId, { decision_note: decisionNote.trim() || null }),
    onSuccess: async (detail) => {
      queryClient.setQueryData(['tool-approval', detail.id], detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tool-approval-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['tool-approvals'] }),
        queryClient.invalidateQueries({ queryKey: ['tool'] }),
        queryClient.invalidateQueries({ queryKey: ['tools'] }),
        queryClient.invalidateQueries({ queryKey: ['conversation'] }),
        queryClient.invalidateQueries({ queryKey: ['conversations'] }),
      ]);
      setDecisionNote('');
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const rejectMutation = useMutation({
    mutationFn: (approvalId: string) => rejectToolApproval(approvalId, { decision_note: decisionNote.trim() || null }),
    onSuccess: async (detail) => {
      queryClient.setQueryData(['tool-approval', detail.id], detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tool-approval-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['tool-approvals'] }),
        queryClient.invalidateQueries({ queryKey: ['tool'] }),
        queryClient.invalidateQueries({ queryKey: ['tools'] }),
        queryClient.invalidateQueries({ queryKey: ['conversation'] }),
        queryClient.invalidateQueries({ queryKey: ['conversations'] }),
      ]);
      setDecisionNote('');
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const approveNotificationMutation = useMutation({
    mutationFn: (snapshotId: string) =>
      approveNotificationPolicyApproval(snapshotId, { decision_note: decisionNote.trim() || null }),
    onSuccess: async (detail) => {
      queryClient.setQueryData(['notification-policy-approval', detail.id], detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['notification-policy-approval-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['notification-policy-approvals'] }),
        queryClient.invalidateQueries({ queryKey: ['notification-policy-snapshots'] }),
        queryClient.invalidateQueries({ queryKey: ['notification-policy-audit'] }),
        queryClient.invalidateQueries({ queryKey: ['system-settings'] }),
        queryClient.invalidateQueries({ queryKey: ['system-settings-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['security-center-overview'] }),
      ]);
      setDecisionNote('');
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const rejectNotificationMutation = useMutation({
    mutationFn: (snapshotId: string) =>
      rejectNotificationPolicyApproval(snapshotId, { decision_note: decisionNote.trim() || null }),
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
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const approveArchiveMutation = useMutation({
    mutationFn: (approvalId: string) =>
      approveApprovalAuditArchiveApproval(approvalId, { decision_note: decisionNote.trim() || null }),
    onSuccess: async (detail) => {
      queryClient.setQueryData(['approval-audit-archive-approval', detail.id], detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['approval-audit-archive-approval-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['approval-audit-archive-approvals'] }),
        queryClient.invalidateQueries({ queryKey: ['approval-audit-archives'] }),
        queryClient.invalidateQueries({ queryKey: ['approval-audit-events'] }),
        queryClient.invalidateQueries({ queryKey: ['approval-audit-overview'] }),
      ]);
      setDecisionNote('');
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const rejectArchiveMutation = useMutation({
    mutationFn: (approvalId: string) =>
      rejectApprovalAuditArchiveApproval(approvalId, { decision_note: decisionNote.trim() || null }),
    onSuccess: async (detail) => {
      queryClient.setQueryData(['approval-audit-archive-approval', detail.id], detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['approval-audit-archive-approval-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['approval-audit-archive-approvals'] }),
        queryClient.invalidateQueries({ queryKey: ['approval-audit-events'] }),
        queryClient.invalidateQueries({ queryKey: ['approval-audit-overview'] }),
      ]);
      setDecisionNote('');
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const visibleApprovalsCount =
    approvalType === 'TOOL'
      ? approvals.length
      : approvalType === 'NOTIFICATION_POLICY'
        ? notificationApprovals.length
        : archiveApprovals.length;
  const totalApprovalsCount =
    approvalType === 'TOOL'
      ? (approvalsQuery.data?.total ?? 0)
      : approvalType === 'NOTIFICATION_POLICY'
        ? (notificationApprovalsQuery.data?.total ?? 0)
        : archiveApprovals.length;
  const activeQueueQuery =
    approvalType === 'TOOL'
      ? approvalsQuery
      : approvalType === 'NOTIFICATION_POLICY'
        ? notificationApprovalsQuery
        : archiveApprovalsQuery;

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
      >
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M76</StatusBadge>
            <StatusBadge tone="healthy">真实审批</StatusBadge>
            <StatusBadge tone="planned">工具与通知策略</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">审批中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            集中处理高风险工具调用与高影响通知策略变更，覆盖测试调用、运行时调用和系统参数审批。
          </p>
        </div>
        <Button
          onClick={() => {
            void overviewQuery.refetch();
            void notificationOverviewQuery.refetch();
            void archiveApprovalOverviewQuery.refetch();
            void approvalsQuery.refetch();
            void notificationApprovalsQuery.refetch();
            void archiveApprovalsQuery.refetch();
            void selectedApprovalQuery.refetch();
            void selectedNotificationApprovalQuery.refetch();
            void selectedArchiveApprovalQuery.refetch();
          }}
          type="button"
          variant="outline"
        >
          刷新数据
        </Button>
      </motion.section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      {actionError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <section className="grid min-w-0 gap-4 xl:grid-cols-[1.12fr_0.88fr]">
        <Card className="min-w-0">
          <div className="border-b p-4">
            <div className="grid gap-4">
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                <div>
                  <h2 className="text-sm font-semibold">审批队列</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    优先处理待审批请求，查看来源、上下文、影响范围和当前执行状态。
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="inline-flex rounded-md border bg-background p-1">
                    <button
                      className={`inline-flex h-8 items-center gap-2 rounded px-3 text-sm transition-colors ${
                        approvalType === 'TOOL' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                      }`}
                      onClick={() => {
                        setApprovalType('TOOL');
                        setSelectedNotificationApprovalId(null);
                        setSelectedArchiveApprovalId(null);
                      }}
                      type="button"
                    >
                      <Wrench className="size-4" />
                      工具审批
                    </button>
                    <button
                      className={`inline-flex h-8 items-center gap-2 rounded px-3 text-sm transition-colors ${
                        approvalType === 'NOTIFICATION_POLICY'
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                      onClick={() => {
                        setApprovalType('NOTIFICATION_POLICY');
                        setSelectedApprovalId(null);
                        setSelectedArchiveApprovalId(null);
                      }}
                      type="button"
                    >
                      <Settings2 className="size-4" />
                      通知策略
                    </button>
                    <button
                      className={`inline-flex h-8 items-center gap-2 rounded px-3 text-sm transition-colors ${
                        approvalType === 'ARCHIVE_DELETE'
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                      onClick={() => {
                        setApprovalType('ARCHIVE_DELETE');
                        setSelectedApprovalId(null);
                        setSelectedNotificationApprovalId(null);
                      }}
                      type="button"
                    >
                      <Archive className="size-4" />
                      归档删除
                    </button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    显示 {visibleApprovalsCount} / {totalApprovalsCount}
                  </div>
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_140px_140px_auto]">
                <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
                  <Search className="size-4 text-muted-foreground" />
                  <input
                    className="min-w-0 flex-1 bg-transparent outline-none"
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder={
                      approvalType === 'TOOL'
                        ? '搜索工具、会话、申请人'
                        : approvalType === 'NOTIFICATION_POLICY'
                          ? '搜索策略名称、编码、影响说明'
                          : '归档删除队列暂按全部展示'
                    }
                    value={keyword}
                  />
                </label>
                {approvalType === 'TOOL' ? (
                  <>
                    <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setStatusValue(event.target.value as ToolApprovalStatus | '')} value={statusValue}>
                      <option value="">全部状态</option>
                      {approvalStatuses.map((status) => (
                        <option key={status} value={status}>
                          {approvalStatusLabel(status)}
                        </option>
                      ))}
                    </select>
                    <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setTriggerSource(event.target.value as ToolCallTriggerSource | '')} value={triggerSource}>
                      <option value="">全部来源</option>
                      {triggerSources.map((source) => (
                        <option key={source} value={source}>
                          {triggerSourceLabel(source)}
                        </option>
                      ))}
                    </select>
                  </>
                ) : approvalType === 'NOTIFICATION_POLICY' ? (
                  <>
                    <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setNotificationStatusValue(event.target.value as SystemSettingSnapshotApprovalStatus | '')} value={notificationStatusValue}>
                      <option value="">全部状态</option>
                      {notificationApprovalStatuses.map((status) => (
                        <option key={status} value={status}>
                          {snapshotApprovalLabel(status)}
                        </option>
                      ))}
                    </select>
                    <div className="flex h-9 items-center rounded-md border bg-muted/25 px-3 text-sm text-muted-foreground">
                      高影响策略
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex h-9 items-center rounded-md border bg-muted/25 px-3 text-sm text-muted-foreground">
                      归档删除
                    </div>
                    <div className="flex h-9 items-center rounded-md border bg-muted/25 px-3 text-sm text-muted-foreground">
                      审批后生效
                    </div>
                  </>
                )}
                <Button
                  onClick={() => {
                    setKeyword('');
                    setStatusValue('PENDING');
                    setNotificationStatusValue('PENDING');
                    setTriggerSource('');
                  }}
                  type="button"
                  variant="outline"
                >
                  清空
                </Button>
              </div>
            </div>
          </div>

          {activeQueueQuery.isError ? (
            <div className="p-6 text-sm text-destructive">审批列表加载失败。</div>
          ) : activeQueueQuery.isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">正在加载审批队列...</div>
          ) : visibleApprovalsCount === 0 ? (
            <EmptyState description="当前筛选条件下没有审批请求。" title="暂无审批请求" />
          ) : approvalType === 'ARCHIVE_DELETE' ? (
            <ArchiveDeleteApprovalTable
              approvals={archiveApprovals}
              onSelect={(approvalId) => setSelectedArchiveApprovalId(approvalId)}
            />
          ) : approvalType === 'NOTIFICATION_POLICY' ? (
            <NotificationPolicyApprovalTable
              approvals={notificationApprovals}
              onSelect={(snapshotId) => setSelectedNotificationApprovalId(snapshotId)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1020px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {['时间', '工具', '来源', '审批状态', '执行状态', '申请人', '上下文'].map((column) => (
                      <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {approvals.map((approval, index) => (
                    <motion.tr
                      animate={{ opacity: 1, y: 0 }}
                      className="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/25"
                      initial={{ opacity: 0, y: 8 }}
                      key={approval.id}
                      onClick={() => setSelectedApprovalId(approval.id)}
                      transition={{ delay: index * 0.02, duration: 0.22 }}
                    >
                      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(approval.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{approval.tool_name}</div>
                        <div className="text-xs text-muted-foreground">{approval.tool_code}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{triggerSourceLabel(approval.trigger_source)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={approvalStatusTone(approval.status)}>{approvalStatusLabel(approval.status)}</StatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={executionStatusTone(approval.execution_status)}>{executionStatusLabel(approval.execution_status)}</StatusBadge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{approval.requested_by?.email ?? '-'}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{approval.conversation_title ?? approval.request_url}</div>
                        <div className="line-clamp-1 text-xs text-muted-foreground">
                          {approval.agent_name ?? '无会话上下文'}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {approvalType === 'ARCHIVE_DELETE' ? (
          <ArchiveDeleteApprovalDetailPanel
            canWrite={canWrite}
            decisionNote={decisionNote}
            detail={selectedArchiveApprovalQuery.data ?? null}
            loading={selectedArchiveApprovalQuery.isLoading}
            onApprove={(approvalId) => approveArchiveMutation.mutate(approvalId)}
            onChangeDecisionNote={setDecisionNote}
            onReject={(approvalId) => rejectArchiveMutation.mutate(approvalId)}
            pending={approveArchiveMutation.isPending || rejectArchiveMutation.isPending}
          />
        ) : approvalType === 'NOTIFICATION_POLICY' ? (
          <NotificationPolicyApprovalDetailPanel
            canWrite={canWrite}
            decisionNote={decisionNote}
            detail={selectedNotificationApprovalQuery.data ?? null}
            loading={selectedNotificationApprovalQuery.isLoading}
            onApprove={(snapshotId) => approveNotificationMutation.mutate(snapshotId)}
            onChangeDecisionNote={setDecisionNote}
            onReject={(snapshotId) => rejectNotificationMutation.mutate(snapshotId)}
            pending={approveNotificationMutation.isPending || rejectNotificationMutation.isPending}
          />
        ) : (
          <ApprovalDetailPanel
            canWrite={canWrite}
            decisionNote={decisionNote}
            detail={selectedApprovalQuery.data ?? null}
            loading={selectedApprovalQuery.isLoading}
            onApprove={(approvalId) => approveMutation.mutate(approvalId)}
            onChangeDecisionNote={setDecisionNote}
            onReject={(approvalId) => rejectMutation.mutate(approvalId)}
            pending={approveMutation.isPending || rejectMutation.isPending}
          />
        )}
      </section>
    </main>
  );
}

function ApprovalDetailPanel({
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
  detail: Awaited<ReturnType<typeof getToolApproval>> | null;
  loading: boolean;
  onApprove: (approvalId: string) => void;
  onChangeDecisionNote: (value: string) => void;
  onReject: (approvalId: string) => void;
  pending: boolean;
}) {
  return (
    <Card className="grid gap-4 p-5">
      <div>
        <h2 className="text-sm font-semibold">审批详情</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          查看原始请求、执行结果和上下文后，决定是否继续执行当前工具调用。
        </p>
      </div>

      {loading ? (
        <div className="rounded-lg border bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
          正在加载审批详情...
        </div>
      ) : !detail ? (
        <EmptyState description="从左侧选择一条审批请求查看详情。" title="未选择审批请求" />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={approvalStatusTone(detail.status)}>{approvalStatusLabel(detail.status)}</StatusBadge>
            <StatusBadge tone={executionStatusTone(detail.execution_status)}>{executionStatusLabel(detail.execution_status)}</StatusBadge>
            <StatusBadge tone="planned">{triggerSourceLabel(detail.trigger_source)}</StatusBadge>
          </div>

          <div className="grid gap-3 text-sm">
            <DetailRow label="工具" value={detail.tool_name} />
            <DetailRow label="会话" value={detail.conversation_title ?? '-'} />
            <DetailRow label="智能体" value={detail.agent_name ?? '-'} />
            <DetailRow label="申请人" value={detail.requested_by ? `${detail.requested_by.name} (${detail.requested_by.email})` : '-'} />
            <DetailRow label="审批人" value={detail.reviewed_by ? `${detail.reviewed_by.name} (${detail.reviewed_by.email})` : '-'} />
            <DetailRow label="审批时间" value={formatDateTime(detail.reviewed_at)} />
            <DetailRow label="请求方法" value={detail.request_method} />
            <DetailRow label="请求地址" value={detail.request_url} />
            <DetailRow label="执行耗时" value={formatLatency(detail.latency_ms)} />
            <DetailRow label="响应状态" value={detail.response_status ? `HTTP ${detail.response_status}` : '-'} />
          </div>

          <div className="grid gap-3 rounded-lg border border-border/70 bg-muted/15 p-3">
            <div className="text-sm font-medium">上下文链接</div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={`/tools/${detail.tool_id}`}>打开工具</Link>
              </Button>
              {detail.conversation_id ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/conversations/${detail.conversation_id}`}>打开会话</Link>
                </Button>
              ) : null}
            </div>
          </div>

          {detail.reason ? (
            <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">申请原因：</span>
              {detail.reason}
            </div>
          ) : null}

          {detail.error_message ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {detail.error_message}
            </div>
          ) : null}

          <PreviewCard title="请求头" value={detail.request_headers} />
          <PreviewCard title="请求体" value={detail.request_body} />
          <PreviewCard title="响应头" value={detail.response_headers} />
          <PreviewCard title="响应体" value={detail.response_body} />
          <ApprovalAuditTimeline events={detail.audit_timeline} />

          <div className="grid gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldAlert className="size-4 text-muted-foreground" />
              审批动作
            </div>
            <textarea
              className="min-h-28 resize-y rounded-md border bg-background/80 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={!canWrite || pending || detail.status !== 'PENDING'}
              onChange={(event) => onChangeDecisionNote(event.target.value)}
              placeholder="补充审批备注，可用于说明放行原因或拒绝原因..."
              value={decisionNote}
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                disabled={!canWrite || pending || detail.status !== 'PENDING'}
                onClick={() => onApprove(detail.id)}
                type="button"
              >
                <CheckCheck className="size-4" />
                批准并执行
              </Button>
              <Button
                disabled={!canWrite || pending || detail.status !== 'PENDING'}
                onClick={() => onReject(detail.id)}
                type="button"
                variant="destructive"
              >
                <X className="size-4" />
                拒绝请求
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
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
          {approvals.map((approval, index) => (
            <motion.tr
              animate={{ opacity: 1, y: 0 }}
              className="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/25"
              initial={{ opacity: 0, y: 8 }}
              key={approval.id}
              onClick={() => onSelect(approval.id)}
              transition={{ delay: index * 0.02, duration: 0.22 }}
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
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ArchiveDeleteApprovalTable({
  approvals,
  onSelect,
}: {
  approvals: ApprovalAuditArchiveApprovalItem[];
  onSelect: (approvalId: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            {['时间', '归档文件', '审批状态', '申请人', '对象路径', '原因'].map((column) => (
              <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {approvals.map((approval, index) => (
            <motion.tr
              animate={{ opacity: 1, y: 0 }}
              className="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/25"
              initial={{ opacity: 0, y: 8 }}
              key={approval.id}
              onClick={() => onSelect(approval.id)}
              transition={{ delay: index * 0.02, duration: 0.22 }}
            >
              <td className="px-4 py-3 text-muted-foreground">{formatDateTime(approval.requested_at)}</td>
              <td className="px-4 py-3">
                <div className="font-medium">{approval.archive_file_name}</div>
                <div className="text-xs text-muted-foreground">{formatBytes(approval.archive_size_bytes)}</div>
              </td>
              <td className="px-4 py-3">
                <StatusBadge tone={archiveApprovalTone(approval.status)}>
                  {archiveApprovalLabel(approval.status)}
                </StatusBadge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{approval.requested_by?.email ?? '-'}</td>
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{approval.archive_key}</td>
              <td className="px-4 py-3">
                <div className="line-clamp-1 text-muted-foreground">{approval.reason ?? '归档删除审批'}</div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ArchiveDeleteApprovalDetailPanel({
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
  detail: ApprovalAuditArchiveApprovalDetail | null;
  loading: boolean;
  onApprove: (approvalId: string) => void;
  onChangeDecisionNote: (value: string) => void;
  onReject: (approvalId: string) => void;
  pending: boolean;
}) {
  return (
    <Card className="grid gap-4 p-5">
      <div>
        <h2 className="text-sm font-semibold">归档删除审批详情</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          删除审计归档属于高危操作，批准后才会从对象存储移除文件。
        </p>
      </div>

      {loading ? (
        <div className="rounded-lg border bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
          正在加载归档删除审批详情...
        </div>
      ) : !detail ? (
        <EmptyState description="从左侧选择一条归档删除审批查看详情。" title="未选择审批请求" />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={archiveApprovalTone(detail.status)}>{archiveApprovalLabel(detail.status)}</StatusBadge>
            <StatusBadge tone="degraded">高危删除</StatusBadge>
          </div>

          <div className="grid gap-3 text-sm">
            <DetailRow label="归档文件" value={detail.archive_file_name} />
            <DetailRow label="对象路径" value={detail.archive_key} />
            <DetailRow label="文件大小" value={formatBytes(detail.archive_size_bytes)} />
            <DetailRow label="申请人" value={detail.requested_by ? `${detail.requested_by.name} (${detail.requested_by.email})` : '-'} />
            <DetailRow label="审批人" value={detail.reviewed_by ? `${detail.reviewed_by.name} (${detail.reviewed_by.email})` : '-'} />
            <DetailRow label="申请时间" value={formatDateTime(detail.requested_at)} />
            <DetailRow label="审批时间" value={formatDateTime(detail.reviewed_at)} />
          </div>

          {detail.reason ? (
            <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">申请原因：</span>
              {detail.reason}
            </div>
          ) : null}

          <div className="grid gap-3 rounded-lg border border-border/70 bg-muted/15 p-3">
            <div className="text-sm font-medium">上下文链接</div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={`/approval-audits?eventId=${detail.id}`}>打开审批审计</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/storage">打开文件存储</Link>
              </Button>
            </div>
          </div>

          <ApprovalAuditTimeline events={detail.audit_timeline} />

          <div className="grid gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldAlert className="size-4 text-muted-foreground" />
              审批动作
            </div>
            <textarea
              className="min-h-28 resize-y rounded-md border bg-background/80 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={!canWrite || pending || detail.status !== 'PENDING'}
              onChange={(event) => onChangeDecisionNote(event.target.value)}
              placeholder="补充审批备注，例如删除原因确认、保留要求或拒绝原因..."
              value={decisionNote}
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                disabled={!canWrite || pending || detail.status !== 'PENDING'}
                onClick={() => onApprove(detail.id)}
                type="button"
              >
                <CheckCheck className="size-4" />
                批准删除
              </Button>
              <Button
                disabled={!canWrite || pending || detail.status !== 'PENDING'}
                onClick={() => onReject(detail.id)}
                type="button"
                variant="destructive"
              >
                <X className="size-4" />
                拒绝删除
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
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
        <p className="mt-1 text-sm text-muted-foreground">
          审核高影响通知策略变更，批准后才会写入系统参数并影响后台通知任务。
        </p>
      </div>

      {loading ? (
        <div className="rounded-lg border bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
          正在加载通知策略审批详情...
        </div>
      ) : !detail ? (
        <EmptyState description="从左侧选择一条通知策略审批查看详情。" title="未选择审批请求" />
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
            <DetailRow label="审批请求" value={detail.approval_request_id ?? '-'} />
            <DetailRow label="回滚来源" value={detail.rollback_from_snapshot_id ?? '-'} />
          </div>

          <div className="grid gap-3 rounded-lg border border-border/70 bg-muted/15 p-3">
            <div className="text-sm font-medium">上下文链接</div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/settings">打开设置中心</Link>
              </Button>
              {detail.rollback_from_snapshot_id ? (
                <StatusBadge tone="mock">回滚审批</StatusBadge>
              ) : (
                <StatusBadge tone="planned">参数变更</StatusBadge>
              )}
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

          <div className="grid gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldAlert className="size-4 text-muted-foreground" />
              审批动作
            </div>
            <textarea
              className="min-h-28 resize-y rounded-md border bg-background/80 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={!canWrite || pending || detail.approval_status !== 'PENDING'}
              onChange={(event) => onChangeDecisionNote(event.target.value)}
              placeholder="补充审批备注，例如影响确认、拒绝原因或观察要求..."
              value={decisionNote}
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                disabled={!canWrite || pending || detail.approval_status !== 'PENDING'}
                onClick={() => onApprove(detail.id)}
                type="button"
              >
                <CheckCheck className="size-4" />
                批准并生效
              </Button>
              <Button
                disabled={!canWrite || pending || detail.approval_status !== 'PENDING'}
                onClick={() => onReject(detail.id)}
                type="button"
                variant="destructive"
              >
                <X className="size-4" />
                拒绝变更
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

function ApprovalAuditTimeline({ events }: { events: ApprovalAuditEventItem[] }) {
  return (
    <div className="grid gap-3 rounded-lg border bg-muted/10 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <GitBranch className="size-4 text-muted-foreground" />
          审批审计时间线
        </div>
        <StatusBadge tone="planned">{events.length} 条事件</StatusBadge>
      </div>
      {events.length === 0 ? (
        <p className="rounded-md border bg-background px-3 py-3 text-sm text-muted-foreground">
          暂无审批审计事件。旧数据会在后续审批动作发生后开始生成时间线。
        </p>
      ) : (
        <div className="grid gap-3">
          {events.map((event) => (
            <div className="relative grid gap-2 rounded-md border bg-background px-3 py-3 text-sm" key={event.id}>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone={approvalAuditEventTone(event.event_status)}>
                  {approvalAuditEventStatusLabel(event.event_status)}
                </StatusBadge>
                <span className="font-medium">{event.title}</span>
                <span className="text-xs text-muted-foreground">{approvalAuditEventTypeLabel(event.event_type)}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {event.actor ? `${event.actor.name} (${event.actor.email})` : '系统'} · {formatDateTime(event.occurred_at)}
              </div>
              {event.note ? <p className="leading-6 text-muted-foreground">{event.note}</p> : null}
              <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                <span>请求 ID：{event.request_id ?? '-'}</span>
                <span>Trace ID：{event.trace_id ?? '-'}</span>
              </div>
              {event.metadata ? <PreviewCard title="事件元数据" value={event.metadata} /> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-md border bg-muted/15 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="break-words text-sm font-medium">{value}</div>
    </div>
  );
}

function notificationPolicySettingLabel(key: string) {
  const labels: Record<string, string> = {
    alert_notification_auto_retry_enabled: '告警通知自动重试开关',
    alert_notification_retry_interval_ms: '自动重试扫描间隔',
    alert_notification_retry_batch_size: '单批重试数量',
    alert_notification_max_retry_count: '最大重试次数',
    alert_notification_retry_backoff_seconds: '重试退避秒数',
    alert_notification_lookback_hours: '重试回看小时数',
    operation_alert_sla_enabled: '审批归档告警 SLA',
    operation_alert_sla_scan_interval_ms: 'SLA 扫描间隔',
    operation_alert_sla_due_minutes: 'SLA 到期分钟数',
    operation_alert_sla_warning_minutes: 'SLA 预警分钟数',
    operation_alert_sla_auto_escalate_enabled: 'SLA 超时自动升级',
    operation_alert_sla_lookback_hours: 'SLA 回看小时数',
    operation_alert_sla_subscription_policy: 'SLA 超时订阅策略',
  };

  return labels[key] ?? key;
}

function snapshotActionTone(action: SystemSettingSnapshotItem['action']) {
  if (action === 'ROLLBACK') return 'degraded';
  if (action === 'RESET') return 'mock';
  return 'planned';
}

function snapshotActionLabel(action: SystemSettingSnapshotItem['action']) {
  if (action === 'ROLLBACK') return '回滚';
  if (action === 'RESET') return '恢复默认';
  return '更新';
}

function snapshotApprovalTone(status: SystemSettingSnapshotApprovalStatus) {
  if (status === 'PENDING') return 'degraded';
  if (status === 'APPROVED') return 'healthy';
  if (status === 'REJECTED') return 'unavailable';
  if (status === 'RESERVED') return 'mock';
  return 'planned';
}

function snapshotApprovalLabel(status: SystemSettingSnapshotApprovalStatus) {
  if (status === 'PENDING') return '待审批';
  if (status === 'APPROVED') return '已通过';
  if (status === 'REJECTED') return '已拒绝';
  if (status === 'RESERVED') return '审批预留';
  return '无需审批';
}

function notificationPolicyImpactTone(level: SystemSettingSnapshotItem['impact_level']) {
  if (level === 'HIGH') return 'unavailable';
  if (level === 'MEDIUM') return 'degraded';
  return 'healthy';
}

function notificationPolicyImpactLabel(level: SystemSettingSnapshotItem['impact_level']) {
  if (level === 'HIGH') return '高影响';
  if (level === 'MEDIUM') return '中影响';
  if (level === 'LOW') return '低影响';
  return '未评估';
}

function settingStatusLabel(status: string) {
  if (status === 'ACTIVE') return '启用';
  if (status === 'DISABLED') return '停用';
  if (status === 'DELETED') return '已删除';
  return status;
}

function archiveApprovalTone(status: ApprovalAuditArchiveApprovalStatus) {
  if (status === 'PENDING') return 'degraded';
  if (status === 'REJECTED') return 'unavailable';
  return 'healthy';
}

function archiveApprovalLabel(status: ApprovalAuditArchiveApprovalStatus) {
  if (status === 'PENDING') return '待审批';
  if (status === 'APPROVED') return '已通过';
  if (status === 'REJECTED') return '已拒绝';
  return '已生效';
}

function formatBytes(value: number) {
  if (value <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function approvalAuditEventTone(status: ApprovalAuditEventItem['event_status']) {
  if (status === 'SUCCESS') return 'healthy';
  if (status === 'FAILED') return 'unavailable';
  if (status === 'WARNING') return 'degraded';
  return 'planned';
}

function approvalAuditEventStatusLabel(status: ApprovalAuditEventItem['event_status']) {
  if (status === 'SUCCESS') return '成功';
  if (status === 'FAILED') return '失败';
  if (status === 'WARNING') return '警告';
  return '信息';
}

function approvalAuditEventTypeLabel(type: ApprovalAuditEventItem['event_type']) {
  const labels: Record<ApprovalAuditEventItem['event_type'], string> = {
    REQUEST_CREATED: '请求创建',
    SUBMITTED: '提交审批',
    APPROVED: '审批通过',
    REJECTED: '审批拒绝',
    APPLIED: '变更生效',
    EXECUTION_FAILED: '执行失败',
    ARCHIVED: '归档生成',
    DOWNLOAD_URL_CREATED: '下载链接',
    DELETE_REQUESTED: '删除申请',
    DELETE_APPLIED: '删除生效',
  };

  return labels[type] ?? type;
}

function PreviewCard({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="rounded-md border bg-slate-950 p-3">
      <div className="mb-2 text-xs font-medium text-slate-300">{title}</div>
      <pre className="max-h-56 overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-100">
        {JSON.stringify(value ?? {}, null, 2)}
      </pre>
    </div>
  );
}
