'use client';

import type {
  AgentTeamFailurePolicy,
  AgentTeamHandoffPolicy,
  AgentTeamMode,
  AgentTeamRunReportArchiveApprovalItem,
  AgentTeamStatus,
} from '@aiaget/shared-types';

export const teamStatuses: AgentTeamStatus[] = ['DRAFT', 'ACTIVE', 'DISABLED', 'ARCHIVED'];
export const teamModes: AgentTeamMode[] = ['SEQUENTIAL', 'PARALLEL', 'SUPERVISOR'];
export const handoffPolicies: AgentTeamHandoffPolicy[] = ['AUTO', 'MANUAL', 'APPROVAL_REQUIRED'];
export const failurePolicies: AgentTeamFailurePolicy[] = [
  'MATCH_HANDOFF_POLICY',
  'STOP_ON_REQUIRED_FAILURE',
  'WAIT_HUMAN_ON_REQUIRED_FAILURE',
  'CONTINUE_OPTIONAL',
];

export function teamStatusLabel(status: AgentTeamStatus) {
  return ({ DRAFT: '草稿', ACTIVE: '启用', DISABLED: '停用', ARCHIVED: '归档' } as const)[status];
}

export function teamStatusTone(status: AgentTeamStatus) {
  return status === 'ACTIVE' ? 'healthy' : status === 'DRAFT' ? 'planned' : status === 'DISABLED' ? 'loading' : 'degraded';
}

export function teamModeLabel(mode: AgentTeamMode) {
  return ({ SEQUENTIAL: '顺序执行', PARALLEL: '并行协作', SUPERVISOR: '主管调度' } as const)[mode];
}

export function handoffPolicyLabel(policy: AgentTeamHandoffPolicy) {
  return ({ AUTO: '自动接力', MANUAL: '人工接力', APPROVAL_REQUIRED: '接力需审批' } as const)[policy];
}

export function failurePolicyLabel(policy: AgentTeamFailurePolicy) {
  return ({
    MATCH_HANDOFF_POLICY: '跟随接力策略',
    STOP_ON_REQUIRED_FAILURE: '必选失败即终止',
    WAIT_HUMAN_ON_REQUIRED_FAILURE: '必选失败等人工',
    CONTINUE_OPTIONAL: '允许继续调度',
  } as const)[policy];
}

export function teamRunStatusLabel(status: string) {
  return ({
    QUEUED: '排队中',
    RUNNING: '运行中',
    WAITING_HUMAN: '等待接管',
    SUCCESS: '成功',
    FAILED: '失败',
    CANCELLED: '已取消',
  } as Record<string, string>)[status] ?? status;
}

export function teamRunStatusTone(status: string) {
  if (status === 'SUCCESS') return 'healthy';
  if (status === 'FAILED' || status === 'CANCELLED') return 'unavailable';
  if (status === 'WAITING_HUMAN') return 'degraded';
  if (status === 'RUNNING') return 'ready';
  return 'planned';
}

export function handoffStatusLabel(status: string) {
  return ({ PENDING: '待处理', APPROVED: '已通过', REJECTED: '已拒绝', AUTO: '自动接力' } as Record<string, string>)[status] ?? status;
}

export function handoffStatusTone(status: string) {
  if (status === 'APPROVED' || status === 'AUTO') return 'healthy';
  if (status === 'REJECTED') return 'unavailable';
  return 'degraded';
}

export function archiveApprovalStatusLabel(status: AgentTeamRunReportArchiveApprovalItem['status']) {
  return ({ PENDING: '待审批', APPROVED: '已通过', REJECTED: '已拒绝', APPLIED: '已删除' } as const)[status];
}

export function archiveApprovalStatusTone(status: AgentTeamRunReportArchiveApprovalItem['status']) {
  if (status === 'APPLIED' || status === 'APPROVED') return 'healthy';
  if (status === 'REJECTED') return 'unavailable';
  return 'degraded';
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatInteger(value: number | null | undefined) {
  return new Intl.NumberFormat('zh-CN').format(value ?? 0);
}

export function formatMoney(value: number | null | undefined) {
  return `$${new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 6,
    minimumFractionDigits: 0,
  }).format(value ?? 0)}`;
}

export function formatLatency(value: number | null | undefined) {
  if (!value) return '0 ms';
  if (value < 1000) return `${Math.round(value)} ms`;
  return `${(value / 1000).toFixed(2)} s`;
}

export function formatBytes(value: number | null | undefined) {
  if (!value || value <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function nullableText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-md border bg-muted/30 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="break-words font-medium">{value}</div>
    </div>
  );
}

export function LoadingPanel({ text }: { text: string }) {
  return <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">{text}</div>;
}

export function ErrorPanel({ text }: { text: string }) {
  return <div className="rounded-lg border bg-background p-6 text-sm text-destructive">{text}</div>;
}

