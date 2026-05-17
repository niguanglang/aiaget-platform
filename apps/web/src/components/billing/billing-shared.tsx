'use client';

import type {
  BillingAdjustmentStatus,
  BillingAdjustmentType,
  BillingApiKeyQuotaItem,
  BillingCycle,
  BillingInvoiceItem,
  BillingPlanItem,
  BillingQuotaAction,
  BillingQuotaMetricType,
  BillingQuotaPolicyStatus,
  BillingQuotaRiskLevel,
  BillingQuotaSubjectType,
  BillingSubscriptionStatus,
  BillingWindow,
  CreateBillingAdjustmentInput,
  UpdateBillingQuotaPolicyInput,
} from '@aiaget/shared-types';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';

export const billingWindows: BillingWindow[] = ['24h', '7d'];
export const quotaActions: BillingQuotaAction[] = ['WARN', 'THROTTLE', 'REQUIRE_APPROVAL', 'BLOCK'];
export const quotaPolicyStatuses: Exclude<BillingQuotaPolicyStatus, 'DELETED'>[] = ['ACTIVE', 'DISABLED'];
export const adjustmentTypes: BillingAdjustmentType[] = ['CREDIT', 'DEBIT', 'REFUND', 'DISCOUNT', 'CORRECTION'];
export const invoiceStatusFilters: InvoiceStatusFilter[] = ['ALL', 'DRAFT', 'OPEN', 'PAID', 'OVERDUE', 'VOID'];

export const riskLabels: Record<BillingQuotaRiskLevel, string> = {
  NORMAL: '正常',
  WARNING: '预警',
  CRITICAL: '高危',
  UNLIMITED: '未设额度',
};

export const subscriptionStatusLabels: Record<BillingSubscriptionStatus, string> = {
  TRIALING: '试用中',
  ACTIVE: '生效中',
  PAST_DUE: '已逾期',
  SUSPENDED: '已暂停',
  CANCELED: '已取消',
};

export const invoiceStatusLabels: Record<BillingInvoiceItem['status'], string> = {
  DRAFT: '草稿',
  OPEN: '待支付',
  PAID: '已支付',
  VOID: '已作废',
  OVERDUE: '已逾期',
};

export const adjustmentTypeLabels: Record<BillingAdjustmentType, string> = {
  CREDIT: '减免',
  DEBIT: '补收',
  REFUND: '退款',
  DISCOUNT: '折扣',
  CORRECTION: '纠错',
};

export const adjustmentStatusLabels: Record<BillingAdjustmentStatus, string> = {
  PENDING: '待处理',
  APPROVED: '已批准',
  APPLIED: '已生效',
  REJECTED: '已拒绝',
  VOID: '已作废',
};

export const planTierLabels: Record<BillingPlanItem['tier'], string> = {
  FREE: '免费版',
  TEAM: '团队版',
  BUSINESS: '企业版',
  ENTERPRISE: '旗舰版',
};

export const billingCycleLabels: Record<BillingCycle, string> = {
  MONTHLY: '月付',
  YEARLY: '年付',
};

export const quotaSubjectLabels: Record<BillingQuotaSubjectType, string> = {
  TENANT: '租户',
  API_KEY: 'API Key',
  AGENT: 'Agent',
  MODEL: '模型',
  PLUGIN: '插件',
};

export const quotaMetricLabels: Record<BillingQuotaMetricType, string> = {
  COST: '成本',
  TOKEN: '词元',
  MODEL_CALL: '模型调用',
  API_CALL: '接口调用',
  AGENT_RUN: 'Agent 运行',
  STORAGE_GB: '存储',
};

export const quotaActionLabels: Record<BillingQuotaAction, string> = {
  WARN: '预警',
  THROTTLE: '限流',
  REQUIRE_APPROVAL: '需要审批',
  BLOCK: '阻断',
};

export const quotaPolicyStatusLabels: Record<BillingQuotaPolicyStatus, string> = {
  ACTIVE: '启用',
  DISABLED: '停用',
  DELETED: '已删除',
};

export type InvoiceStatusFilter = 'ALL' | BillingInvoiceItem['status'];
export type InvoiceAction = 'lock' | 'mark-paid' | 'void' | 'mark-overdue';
export type AdjustmentAction = 'approve' | 'apply' | 'void';

export interface QuotaPolicyDraft {
  limit_value: string;
  warn_threshold: string;
  hard_threshold: string;
  action: BillingQuotaAction;
  status: Exclude<BillingQuotaPolicyStatus, 'DELETED'>;
}

export interface AdjustmentDraft {
  invoice_id: string;
  type: BillingAdjustmentType;
  amount: string;
  reason: string;
  description: string;
}

export interface InvoiceLineItem {
  id: string;
  name: string;
  quantity: string;
  unit_price: number | null;
  amount: number;
  description: string;
}

export interface InvoiceSummary {
  outstanding_amount: number;
  line_item_total: number;
}

export function BillingWorkspaceHeader({
  actions,
  backHref,
  backLabel = '成本总览',
  badge,
  onWindowChange,
  title,
  windowValue,
}: {
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
  badge: string;
  description?: string;
  onWindowChange?: (value: BillingWindow) => void;
  title: string;
  windowValue?: BillingWindow;
}) {
  return (
    <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
      <div>
        {backHref ? (
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href={backHref}>
              <ArrowLeft className="size-4" />
              {backLabel}
            </Link>
          </Button>
        ) : null}
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatusBadge tone="ready">{badge}</StatusBadge>
        </div>
        <h1 className="text-2xl font-semibold">{title}</h1>
      </div>
      <div className="flex flex-wrap gap-2">
        {windowValue && onWindowChange ? (
          <div className="flex rounded-md border bg-background p-1">
            {billingWindows.map((item) => (
              <button
                className={`h-8 rounded px-3 text-sm transition-colors ${
                  windowValue === item ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                }`}
                key={item}
                onClick={() => onWindowChange(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        ) : null}
        {actions}
      </div>
    </section>
  );
}

export function RefreshButton({ loading, onClick }: { loading?: boolean; onClick: () => void }) {
  return (
    <Button disabled={loading} onClick={onClick} type="button" variant="outline">
      <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
      刷新
    </Button>
  );
}

export function PageError({ children }: { children: ReactNode }) {
  return <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{children}</div>;
}

export function ActionMessage({ children }: { children: ReactNode }) {
  return <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">{children}</div>;
}

export function BillingStatTile({ detail, label, value }: { detail?: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200/80 bg-white px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-2 truncate text-xl font-semibold">{value}</div>
      {detail ? <div className="mt-1 truncate text-xs text-muted-foreground">{detail}</div> : null}
    </div>
  );
}

export function BillingConfirmDialog({
  body,
  confirmLabel = '确认',
  onCancel,
  onConfirm,
  pending,
  title,
}: {
  body: ReactNode;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 px-4 backdrop-blur-sm">
      <Card className="w-full max-w-md p-5 shadow-lg">
        <h2 className="text-base font-semibold">{title}</h2>
        <div className="mt-3 text-sm leading-6 text-muted-foreground">{body}</div>
        <div className="mt-5 flex justify-end gap-2">
          <Button disabled={pending} onClick={onCancel} type="button" variant="outline">
            取消
          </Button>
          <Button disabled={pending} onClick={onConfirm} type="button" variant="destructive">
            {pending ? '处理中...' : confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
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

export function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="grid gap-1 text-xs text-muted-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function SegmentedSelect({
  disabled,
  label,
  onChange,
  options,
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <div className="grid gap-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            className={`h-8 rounded-md border px-3 text-xs transition-colors ${
              option.value === value ? 'border-primary/50 bg-primary/10 text-primary' : 'bg-background text-muted-foreground hover:bg-muted'
            }`}
            disabled={disabled}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function UsageMiniCard({ label, rate, total, usage }: { label: string; rate: number; total: string; usage: string }) {
  return (
    <div className="rounded-md border bg-muted/15 p-3">
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{formatPercent(rate)}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-background">
        <div className="h-full rounded-full bg-primary/50" style={{ width: `${Math.min(100, rate)}%` }} />
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        {usage} / {total}
      </div>
    </div>
  );
}

export function QuotaItem({ item }: { item: BillingApiKeyQuotaItem }) {
  const usage = item.usage_rate ?? 0;

  return (
    <div className="rounded-md border bg-muted/20 px-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{item.name}</span>
            <StatusBadge tone={riskTone(item.risk_level)}>{riskLabels[item.risk_level]}</StatusBadge>
          </div>
          <div className="mt-1 font-mono text-xs text-muted-foreground">{item.masked_key}</div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <div>{item.daily_quota ? `${item.used_count_today}/${item.daily_quota}` : '不限日额度'}</div>
          <div>{item.rate_limit_per_minute}/分钟</div>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-background">
        <div className="h-full rounded-full bg-primary/50" style={{ width: `${Math.min(100, usage)}%` }} />
      </div>
      <div className="mt-2 grid gap-1 text-xs text-muted-foreground md:grid-cols-3">
        <span>使用率：{item.usage_rate === null ? '未设额度' : formatPercent(item.usage_rate)}</span>
        <span>剩余：{item.remaining_today === null ? '不限' : formatInteger(item.remaining_today)}</span>
        <span>最近使用：{item.last_used_at ? formatDateTime(item.last_used_at) : '从未'}</span>
      </div>
    </div>
  );
}

export function riskTone(risk: BillingQuotaRiskLevel) {
  if (risk === 'CRITICAL') return 'unavailable';
  if (risk === 'WARNING') return 'degraded';
  if (risk === 'UNLIMITED') return 'planned';
  return 'healthy';
}

export function subscriptionStatusTone(status: BillingSubscriptionStatus) {
  if (status === 'ACTIVE' || status === 'TRIALING') return 'healthy';
  if (status === 'PAST_DUE') return 'degraded';
  if (status === 'SUSPENDED' || status === 'CANCELED') return 'unavailable';
  return 'planned';
}

export function invoiceTone(status: BillingInvoiceItem['status']) {
  if (status === 'PAID') return 'healthy';
  if (status === 'OPEN' || status === 'DRAFT') return 'planned';
  if (status === 'OVERDUE') return 'degraded';
  return 'unavailable';
}

export function adjustmentTypeTone(type: BillingAdjustmentType) {
  if (type === 'DEBIT') return 'degraded';
  if (type === 'CORRECTION') return 'mock';
  return 'healthy';
}

export function adjustmentStatusTone(status: BillingAdjustmentStatus) {
  if (status === 'APPROVED' || status === 'APPLIED') return 'healthy';
  if (status === 'PENDING') return 'planned';
  if (status === 'REJECTED' || status === 'VOID') return 'unavailable';
  return 'planned';
}

export function getInvoiceActions(status: BillingInvoiceItem['status']): Array<{ action: InvoiceAction; label: string }> {
  if (status === 'DRAFT') return [{ action: 'lock', label: '锁账' }, { action: 'void', label: '作废' }];
  if (status === 'OPEN') {
    return [
      { action: 'mark-paid', label: '标记已付' },
      { action: 'mark-overdue', label: '标记逾期' },
      { action: 'void', label: '作废' },
    ];
  }
  if (status === 'OVERDUE') return [{ action: 'mark-paid', label: '标记已付' }, { action: 'void', label: '作废' }];
  return [];
}

export function getAdjustmentActions(status: BillingAdjustmentStatus): Array<{ action: AdjustmentAction; label: string }> {
  if (status === 'PENDING') return [{ action: 'approve', label: '审批' }, { action: 'void', label: '作废' }];
  if (status === 'APPROVED') return [{ action: 'apply', label: '应用' }, { action: 'void', label: '作废' }];
  return [];
}

export function percentValue(usage: number, total: number) {
  if (!total) return 0;
  return Number(((usage / total) * 100).toFixed(1));
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN');
}

export function formatDateShort(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('zh-CN');
}

export function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined) return '-';
  return `$${value.toFixed(6)}`;
}

export function formatPercent(value: number | null | undefined) {
  return `${(value ?? 0).toFixed(1)}%`;
}

export function formatLatency(value: number | null | undefined) {
  if (value === null || value === undefined) return '-';
  return `${value} ms`;
}

export function formatInteger(value: number | null | undefined) {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('zh-CN').format(value);
}

export function formatCompact(value: number | null | undefined) {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('zh-CN', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export function formatQuotaValue(metricType: BillingQuotaMetricType, value: number) {
  if (metricType === 'COST') return formatMoney(value);
  if (metricType === 'STORAGE_GB') return `${formatInteger(value)} GB`;
  return formatInteger(value);
}

export function formatSignedMoney(value: number) {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${formatMoney(value)}`;
}

export function getOutstandingAmount(invoice: BillingInvoiceItem) {
  return Math.max(0, invoice.total_amount - invoice.paid_amount);
}

export function buildInvoiceSummary(invoice: BillingInvoiceItem): InvoiceSummary {
  const lineItems = parseInvoiceLineItems(invoice);

  return {
    outstanding_amount: getOutstandingAmount(invoice),
    line_item_total: lineItems.reduce((total, item) => total + item.amount, 0),
  };
}

export function countInvoicesByStatus(invoices: BillingInvoiceItem[]) {
  return invoices.reduce<Record<BillingInvoiceItem['status'], number>>(
    (counts, invoice) => {
      counts[invoice.status] += 1;
      return counts;
    },
    { DRAFT: 0, OPEN: 0, PAID: 0, VOID: 0, OVERDUE: 0 },
  );
}

export function parseInvoiceLineItems(invoice: BillingInvoiceItem): InvoiceLineItem[] {
  const rawItems = extractInvoiceLineItemRecords(invoice.line_items);
  const parsedItems = rawItems
    .map((item, index) => toInvoiceLineItem(item, index))
    .filter((item): item is InvoiceLineItem => item !== null);

  if (parsedItems.length > 0) return parsedItems;
  if (invoice.subtotal_amount === 0 && invoice.total_amount === 0) return [];

  return [
    {
      id: `${invoice.id}-subtotal`,
      name: '账单小计',
      quantity: '1',
      unit_price: invoice.subtotal_amount,
      amount: invoice.subtotal_amount,
      description: '后端未提供结构化账单项，按发票小计展示。',
    },
  ];
}

function extractInvoiceLineItemRecords(value: BillingInvoiceItem['line_items']): Record<string, unknown>[] {
  if (!value || typeof value !== 'object') return [];

  if (Array.isArray(value)) {
    return value.filter(isRecord);
  }

  const candidateKeys = ['items', 'line_items', 'lines', 'details'];
  for (const key of candidateKeys) {
    const candidate = value[key];
    if (Array.isArray(candidate)) return candidate.filter(isRecord);
  }

  return Object.values(value).filter(isRecord);
}

function toInvoiceLineItem(item: Record<string, unknown>, index: number): InvoiceLineItem | null {
  const amount = firstNumber(item, ['amount', 'total', 'total_amount', 'cost', 'subtotal']);
  if (amount === null) return null;
  const name = firstString(item, ['name', 'label', 'title', 'description', 'type']) ?? `账单项 ${index + 1}`;
  const quantity = firstNumber(item, ['quantity', 'qty', 'count', 'usage']);
  const unitPrice = firstNumber(item, ['unit_price', 'unitPrice', 'price', 'rate']);
  const description = firstString(item, ['description', 'remark', 'note', 'memo']) ?? '';

  return {
    id: firstString(item, ['id', 'key', 'code']) ?? `line-${index}`,
    name,
    quantity: quantity === null ? '-' : formatInteger(quantity),
    unit_price: unitPrice,
    amount,
    description: description === name ? '' : description,
  };
}

function firstString(item: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  }
  return null;
}

function firstNumber(item: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function toQuotaPolicyInput(draft: QuotaPolicyDraft): UpdateBillingQuotaPolicyInput | null {
  const limitValue = Number(draft.limit_value);
  const warnThreshold = Number(draft.warn_threshold);
  const hardThreshold = Number(draft.hard_threshold);
  if (
    !Number.isFinite(limitValue) ||
    !Number.isFinite(warnThreshold) ||
    !Number.isFinite(hardThreshold) ||
    limitValue < 0 ||
    warnThreshold < 0 ||
    hardThreshold < 0 ||
    warnThreshold > hardThreshold
  ) {
    return null;
  }

  return {
    limit_value: limitValue,
    warn_threshold: warnThreshold,
    hard_threshold: hardThreshold,
    action: draft.action,
    status: draft.status,
  };
}

export function defaultAdjustmentDraft(): AdjustmentDraft {
  return {
    invoice_id: '',
    type: 'CREDIT',
    amount: '',
    reason: '',
    description: '',
  };
}

export function toAdjustmentInput(draft: AdjustmentDraft): CreateBillingAdjustmentInput | null {
  const amount = Number(draft.amount);
  if (!Number.isFinite(amount) || amount <= 0 || draft.reason.trim().length < 2) return null;

  return {
    invoice_id: draft.invoice_id || null,
    type: draft.type,
    amount,
    reason: draft.reason.trim(),
    description: draft.description.trim() || null,
    status: 'PENDING',
  };
}
