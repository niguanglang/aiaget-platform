'use client';

import { hasPermission, type ApprovalAuditArchiveApprovalStatus, type ApprovalAuditEventItem, type SystemSettingSnapshotApprovalStatus, type SystemSettingSnapshotItem } from '@aiaget/shared-types';
import { GitBranch } from 'lucide-react';

import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDateTime } from '@/components/approvals/approval-status';

export { formatDateTime, formatLatency } from '@/components/approvals/approval-status';

export type ArchiveApprovalStatus = ApprovalAuditArchiveApprovalStatus;

export function useApprovalCanHandle() {
  const { currentUser } = useAuth();

  return Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'security:approval:handle'),
  );
}

export function ApprovalPageShell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">{children}</main>;
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
      {message}
    </div>
  );
}

export function LoadingBlock({ children }: { children: React.ReactNode }) {
  return <div className="p-6 text-sm text-muted-foreground">{children}</div>;
}

export function DetailRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="grid gap-1 rounded-md border bg-muted/15 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="break-words text-sm font-medium">{value === null || value === undefined || value === '' ? '-' : value}</div>
    </div>
  );
}

export function PreviewCard({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="rounded-md border bg-slate-950 p-3">
      <div className="mb-2 text-xs font-medium text-slate-300">{title}</div>
      <pre className="max-h-56 overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-100">
        {JSON.stringify(value ?? {}, null, 2)}
      </pre>
    </div>
  );
}

export function DecisionActions({
  approveLabel,
  canWrite,
  decisionNote,
  disabled,
  onApprove,
  onChangeDecisionNote,
  onReject,
  pending,
  placeholder,
  rejectLabel,
}: {
  approveLabel: string;
  canWrite: boolean;
  decisionNote: string;
  disabled: boolean;
  onApprove: () => void;
  onChangeDecisionNote: (value: string) => void;
  onReject: () => void;
  pending: boolean;
  placeholder: string;
  rejectLabel: string;
}) {
  const isDisabled = !canWrite || disabled || pending;

  return (
    <div className="grid gap-3">
      <div className="text-sm font-medium">审批动作</div>
      <textarea
        className="min-h-28 resize-y rounded-md border bg-background/80 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        disabled={isDisabled}
        onChange={(event) => onChangeDecisionNote(event.target.value)}
        placeholder={placeholder}
        value={decisionNote}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <Button disabled={isDisabled} onClick={onApprove} type="button">
          {approveLabel}
        </Button>
        <Button disabled={isDisabled} onClick={onReject} type="button" variant="destructive">
          {rejectLabel}
        </Button>
      </div>
      {!canWrite ? <p className="text-xs text-muted-foreground">当前账号没有审批处理权限，只能查看审批内容。</p> : null}
    </div>
  );
}

export function ApprovalAuditTimeline({ events }: { events: ApprovalAuditEventItem[] }) {
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

export function EmptyApprovalSelection({ description, title }: { description: string; title: string }) {
  return <EmptyState description={description} title={title} />;
}

export function CardSection({ children, title, description }: { children: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="min-w-0">
      <div className="border-b p-4">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </Card>
  );
}

export function notificationPolicySettingLabel(key: string) {
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

export function snapshotActionTone(action: SystemSettingSnapshotItem['action']) {
  if (action === 'ROLLBACK') return 'degraded';
  if (action === 'RESET') return 'mock';
  return 'planned';
}

export function snapshotActionLabel(action: SystemSettingSnapshotItem['action']) {
  if (action === 'ROLLBACK') return '回滚';
  if (action === 'RESET') return '恢复默认';
  return '更新';
}

export function snapshotApprovalTone(status: SystemSettingSnapshotApprovalStatus) {
  if (status === 'PENDING') return 'degraded';
  if (status === 'APPROVED') return 'healthy';
  if (status === 'REJECTED') return 'unavailable';
  if (status === 'RESERVED') return 'mock';
  return 'planned';
}

export function snapshotApprovalLabel(status: SystemSettingSnapshotApprovalStatus) {
  if (status === 'PENDING') return '待审批';
  if (status === 'APPROVED') return '已通过';
  if (status === 'REJECTED') return '已拒绝';
  if (status === 'RESERVED') return '审批预留';
  return '无需审批';
}

export function notificationPolicyImpactTone(level: SystemSettingSnapshotItem['impact_level']) {
  if (level === 'HIGH') return 'unavailable';
  if (level === 'MEDIUM') return 'degraded';
  return 'healthy';
}

export function notificationPolicyImpactLabel(level: SystemSettingSnapshotItem['impact_level']) {
  if (level === 'HIGH') return '高影响';
  if (level === 'MEDIUM') return '中影响';
  if (level === 'LOW') return '低影响';
  return '未评估';
}

export function settingStatusLabel(status: string) {
  if (status === 'ACTIVE') return '启用';
  if (status === 'DISABLED') return '停用';
  if (status === 'DELETED') return '已删除';
  return status;
}

export function archiveApprovalTone(status: ArchiveApprovalStatus) {
  if (status === 'PENDING') return 'degraded';
  if (status === 'REJECTED') return 'unavailable';
  return 'healthy';
}

export function archiveApprovalLabel(status: ArchiveApprovalStatus) {
  if (status === 'PENDING') return '待审批';
  if (status === 'APPROVED') return '已通过';
  if (status === 'REJECTED') return '已拒绝';
  return '已生效';
}

export function formatBytes(value: number) {
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
