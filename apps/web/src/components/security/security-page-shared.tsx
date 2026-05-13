'use client';

import type { ComponentProps, ReactNode } from 'react';
import type {
  SecurityApprovalWorkbenchRiskLevel,
  SecurityApprovalWorkbenchStatus,
  SecurityCenterEventSource,
  SecurityCenterRiskLevel,
  SecurityOperationAlertNotificationStatus,
  SecurityOperationAlertSlaStatus,
  SecurityOperationAlertStatus,
} from '@aiaget/shared-types';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';

export type SecurityStatusTone = ComponentProps<typeof StatusBadge>['tone'];

export function SecurityWorkspaceHeader({
  actions,
  badge,
  badgeTone = 'ready',
  title,
	}: {
	  actions?: ReactNode;
	  badge: string;
	  badgeTone?: SecurityStatusTone;
	  title: string;
	}) {
  return (
    <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
      <div>
        <Button asChild className="mb-4 w-fit" variant="outline">
          <Link href="/security">
            <ArrowLeft className="size-4" />
            安全总览
          </Link>
        </Button>
	        <div className="mb-2 flex flex-wrap items-center gap-2">
	          <StatusBadge tone={badgeTone}>{badge}</StatusBadge>
	        </div>
        <h1 className="text-2xl font-semibold">{title}</h1>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </section>
  );
}

export function RefreshButton({
  loading,
  onClick,
}: {
  loading?: boolean;
  onClick: () => void;
}) {
  return (
    <Button disabled={loading} onClick={onClick} type="button" variant="outline">
      <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
      刷新
    </Button>
  );
}

export function PageError({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
      {children}
    </div>
  );
}

export function SecurityConfirmDialog({
  body,
  confirmLabel = '确认',
  pending,
  title,
  onCancel,
  onConfirm,
}: {
  body: string;
  confirmLabel?: string;
  pending: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <section className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-xl">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button disabled={pending} onClick={onCancel} type="button" variant="outline">取消</Button>
          <Button disabled={pending} onClick={onConfirm} type="button" variant="destructive">{pending ? '处理中' : confirmLabel}</Button>
        </div>
      </div>
    </section>
  );
}

export function LoadingRows({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 p-4">
      {Array.from({ length: count }).map((_, index) => (
        <div className="h-16 rounded-md border bg-muted/30" key={index} />
      ))}
    </div>
  );
}

export function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="max-h-64 overflow-auto rounded-md bg-slate-950 p-3 text-xs leading-5 text-slate-100">
      {JSON.stringify(value ?? {}, null, 2)}
    </pre>
  );
}

export function DetailLine({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1 rounded-md border bg-muted/20 px-3 py-2 text-sm md:grid-cols-[120px_1fr]">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words">{value || '暂无'}</span>
    </div>
  );
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '暂无';

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat('zh-CN').format(value ?? 0);
}

export function formatPercent(value: number | null | undefined) {
  return `${Math.round((value ?? 0) * 100)}%`;
}

export function formatBytes(value: number | null | undefined) {
  const size = value ?? 0;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function shortId(value: string | null | undefined) {
  if (!value) return '暂无';
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export function securityRiskLevelLabel(level: SecurityCenterRiskLevel | SecurityApprovalWorkbenchRiskLevel) {
  const labels: Record<SecurityCenterRiskLevel | SecurityApprovalWorkbenchRiskLevel, string> = {
    LOW: '低风险',
    MEDIUM: '中风险',
    HIGH: '高风险',
    CRITICAL: '严重风险',
  };

  return labels[level] ?? level;
}

export function securityRiskTone(level: SecurityCenterRiskLevel | SecurityApprovalWorkbenchRiskLevel) {
  if (level === 'CRITICAL') return 'unavailable';
  if (level === 'HIGH') return 'degraded';
  if (level === 'MEDIUM') return 'planned';
  return 'healthy';
}

export function securityEventSourceLabel(source: SecurityCenterEventSource) {
  const labels: Record<SecurityCenterEventSource, string> = {
    DATA_SCOPE: '数据权限',
    RESOURCE_ACL: '资源授权',
    SECURITY_POLICY: '安全策略',
    OPERATION: '操作拒绝',
    APPROVAL_WORKBENCH: '审批工作台',
  };

  return labels[source] ?? source;
}

export function approvalStatusLabel(status: SecurityApprovalWorkbenchStatus) {
  const labels: Record<SecurityApprovalWorkbenchStatus, string> = {
    PENDING: '待审批',
    APPROVED: '已批准',
    REJECTED: '已拒绝',
    APPLIED: '已生效',
  };

  return labels[status] ?? status;
}

export function approvalStatusTone(status: SecurityApprovalWorkbenchStatus) {
  if (status === 'PENDING') return 'degraded';
  if (status === 'APPROVED' || status === 'APPLIED') return 'healthy';
  return 'unavailable';
}

export function alertStatusLabel(status: SecurityOperationAlertStatus) {
  const labels: Record<SecurityOperationAlertStatus, string> = {
    OPEN: '打开',
    ACKNOWLEDGED: '已确认',
    ESCALATED: '已升级',
    CLOSED: '已关闭',
  };

  return labels[status] ?? status;
}

export function alertStatusTone(status: SecurityOperationAlertStatus) {
  if (status === 'OPEN') return 'degraded';
  if (status === 'ESCALATED') return 'unavailable';
  if (status === 'CLOSED') return 'healthy';
  return 'planned';
}

export function notificationStatusLabel(status: SecurityOperationAlertNotificationStatus) {
  const labels: Record<SecurityOperationAlertNotificationStatus, string> = {
    SENT: '已发送',
    PARTIAL: '部分成功',
    SKIPPED: '已跳过',
    FAILED: '失败',
  };

  return labels[status] ?? status;
}

export function notificationStatusTone(status: SecurityOperationAlertNotificationStatus) {
  if (status === 'SENT') return 'healthy';
  if (status === 'FAILED') return 'unavailable';
  if (status === 'PARTIAL') return 'degraded';
  return 'planned';
}

export function slaStatusLabel(status: SecurityOperationAlertSlaStatus) {
  const labels: Record<SecurityOperationAlertSlaStatus, string> = {
    WITHIN_SLA: 'SLA 内',
    WARNING: '即将超时',
    OVERDUE: '已超时',
    CLOSED: '已关闭',
  };

  return labels[status] ?? status;
}

export function slaStatusTone(status: SecurityOperationAlertSlaStatus) {
  if (status === 'WITHIN_SLA' || status === 'CLOSED') return 'healthy';
  if (status === 'OVERDUE') return 'unavailable';
  return 'degraded';
}
