'use client';

import { useQuery } from '@tanstack/react-query';
import { hasPermission, type TenantStatus } from '@aiaget/shared-types';
import { motion } from 'motion/react';
import { ArrowRight, Edit, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { formatDateTime } from '@/components/agents/agent-status';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { listTenants } from '@/lib/api-client';

const tenantStatusLabels: Record<TenantStatus, string> = {
  ACTIVE: '启用',
  DISABLED: '停用',
  DELETED: '已删除',
};

export function TenantsContent() {
  const { currentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');

  const canManageTenant = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'system:tenant:manage'),
  );

  const tenantsQuery = useQuery({
    queryKey: ['tenants-center', keyword, status],
    queryFn: () =>
      listTenants({
        page: 1,
        page_size: 20,
        keyword,
        status,
      }),
  });

  const tenants = tenantsQuery.data?.items ?? [];
  const currentTenant = currentUser?.tenant ?? null;

  const metrics = useMemo(
    () => [
      { label: '租户范围', value: `${tenantsQuery.data?.total ?? tenants.length}`, helper: '当前上下文可见' },
      { label: '当前状态', value: currentTenant ? tenantStatusLabel(currentTenant.status) : '--', helper: currentTenant?.code ?? '等待加载' },
      { label: '当前租户', value: currentTenant?.name ?? '--', helper: '登录上下文' },
      { label: '用户上下文', value: currentUser?.user.email ?? '--', helper: '当前登录主体' },
    ],
    [currentTenant, currentUser?.user.email, tenants.length, tenantsQuery.data?.total],
  );

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
      >
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M51</StatusBadge>
            <StatusBadge tone="healthy">租户上下文</StatusBadge>
            <StatusBadge tone={canManageTenant ? 'mock' : 'planned'}>{canManageTenant ? '可管理' : '仅查看'}</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">租户管理中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            查看当前租户范围内的租户资料。详情查看和资料编辑已拆到独立页面，列表页只保留筛选、概览和入口。
          </p>
        </div>
        <Button disabled={tenantsQuery.isFetching} onClick={() => tenantsQuery.refetch()} type="button" variant="outline">
          <RefreshCw className="size-4" />
          刷新
        </Button>
      </motion.section>

      <section className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(circle_at_16%_20%,rgba(37,99,235,0.10),transparent_32%),radial-gradient(circle_at_84%_12%,rgba(14,165,233,0.08),transparent_30%)]" />

      {tenantsQuery.isError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          租户列表加载失败，请检查接口权限。
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {tenantsQuery.isLoading
          ? Array.from({ length: 4 }).map((_, index) => <div className="h-28 rounded-lg border bg-muted/30" key={index} />)
          : metrics.map((metric) => <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />)}
      </section>

      <section className="grid gap-4 xl:grid-cols-[280px_1fr]">
        <Card className="h-fit p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="size-4 text-primary" />
            当前租户入口
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            当前登录上下文绑定的租户是所有业务数据的隔离边界。
          </p>
          {currentTenant ? (
            <div className="mt-4 grid gap-3 text-sm">
              <DetailRow label="租户名称" value={currentTenant.name} />
              <DetailRow label="租户编码" value={currentTenant.code} />
              <DetailRow label="状态" value={tenantStatusLabel(currentTenant.status)} />
              <div className="flex flex-wrap gap-2 pt-1">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/tenants/${currentTenant.id}`}>
                    详情
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild disabled={!canManageTenant || currentTenant.status === 'DELETED'} size="sm" variant="outline">
                  <Link href={`/tenants/${currentTenant.id}/edit`}>
                    <Edit className="size-4" />
                    编辑
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <EmptyState description="正在读取当前租户上下文。" title="等待租户数据" />
          )}
        </Card>

        <Card className="grid gap-4 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold">租户列表</h2>
              <p className="mt-1 text-sm text-muted-foreground">当前接口按租户上下文隔离，列表用于确认当前工作区资料和状态。</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm">
                <Search className="size-4 text-muted-foreground" />
                <input
                  className="w-48 bg-transparent outline-none"
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="搜索名称或编码"
                  value={keyword}
                />
              </label>
              <select className="h-9 rounded-md border bg-background px-3 text-sm" onChange={(event) => setStatus(event.target.value)} value={status}>
                <option value="">全部状态</option>
                <option value="ACTIVE">启用</option>
                <option value="DISABLED">停用</option>
                <option value="DELETED">已删除</option>
              </select>
            </div>
          </div>

          {tenantsQuery.isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">正在加载租户...</div>
          ) : tenants.length === 0 ? (
            <EmptyState description="当前筛选条件下没有租户数据。" title="暂无租户" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {['租户名称', '编码', '状态', '创建时间', '更新时间', '操作'].map((column) => (
                      <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((item) => (
                    <tr className="border-b last:border-0" key={item.id}>
                      <td className="px-4 py-3 font-medium">{item.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.code}</td>
                      <td className="px-4 py-3"><StatusBadge tone={tenantStatusTone(item.status)}>{tenantStatusLabel(item.status)}</StatusBadge></td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(item.created_at)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(item.updated_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/tenants/${item.id}`}>详情</Link>
                          </Button>
                          <Button asChild disabled={!canManageTenant || item.status === 'DELETED'} size="sm" variant="outline">
                            <Link href={`/tenants/${item.id}/edit`}>
                              <Edit className="size-4" />
                              编辑
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>

      <GovernanceCard />
    </main>
  );
}

function GovernanceCard() {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <ShieldCheck className="size-4 text-primary" />
        租户治理边界
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <GovernanceItem title="强制租户隔离" description="核心业务表使用 tenant_id 隔离，前后端都围绕当前租户上下文读取数据。" />
        <GovernanceItem title="当前接口范围" description="本阶段租户列表只返回当前租户，不提供跨租户创建、删除和切换。" />
        <GovernanceItem title="独立工作流" description="详情和编辑通过独立路由承载，避免列表页混入表单状态。" />
      </div>
    </Card>
  );
}

function GovernanceItem({ description, title }: { description: string; title: string }) {
  return (
    <div className="rounded-md border bg-muted/20 px-3 py-3">
      <div className="font-medium">{title}</div>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
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
