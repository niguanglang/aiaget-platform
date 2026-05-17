import type {
  ApprovalAuditEventStatus,
  ApprovalAuditEventType,
  ApprovalAuditSourceType,
  ApprovalAuditWindow,
} from '@aiaget/shared-types';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const approvalAuditWindows: ApprovalAuditWindow[] = ['24h', '7d', '30d'];
export const approvalAuditSourceTypes: ApprovalAuditSourceType[] = [
  'TOOL_APPROVAL',
  'NOTIFICATION_POLICY',
  'APPROVAL_AUDIT_ARCHIVE',
  'PRODUCTION_READINESS',
];
export const approvalAuditEventTypes: ApprovalAuditEventType[] = [
  'REQUEST_CREATED',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'APPLIED',
  'EXECUTION_FAILED',
  'ARCHIVED',
  'DOWNLOAD_URL_CREATED',
  'DELETE_REQUESTED',
  'DELETE_APPLIED',
  'ACCEPTED',
];
export const approvalAuditEventStatuses: ApprovalAuditEventStatus[] = ['INFO', 'SUCCESS', 'WARNING', 'FAILED'];

export function ApprovalAuditPageShell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto grid max-w-[1680px] gap-6 rounded-xl border border-slate-200/80 bg-white/[0.9] px-4 py-6 lg:px-6">
      {children}
    </main>
  );
}

export function ApprovalAuditSummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-lg border-slate-200/80 bg-white/80 p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </Card>
  );
}

export function approvalAuditSourceLabel(source: ApprovalAuditSourceType) {
  if (source === 'TOOL_APPROVAL') return '工具审批';
  if (source === 'APPROVAL_AUDIT_ARCHIVE') return '归档操作';
  if (source === 'PRODUCTION_READINESS') return '生产落地验收';
  return '通知策略';
}

export function approvalAuditEventTypeLabel(type: ApprovalAuditEventType) {
  const labels: Record<ApprovalAuditEventType, string> = {
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
    ACCEPTED: '验收确认',
  };
  return labels[type] ?? type;
}

export function approvalAuditStatusLabel(status: ApprovalAuditEventStatus) {
  if (status === 'SUCCESS') return '成功';
  if (status === 'FAILED') return '失败';
  if (status === 'WARNING') return '警告';
  return '信息';
}

export function approvalAuditTone(status: ApprovalAuditEventStatus) {
  if (status === 'SUCCESS') return 'healthy';
  if (status === 'FAILED') return 'unavailable';
  if (status === 'WARNING') return 'degraded';
  return 'planned';
}

export function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function normalizeApprovalAuditWindow(value: string | null | undefined): ApprovalAuditWindow {
  if (value === '7d' || value === '30d') return value;
  return '24h';
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

export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-md border bg-muted/15 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="break-words text-sm font-medium">{value}</div>
    </div>
  );
}

export function JsonPreviewCard({ title, value }: { title: string; value: unknown }) {
  return (
    <Card className="grid gap-3 bg-slate-950 p-5">
      <div className="text-sm font-semibold text-slate-100">{title}</div>
      <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-slate-100">
        {JSON.stringify(value ?? {}, null, 2)}
      </pre>
    </Card>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-sm font-semibold">{children}</h2>;
}

export function ApprovalAuditConfirmDialog({
  body,
  confirmLabel,
  onCancel,
  onConfirm,
  pending,
  title,
}: {
  body: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 px-4 backdrop-blur-sm">
      <Card className="w-full max-w-md p-5 shadow-xl">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={onCancel} type="button" variant="outline">
            取消
          </Button>
          <Button disabled={pending} onClick={onConfirm} type="button" variant="destructive">
            {confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function downloadBlob(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
