'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

import type {
  ChannelAdapterReadiness,
  ChannelCredentialRotationMetadata,
  ChannelOperationsListParams,
  ChannelOperationsListResult,
} from '@aiaget/shared-types';
import { hasPermission } from '@aiaget/shared-types';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Eye, MoreHorizontal, RefreshCw, Search, X } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/components/auth/auth-provider';
import { ChannelCenterBackground } from '@/components/channels/channel-center-background';
import { formatChannelDateTime } from '@/components/channels/channel-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';

export type ChannelFocusedRoute =
  | 'publish'
  | 'providers'
  | 'accounts'
  | 'templates'
  | 'route-rules'
  | 'jobs'
  | 'deliveries'
  | 'replies'
  | 'sender'
  | 'release';

export interface ChannelOperationMetric {
  helper: string;
  label: string;
  value: string;
}

export interface ChannelOperationStatusOption {
  label: string;
  value: string;
}

export interface ChannelPermissions {
  canDeploy: boolean;
  canDisable: boolean;
  canManage: boolean;
  canView: boolean;
}

export interface ChannelOperationDetail {
  label: string;
  value: ReactNode;
}

export interface ChannelOperationRowStat {
  label: string;
  value: string;
}

interface ChannelOperationsPageProps<TItem> {
  activeRoute: ChannelFocusedRoute;
  actionError?: string | null;
  actionNotice?: string | null;
  badge: string;
  buildMetrics: (input: { items: TItem[]; result: ChannelOperationsListResult<TItem> | undefined; total: number }) => ChannelOperationMetric[];
  description: string;
  emptyDescription: string;
  emptyTitle: string;
  errorMessage: string;
  getItemId: (item: TItem) => string;
  listQuery: (params: ChannelOperationsListParams) => Promise<ChannelOperationsListResult<TItem>>;
  headerActions?: ReactNode;
  pageSize?: number;
  providerFilterLabel?: string;
  queryKey: string;
  renderItem: (input: { item: TItem; permissions: ChannelPermissions; selected: boolean; onToggle: () => void }) => ReactNode;
  statusOptions?: ChannelOperationStatusOption[];
  subtitle: string;
  title: string;
}

const focusedNavItems: Array<{ href: string; label: string; route: ChannelFocusedRoute }> = [
  { href: '/channels/publish', label: '发布渠道', route: 'publish' },
  { href: '/channels/providers', label: '渠道提供方', route: 'providers' },
  { href: '/channels/accounts', label: '账号凭据', route: 'accounts' },
  { href: '/channels/templates', label: '消息模板', route: 'templates' },
  { href: '/channels/route-rules', label: '路由规则', route: 'route-rules' },
  { href: '/channels/jobs', label: '发布任务', route: 'jobs' },
  { href: '/channels/deliveries', label: '投递记录', route: 'deliveries' },
  { href: '/channels/replies', label: '回复记录', route: 'replies' },
  { href: '/channels/sender', label: 'Sender 投递', route: 'sender' },
  { href: '/channels/release', label: '发布治理', route: 'release' },
];

export function ChannelOperationsListPage<TItem>({
  activeRoute,
  actionError,
  actionNotice,
  badge,
  buildMetrics,
  description,
  emptyDescription,
  emptyTitle,
  errorMessage,
  getItemId,
  headerActions,
  listQuery,
  pageSize = 20,
  providerFilterLabel = '渠道提供方',
  queryKey,
  renderItem,
  statusOptions = [],
  subtitle,
  title,
}: ChannelOperationsPageProps<TItem>) {
  const permissions = useChannelOperationPermissions();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [provider, setProvider] = useState('');
  const [page, setPage] = useState(1);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const listParams = useMemo<ChannelOperationsListParams>(
    () => ({
      page,
      page_size: pageSize,
      keyword: keyword.trim() || undefined,
      status: status || undefined,
      provider: provider.trim() || undefined,
    }),
    [keyword, page, pageSize, provider, status],
  );

  const listResultQuery = useQuery({
    enabled: permissions.canView,
    queryKey: [queryKey, listParams],
    queryFn: () => listQuery(listParams),
  });

  const items = listResultQuery.data?.items ?? [];
  const total = listResultQuery.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const metrics = useMemo(
    () => buildMetrics({ items, result: listResultQuery.data, total }),
    [buildMetrics, items, listResultQuery.data, total],
  );

  function updateFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
    setSelectedItemId(null);
  }

  function clearFilters() {
    setKeyword('');
    setStatus('');
    setProvider('');
    setPage(1);
    setSelectedItemId(null);
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <ChannelCenterBackground />
      <ChannelFocusedHeader
        activeRoute={activeRoute}
        badge={badge}
        description={description}
        permissions={permissions}
        subtitle={subtitle}
        title={title}
        onRefresh={() => void listResultQuery.refetch()}
        refreshing={listResultQuery.isFetching}
      />

      {headerActions ? <div className="flex flex-wrap justify-end gap-2">{headerActions}</div> : null}

      <ChannelAlert tone="ready" message={actionNotice} />
      <ChannelAlert tone="error" message={actionError ?? (listResultQuery.isError ? errorMessage : null)} />

      {!permissions.canView ? (
        <PermissionDeniedCard />
      ) : (
        <>
          <ChannelMetricGrid loading={listResultQuery.isLoading} metrics={metrics} />
          <Card className="grid gap-4 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-sm font-semibold">{title}列表</h2>
                <p className="mt-1 text-sm text-muted-foreground">核心识别字段、状态、关键指标和单条记录操作。</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative min-w-56 flex-1 sm:flex-none">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    onChange={(event) => updateFilter(setKeyword, event.target.value)}
                    placeholder="搜索名称、编码、目标"
                    value={keyword}
                  />
                </div>
                {statusOptions.length > 0 ? (
                  <select
                    className="h-10 rounded-md border bg-background/80 px-3 text-sm"
                    onChange={(event) => updateFilter(setStatus, event.target.value)}
                    value={status}
                  >
                    <option value="">全部状态</option>
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : null}
                <Input
                  className="w-40"
                  onChange={(event) => updateFilter(setProvider, event.target.value)}
                  placeholder={providerFilterLabel}
                  value={provider}
                />
                <Button onClick={clearFilters} type="button" variant="outline">
                  <X className="size-4" />
                  重置
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>共 {formatNumber(total)} 条，当前第 {formatNumber(page)} / {formatNumber(pageCount)} 页</span>
              <div className="flex gap-2">
                <Button disabled={page <= 1 || listResultQuery.isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))} size="sm" type="button" variant="outline">
                  <ChevronLeft className="size-4" />
                  上一页
                </Button>
                <Button disabled={page >= pageCount || listResultQuery.isFetching} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} size="sm" type="button" variant="outline">
                  下一页
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            {listResultQuery.isLoading ? (
              <ChannelRowSkeleton />
            ) : items.length === 0 ? (
              <EmptyState description={emptyDescription} title={emptyTitle} />
            ) : (
              <div className="grid gap-3">
                {items.map((item) => {
                  const itemId = getItemId(item);
                  const selected = selectedItemId === itemId;
                  return (
                    <div key={itemId}>
                      {renderItem({
                        item,
                        permissions,
                        selected,
                        onToggle: () => setSelectedItemId((current) => (current === itemId ? null : itemId)),
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}
    </main>
  );
}

export function ChannelFocusedHeader({
  activeRoute,
  badge,
  description,
  permissions,
  refreshing,
  subtitle,
  title,
  onRefresh,
}: {
  activeRoute: ChannelFocusedRoute;
  badge: string;
  description: string;
  permissions: ChannelPermissions;
  refreshing: boolean;
  subtitle: string;
  title: string;
  onRefresh: () => void;
}) {
  return (
    <section className="grid gap-4">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">渠道运营</StatusBadge>
            <StatusBadge tone="mock">{badge}</StatusBadge>
            <StatusBadge tone={permissions.canManage ? 'healthy' : 'planned'}>
              {permissions.canManage ? '可配置' : '只读配置'}
            </StatusBadge>
            <StatusBadge tone={permissions.canDeploy ? 'healthy' : 'planned'}>
              {permissions.canDeploy ? '可执行' : '不可执行'}
            </StatusBadge>
          </div>
          <p className="text-xs font-medium text-muted-foreground">{subtitle}</p>
          <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={refreshing} onClick={onRefresh} type="button" variant="outline">
            <RefreshCw className="size-4" />
            刷新
          </Button>
          <Button asChild type="button" variant="outline">
            <Link href="/channels">返回总览</Link>
          </Button>
        </div>
      </div>

      <nav className="flex gap-2 overflow-x-auto rounded-lg border bg-background/80 p-2">
        {focusedNavItems.map((item) => (
          <Link
            className={
              item.route === activeRoute
                ? 'shrink-0 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground'
                : 'shrink-0 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
            }
            href={item.href}
            key={item.route}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </section>
  );
}

export function ChannelMetricGrid({ loading, metrics }: { loading: boolean; metrics: ChannelOperationMetric[] }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {loading
        ? Array.from({ length: 4 }).map((_, index) => <div className="h-24 rounded-lg border bg-muted/30" key={index} />)
        : metrics.map((metric) => <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />)}
    </section>
  );
}

export function ChannelOperationRow({
  actions,
  badges,
  details,
  onToggle,
  selected,
  stats,
  subtitle,
  title,
}: {
  actions?: ReactNode;
  badges?: ReactNode;
  details: ChannelOperationDetail[];
  selected: boolean;
  stats?: ChannelOperationRowStat[];
  subtitle: ReactNode;
  title: ReactNode;
  onToggle: () => void;
}) {
  return (
    <article className="rounded-md border bg-background/90 p-4 shadow-sm transition-colors hover:bg-muted/10">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {badges}
            <div className="truncate text-sm font-semibold">{title}</div>
          </div>
          <div className="mt-2 text-xs leading-5 text-muted-foreground">{subtitle}</div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-start gap-2 lg:justify-end">
          {stats?.map((stat) => (
            <StatusBadge key={stat.label} tone="mock">
              {stat.label} {stat.value}
            </StatusBadge>
          ))}
          <Button onClick={onToggle} size="sm" type="button" variant="outline">
            {selected ? <Eye className="size-4" /> : <MoreHorizontal className="size-4" />}
            {selected ? '收起' : '更多'}
          </Button>
        </div>
      </div>

      {selected ? (
        <div className="mt-4 border-t pt-4">
          <DetailGrid items={details} />
          {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      ) : null}
    </article>
  );
}

export function DetailGrid({ items }: { items: ChannelOperationDetail[] }) {
  return (
    <dl className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div className="rounded-md border bg-muted/20 p-3" key={item.label}>
          <dt className="text-xs text-muted-foreground">{item.label}</dt>
          <dd className="mt-1 break-words text-sm font-medium">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ChannelAlert({ message, tone }: { message?: string | null; tone: 'error' | 'ready' }) {
  if (!message) return null;

  return (
    <Card className={tone === 'error' ? 'border-destructive/30 p-4 text-sm text-destructive' : 'border-emerald-200 p-4 text-sm text-emerald-700'}>
      {message}
    </Card>
  );
}

export function ChannelActionConfirmDialog({
  body,
  confirmLabel = '确认',
  onCancel,
  onConfirm,
  pending,
  title,
  variant = 'default',
}: {
  body: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
  title: string;
  variant?: 'default' | 'destructive';
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 px-4 backdrop-blur-sm">
      <Card className="w-full max-w-md p-5 shadow-lg">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={onCancel} type="button" variant="outline">
            取消
          </Button>
          <Button disabled={pending} onClick={onConfirm} type="button" variant={variant}>
            {confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function ChannelOperationStatusBadge({ status }: { status: string | null | undefined }) {
  const normalized = status ?? 'UNKNOWN';

  return <StatusBadge tone={channelOperationStatusTone(normalized)}>{channelOperationStatusLabel(normalized)}</StatusBadge>;
}

export function channelOperationStatusLabel(status: string) {
  const labels: Record<string, string> = {
    ACTIVE: '启用',
    APPROVED: '已通过',
    ARCHIVED: '已归档',
    CANCELED: '已取消',
    DISABLED: '停用',
    DRAFT: '草稿',
    ERROR: '异常',
    EXPIRED: '已过期',
    FAILED: '失败',
    PENDING: '待处理',
    REJECTED: '已拒绝',
    RETRYING: '重试中',
    RUNNING: '运行中',
    SKIPPED: '已跳过',
    SUCCESS: '成功',
    UNKNOWN: '未知',
  };

  return labels[status] ?? status;
}

export function channelOperationStatusTone(status: string) {
  if (status === 'ACTIVE' || status === 'SUCCESS' || status === 'APPROVED') return 'healthy' as const;
  if (status === 'FAILED' || status === 'ERROR' || status === 'EXPIRED') return 'unavailable' as const;
  if (status === 'PENDING' || status === 'RUNNING' || status === 'RETRYING') return 'degraded' as const;
  if (status === 'DRAFT') return 'mock' as const;

  return 'planned' as const;
}

export function channelReadinessLabel(readiness: ChannelAdapterReadiness | null | undefined) {
  const labels: Record<ChannelAdapterReadiness['status'], string> = {
    BLOCKED: '已阻断',
    DEGRADED: '部分就绪',
    READY: '已就绪',
    UNCONFIGURED: '未配置',
  };

  return readiness ? labels[readiness.status] ?? readiness.status : '-';
}

export function credentialRotationLabel(rotation: ChannelCredentialRotationMetadata | null | undefined) {
  const labels: Record<ChannelCredentialRotationMetadata['status'], string> = {
    CURRENT: '当前有效',
    EXPIRED: '已过期',
    ROTATING: '轮换中',
    ROTATION_DUE: '待轮换',
    UNKNOWN: '未知',
  };

  if (!rotation) return '-';
  const configuredLabel = rotation.secret_configured ? '已配置' : '未配置';

  return `${labels[rotation.status] ?? rotation.status} · ${configuredLabel}`;
}

export function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-';

  return new Intl.NumberFormat('zh-CN').format(value);
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-';

  return `${new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 1 }).format(value)}%`;
}

export function formatLatency(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-';
  if (value >= 1000) return `${(value / 1000).toFixed(2)} 秒`;

  return `${Math.round(value)} 毫秒`;
}

export function formatOptionalDateTime(value: string | null | undefined) {
  return formatChannelDateTime(value);
}

export function useChannelOperationPermissions(): ChannelPermissions {
  const { currentUser } = useAuth();
  const roles = currentUser?.user.roles ?? [];
  const permissions = currentUser?.user.permissions ?? [];
  const isTenantAdmin = roles.some((role) => role.code === 'tenant_admin');

  return {
    canDeploy: isTenantAdmin || hasPermission(permissions, 'channel:publish:deploy'),
    canDisable: isTenantAdmin || hasPermission(permissions, 'channel:publish:disable'),
    canManage: isTenantAdmin || hasPermission(permissions, 'channel:publish:manage'),
    canView: isTenantAdmin || hasPermission(permissions, 'channel:publish:view'),
  };
}

function PermissionDeniedCard() {
  return (
    <Card className="p-5">
      <EmptyState
        description="当前账号缺少 channel:publish:view 权限，无法查看渠道运营数据。"
        title="无权查看渠道运营"
      />
    </Card>
  );
}

function ChannelRowSkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div className="h-28 rounded-md border bg-muted/30" key={index} />
      ))}
    </div>
  );
}
