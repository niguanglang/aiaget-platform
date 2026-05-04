'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission, type TenantDetail, type TenantStatus } from '@aiaget/shared-types';
import { motion } from 'motion/react';
import { Building2, Edit, RefreshCw, Search, ShieldCheck, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useAuth } from '@/components/auth/auth-provider';
import { formatDateTime } from '@/components/agents/agent-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  getTenant,
  listTenants,
  updateTenant,
  type ApiClientError,
} from '@/lib/api-client';

const tenantFormSchema = z.object({
  name: z.string().min(2, '租户名称至少需要 2 个字符。'),
  status: z.enum(['ACTIVE', 'DISABLED']),
});

type TenantFormValues = z.infer<typeof tenantFormSchema>;

const tenantStatusLabels: Record<TenantStatus, string> = {
  ACTIVE: '启用',
  DISABLED: '停用',
  DELETED: '已删除',
};

export function TenantsContent() {
  const queryClient = useQueryClient();
  const { currentUser, refreshCurrentUser } = useAuth();
  const tenantId = currentUser?.tenant.id ?? '';
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canManageTenant = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'system:tenant:manage'),
  );

  const tenantQuery = useQuery({
    enabled: Boolean(tenantId),
    queryKey: ['tenant-center-detail', tenantId],
    queryFn: () => getTenant(tenantId),
  });

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

  const tenant = tenantQuery.data ?? currentUser?.tenant ?? null;
  const tenants = tenantsQuery.data?.items ?? [];

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      name: tenant?.name ?? '',
      status: tenant?.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: TenantFormValues) =>
      updateTenant(tenantId, {
        name: values.name,
        status: values.status,
      }),
    onSuccess: async (updatedTenant) => {
      setNotice(`已更新租户 ${updatedTenant.name}。`);
      setFormError(null);
      setIsEditing(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tenant-center-detail', tenantId] }),
        queryClient.invalidateQueries({ queryKey: ['tenants-center'] }),
        refreshCurrentUser(),
      ]);
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setFormError(error.message);
    },
  });

  const metrics = useMemo(
    () => [
      { label: '租户范围', value: `${tenantsQuery.data?.total ?? tenants.length}`, helper: '当前上下文可见' },
      { label: '当前状态', value: tenant ? tenantStatusLabel(tenant.status) : '--', helper: tenant?.code ?? '等待加载' },
      { label: '租户编码', value: tenant?.code ?? '--', helper: '不可在当前接口修改' },
      { label: '用户上下文', value: currentUser?.user.email ?? '--', helper: '当前登录主体' },
    ],
    [currentUser?.user.email, tenant, tenants.length, tenantsQuery.data?.total],
  );

  function openEditForm(nextTenant: TenantDetail | null) {
    if (!nextTenant) return;
    setFormError(null);
    setIsEditing(true);
    form.reset({
      name: nextTenant.name,
      status: nextTenant.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE',
    });
  }

  function refreshAll() {
    void Promise.all([
      tenantQuery.refetch(),
      tenantsQuery.refetch(),
    ]);
  }

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
            查看并维护当前租户资料和启停状态。当前控制接口按租户上下文隔离，列表仅返回当前租户范围内的数据。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={!canManageTenant || !tenant} onClick={() => openEditForm(tenant as TenantDetail | null)} type="button">
            <Edit className="size-4" />
            编辑租户
          </Button>
          <Button onClick={refreshAll} type="button" variant="outline">
            <RefreshCw className="size-4" />
            刷新
          </Button>
        </div>
      </motion.section>

      <section className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(circle_at_16%_20%,rgba(37,99,235,0.10),transparent_32%),radial-gradient(circle_at_84%_12%,rgba(14,165,233,0.08),transparent_30%)]" />

      {notice ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>
      ) : null}
      {formError || tenantQuery.isError || tenantsQuery.isError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {formError ?? '租户数据加载失败，请检查接口权限。'}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {tenantQuery.isLoading || tenantsQuery.isLoading
          ? Array.from({ length: 4 }).map((_, index) => <div className="h-28 rounded-lg border bg-muted/30" key={index} />)
          : metrics.map((metric) => <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />)}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <TenantProfileCard canManage={canManageTenant} tenant={tenant as TenantDetail | null} onEdit={() => openEditForm(tenant as TenantDetail | null)} />
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
                        <Button disabled={!canManageTenant || item.status === 'DELETED'} onClick={() => openEditForm(item)} size="sm" type="button" variant="outline">
                          <Edit className="size-4" />
                          编辑
                        </Button>
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

      {isEditing ? (
        <section className="fixed inset-y-0 right-0 z-30 w-full max-w-md border-l bg-background p-6 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">编辑租户资料</h2>
              <p className="mt-1 text-sm text-muted-foreground">租户名称和状态会影响当前控制台上下文。</p>
            </div>
            <Button onClick={() => setIsEditing(false)} size="icon" type="button" variant="ghost">
              <X className="size-4" />
            </Button>
          </div>
          <form className="mt-6 grid gap-4" onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))}>
            <Field label="租户名称" message={form.formState.errors.name?.message}>
              <Input disabled={!canManageTenant} {...form.register('name')} />
            </Field>
            <Field label="租户状态" message={form.formState.errors.status?.message}>
              <select className="h-10 rounded-md border bg-background px-3 text-sm disabled:bg-muted" disabled={!canManageTenant} {...form.register('status')}>
                <option value="ACTIVE">启用</option>
                <option value="DISABLED">停用</option>
              </select>
            </Field>
            <Button disabled={!canManageTenant || updateMutation.isPending} type="submit">保存修改</Button>
          </form>
        </section>
      ) : null}
    </main>
  );
}

function TenantProfileCard({
  canManage,
  tenant,
  onEdit,
}: {
  canManage: boolean;
  tenant: TenantDetail | null;
  onEdit: () => void;
}) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Building2 className="size-4 text-primary" />
            当前租户资料
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">这是当前登录上下文绑定的租户，所有业务数据都按该租户 ID 隔离。</p>
        </div>
        <Button disabled={!canManage || !tenant} onClick={onEdit} size="sm" type="button" variant="outline">
          <Edit className="size-4" />
          编辑
        </Button>
      </div>

      {tenant ? (
        <div className="grid gap-3 text-sm">
          <DetailRow label="租户名称" value={tenant.name} />
          <DetailRow label="租户编码" value={tenant.code} />
          <DetailRow label="租户 ID" value={tenant.id} />
          <DetailRow label="状态" value={tenantStatusLabel(tenant.status)} />
          <DetailRow label="创建时间" value={formatDateTime(tenant.created_at)} />
          <DetailRow label="更新时间" value={formatDateTime(tenant.updated_at)} />
        </div>
      ) : (
        <EmptyState description="正在读取当前租户上下文。" title="等待租户数据" />
      )}
    </Card>
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
        <GovernanceItem title="后续扩展方向" description="如果要做 SaaS 平台级运营，可增加平台角色、租户创建、租户套餐和跨租户审计。" />
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

function Field({ children, label, message }: { children: React.ReactNode; label: string; message?: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      {children}
      {message ? <span className="text-xs text-destructive">{message}</span> : null}
    </label>
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
