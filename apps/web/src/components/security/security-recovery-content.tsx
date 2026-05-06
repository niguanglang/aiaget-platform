'use client';

import type {
  SecurityOperationAlertNotificationTaskName,
  SecurityOperationAlertNotificationTaskRecoveryAction,
  SecurityOperationAlertNotificationTaskRecoveryFailureSource,
  SecurityOperationAlertNotificationTaskRecoveryReason,
  SecurityOperationAlertNotificationTaskRecoveryStatus,
  SecurityOperationAlertNotificationTaskRunResult,
} from '@aiaget/shared-types';
import { useQuery } from '@tanstack/react-query';
import { Archive, ArrowRight, Search, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { SecurityPolicyBackground } from '@/components/security/security-policy-background';
import {
  LoadingRows,
  PageError,
  RefreshButton,
  SecurityWorkspaceHeader,
  formatBytes,
  formatDateTime,
  formatNumber,
  formatPercent,
  securityRiskLevelLabel,
  securityRiskTone,
} from '@/components/security/security-page-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  getSecurityCenterOverview,
  getSecurityOperationAlertNotificationTaskOverview,
  getSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalOverview,
  listSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovals,
  listSecurityOperationAlertNotificationTaskRecoveryAuditArchives,
  listSecurityOperationAlertNotificationTaskRecoveryAudits,
  listSecurityOperationAlertNotificationTaskRuns,
} from '@/lib/api-client';

const taskNames: Array<{ label: string; value: SecurityOperationAlertNotificationTaskName }> = [
  { label: '自动通知', value: 'AUTO_NOTIFY' },
  { label: '自动重试', value: 'AUTO_RETRY' },
];
const taskStatuses: Array<{ label: string; value: SecurityOperationAlertNotificationTaskRunResult['status'] }> = [
  { label: '成功', value: 'SUCCESS' },
  { label: '失败', value: 'FAILED' },
  { label: '跳过', value: 'SKIPPED' },
];
const recoveryActions: Array<{ label: string; value: SecurityOperationAlertNotificationTaskRecoveryAction }> = [
  { label: '确认', value: 'ACKNOWLEDGE' },
  { label: '忽略', value: 'IGNORE' },
  { label: '解决', value: 'RESOLVE' },
];
const recoveryStatuses: Array<{ label: string; value: SecurityOperationAlertNotificationTaskRecoveryStatus }> = [
  { label: '已确认', value: 'ACKNOWLEDGED' },
  { label: '已忽略', value: 'IGNORED' },
  { label: '已解决', value: 'RESOLVED' },
];
const recoveryReasons: Array<{ label: string; value: SecurityOperationAlertNotificationTaskRecoveryReason }> = [
  { label: 'Webhook 未配置', value: 'WEBHOOK_NOT_CONFIGURED' },
  { label: 'Webhook 投递失败', value: 'WEBHOOK_DELIVERY_FAILED' },
  { label: '自动通知关闭', value: 'AUTO_NOTIFY_DISABLED' },
  { label: '自动重试关闭', value: 'AUTO_RETRY_DISABLED' },
  { label: '连续失败', value: 'CONSECUTIVE_FAILURES' },
  { label: '高失败率', value: 'HIGH_FAILURE_RATE' },
];
const failureSources: Array<{ label: string; value: SecurityOperationAlertNotificationTaskRecoveryFailureSource }> = [
  { label: 'SLA 死信归档删除', value: 'SLA_DEAD_LETTER_ARCHIVE_DELETE' },
  { label: '团队报告归档删除', value: 'AGENT_TEAM_REPORT_ARCHIVE_DELETE' },
  { label: '自愈审计归档删除', value: 'NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE' },
  { label: '混合来源', value: 'MIXED' },
  { label: '未知来源', value: 'UNKNOWN' },
];

export function SecurityRecoveryContent() {
  const [taskRunTask, setTaskRunTask] = useState<SecurityOperationAlertNotificationTaskName | ''>('');
  const [taskRunStatus, setTaskRunStatus] = useState<SecurityOperationAlertNotificationTaskRunResult['status'] | ''>('');
  const [taskRunKeyword, setTaskRunKeyword] = useState('');
  const [auditAction, setAuditAction] = useState<SecurityOperationAlertNotificationTaskRecoveryAction | ''>('');
  const [auditStatus, setAuditStatus] = useState<SecurityOperationAlertNotificationTaskRecoveryStatus | ''>('');
  const [auditReason, setAuditReason] = useState<SecurityOperationAlertNotificationTaskRecoveryReason | ''>('');
  const [auditFailureSource, setAuditFailureSource] = useState<SecurityOperationAlertNotificationTaskRecoveryFailureSource | ''>('');
  const [auditKeyword, setAuditKeyword] = useState('');

  const securityOverviewQuery = useQuery({
    queryKey: ['security-recovery-page-security-overview'],
    queryFn: getSecurityCenterOverview,
  });
  const taskOverviewQuery = useQuery({
    queryKey: ['security-recovery-page-task-overview'],
    queryFn: getSecurityOperationAlertNotificationTaskOverview,
  });
  const taskRunsQuery = useQuery({
    queryKey: ['security-recovery-page-task-runs', taskRunTask, taskRunStatus, taskRunKeyword],
    queryFn: () =>
      listSecurityOperationAlertNotificationTaskRuns({
        task: taskRunTask,
        status: taskRunStatus,
        keyword: taskRunKeyword,
      }),
  });
  const recoveryAuditsQuery = useQuery({
    queryKey: ['security-recovery-page-audits', auditAction, auditStatus, auditReason, auditFailureSource, auditKeyword],
    queryFn: () =>
      listSecurityOperationAlertNotificationTaskRecoveryAudits({
        action: auditAction,
        status: auditStatus,
        reason_code: auditReason,
        failure_source: auditFailureSource,
        keyword: auditKeyword,
      }),
  });
  const archiveOverviewQuery = useQuery({
    queryKey: ['security-recovery-page-archive-approval-overview'],
    queryFn: getSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalOverview,
  });
  const archiveApprovalsQuery = useQuery({
    queryKey: ['security-recovery-page-archive-approvals'],
    queryFn: listSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovals,
  });
  const archivesQuery = useQuery({
    queryKey: ['security-recovery-page-archives'],
    queryFn: listSecurityOperationAlertNotificationTaskRecoveryAuditArchives,
  });

  const taskOverview = taskOverviewQuery.data;
  const taskRuns = taskRunsQuery.data?.items ?? [];
  const recoveryAudits = recoveryAuditsQuery.data?.items ?? [];
  const suggestions = securityOverviewQuery.data?.approval_operations.notification_task_recovery_suggestions ?? [];
  const archiveApprovals = archiveApprovalsQuery.data ?? [];
  const archives = archivesQuery.data?.items ?? [];
  const failureRate = securityOverviewQuery.data?.approval_operations.notification_task_failure_rate_24h ?? 0;

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <SecurityPolicyBackground />

      <SecurityWorkspaceHeader
        actions={
          <>
            <RefreshButton loading={securityOverviewQuery.isFetching || taskOverviewQuery.isFetching || taskRunsQuery.isFetching || recoveryAuditsQuery.isFetching || archiveApprovalsQuery.isFetching || archivesQuery.isFetching} onClick={() => {
              void securityOverviewQuery.refetch();
              void taskOverviewQuery.refetch();
              void taskRunsQuery.refetch();
              void recoveryAuditsQuery.refetch();
              void archiveOverviewQuery.refetch();
              void archiveApprovalsQuery.refetch();
              void archivesQuery.refetch();
            }} />
            <Button asChild variant="outline">
              <Link href="/security/alerts">
                <ArrowRight className="size-4" />
                告警运营
              </Link>
            </Button>
          </>
        }
        badge="任务"
        description="聚焦通知任务健康、自愈建议、恢复审计和归档审批，帮助定位自动通知与自动重试的失败来源。"
        title="自愈恢复"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard helper="等待自动通知" label="待通知" value={formatNumber(taskOverview?.summary.pending_auto_notify_count)} />
        <MetricCard helper="等待自动重试" label="待重试" value={formatNumber(taskOverview?.summary.pending_auto_retry_count)} />
        <MetricCard helper="最近 24 小时" label="任务失败率" value={formatPercent(failureRate)} />
        <MetricCard helper="自愈建议" label="待处理建议" value={formatNumber(suggestions.length)} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Wrench className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">任务运行</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">自动通知和自动重试任务状态，任务动作由既有后端调度接口执行。</p>
          {taskOverviewQuery.isError ? (
            <PageError>任务概览加载失败。</PageError>
          ) : taskOverviewQuery.isLoading ? (
            <LoadingRows count={4} />
          ) : taskOverview ? (
            <div className="mt-4 grid gap-3">
              <div className="grid gap-3 md:grid-cols-2">
                <StatusTile label="调度器" tone={taskOverview.scheduler_enabled ? 'healthy' : 'planned'} value={taskOverview.scheduler_enabled ? '已启用' : '未启用'} />
                <StatusTile label="运行状态" tone={taskOverview.running ? 'degraded' : 'healthy'} value={taskOverview.running ? '运行中' : '空闲'} />
                <StatusTile label="自动通知" tone={taskOverview.policy.auto_notify_enabled ? 'healthy' : 'planned'} value={taskOverview.policy.auto_notify_enabled ? '启用' : '关闭'} />
                <StatusTile label="自动重试" tone={taskOverview.policy.auto_retry_enabled ? 'healthy' : 'planned'} value={taskOverview.policy.auto_retry_enabled ? '启用' : '关闭'} />
              </div>
              <p className="text-sm text-muted-foreground">
                最近 Tick：{formatDateTime(taskOverview.last_tick_at)} · 策略来源 {taskOverview.policy.source} · 回看 {taskOverview.policy.lookback_hours} 小时
              </p>
            </div>
          ) : null}
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b p-4">
            <h2 className="text-sm font-semibold">任务运行历史</h2>
            <div className="mt-4 grid gap-2 md:grid-cols-[160px_140px_1fr]">
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setTaskRunTask(event.target.value as SecurityOperationAlertNotificationTaskName | '')} value={taskRunTask}>
                <option value="">全部任务</option>
                {taskNames.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setTaskRunStatus(event.target.value as SecurityOperationAlertNotificationTaskRunResult['status'] | '')} value={taskRunStatus}>
                <option value="">全部状态</option>
                {taskStatuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
                <Search className="size-4 shrink-0 text-muted-foreground" />
                <input className="min-w-0 flex-1 bg-transparent outline-none" onChange={(event) => setTaskRunKeyword(event.target.value)} placeholder="搜索任务摘要、request_id、trace_id" value={taskRunKeyword} />
              </label>
            </div>
          </div>
          {taskRunsQuery.isError ? (
            <div className="p-4"><PageError>任务运行历史加载失败。</PageError></div>
          ) : taskRunsQuery.isLoading ? (
            <LoadingRows count={4} />
          ) : taskRuns.length === 0 ? (
            <EmptyState description="当前筛选下暂无任务运行记录。" title="暂无任务运行" />
          ) : (
            <div className="divide-y">
              {taskRuns.slice(0, 8).map((run) => (
                <div className="grid gap-2 p-4 md:grid-cols-[1fr_160px] md:items-center" key={run.event_id}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={taskRunTone(run.status)}>{taskRunLabel(run.status)}</StatusBadge>
                      <StatusBadge tone="planned">{taskNameLabel(run.task)}</StatusBadge>
                      <span className="font-medium">扫描 {run.scanned_count} 条</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">成功 {run.success_count} · 失败 {run.failed_count} · 跳过 {run.skipped_count}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">{formatDateTime(run.finished_at)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="p-5">
          <h2 className="text-sm font-semibold">自愈建议</h2>
          <p className="mt-1 text-sm text-muted-foreground">来自安全中心态势聚合的失败来源建议。</p>
          {securityOverviewQuery.isError ? (
            <PageError>自愈建议加载失败。</PageError>
          ) : securityOverviewQuery.isLoading ? (
            <LoadingRows count={3} />
          ) : suggestions.length === 0 ? (
            <EmptyState className="px-0" description="当前暂无需要处理的自愈建议。" title="暂无建议" />
          ) : (
            <div className="mt-4 grid gap-3">
              {suggestions.map((suggestion) => (
                <div className="rounded-md border bg-muted/15 p-3" key={suggestion.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={securityRiskTone(suggestion.severity)}>{securityRiskLevelLabel(suggestion.severity)}</StatusBadge>
                    <StatusBadge tone="planned">{failureSourceLabel(suggestion.failure_source)}</StatusBadge>
                    <span className="font-medium">{suggestion.title}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{suggestion.description}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{suggestion.evidence}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b p-4">
            <h2 className="text-sm font-semibold">恢复审计</h2>
            <p className="mt-1 text-sm text-muted-foreground">按动作、状态、原因和失败来源检索自愈处理记录。</p>
            <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-[140px_140px_180px_180px_1fr]">
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setAuditAction(event.target.value as SecurityOperationAlertNotificationTaskRecoveryAction | '')} value={auditAction}>
                <option value="">全部动作</option>
                {recoveryActions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setAuditStatus(event.target.value as SecurityOperationAlertNotificationTaskRecoveryStatus | '')} value={auditStatus}>
                <option value="">全部状态</option>
                {recoveryStatuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setAuditReason(event.target.value as SecurityOperationAlertNotificationTaskRecoveryReason | '')} value={auditReason}>
                <option value="">全部原因</option>
                {recoveryReasons.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setAuditFailureSource(event.target.value as SecurityOperationAlertNotificationTaskRecoveryFailureSource | '')} value={auditFailureSource}>
                <option value="">全部来源</option>
                {failureSources.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
                <Search className="size-4 shrink-0 text-muted-foreground" />
                <input className="min-w-0 flex-1 bg-transparent outline-none" onChange={(event) => setAuditKeyword(event.target.value)} placeholder="搜索标题、证据、trace_id" value={auditKeyword} />
              </label>
            </div>
          </div>

          {recoveryAuditsQuery.isError ? (
            <div className="p-4"><PageError>恢复审计加载失败。</PageError></div>
          ) : recoveryAuditsQuery.isLoading ? (
            <LoadingRows count={5} />
          ) : recoveryAudits.length === 0 ? (
            <EmptyState description="当前筛选下暂无恢复审计。" title="暂无恢复审计" />
          ) : (
            <div className="divide-y">
              {recoveryAudits.map((audit) => (
                <div className="grid gap-2 p-4 md:grid-cols-[1fr_170px] md:items-center" key={audit.event_id}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={securityRiskTone(audit.severity)}>{securityRiskLevelLabel(audit.severity)}</StatusBadge>
                      <StatusBadge tone="planned">{recoveryActionLabel(audit.action)}</StatusBadge>
                      <StatusBadge tone={recoveryStatusTone(audit.status)}>{recoveryStatusLabel(audit.status)}</StatusBadge>
                      <span className="font-medium">{audit.title}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{failureSourceLabel(audit.failure_source)} · {recoveryReasonLabel(audit.reason_code)}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">{formatDateTime(audit.occurred_at)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      <Card className="overflow-hidden">
        <div className="border-b p-4">
          <div className="flex items-center gap-2">
            <Archive className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">归档审批</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">自愈恢复审计归档和归档删除审批，用于保留恢复闭环证据。</p>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <MetricCard helper="对象存储归档" label="归档文件" value={formatNumber(archivesQuery.data?.summary.archive_count)} />
            <MetricCard helper="归档体积" label="归档大小" value={formatBytes(archivesQuery.data?.summary.total_size_bytes)} />
            <MetricCard helper="待安全审批" label="待审批" value={formatNumber(archiveOverviewQuery.data?.pending_count)} />
            <MetricCard helper="已生效删除" label="已生效" value={formatNumber(archiveOverviewQuery.data?.applied_count)} />
          </div>
        </div>
        {archiveApprovalsQuery.isError || archivesQuery.isError ? (
          <div className="p-4"><PageError>归档审批加载失败。</PageError></div>
        ) : archiveApprovalsQuery.isLoading || archivesQuery.isLoading ? (
          <LoadingRows count={4} />
        ) : archiveApprovals.length === 0 && archives.length === 0 ? (
          <EmptyState description="暂无恢复审计归档或归档删除审批。" title="暂无归档审批" />
        ) : (
          <div className="grid gap-4 p-4 xl:grid-cols-2">
            <div className="grid gap-3">
              <h3 className="text-sm font-semibold">最近归档</h3>
              {archives.slice(0, 5).map((archive) => (
                <div className="rounded-md border bg-muted/15 p-3" key={archive.id}>
                  <div className="font-medium">{archive.file_name}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{archive.folder} · {formatBytes(archive.size_bytes)} · {formatDateTime(archive.last_modified)}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-3">
              <h3 className="text-sm font-semibold">归档删除审批</h3>
              {archiveApprovals.slice(0, 5).map((approval) => (
                <div className="rounded-md border bg-muted/15 p-3" key={approval.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={archiveApprovalTone(approval.status)}>{archiveApprovalLabel(approval.status)}</StatusBadge>
                    <span className="font-medium">{approval.archive_file_name}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">申请人：{approval.requested_by?.name ?? '系统'} · {formatDateTime(approval.requested_at)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </main>
  );
}

function StatusTile({ label, tone, value }: { label: string; tone: 'healthy' | 'planned' | 'degraded'; value: string }) {
  return (
    <div className="rounded-md border bg-muted/15 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-2"><StatusBadge tone={tone}>{value}</StatusBadge></div>
    </div>
  );
}

function taskNameLabel(task: SecurityOperationAlertNotificationTaskName) {
  return task === 'AUTO_NOTIFY' ? '自动通知' : '自动重试';
}

function taskRunLabel(status: SecurityOperationAlertNotificationTaskRunResult['status']) {
  if (status === 'SUCCESS') return '成功';
  if (status === 'FAILED') return '失败';
  return '跳过';
}

function taskRunTone(status: SecurityOperationAlertNotificationTaskRunResult['status']) {
  if (status === 'SUCCESS') return 'healthy';
  if (status === 'FAILED') return 'unavailable';
  return 'planned';
}

function recoveryActionLabel(action: SecurityOperationAlertNotificationTaskRecoveryAction) {
  const labels: Record<SecurityOperationAlertNotificationTaskRecoveryAction, string> = {
    ACKNOWLEDGE: '确认',
    IGNORE: '忽略',
    RESOLVE: '解决',
  };
  return labels[action] ?? action;
}

function recoveryStatusLabel(status: SecurityOperationAlertNotificationTaskRecoveryStatus) {
  const labels: Record<SecurityOperationAlertNotificationTaskRecoveryStatus, string> = {
    OPEN: '打开',
    ACKNOWLEDGED: '已确认',
    IGNORED: '已忽略',
    RESOLVED: '已解决',
  };
  return labels[status] ?? status;
}

function recoveryStatusTone(status: SecurityOperationAlertNotificationTaskRecoveryStatus) {
  if (status === 'OPEN') return 'degraded';
  if (status === 'RESOLVED') return 'healthy';
  return 'planned';
}

function recoveryReasonLabel(reason: SecurityOperationAlertNotificationTaskRecoveryReason) {
  return recoveryReasons.find((item) => item.value === reason)?.label ?? reason;
}

function failureSourceLabel(source: SecurityOperationAlertNotificationTaskRecoveryFailureSource) {
  return failureSources.find((item) => item.value === source)?.label ?? source;
}

function archiveApprovalLabel(status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPLIED') {
  const labels = {
    PENDING: '待审批',
    APPROVED: '已批准',
    REJECTED: '已拒绝',
    APPLIED: '已生效',
  } as const;
  return labels[status] ?? status;
}

function archiveApprovalTone(status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPLIED') {
  if (status === 'PENDING') return 'degraded';
  if (status === 'REJECTED') return 'unavailable';
  return 'healthy';
}
