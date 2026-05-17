'use client';

import {
  type NotificationPolicyChangePreview,
  type NotificationPolicyImpactLevel,
  type SystemSettingCategory,
  type SystemSettingItem,
  type SystemSettingSnapshotAction,
  type SystemSettingSnapshotApprovalStatus,
  type SystemSettingStatus,
  type SystemSettingValueType,
} from '@aiaget/shared-types';
import { RefreshCw, Save } from 'lucide-react';
import type { ReactNode } from 'react';

import { formatDateTime } from '@/components/agents/agent-status';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';

export const settingCategoryLabels: Record<SystemSettingCategory, string> = {
  GENERAL: '基础',
  SECURITY: '安全',
  RUNTIME: '运行时',
  OBSERVABILITY: '观测',
  NOTIFICATION: '通知策略',
  RETENTION: '数据保留',
  INTEGRATION: '外部集成',
};

export const settingStatusLabels: Record<SystemSettingStatus, string> = {
  ACTIVE: '启用',
  DISABLED: '停用',
  DELETED: '已删除',
};

export const settingValueTypeLabels: Record<SystemSettingValueType, string> = {
  STRING: '文本',
  NUMBER: '数字',
  BOOLEAN: '开关',
  JSON: 'JSON',
  SELECT: '选项',
};

export function defaultSettingCategorySummaries() {
  return (Object.entries(settingCategoryLabels) as Array<[SystemSettingCategory, string]>).map(([category, label]) => ({
    category,
    label,
    total: 0,
    active: 0,
    changed: 0,
  }));
}

export function SettingsPageShell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto grid max-w-[1680px] gap-6 rounded-xl border border-slate-200/80 bg-white/[0.9] px-4 py-6 lg:px-6">
      {children}
    </main>
  );
}

export function SettingsStatTile({ detail, label, value }: { detail?: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200/80 bg-white px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-2 truncate text-xl font-semibold">{value}</div>
      {detail ? <div className="mt-1 truncate text-xs text-muted-foreground">{detail}</div> : null}
    </div>
  );
}

export function normalizeSettingCategory(value: string | null): SystemSettingCategory | '' {
  if (!value) return '';
  const categories = Object.keys(settingCategoryLabels) as SystemSettingCategory[];
  return categories.includes(value as SystemSettingCategory) ? (value as SystemSettingCategory) : '';
}

export function formatSettingDraftValue(setting: SystemSettingItem) {
  if (setting.is_secret && setting.value === '') return '';
  if (setting.value_type === 'JSON') return JSON.stringify(setting.value ?? {}, null, 2);
  if (setting.value_type === 'BOOLEAN') return setting.value === true ? 'true' : 'false';
  if (setting.value_type === 'SELECT') {
    if (typeof setting.value === 'string' || typeof setting.value === 'number' || typeof setting.value === 'boolean') {
      return serializeSelectOptionValue(setting.value);
    }

    return '';
  }
  if (setting.value === null || setting.value === undefined) return '';
  return String(setting.value);
}

export function parseSettingDraftValue(setting: SystemSettingItem, value: string): { ok: true; value: unknown } | { ok: false; message: string } {
  if (setting.value_type === 'STRING' || setting.value_type === 'SELECT') {
    if (setting.value_type === 'SELECT') {
      const option = setting.options.find((item) => serializeSelectOptionValue(item.value) === value);
      return option ? { ok: true, value: option.value } : { ok: false, message: '请选择有效选项。' };
    }

    return { ok: true, value };
  }

  if (setting.value_type === 'NUMBER') {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) {
      return { ok: false, message: '请输入有效数字。' };
    }

    return { ok: true, value: numberValue };
  }

  if (setting.value_type === 'BOOLEAN') {
    return { ok: true, value: value === 'true' };
  }

  try {
    return { ok: true, value: JSON.parse(value) as unknown };
  } catch {
    return { ok: false, message: '请输入有效 JSON。' };
  }
}

export function isSameSettingValue(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function formatSettingDisplayValue(value: unknown, valueType: SystemSettingValueType, secret: boolean) {
  if (secret && value) return '已脱敏';
  if (valueType === 'JSON') return JSON.stringify(value);
  if (value === true) return '开启';
  if (value === false) return '关闭';
  if (value === null || value === undefined || value === '') return '空';
  return String(value);
}

export function settingStatusTone(status: SystemSettingStatus) {
  if (status === 'ACTIVE') return 'healthy';
  if (status === 'DISABLED') return 'degraded';
  return 'unavailable';
}

export function CategoryButton({
  active,
  count,
  label,
  onClick,
}: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex h-9 items-center justify-between rounded-md border px-3 text-left text-sm transition-colors ${
        active ? 'border-primary bg-primary/5 text-primary' : 'bg-background hover:bg-muted/50'
      }`}
      onClick={onClick}
      type="button"
    >
      <span>{label}</span>
      <span className="text-xs text-muted-foreground">{count}</span>
    </button>
  );
}

export function SystemSettingCard({
  canManage,
  draftValue,
  error,
  isPending,
  preview,
  previewError,
  previewLoading,
  setting,
  statusValue,
  success,
  successMessage,
  onDraftChange,
  onPreview,
  onReset,
  onSave,
  onStatusChange,
}: {
  canManage: boolean;
  draftValue: string;
  error?: string;
  isPending: boolean;
  preview?: NotificationPolicyChangePreview | null;
  previewError?: string;
  previewLoading?: boolean;
  setting: SystemSettingItem;
  statusValue: 'ACTIVE' | 'DISABLED';
  success: boolean;
  successMessage?: string;
  onDraftChange: (value: string) => void;
  onPreview?: () => void;
  onReset: () => void;
  onSave: () => void;
  onStatusChange: (value: 'ACTIVE' | 'DISABLED') => void;
}) {
  const changed = draftValue !== formatSettingDraftValue(setting) || statusValue !== (setting.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE');
  const disabled = !canManage || isPending;

  return (
    <div className="grid gap-4 rounded-md border bg-background/90 p-4 shadow-sm transition-colors hover:bg-muted/10 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold">{setting.name}</h3>
          <StatusBadge tone={settingStatusTone(setting.status)}>{settingStatusLabels[setting.status]}</StatusBadge>
          <StatusBadge tone="planned">{settingCategoryLabels[setting.category]}</StatusBadge>
          {setting.is_secret ? <StatusBadge tone="degraded">敏感</StatusBadge> : null}
          {changed ? <StatusBadge tone="loading">未保存</StatusBadge> : null}
        </div>
        <div className="mt-2 font-mono text-xs text-muted-foreground">{setting.key}</div>
        {setting.description ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{setting.description}</p> : null}
        <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
          <span>类型：{settingValueTypeLabels[setting.value_type]}</span>
          <span>默认：{formatSettingDisplayValue(setting.default_value, setting.value_type, setting.is_secret)}</span>
          <span>更新：{formatDateTime(setting.updated_at)}</span>
        </div>
      </div>

      <div className="grid gap-3">
        {renderSettingInput(setting, draftValue, disabled, onDraftChange)}
        <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            disabled={disabled}
            onChange={(event) => onStatusChange(event.target.value as 'ACTIVE' | 'DISABLED')}
            value={statusValue}
          >
            <option value="ACTIVE">启用</option>
            <option value="DISABLED">停用</option>
          </select>
          <Button disabled={disabled || !changed} onClick={onSave} size="sm" type="button">
            <Save className="size-4" />
            保存
          </Button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <Button disabled={disabled || isSameSettingValue(setting.value, setting.default_value)} onClick={onReset} size="sm" type="button" variant="outline">
            <RefreshCw className="size-4" />
            恢复默认
          </Button>
          <span className="text-xs text-muted-foreground">{setting.updated_by?.name ?? '系统'}</span>
        </div>
        {setting.category === 'NOTIFICATION' && onPreview ? (
          <div className="grid gap-2 rounded-md border bg-muted/20 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-medium">变更影响预览</div>
              <Button disabled={!changed || Boolean(previewLoading)} onClick={onPreview} size="sm" type="button" variant="outline">
                {previewLoading ? '预览中' : '预览影响'}
              </Button>
            </div>
            {preview ? (
              <NotificationPolicyPreview preview={preview} />
            ) : (
              <p className="text-xs leading-5 text-muted-foreground">
                保存前可预览对自动重试任务、失败投递积压和最近配置变更的影响。
              </p>
            )}
            {previewError ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {previewError}
              </div>
            ) : null}
          </div>
        ) : null}
        {error ? <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</div> : null}
        {success ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            {successMessage ?? '参数已保存。'}
          </div>
        ) : null}
        {!canManage ? <div className="text-xs text-muted-foreground">当前账号没有系统参数管理权限。</div> : null}
      </div>
    </div>
  );
}

function renderSettingInput(
  setting: SystemSettingItem,
  value: string,
  disabled: boolean,
  onChange: (value: string) => void,
) {
  const baseClass = 'rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring';

  if (setting.value_type === 'BOOLEAN') {
    return (
      <label className="flex h-10 items-center gap-2 rounded-md border bg-background px-3 text-sm">
        <input checked={value === 'true'} disabled={disabled} onChange={(event) => onChange(event.target.checked ? 'true' : 'false')} type="checkbox" />
        {value === 'true' ? '已开启' : '已关闭'}
      </label>
    );
  }

  if (setting.value_type === 'SELECT') {
    return (
      <select className={`h-10 ${baseClass}`} disabled={disabled} onChange={(event) => onChange(event.target.value)} value={value}>
        {setting.options.length === 0 ? <option value="">未配置选项</option> : null}
        {setting.options.map((option) => {
          const optionValue = serializeSelectOptionValue(option.value);

          return (
            <option key={optionValue} value={optionValue}>
              {option.label}
            </option>
          );
        })}
      </select>
    );
  }

  if (setting.value_type === 'JSON') {
    return (
      <textarea
        className={`min-h-24 py-2 font-mono ${baseClass}`}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    );
  }

  return (
    <input
      className={`h-10 ${baseClass}`}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      placeholder={setting.is_secret ? '敏感值为空时表示未配置' : undefined}
      type={setting.is_secret ? 'password' : setting.value_type === 'NUMBER' ? 'number' : 'text'}
      value={value}
    />
  );
}

function NotificationPolicyPreview({ preview }: { preview: NotificationPolicyChangePreview }) {
  return (
    <div className="grid gap-3 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone={notificationPolicyImpactTone(preview.impact_level)}>
          {notificationPolicyImpactLabel(preview.impact_level)}
        </StatusBadge>
        <span className="text-muted-foreground">
          变更项：{preview.changed_fields.length > 0 ? preview.changed_fields.join('、') : '无'}
        </span>
      </div>
      <p className="leading-5 text-muted-foreground">{preview.impact_summary}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <DetailRow label="待自动通知" value={`${preview.task_snapshot.pending_auto_notify_count} 条`} />
        <DetailRow label="已首发覆盖" value={`${preview.task_snapshot.auto_notified_count} 条`} />
        <DetailRow label="待自动重试" value={`${preview.task_snapshot.pending_auto_retry_count} 条`} />
        <DetailRow label="失败/部分成功" value={`${preview.task_snapshot.failed_notification_count}/${preview.task_snapshot.partial_notification_count} 条`} />
        <DetailRow label="已重试" value={`${preview.task_snapshot.retried_notification_count} 条`} />
        <DetailRow label="近 7 天变更" value={`${preview.recent_change_count} 次`} />
      </div>
      {preview.warnings.length > 0 ? (
        <div className="grid gap-1 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
          {preview.warnings.slice(0, 3).map((warning) => (
            <div key={warning}>{warning}</div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function notificationPolicyImpactTone(level: NotificationPolicyImpactLevel) {
  if (level === 'HIGH') return 'unavailable';
  if (level === 'MEDIUM') return 'degraded';
  return 'healthy';
}

export function notificationPolicyImpactLabel(level: NotificationPolicyImpactLevel) {
  if (level === 'HIGH') return '高影响';
  if (level === 'MEDIUM') return '中影响';
  return '低影响';
}

export function notificationPolicySettingLabel(key: string | null) {
  const labels: Record<string, string> = {
    alert_notification_auto_notify_enabled: '告警首发自动通知',
    alert_notification_auto_notify_interval_ms: '首发通知扫描间隔',
    alert_notification_auto_notify_batch_size: '单批通知数量',
    alert_notification_auto_retry_enabled: '告警通知自动重试',
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

  return key ? labels[key] ?? key : '未知策略';
}

export function snapshotActionTone(action: SystemSettingSnapshotAction) {
  if (action === 'ROLLBACK') return 'degraded';
  if (action === 'RESET') return 'mock';
  return 'planned';
}

export function snapshotActionLabel(action: SystemSettingSnapshotAction) {
  if (action === 'ROLLBACK') return '回滚';
  if (action === 'RESET') return '恢复默认';
  return '更新';
}

export function snapshotApprovalTone(status: SystemSettingSnapshotApprovalStatus) {
  if (status === 'PENDING') return 'degraded';
  if (status === 'REJECTED') return 'unavailable';
  if (status === 'APPROVED') return 'healthy';
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

export function formatSnapshotValue(value: unknown) {
  if (value === true) return '开启';
  if (value === false) return '关闭';
  if (value === null || value === undefined || value === '') return '空';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function serializeSelectOptionValue(value: string | number | boolean) {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-md border bg-muted/30 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="break-words font-medium">{value}</div>
    </div>
  );
}

export function ConfirmDialog({
  body,
  confirmLabel = '删除',
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
      <div className="w-full max-w-sm rounded-lg border bg-background p-6 shadow-xl">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={onCancel} variant="outline">取消</Button>
          <Button disabled={pending} onClick={onConfirm}>{pending ? '处理中' : confirmLabel}</Button>
        </div>
      </div>
    </section>
  );
}
