'use client';

import { useQuery } from '@tanstack/react-query';
import { hasPermission, type TenantStatus } from '@aiaget/shared-types';
import { ArrowLeft, Edit, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import { formatDateTime } from '@/components/agents/agent-status';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { getTenant } from '@/lib/api-client';

const tenantStatusLabels: Record<TenantStatus, string> = {
  ACTIVE: '启用',
  DISABLED: '停用',
  DELETED: '已删除',
};

export function TenantDetailContent({ tenantId }: { tenantId: string }) {
  const { currentUser } = useAuth();
  const canManageTenant = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'system:tenant:manage'),
  );

  const tenantQuery = useQuery({
    queryKey: ['tenant-center-detail', tenantId],
    queryFn: () => getTenant(tenantId),
  });

  const tenant = tenantQuery.data;

  return (
    <main className="relative mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:px-6">
      <section className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(circle_at_16%_20%,rgba(37,99,235,0.10),transparent_32%),radial-gradient(circle_at_84%_12%,rgba(14,165,233,0.08),transparent_30%)]" />

      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href="/tenants">
              <ArrowLeft className="size-4" />
              租户管理中心
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">租户档案</StatusBadge>
            {tenant ? <StatusBadge tone={tenantStatusTone(tenant.status)}>{tenantStatusLabel(tenant.status)}</StatusBadge> : null}
          </div>
          <h1 className="text-2xl font-semibold">{tenant?.name ?? '租户详情'}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            租户资料、租户编码与生命周期时间。
          </p>
        </div>
        {tenant ? (
          <Button asChild disabled={!canManageTenant || tenant.status === 'DELETED'} variant="outline">
            <Link href={`/tenants/${tenant.id}/edit`}>
              <Edit className="size-4" />
              编辑租户
            </Link>
          </Button>
        ) : null}
      </section>

      {tenantQuery.isError ? (
        <Card className="p-6 text-sm text-destructive">租户详情加载失败。</Card>
      ) : tenantQuery.isLoading ? (
        <Card className="p-6 text-sm text-muted-foreground">正在加载租户详情...</Card>
      ) : !tenant ? (
        <EmptyState description="未找到该租户，可能已删除或无权限访问。" title="租户不存在" />
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard helper="生命周期" label="租户状态" value={tenantStatusLabel(tenant.status)} />
            <MetricCard helper="不可在当前接口修改" label="租户编码" value={tenant.code} />
            <MetricCard helper="创建时间" label="创建" value={formatDateTime(tenant.created_at)} />
            <MetricCard helper="更新时间" label="更新" value={formatDateTime(tenant.updated_at)} />
          </section>

          <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <Card className="p-5">
              <h2 className="text-sm font-semibold">基础资料</h2>
              <div className="mt-4 grid gap-3 text-sm">
                <DetailRow label="租户名称" value={tenant.name} />
                <DetailRow label="租户编码" value={tenant.code} />
                <DetailRow label="租户 ID" value={tenant.id} />
                <DetailRow label="状态" value={tenantStatusLabel(tenant.status)} />
                <DetailRow label="创建时间" value={formatDateTime(tenant.created_at)} />
                <DetailRow label="更新时间" value={formatDateTime(tenant.updated_at)} />
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="size-4 text-primary" />
                治理说明
              </div>
              <div className="mt-4 grid gap-3 text-sm leading-6 text-muted-foreground">
                <p>租户是当前控制台的数据隔离边界，业务表和配置读取都按租户上下文生效。</p>
                <p>跨租户创建、删除和切换未开放。租户名称和启停状态可编辑。</p>
                <p>如果租户被停用，依赖该租户上下文的用户和业务访问会受到后端权限策略限制。</p>
              </div>
            </Card>
          </section>
        </>
      )}
    </main>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-md border bg-muted/30 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="break-words font-medium">{value}</div>
    </div>
  );
}

function tenantStatusLabel(status: TenantStatus) {
  return tenantStatusLabels[status] ?? status;
}

function tenantStatusTone(status: TenantStatus) {
  if (status === 'ACTIVE') return 'healthy';
  if (status === 'DISABLED') return 'degraded';
  return 'unavailable';
}
