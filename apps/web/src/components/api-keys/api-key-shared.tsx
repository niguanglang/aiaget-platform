'use client';

import type {
  AgentListItem,
  ExternalApiCallLogItem,
  ExternalApiObservabilityWindow,
  ExternalApiQuotaRiskLevel,
  TenantApiKeyListItem,
  TenantStatus,
  WebhookDeliveryStatus,
} from '@aiaget/shared-types';
import { AlertTriangle, Edit, KeyRound, PauseCircle, PlayCircle, ShieldCheck, Trash2 } from 'lucide-react';
import Link from 'next/link';

import { formatDateTime } from '@/components/agents/agent-status';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { hasPermission } from '@aiaget/shared-types';

export type ApiKeyFormValues = {
  name: string;
  scopes: string[];
  allowed_agent_ids?: string[];
  ip_allowlist_text?: string;
  rate_limit_per_minute: string;
  daily_quota?: string;
  allow_stream: boolean;
  webhook_enabled: boolean;
  webhook_url?: string;
  webhook_secret?: string;
  expires_at?: string;
};

export type QuotaRisk = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'UNLIMITED';

export const windowOptions: Array<{ label: string; value: ExternalApiObservabilityWindow }> = [
  { label: '近 24 小时', value: '24h' },
  { label: '近 7 天', value: '7d' },
];

const tenantStatusLabels: Record<TenantStatus, string> = {
  ACTIVE: '启用',
  DISABLED: '停用',
  DELETED: '已删除',
};

const riskLabels: Record<QuotaRisk, string> = {
  NORMAL: '正常',
  WARNING: '预警',
  CRITICAL: '高危',
  UNLIMITED: '未设额度',
};

export function useCanManageApiKeys() {
  const { currentUser } = useAuth();

  return Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'system:api_key:manage'),
  );
}

export function NoticeBanner({ message }: { message: string | null }) {
  return message ? <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div> : null;
}

export function ErrorBanner({ message }: { message: string | null }) {
  return message ? <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{message}</div> : null;
}

export function ApiKeyRow({
  agents,
  apiKey,
  canManage,
  onDisable,
  onDelete,
  onEnable,
  onRotate,
}: {
  agents: AgentListItem[];
  apiKey: TenantApiKeyListItem;
  canManage: boolean;
  onDisable: () => void;
  onDelete: () => void;
  onEnable: () => void;
  onRotate: () => void;
}) {
  const risk = quotaRisk(apiKey);

  return (
    <div className="grid gap-4 rounded-md border bg-background/90 p-4 shadow-sm transition-colors hover:bg-muted/10 xl:grid-cols-[minmax(0,1fr)_220px_auto]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold">{apiKey.name}</h3>
          <StatusBadge tone={statusTone(apiKey.status)}>{tenantStatusLabel(apiKey.status)}</StatusBadge>
          <StatusBadge tone={riskTone(risk)}>{riskLabels[risk]}</StatusBadge>
          {apiKey.allow_stream ? <StatusBadge tone="ready">流式</StatusBadge> : null}
          {apiKey.webhook_enabled ? <StatusBadge tone={webhookTone(apiKey.webhook_last_status)}>Webhook</StatusBadge> : null}
        </div>
        <div className="mt-2 break-all font-mono text-xs text-muted-foreground">{apiKey.masked_key}</div>
        <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
          <span>范围：{apiKey.scopes.join('、') || '未配置'}</span>
          <span>Agent：{formatAllowedAgents(apiKey.allowed_agent_ids, agents)}</span>
          <span>IP：{apiKey.ip_allowlist.length > 0 ? apiKey.ip_allowlist.join('、') : '不限'}</span>
          <span>创建：{formatDateTime(apiKey.created_at)}</span>
          <span>Webhook：{apiKey.webhook_enabled ? formatWebhookTarget(apiKey.webhook_url) : '未启用'}</span>
          <span>签名：{apiKey.webhook_secret_configured ? '已配置' : '未配置'}</span>
        </div>
      </div>

      <div className="grid gap-2 rounded-md border bg-muted/20 px-3 py-2 text-xs">
        <DetailRow label="分钟限流" value={`${apiKey.rate_limit_per_minute}/分钟`} />
        <DetailRow label="日额度" value={formatQuota(apiKey)} />
        <DetailRow label="最近使用" value={apiKey.last_used_at ? formatDateTime(apiKey.last_used_at) : '从未'} />
        <DetailRow label="回调状态" value={formatWebhookDelivery(apiKey)} />
      </div>

      <div className="flex flex-wrap items-start justify-end gap-2">
        <Button asChild disabled={!canManage} size="sm" type="button" variant="outline">
          <Link href={`/api-keys/${apiKey.id}/edit`}>
            <Edit className="size-4" />
            编辑
          </Link>
        </Button>
        {apiKey.status === 'ACTIVE' ? (
          <Button disabled={!canManage} onClick={onDisable} size="sm" type="button" variant="outline">
            <PauseCircle className="size-4" />
            停用
          </Button>
        ) : (
          <Button disabled={!canManage || apiKey.status === 'DELETED'} onClick={onEnable} size="sm" type="button" variant="outline">
            <PlayCircle className="size-4" />
            启用
          </Button>
        )}
        <Button disabled={!canManage || apiKey.status === 'DELETED'} onClick={onRotate} size="sm" type="button" variant="outline">
          <KeyRound className="size-4" />
          轮换
        </Button>
        <Button disabled={!canManage} onClick={onDelete} size="sm" type="button" variant="outline">
          <Trash2 className="size-4" />
          删除
        </Button>
      </div>
    </div>
  );
}

export function GovernanceCard({ canManage }: { canManage: boolean }) {
  return (
    <Card className="h-fit p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <ShieldCheck className="size-4 text-primary" />
        外部调用治理
      </div>
      <div className="mt-4 grid gap-3 text-sm">
        <GovernanceItem title="密钥只展示一次" description="创建成功后立即保存明文密钥，后续仅显示脱敏前缀。" />
        <GovernanceItem title="Agent 白名单优先" description="生产集成建议绑定到指定 Agent，避免一枚密钥覆盖全部能力。" />
        <GovernanceItem title="额度和 IP 双限制" description="用日额度、分钟限流和 IP 白名单共同降低外部调用风险。" />
        <GovernanceItem title="后端权限校验" description="scope、数据范围、资源授权。" />
        <GovernanceItem title="Webhook 异步投递" description="完成回调失败只记录投递状态，不阻塞外部调用主响应。" />
      </div>
      <div className="mt-5 rounded-md border bg-muted/20 p-3 text-xs leading-6 text-muted-foreground">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <AlertTriangle className="size-4 text-amber-600" />
          当前权限
        </div>
        <div className="mt-2">{canManage ? '允许创建和删除外部调用密钥。' : '只读权限。'}</div>
      </div>
    </Card>
  );
}

function GovernanceItem({ description, title }: { description: string; title: string }) {
  return (
    <div className="rounded-md border bg-muted/20 px-3 py-2">
      <div className="font-medium">{title}</div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
    </div>
  );
}

export function Field({ children, label, message }: { children: React.ReactNode; label: string; message?: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      {children}
      {message ? <span className="text-xs text-destructive">{message}</span> : null}
    </label>
  );
}

export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium text-foreground">{value}</div>
    </div>
  );
}

export function ConfirmDialog({
  body,
  pending,
  title,
  onCancel,
  onConfirm,
}: {
  body: string;
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
          <Button onClick={onCancel} type="button" variant="outline">取消</Button>
          <Button disabled={pending} onClick={onConfirm} type="button" variant="destructive">确认</Button>
        </div>
      </div>
    </section>
  );
}

export function nullableText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function nullableNumber(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const numberValue = Number(trimmed);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
}

export function parseLines(value?: string) {
  return Array.from(new Set((value ?? '').split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean)));
}

export function normalizedScopes(scopes: string[], allowStream: boolean) {
  const output = new Set(scopes);
  if (allowStream) output.add('external:agent:stream');
  return Array.from(output);
}

export function formatAllowedAgents(agentIds: string[], agents: AgentListItem[]) {
  if (agentIds.length === 0) return '全部有权 Agent';
  const agentNameById = new Map(agents.map((agent) => [agent.id, agent.name]));
  return agentIds.map((id) => agentNameById.get(id) ?? id).join('、');
}

export function quotaRisk(apiKey: TenantApiKeyListItem): QuotaRisk {
  if (!apiKey.daily_quota) return 'UNLIMITED';
  const ratio = apiKey.used_count_today / apiKey.daily_quota;
  if (ratio >= 0.95) return 'CRITICAL';
  if (ratio >= 0.8) return 'WARNING';
  return 'NORMAL';
}

export function riskTone(risk: QuotaRisk) {
  if (risk === 'CRITICAL') return 'unavailable';
  if (risk === 'WARNING') return 'degraded';
  if (risk === 'UNLIMITED') return 'planned';
  return 'healthy';
}

export function statusTone(status: TenantStatus) {
  if (status === 'ACTIVE') return 'healthy';
  if (status === 'DISABLED') return 'degraded';
  return 'unavailable';
}

export function tenantStatusLabel(status: TenantStatus) {
  return tenantStatusLabels[status] ?? status;
}

export function webhookTone(status: TenantApiKeyListItem['webhook_last_status'] | null) {
  if (status === 'SUCCESS') return 'healthy';
  if (status === 'FAILED') return 'unavailable';
  return 'planned';
}

export function formatWebhookTarget(value: string | null) {
  if (!value) return '未配置地址';
  try {
    const url = new URL(value);
    return `${url.host}${url.pathname}`;
  } catch {
    return value;
  }
}

export function webhookDeliveryTone(status: WebhookDeliveryStatus) {
  if (status === 'SUCCESS') return 'healthy';
  if (status === 'FAILED') return 'unavailable';
  if (status === 'RETRYING') return 'degraded';
  return 'planned';
}

export function webhookDeliveryLabel(status: WebhookDeliveryStatus) {
  const labels: Record<WebhookDeliveryStatus, string> = {
    SUCCESS: '成功',
    FAILED: '失败',
    PENDING: '待投递',
    RETRYING: '重试中',
  };

  return labels[status] ?? status;
}

export function stringifyPretty(value: unknown) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return value;

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function formatWebhookDelivery(apiKey: TenantApiKeyListItem) {
  if (!apiKey.webhook_enabled) return '未启用';
  if (!apiKey.webhook_last_status) return '暂无投递';

  const statusLabels: Record<NonNullable<TenantApiKeyListItem['webhook_last_status']>, string> = {
    SUCCESS: '成功',
    FAILED: '失败',
    SKIPPED: '跳过',
  };
  const time = apiKey.webhook_last_sent_at ? formatDateTime(apiKey.webhook_last_sent_at) : '未知时间';
  const error = apiKey.webhook_last_error ? `：${apiKey.webhook_last_error}` : '';

  return `${statusLabels[apiKey.webhook_last_status]} · ${time}${error}`;
}

export function formatQuota(apiKey: TenantApiKeyListItem) {
  if (!apiKey.daily_quota) return '不限';
  return `${apiKey.used_count_today}/${apiKey.daily_quota}`;
}

export function isWithinDays(value: string | null, days: number) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() <= days * 24 * 60 * 60 * 1000;
}

export function formatInteger(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-';
  return new Intl.NumberFormat('zh-CN').format(value);
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-';
  return `${new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 1 }).format(value)}%`;
}

export function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-';
  return `¥${new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 6,
    minimumFractionDigits: value > 0 && value < 0.01 ? 6 : 2,
  }).format(value)}`;
}

export function formatLatency(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-';
  if (value >= 1000) return `${(value / 1000).toFixed(2)} 秒`;
  return `${Math.round(value)} 毫秒`;
}

export function average(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function isNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function windowLabel(window: ExternalApiObservabilityWindow) {
  return window === '7d' ? '近 7 天' : '近 24 小时';
}

export function callStatusTone(status: ExternalApiCallLogItem['status']) {
  if (status === 'SUCCESS') return 'healthy';
  if (status === 'DEGRADED') return 'degraded';
  return 'unavailable';
}

export function callStatusLabel(status: ExternalApiCallLogItem['status']) {
  const labels: Record<ExternalApiCallLogItem['status'], string> = {
    SUCCESS: '成功',
    DEGRADED: '异常',
    FAILED: '失败',
  };

  return labels[status] ?? status;
}

export function quotaRiskTone(risk: ExternalApiQuotaRiskLevel) {
  if (risk === 'CRITICAL') return 'unavailable';
  if (risk === 'WARNING') return 'degraded';
  if (risk === 'UNLIMITED') return 'planned';
  return 'healthy';
}

export function quotaRiskLabel(risk: ExternalApiQuotaRiskLevel) {
  const labels: Record<ExternalApiQuotaRiskLevel, string> = {
    NORMAL: '正常',
    WARNING: '预警',
    CRITICAL: '高危',
    UNLIMITED: '未设额度',
  };

  return labels[risk] ?? risk;
}
