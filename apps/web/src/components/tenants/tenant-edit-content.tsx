'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission, type TenantStatus } from '@aiaget/shared-types';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useAuth } from '@/components/auth/auth-provider';
import { formatDateTime } from '@/components/agents/agent-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { getTenant, updateTenant, type ApiClientError } from '@/lib/api-client';

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

export function TenantEditContent({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser, refreshCurrentUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const canManageTenant = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'system:tenant:manage'),
  );

  const tenantQuery = useQuery({
    queryKey: ['tenant-center-detail', tenantId],
    queryFn: () => getTenant(tenantId),
  });

  const tenant = tenantQuery.data;

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      name: '',
      status: 'ACTIVE',
    },
  });

  useEffect(() => {
    if (!tenant) return;
    form.reset({
      name: tenant.name,
      status: tenant.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE',
    });
  }, [form, tenant]);

  const updateMutation = useMutation({
    mutationFn: (values: TenantFormValues) =>
      updateTenant(tenantId, {
        name: values.name.trim(),
        status: values.status,
      }),
    onSuccess: async (updatedTenant) => {
      setFormError(null);
      queryClient.setQueryData(['tenant-center-detail', updatedTenant.id], updatedTenant);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tenants-center'] }),
        refreshCurrentUser(),
      ]);
      router.push(`/tenants/${updatedTenant.id}`);
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  return (
    <main className="mx-auto grid w-full max-w-none gap-6 bg-background px-4 py-6 lg:px-6">
      <section>
        <Button asChild className="mb-4 w-fit" variant="outline">
          <Link href={`/tenants/${tenantId}`}>
            <ArrowLeft className="size-4" />
            租户详情
          </Link>
        </Button>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatusBadge tone="ready">编辑页</StatusBadge>
          <StatusBadge tone={canManageTenant ? 'healthy' : 'degraded'}>{canManageTenant ? '可编辑' : '只读权限'}</StatusBadge>
          {tenant ? <StatusBadge tone={tenantStatusTone(tenant.status)}>{tenantStatusLabel(tenant.status)}</StatusBadge> : null}
        </div>
        <h1 className="text-2xl font-semibold">编辑租户</h1>
      </section>

      {tenantQuery.isError ? (
        <Card className="p-6 text-sm text-destructive">租户编辑数据加载失败。</Card>
      ) : tenantQuery.isLoading ? (
        <Card className="p-6 text-sm text-muted-foreground">正在加载租户资料...</Card>
      ) : !canManageTenant ? (
        <Card className="p-6 text-sm text-muted-foreground">当前账号没有编辑租户权限。</Card>
      ) : tenant ? (
        <Card className="grid gap-5 p-5">
          <div className="grid gap-3 text-sm md:grid-cols-3">
            <DetailRow label="租户编码" value={tenant.code} />
            <DetailRow label="租户 ID" value={tenant.id} />
            <DetailRow label="更新时间" value={formatDateTime(tenant.updated_at)} />
          </div>

          {formError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {formError}
            </div>
          ) : null}

          <form className="grid gap-4" onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))}>
            <Field label="租户名称" message={form.formState.errors.name?.message}>
              <Input disabled={updateMutation.isPending} {...form.register('name')} />
            </Field>
            <Field label="租户状态" message={form.formState.errors.status?.message}>
              <select className="h-10 rounded-md border bg-background px-3 text-sm disabled:bg-muted" disabled={updateMutation.isPending} {...form.register('status')}>
                <option value="ACTIVE">启用</option>
                <option value="DISABLED">停用</option>
              </select>
            </Field>
            <div className="flex flex-wrap justify-end gap-2">
              <Button asChild type="button" variant="outline">
                <Link href={`/tenants/${tenantId}`}>取消</Link>
              </Button>
              <Button disabled={updateMutation.isPending} type="submit">
                <Save className="size-4" />
                {updateMutation.isPending ? '保存中' : '保存修改'}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}
    </main>
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
