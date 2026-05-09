'use client';

import {
  hasPermission,
  type SecurityCenterOperationalAlert,
  type SecurityApprovalWorkbenchDecision,
  type SecurityApprovalWorkbenchDetail,
  type SecurityApprovalWorkbenchRiskDomain,
  type SecurityApprovalWorkbenchStatus,
  type SecurityApprovalWorkbenchType,
  type SecurityOperationAlertAction,
  type SecurityOperationAlertNotificationStatus,
} from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardCheck, Download, Search, Send, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { SecurityPolicyBackground } from '@/components/security/security-policy-background';
import {
  LoadingRows,
  PageError,
  RefreshButton,
  SecurityConfirmDialog,
  SecurityWorkspaceHeader,
  alertStatusLabel,
  alertStatusTone,
  approvalStatusLabel,
  approvalStatusTone,
  DetailLine,
  formatDateTime,
  formatNumber,
  JsonBlock,
  notificationStatusLabel,
  notificationStatusTone,
  securityRiskLevelLabel,
  securityRiskTone,
  shortId,
  slaStatusLabel,
  slaStatusTone,
} from '@/components/security/security-page-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  getSecurityApprovalWorkbenchItem,
  getSecurityApprovalWorkbenchOverview,
  getSecurityCenterOverview,
  getSecurityOperationAlertSlaOverview,
  exportSecurityApprovalWorkbenchItems,
  listSecurityApprovalWorkbenchItems,
  listSecurityOperationAlertNotifications,
  notifySecurityOperationAlert,
  reviewSecurityApprovalWorkbenchItem,
  updateSecurityOperationAlert,
  type ApiClientError,
} from '@/lib/api-client';

const approvalTypes: Array<{ label: string; value: SecurityApprovalWorkbenchType }> = [
  { label: '工具调用审批', value: 'TOOL_CALL' },
  { label: '通知策略审批', value: 'NOTIFICATION_POLICY' },
  { label: '审批审计归档删除', value: 'APPROVAL_AUDIT_ARCHIVE_DELETE' },
  { label: '团队报告归档删除', value: 'AGENT_TEAM_RUN_REPORT_ARCHIVE_DELETE' },
  { label: '告警通知归档删除', value: 'OPERATION_ALERT_NOTIFICATION_ARCHIVE_DELETE' },
  { label: 'SLA 死信归档删除', value: 'SLA_DEAD_LETTER_AUDIT_ARCHIVE_DELETE' },
  { label: '自愈审计归档删除', value: 'NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE' },
];
const approvalStatuses: Array<{ label: string; value: SecurityApprovalWorkbenchStatus }> = [
  { label: '待审批', value: 'PENDING' },
  { label: '已批准', value: 'APPROVED' },
  { label: '已拒绝', value: 'REJECTED' },
  { label: '已生效', value: 'APPLIED' },
];
const approvalRiskDomains: Array<{ label: string; value: SecurityApprovalWorkbenchRiskDomain }> = [
  { label: '工具风险', value: 'TOOL' },
  { label: '策略风险', value: 'POLICY' },
  { label: '审计归档', value: 'AUDIT_ARCHIVE' },
  { label: '运营告警', value: 'OPERATION_ALERT' },
];
const notificationStatuses: Array<{ label: string; value: SecurityOperationAlertNotificationStatus }> = [
  { label: '已发送', value: 'SENT' },
  { label: '部分成功', value: 'PARTIAL' },
  { label: '已跳过', value: 'SKIPPED' },
  { label: '失败', value: 'FAILED' },
];

type ApprovalReviewTarget = {
  approvalId: string;
  title: string;
  decision: SecurityApprovalWorkbenchDecision;
};

type OperationAlertActionTarget =
  | {
      alertId: string;
      title: string;
      type: 'notify';
    }
  | {
      action: SecurityOperationAlertAction;
      alertId: string;
      title: string;
      type: 'update';
    };

export function SecurityAlertsContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [approvalKeyword, setApprovalKeyword] = useState('');
  const [approvalType, setApprovalType] = useState<SecurityApprovalWorkbenchType | ''>('');
  const [approvalStatus, setApprovalStatus] = useState<SecurityApprovalWorkbenchStatus | ''>('PENDING');
  const [approvalRiskDomain, setApprovalRiskDomain] = useState<SecurityApprovalWorkbenchRiskDomain | ''>('');
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [approvalReviewTarget, setApprovalReviewTarget] = useState<ApprovalReviewTarget | null>(null);
  const [approvalNotice, setApprovalNotice] = useState<string | null>(null);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<SecurityOperationAlertNotificationStatus | ''>('');
  const [notificationKeyword, setNotificationKeyword] = useState('');
  const [operationAlertActionTarget, setOperationAlertActionTarget] = useState<OperationAlertActionTarget | null>(null);
  const [operationAlertNotice, setOperationAlertNotice] = useState<string | null>(null);
  const [operationAlertError, setOperationAlertError] = useState<string | null>(null);

  const canViewApprovals = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'security:approval:view'),
  );
  const canHandleApprovals = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'security:approval:handle'),
  );
  const canHandleOperationAlerts = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'security:rule:view'),
  );

  const securityOverviewQuery = useQuery({
    queryKey: ['security-alerts-page-overview'],
    queryFn: getSecurityCenterOverview,
  });
  const approvalOverviewQuery = useQuery({
    enabled: canViewApprovals,
    queryKey: ['security-alerts-page-approval-overview'],
    queryFn: getSecurityApprovalWorkbenchOverview,
  });
  const approvalItemsQuery = useQuery({
    enabled: canViewApprovals,
    queryKey: ['security-alerts-page-approval-items', approvalKeyword, approvalType, approvalStatus, approvalRiskDomain],
    queryFn: () =>
      listSecurityApprovalWorkbenchItems({
        page: 1,
        page_size: 8,
        keyword: approvalKeyword,
        type: approvalType,
        status: approvalStatus,
        risk_domain: approvalRiskDomain,
      }),
  });
  const approvalDetailQuery = useQuery({
    enabled: canViewApprovals && Boolean(selectedApprovalId),
    queryKey: ['security-alerts-page-approval-detail', selectedApprovalId],
    queryFn: () => getSecurityApprovalWorkbenchItem(selectedApprovalId ?? ''),
  });
  const notificationQuery = useQuery({
    queryKey: ['security-alerts-page-notifications', notificationStatus, notificationKeyword],
    queryFn: () =>
      listSecurityOperationAlertNotifications({
        status: notificationStatus,
        keyword: notificationKeyword,
      }),
  });
  const slaQuery = useQuery({
    queryKey: ['security-alerts-page-sla-overview'],
    queryFn: getSecurityOperationAlertSlaOverview,
  });

  const securityOverview = securityOverviewQuery.data;
  const approvalOverview = approvalOverviewQuery.data;
  const approvalItems = approvalItemsQuery.data?.items ?? [];
  const approvalTotal = approvalItemsQuery.data?.total ?? 0;
  const selectedApproval = approvalDetailQuery.data;
  const notifications = notificationQuery.data?.items ?? [];
  const alerts = securityOverview?.approval_operations.operational_alerts ?? [];
  const slaItems = slaQuery.data?.items ?? [];
  const approvalOperations = securityOverview?.approval_operations;
  const hasExportGovernanceRisk =
    (approvalOperations?.approval_workbench_high_risk_exports_24h ?? 0) > 0 ||
    (approvalOperations?.approval_workbench_repeated_exports_24h ?? 0) > 0 ||
    (approvalOperations?.approval_workbench_exported_records_24h ?? 0) >= 1000 ||
    (approvalOperations?.approval_workbench_exports_24h ?? 0) >= 10;

  useEffect(() => {
    if (!approvalItems.length) {
      setSelectedApprovalId(null);
      return;
    }

    if (!selectedApprovalId || !approvalItems.some((item) => item.id === selectedApprovalId)) {
      setSelectedApprovalId(approvalItems[0]?.id ?? null);
    }
  }, [approvalItems, selectedApprovalId]);

  const reviewMutation = useMutation({
    mutationFn: (target: ApprovalReviewTarget) =>
      reviewSecurityApprovalWorkbenchItem(target.approvalId, {
        decision: target.decision,
        decision_note: decisionNote.trim() || null,
      }),
    onSuccess: async (result) => {
      setApprovalError(null);
      setApprovalNotice(result.status === 'REJECTED' ? '审批已拒绝，工作台已刷新。' : '审批已通过，工作台已刷新。');
      setApprovalReviewTarget(null);
      setDecisionNote('');
      setSelectedApprovalId(result.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['security-alerts-page-approval-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['security-alerts-page-approval-items'] }),
        queryClient.invalidateQueries({ queryKey: ['security-alerts-page-approval-detail'] }),
        queryClient.invalidateQueries({ queryKey: ['security-overview-entry-approvals'] }),
        invalidateApprovalWorkbenchSourceQueries(queryClient),
      ]);
    },
    onError: (error: ApiClientError) => {
      setApprovalNotice(null);
      setApprovalError(error.message);
      setApprovalReviewTarget(null);
    },
  });

  const exportMutation = useMutation({
    mutationFn: () =>
      exportSecurityApprovalWorkbenchItems({
        keyword: approvalKeyword,
        type: approvalType,
        status: approvalStatus,
        risk_domain: approvalRiskDomain,
      }),
    onSuccess: async (blob) => {
      downloadBlob(blob, `安全审批工作台-${new Date().toISOString().slice(0, 10)}.csv`);
      setApprovalError(null);
      setApprovalNotice(`审批工作台导出完成，当前筛选命中 ${formatNumber(approvalTotal)} 条。`);
      await queryClient.invalidateQueries({ queryKey: ['security-alerts-page-overview'] });
    },
    onError: (error: ApiClientError) => {
      setApprovalNotice(null);
      setApprovalError(`审批工作台导出失败：${error.message}`);
    },
  });

  const notifyOperationAlertMutation = useMutation({
    mutationFn: (target: Extract<OperationAlertActionTarget, { type: 'notify' }>) =>
      notifySecurityOperationAlert(target.alertId, {
        channels: ['IN_APP', 'WEBHOOK'],
        note: `从安全中心告警运营页通知：${target.title}`,
      }),
    onSuccess: async (result) => {
      setOperationAlertError(null);
      setOperationAlertNotice(result.message);
      setOperationAlertActionTarget(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['security-alerts-page-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['security-alerts-page-notifications'] }),
        queryClient.invalidateQueries({ queryKey: ['security-overview-entry-center'] }),
      ]);
    },
    onError: (error: ApiClientError) => {
      setOperationAlertNotice(null);
      setOperationAlertError(`运营告警通知失败：${error.message}`);
      setOperationAlertActionTarget(null);
    },
  });

  const updateOperationAlertMutation = useMutation({
    mutationFn: (target: Extract<OperationAlertActionTarget, { type: 'update' }>) =>
      updateSecurityOperationAlert(target.alertId, {
        action: target.action,
        note: `从安全中心告警运营页${operationAlertActionLabel(target.action)}。`,
      }),
    onSuccess: async (_, target) => {
      setOperationAlertError(null);
      setOperationAlertNotice(`运营告警已${operationAlertActionLabel(target.action)}。`);
      setOperationAlertActionTarget(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['security-alerts-page-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['security-overview-entry-center'] }),
      ]);
    },
    onError: (error: ApiClientError) => {
      setOperationAlertNotice(null);
      setOperationAlertError(`运营告警状态更新失败：${error.message}`);
      setOperationAlertActionTarget(null);
    },
  });

  function openApprovalReview(target: ApprovalReviewTarget) {
    setApprovalNotice(null);
    setApprovalError(null);
    setApprovalReviewTarget(target);
  }

  function confirmApprovalReview() {
    if (!approvalReviewTarget) return;
    reviewMutation.mutate(approvalReviewTarget);
  }

  function confirmOperationAlertAction() {
    if (!operationAlertActionTarget) return;
    if (operationAlertActionTarget.type === 'notify') {
      notifyOperationAlertMutation.mutate(operationAlertActionTarget);
      return;
    }
    updateOperationAlertMutation.mutate(operationAlertActionTarget);
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <SecurityPolicyBackground />

      <SecurityWorkspaceHeader
        actions={
          <>
            <RefreshButton loading={securityOverviewQuery.isFetching || approvalOverviewQuery.isFetching || approvalItemsQuery.isFetching || notificationQuery.isFetching || slaQuery.isFetching} onClick={() => {
              void securityOverviewQuery.refetch();
              void approvalOverviewQuery.refetch();
              void approvalItemsQuery.refetch();
              void notificationQuery.refetch();
              void slaQuery.refetch();
            }} />
            <Button asChild variant="outline">
              <Link href="/security/recovery">
                <ArrowRight className="size-4" />
                自愈恢复
              </Link>
            </Button>
          </>
        }
        badge="闭环"
        description="集中查看审批工作台、运营告警、通知审计和 SLA 超时风险；审批事项可在右侧详情中查看来源、时间线并直接处理。"
        title="告警运营"
      />

      {!canViewApprovals ? (
        <PageError>当前账号无安全审批查看权限，审批工作台仅显示权限提示。</PageError>
      ) : null}
      {!canHandleApprovals && canViewApprovals ? (
        <PageError>当前账号可查看审批，但无处理权限；批准、拒绝等动作入口会保持只读。</PageError>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard helper="安全中心运营告警" label="运营告警" value={formatNumber(alerts.length)} />
        <MetricCard helper="等待处理" label="待审批" value={formatNumber(approvalOverview?.summary.pending_count)} />
        <MetricCard helper="最近通知审计" label="通知失败" value={formatNumber(notificationQuery.data?.summary.failed_count)} />
        <MetricCard helper="SLA 扫描" label="超时告警" value={formatNumber(slaQuery.data?.summary.overdue_count)} />
      </section>

      <Card className="grid gap-4 p-5">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
          <div>
            <div className="flex items-center gap-2">
              <Download className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">审批工作台导出治理</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              最近 24 小时统一审批工作台导出行为，重点识别导出量偏高、高风险筛选和短时间重复导出。
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/security/events?source=APPROVAL_WORKBENCH">
              <ArrowRight className="size-4" />
              查看导出事件
            </Link>
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard helper="24 小时导出次数" label="导出次数" value={formatNumber(approvalOperations?.approval_workbench_exports_24h)} />
          <MetricCard helper="24 小时导出审批记录" label="导出记录" value={formatNumber(approvalOperations?.approval_workbench_exported_records_24h)} />
          <MetricCard helper="待审批或归档删除筛选" label="高风险筛选" value={formatNumber(approvalOperations?.approval_workbench_high_risk_exports_24h)} />
          <MetricCard helper="同一主体重复导出" label="重复导出" value={formatNumber(approvalOperations?.approval_workbench_repeated_exports_24h)} />
        </div>
        {hasExportGovernanceRisk ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-800">
            导出治理风险：审批工作台最近 24 小时存在高风险筛选、重复导出或导出量偏高，请结合安全事件中心复核操作人、筛选条件、request_id 和 trace_id。
          </div>
        ) : (
          <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
            当前导出治理指标处于正常范围，若发生新的导出风险，运营告警会在下方进入通知和处置闭环。
          </div>
        )}
      </Card>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="min-w-0 overflow-hidden">
          <div className="border-b p-4">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">审批工作台</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">按审批类型、状态和风险域筛选安全高风险待办，选择记录后在右侧查看详情并处理。</p>
            <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
                <Search className="size-4 shrink-0 text-muted-foreground" />
                <input
                  className="min-w-0 flex-1 bg-transparent outline-none"
                  onChange={(event) => setApprovalKeyword(event.target.value)}
                  placeholder="搜索审批、目标、request_id"
                  value={approvalKeyword}
                />
              </label>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setApprovalType(event.target.value as SecurityApprovalWorkbenchType | '')} value={approvalType}>
                <option value="">全部类型</option>
                {approvalTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setApprovalStatus(event.target.value as SecurityApprovalWorkbenchStatus | '')} value={approvalStatus}>
                <option value="">全部状态</option>
                {approvalStatuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setApprovalRiskDomain(event.target.value as SecurityApprovalWorkbenchRiskDomain | '')} value={approvalRiskDomain}>
                <option value="">全部风险域</option>
                {approvalRiskDomains.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                当前筛选命中 {formatNumber(approvalTotal)} 条{approvalTotal === 0 ? '，当前筛选无结果，无法导出。' : '，导出会写入安全审计事件。'}
              </p>
              <Button
                disabled={!canViewApprovals || approvalTotal === 0 || exportMutation.isPending || approvalItemsQuery.isFetching}
                onClick={() => exportMutation.mutate()}
                size="sm"
                type="button"
                variant="outline"
              >
                <Download className="size-4" />
                {exportMutation.isPending ? '正在导出' : '导出当前筛选'}
              </Button>
            </div>
          </div>

          {approvalNotice ? <div className="mx-4 mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{approvalNotice}</div> : null}
          {approvalError ? <div className="mx-4 mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{approvalError}</div> : null}

          {!canViewApprovals ? (
            <EmptyState description="需要 security:approval:view 或租户管理员角色。" title="无权查看审批工作台" />
          ) : approvalItemsQuery.isError ? (
            <div className="p-4"><PageError>审批工作台加载失败。</PageError></div>
          ) : approvalItemsQuery.isLoading ? (
            <LoadingRows count={5} />
          ) : approvalItems.length === 0 ? (
            <EmptyState description="当前筛选下暂无审批记录。" title="暂无审批" />
          ) : (
            <div className="divide-y">
              {approvalItems.map((item) => (
                <div className={`grid gap-3 p-4 xl:grid-cols-[1fr_150px_126px] xl:items-center ${selectedApprovalId === item.id ? 'bg-primary/5' : ''}`} key={item.id}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={approvalStatusTone(item.status)}>{approvalStatusLabel(item.status)}</StatusBadge>
                      <StatusBadge tone={securityRiskTone(item.risk_level)}>{securityRiskLevelLabel(item.risk_level)}</StatusBadge>
                      <span className="font-medium">{item.title}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.target_label} · {shortId(item.request_id)} · {formatDateTime(item.requested_at)}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">申请人：{item.requester?.name ?? '系统'}</div>
                  <div className="flex justify-start xl:justify-end">
                    <Button onClick={() => setSelectedApprovalId(item.id)} size="sm" type="button" variant={selectedApprovalId === item.id ? 'secondary' : 'outline'}>
                      <ArrowRight className="size-4" />
                      查看详情
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <ApprovalDetailPanel
          canHandleApprovals={canHandleApprovals}
          decisionNote={decisionNote}
          detail={selectedApproval}
          isError={approvalDetailQuery.isError}
          isLoading={approvalDetailQuery.isLoading || approvalDetailQuery.isFetching}
          reviewPending={reviewMutation.isPending}
          selectedApprovalId={selectedApprovalId}
          onDecisionNoteChange={setDecisionNote}
          onReview={openApprovalReview}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="h-fit p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">运营告警</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">来自安全中心态势聚合接口的操作告警，支持确认、升级、关闭和通知的后端动作。</p>
          {operationAlertNotice ? <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{operationAlertNotice}</div> : null}
          {operationAlertError ? <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{operationAlertError}</div> : null}
          {securityOverviewQuery.isError ? (
            <PageError>运营告警加载失败。</PageError>
          ) : securityOverviewQuery.isLoading ? (
            <LoadingRows count={4} />
          ) : alerts.length === 0 ? (
            <EmptyState className="px-0" description="当前暂无需要处理的运营告警。" title="暂无告警" />
          ) : (
            <div className="mt-4 grid gap-3">
              {alerts.map((alert) => (
                <OperationAlertCard
                  alert={alert}
                  canHandle={canHandleOperationAlerts}
                  key={alert.id}
                  notifying={notifyOperationAlertMutation.isPending}
                  updating={updateOperationAlertMutation.isPending}
                  onAction={(action) => setOperationAlertActionTarget({ action, alertId: alert.id, title: alert.title, type: 'update' })}
                  onNotify={() => setOperationAlertActionTarget({ alertId: alert.id, title: alert.title, type: 'notify' })}
                />
              ))}
            </div>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b p-4">
            <h2 className="text-sm font-semibold">通知审计</h2>
            <p className="mt-1 text-sm text-muted-foreground">按状态检索运营告警通知审计，导出和归档删除审批由后端既有接口负责。</p>
            <div className="mt-4 grid gap-2 md:grid-cols-[180px_1fr]">
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setNotificationStatus(event.target.value as SecurityOperationAlertNotificationStatus | '')} value={notificationStatus}>
                <option value="">全部状态</option>
                {notificationStatuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
                <Search className="size-4 shrink-0 text-muted-foreground" />
                <input className="min-w-0 flex-1 bg-transparent outline-none" onChange={(event) => setNotificationKeyword(event.target.value)} placeholder="搜索告警、消息、trace_id" value={notificationKeyword} />
              </label>
            </div>
          </div>
          {notificationQuery.isError ? (
            <div className="p-4"><PageError>通知审计加载失败。</PageError></div>
          ) : notificationQuery.isLoading ? (
            <LoadingRows count={4} />
          ) : notifications.length === 0 ? (
            <EmptyState description="当前筛选下暂无通知审计。" title="暂无通知" />
          ) : (
            <div className="divide-y">
              {notifications.slice(0, 8).map((item) => (
                <div className="grid gap-2 p-4 md:grid-cols-[1fr_150px] md:items-center" key={item.notification_event_id}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={notificationStatusTone(item.status)}>{notificationStatusLabel(item.status)}</StatusBadge>
                      {item.alert_category ? <StatusBadge tone="planned">{item.alert_category}</StatusBadge> : null}
                      <span className="font-medium">{shortId(item.alert_id)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.message}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">重试 {item.retry_count} 次 · {formatDateTime(item.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      <section className="grid gap-4">
        <Card className="overflow-hidden">
          <div className="border-b p-4">
            <h2 className="text-sm font-semibold">SLA 告警</h2>
            <p className="mt-1 text-sm text-muted-foreground">展示超时扫描、自动升级和待通知状态，具体升级动作复用现有后端接口。</p>
          </div>
          {slaQuery.isError ? (
            <div className="p-4"><PageError>SLA 告警加载失败。</PageError></div>
          ) : slaQuery.isLoading ? (
            <LoadingRows count={4} />
          ) : slaItems.length === 0 ? (
            <EmptyState description="当前暂无 SLA 告警。" title="暂无 SLA 告警" />
          ) : (
            <div className="divide-y">
              {slaItems.slice(0, 8).map((item) => (
                <div className="grid gap-2 p-4 md:grid-cols-[1fr_150px] md:items-center" key={item.alert_id}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={slaStatusTone(item.sla_status)}>{slaStatusLabel(item.sla_status)}</StatusBadge>
                      <StatusBadge tone={alertStatusTone(item.status)}>{alertStatusLabel(item.status)}</StatusBadge>
                      <span className="font-medium">{item.title}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">到期 {formatDateTime(item.due_at)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      {approvalReviewTarget ? (
        <SecurityConfirmDialog
          body={`将${approvalReviewTarget.decision === 'APPROVE' ? '通过' : '拒绝'}审批「${approvalReviewTarget.title}」。审批意见会写入原审批链路和统一工作台时间线。`}
          confirmLabel={approvalReviewTarget.decision === 'APPROVE' ? '通过审批' : '拒绝审批'}
          pending={reviewMutation.isPending}
          title={approvalReviewTarget.decision === 'APPROVE' ? '确认通过审批' : '确认拒绝审批'}
          onCancel={() => setApprovalReviewTarget(null)}
          onConfirm={confirmApprovalReview}
        />
      ) : null}
      {operationAlertActionTarget ? (
        <SecurityConfirmDialog
          body={operationAlertConfirmBody(operationAlertActionTarget)}
          confirmLabel={operationAlertConfirmLabel(operationAlertActionTarget)}
          pending={notifyOperationAlertMutation.isPending || updateOperationAlertMutation.isPending}
          title={operationAlertConfirmTitle(operationAlertActionTarget)}
          onCancel={() => setOperationAlertActionTarget(null)}
          onConfirm={confirmOperationAlertAction}
        />
      ) : null}
    </main>
  );
}

function OperationAlertCard({
  alert,
  canHandle,
  notifying,
  updating,
  onAction,
  onNotify,
}: {
  alert: SecurityCenterOperationalAlert;
  canHandle: boolean;
  notifying: boolean;
  updating: boolean;
  onAction: (action: SecurityOperationAlertAction) => void;
  onNotify: () => void;
}) {
  const isClosed = alert.status === 'CLOSED';
  const actionDisabled = !canHandle || updating || notifying;

  return (
    <div className="rounded-md border bg-muted/15 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone={alertStatusTone(alert.status)}>{alertStatusLabel(alert.status)}</StatusBadge>
        <StatusBadge tone={securityRiskTone(alert.severity)}>{securityRiskLevelLabel(alert.severity)}</StatusBadge>
        <span className="font-medium">{alert.title}</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{alert.description}</p>
      <p className="mt-2 text-xs text-muted-foreground">{alert.metric} · 触发 {formatDateTime(alert.triggered_at)}</p>
      {alert.updated_at ? (
        <p className="mt-1 text-xs text-muted-foreground">
          最近动作：{alert.last_action ? operationAlertActionLabel(alert.last_action) : '暂无'} · {formatDateTime(alert.updated_at)}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href={alert.href || '/security/events'}>
            <ArrowRight className="size-4" />
            {alert.action_label || '查看导出事件'}
          </Link>
        </Button>
        <Button disabled={actionDisabled || isClosed} onClick={onNotify} size="sm" type="button" variant="outline">
          <Send className="size-4" />
          {notifying ? '通知中' : '发送通知'}
        </Button>
        <Button disabled={actionDisabled || isClosed || alert.status === 'ACKNOWLEDGED'} onClick={() => onAction('ACKNOWLEDGE')} size="sm" type="button" variant="outline">
          确认告警
        </Button>
        <Button disabled={actionDisabled || isClosed || alert.status === 'ESCALATED'} onClick={() => onAction('ESCALATE')} size="sm" type="button" variant="outline">
          升级告警
        </Button>
        <Button disabled={actionDisabled || isClosed} onClick={() => onAction('CLOSE')} size="sm" type="button" variant="outline">
          关闭告警
        </Button>
      </div>
    </div>
  );
}

function operationAlertActionLabel(action: SecurityOperationAlertAction) {
  const labels: Record<SecurityOperationAlertAction, string> = {
    ACKNOWLEDGE: '确认',
    ESCALATE: '升级',
    CLOSE: '关闭',
  };

  return labels[action] ?? action;
}

function operationAlertConfirmTitle(target: OperationAlertActionTarget) {
  return target.type === 'notify' ? '确认通知运营告警' : '确认更新运营告警状态';
}

function operationAlertConfirmLabel(target: OperationAlertActionTarget) {
  return target.type === 'notify' ? '确认通知' : '确认更新';
}

function operationAlertConfirmBody(target: OperationAlertActionTarget) {
  if (target.type === 'notify') {
    return `确认通知运营告警「${target.title}」？系统会向站内和 Webhook 目标投递告警，并记录通知审计事件。`;
  }

  return `确认将运营告警「${target.title}」状态更新为「${operationAlertActionLabel(target.action)}」？该动作会写入告警生命周期，并刷新安全中心运营看板。`;
}

function ApprovalDetailPanel({
  canHandleApprovals,
  decisionNote,
  detail,
  isError,
  isLoading,
  reviewPending,
  selectedApprovalId,
  onDecisionNoteChange,
  onReview,
}: {
  canHandleApprovals: boolean;
  decisionNote: string;
  detail: SecurityApprovalWorkbenchDetail | undefined;
  isError: boolean;
  isLoading: boolean;
  reviewPending: boolean;
  selectedApprovalId: string | null;
  onDecisionNoteChange: (value: string) => void;
  onReview: (target: ApprovalReviewTarget) => void;
}) {
  return (
    <Card className="h-fit min-w-0 overflow-hidden">
      <div className="border-b p-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">审批详情</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">查看来源扩展信息、审批时间线和处理意见。</p>
      </div>

      {!selectedApprovalId ? (
        <EmptyState description="从左侧审批队列选择一条记录后查看详情。" title="未选择审批" />
      ) : isError ? (
        <div className="p-4"><PageError>审批详情加载失败。</PageError></div>
      ) : isLoading ? (
        <LoadingRows count={4} />
      ) : !detail ? (
        <EmptyState description="当前审批记录不存在或已被移出筛选范围。" title="暂无详情" />
      ) : (
        <div className="grid gap-5 p-4">
          <section className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={approvalStatusTone(detail.status)}>{approvalStatusLabel(detail.status)}</StatusBadge>
              <StatusBadge tone={securityRiskTone(detail.risk_level)}>{securityRiskLevelLabel(detail.risk_level)}</StatusBadge>
              <StatusBadge tone="planned">{approvalRiskDomainLabel(detail.risk_domain)}</StatusBadge>
            </div>
            <div>
              <h3 className="text-base font-semibold">{detail.title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{detail.description}</p>
            </div>
          </section>

          <section className="grid gap-2">
            <DetailLine label="来源模块" value={detail.source_module} />
            <DetailLine label="审批对象" value={detail.target_label} />
            <DetailLine label="申请人" value={detail.requester ? `${detail.requester.name}（${detail.requester.email}）` : '系统'} />
            <DetailLine label="审批人" value={detail.reviewer ? `${detail.reviewer.name}（${detail.reviewer.email}）` : '暂无'} />
            <DetailLine label="申请时间" value={formatDateTime(detail.requested_at)} />
            <DetailLine label="审批时间" value={formatDateTime(detail.reviewed_at)} />
            <DetailLine label="Request ID" value={shortId(detail.request_id)} />
            <DetailLine label="Trace ID" value={shortId(detail.trace_id)} />
          </section>

          {detail.reason ? (
            <section className="rounded-md border bg-muted/20 p-3 text-sm leading-6">
              <div className="mb-1 font-medium">审批原因</div>
              <p className="text-muted-foreground">{detail.reason}</p>
            </section>
          ) : null}

          <section className="grid gap-3">
            <h3 className="text-sm font-semibold">来源扩展信息</h3>
            <JsonBlock value={detail.metadata} />
          </section>

          <section className="grid gap-3">
            <h3 className="text-sm font-semibold">审批时间线</h3>
            <div className="grid gap-2">
              {detail.timeline.length === 0 ? (
                <EmptyState className="px-0 py-6" description="当前审批暂无时间线事件。" title="暂无时间线" />
              ) : (
                detail.timeline.map((event) => (
                  <div className="rounded-md border bg-background/80 p-3" key={event.id}>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={timelineStatusTone(event.status)}>{event.type}</StatusBadge>
                      <span className="font-medium">{event.title}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(event.occurred_at)} · {event.actor?.name ?? '系统'} · Request {shortId(event.request_id)} · Trace {shortId(event.trace_id)}
                    </p>
                    {event.note ? <p className="mt-2 text-sm text-muted-foreground">{event.note}</p> : null}
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="grid gap-3 border-t pt-4">
            <label className="grid gap-2 text-sm font-medium">
              审批备注
              <textarea
                className="min-h-24 rounded-md border bg-background/80 px-3 py-2 text-sm font-normal outline-none transition focus:border-primary"
                disabled={!canHandleApprovals || detail.status !== 'PENDING' || reviewPending}
                onChange={(event) => onDecisionNoteChange(event.target.value)}
                placeholder="填写通过或拒绝原因，可为空。"
                value={decisionNote}
              />
            </label>
            {!canHandleApprovals ? (
              <PageError>当前账号没有 security:approval:handle 权限，只能查看审批详情。</PageError>
            ) : null}
            {detail.status !== 'PENDING' ? (
              <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">当前审批已处理，不能重复通过或拒绝。</div>
            ) : null}
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                disabled={!canHandleApprovals || detail.status !== 'PENDING' || reviewPending}
                onClick={() => onReview({ approvalId: detail.id, title: detail.title, decision: 'REJECT' })}
                type="button"
                variant="outline"
              >
                <XCircle className="size-4" />
                拒绝审批
              </Button>
              <Button
                disabled={!canHandleApprovals || detail.status !== 'PENDING' || reviewPending}
                onClick={() => onReview({ approvalId: detail.id, title: detail.title, decision: 'APPROVE' })}
                type="button"
              >
                <CheckCircle2 className="size-4" />
                通过审批
              </Button>
            </div>
          </section>
        </div>
      )}
    </Card>
  );
}

function approvalRiskDomainLabel(domain: SecurityApprovalWorkbenchRiskDomain) {
  return approvalRiskDomains.find((item) => item.value === domain)?.label ?? domain;
}

function timelineStatusTone(status: string) {
  if (status === 'SUCCESS' || status === 'APPROVED' || status === 'APPLIED') return 'healthy';
  if (status === 'FAILED' || status === 'ERROR' || status === 'REJECTED') return 'unavailable';
  if (status === 'WARNING') return 'degraded';
  return 'planned';
}

function downloadBlob(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

function invalidateApprovalWorkbenchSourceQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['tool-approval-overview'] }),
    queryClient.invalidateQueries({ queryKey: ['tool-approvals'] }),
    queryClient.invalidateQueries({ queryKey: ['tools'] }),
    queryClient.invalidateQueries({ queryKey: ['conversations'] }),
    queryClient.invalidateQueries({ queryKey: ['notification-policy-approval-overview'] }),
    queryClient.invalidateQueries({ queryKey: ['notification-policy-approvals'] }),
    queryClient.invalidateQueries({ queryKey: ['notification-policy-snapshots'] }),
    queryClient.invalidateQueries({ queryKey: ['notification-policy-audit'] }),
    queryClient.invalidateQueries({ queryKey: ['approval-audit-archive-approval-overview'] }),
    queryClient.invalidateQueries({ queryKey: ['approval-audit-archive-approvals'] }),
    queryClient.invalidateQueries({ queryKey: ['approval-audit-archives'] }),
    queryClient.invalidateQueries({ queryKey: ['approval-audit-overview'] }),
    queryClient.invalidateQueries({ queryKey: ['agent-team-run-report-archive-approvals'] }),
    queryClient.invalidateQueries({ queryKey: ['agent-team-run-report-archives'] }),
    queryClient.invalidateQueries({ queryKey: ['security-operation-alert-notification-archive-approvals'] }),
    queryClient.invalidateQueries({ queryKey: ['security-operation-alert-notification-task-recovery-audit-archive-approvals'] }),
    queryClient.invalidateQueries({ queryKey: ['security-operation-alert-sla-dead-letter-audit-archive-approvals'] }),
    queryClient.invalidateQueries({ queryKey: ['security-archive-governance-notification-archives'] }),
    queryClient.invalidateQueries({ queryKey: ['security-archive-governance-recovery-archives'] }),
    queryClient.invalidateQueries({ queryKey: ['security-archive-governance-sla-archives'] }),
    queryClient.invalidateQueries({ queryKey: ['security-archive-governance-notification-approval-overview'] }),
    queryClient.invalidateQueries({ queryKey: ['security-archive-governance-recovery-approval-overview'] }),
    queryClient.invalidateQueries({ queryKey: ['security-archive-governance-sla-approval-overview'] }),
    queryClient.invalidateQueries({ queryKey: ['security-archive-governance-notification-approvals'] }),
    queryClient.invalidateQueries({ queryKey: ['security-archive-governance-recovery-approvals'] }),
    queryClient.invalidateQueries({ queryKey: ['security-archive-governance-sla-approvals'] }),
    queryClient.invalidateQueries({ queryKey: ['security-recovery-page-archive-approval-overview'] }),
    queryClient.invalidateQueries({ queryKey: ['security-recovery-page-archive-approvals'] }),
    queryClient.invalidateQueries({ queryKey: ['security-recovery-page-archives'] }),
    queryClient.invalidateQueries({ queryKey: ['security-center-overview'] }),
  ]);
}
