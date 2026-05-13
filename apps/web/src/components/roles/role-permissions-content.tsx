'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission, type PermissionCatalogGroup, type PermissionCatalogItem } from '@aiaget/shared-types';
import { motion } from 'motion/react';
import { ArrowLeft, KeyRound, Save, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { RoleCenterBackground } from '@/components/roles/role-center-background';
import { flattenPermissionCatalog } from '@/components/roles/role-ia-shared';
import { actionLabel, roleStatusLabel, roleStatusTone } from '@/components/roles/role-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { getRole, listRolePermissionCatalog, updateRolePermissions, type ApiClientError } from '@/lib/api-client';
import { cn } from '@/lib/utils';

export function RolePermissionsContent({ roleId }: { roleId: string }) {
  const queryClient = useQueryClient();
  const { currentUser, refreshCurrentUser } = useAuth();
  const [draftPermissionIds, setDraftPermissionIds] = useState<string[]>([]);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const canManage = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'system:role:manage'),
  );

  const roleQuery = useQuery({
    queryKey: ['role', roleId],
    queryFn: () => getRole(roleId),
  });

  const catalogQuery = useQuery({
    queryKey: ['role-permission-catalog'],
    queryFn: listRolePermissionCatalog,
  });

  const role = roleQuery.data;
  const catalog = catalogQuery.data ?? [];
  const allPermissionIds = useMemo(() => flattenPermissionCatalog(catalog).map((permission) => permission.id), [catalog]);
  const selectedRoleIsAdmin = role?.code === 'tenant_admin';
  const canWrite = canManage && !selectedRoleIsAdmin;

  useEffect(() => {
    setDraftPermissionIds(role?.permissions.map((permission) => permission.id) ?? []);
  }, [role]);

  const permissionMutation = useMutation({
    mutationFn: ({ permissionIds }: { permissionIds: string[] }) =>
      updateRolePermissions(roleId, { permission_ids: permissionIds }),
    onSuccess: async (updatedRole) => {
      queryClient.setQueryData(['role', updatedRole.id], updatedRole);
      setPermissionError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['role-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['roles'] }),
        queryClient.invalidateQueries({ queryKey: ['role', roleId] }),
        refreshCurrentUser(),
      ]);
    },
    onError: (error: ApiClientError) => setPermissionError(error.message),
  });

  function togglePermission(permissionId: string) {
    setDraftPermissionIds((current) =>
      current.includes(permissionId)
        ? current.filter((id) => id !== permissionId)
        : [...current, permissionId],
    );
  }

  function selectModulePermissions(group: PermissionCatalogGroup) {
    const moduleIds = group.resources.flatMap((resource) => resource.permissions.map((permission) => permission.id));
    setDraftPermissionIds((current) => Array.from(new Set([...current, ...moduleIds])));
  }

  function clearModulePermissions(group: PermissionCatalogGroup) {
    const moduleIds = new Set(group.resources.flatMap((resource) => resource.permissions.map((permission) => permission.id)));
    setDraftPermissionIds((current) => current.filter((permissionId) => !moduleIds.has(permissionId)));
  }

  function savePermissions() {
    if (!role || !canWrite) return;
    permissionMutation.mutate({ permissionIds: draftPermissionIds });
  }

  const metrics = [
    { label: '当前已选', value: `${draftPermissionIds.length}`, helper: '权限编码' },
    { label: '目录总数', value: `${allPermissionIds.length}`, helper: '可授权权限' },
    { label: '模块数量', value: `${catalog.length}`, helper: '权限分组' },
    { label: '角色状态', value: role?.status ? roleStatusLabel(role.status) : '暂无', helper: role?.code ?? roleId },
  ];

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <RoleCenterBackground />

      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href={`/roles/${roleId}`}>
              <ArrowLeft className="size-4" />
              角色详情
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">配置页</StatusBadge>
            <StatusBadge tone={canWrite ? 'healthy' : 'degraded'}>{canWrite ? '可编辑' : '只读'}</StatusBadge>
            {role ? <StatusBadge tone={roleStatusTone(role.status)}>{roleStatusLabel(role.status)}</StatusBadge> : null}
          </div>
          <h1 className="text-2xl font-semibold">权限编码配置</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={!canWrite || catalogQuery.isLoading || allPermissionIds.length === 0} onClick={() => setDraftPermissionIds(allPermissionIds)} variant="outline">
            <KeyRound className="size-4" />
            全选权限
          </Button>
          <Button disabled={!canWrite || catalogQuery.isLoading} onClick={() => setDraftPermissionIds([])} variant="outline">
            清空权限
          </Button>
          <Button disabled={!canWrite || !role || permissionMutation.isPending} onClick={savePermissions}>
            <Save className="size-4" />
            保存权限
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      {permissionError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {permissionError}
        </div>
      ) : null}

      {selectedRoleIsAdmin ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          租户管理员为内置全权限角色，权限不可修改。
        </div>
      ) : null}

      {roleQuery.isError ? (
        <Card className="p-6 text-sm text-destructive">角色信息加载失败。</Card>
      ) : roleQuery.isLoading || catalogQuery.isLoading ? (
        <Card className="p-6 text-sm text-muted-foreground">正在加载权限目录...</Card>
      ) : catalog.length === 0 ? (
        <EmptyState description="权限编码目录为空，请先确认后端权限种子数据。" title="暂无权限编码" />
      ) : (
        <Card className="min-w-0">
          <div className="border-b p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <ShieldCheck className="size-4 text-blue-700" />
                  <h2 className="text-sm font-semibold">权限编码矩阵</h2>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  当前角色：<span className="font-medium text-foreground">{role?.name ?? '未选择'}</span>
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                已选择 {draftPermissionIds.length} / {allPermissionIds.length}
              </div>
            </div>
          </div>

          <div className="columns-1 gap-4 p-4 lg:columns-2">
            {catalog.map((group, index) => (
              <motion.section
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 break-inside-avoid rounded-lg border bg-background/75"
                initial={{ opacity: 0, y: 8 }}
                key={group.module}
                transition={{ delay: index * 0.025, duration: 0.2 }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
                  <div>
                    <h3 className="text-sm font-semibold">{group.module_label}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{group.module}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button disabled={!canWrite} onClick={() => selectModulePermissions(group)} size="sm" variant="outline">
                      全选
                    </Button>
                    <Button disabled={!canWrite} onClick={() => clearModulePermissions(group)} size="sm" variant="outline">
                      清空
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 p-4">
                  {group.resources.map((resource) => (
                    <div className="rounded-md border bg-muted/10 p-3" key={`${group.module}-${resource.resource}`}>
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="text-sm font-medium">{resource.resource_label}</div>
                        <StatusBadge tone="planned">{resource.resource}</StatusBadge>
                      </div>
                      <div className="grid gap-2">
                        {resource.permissions.map((permission) => (
                          <PermissionCheckbox
                            checked={draftPermissionIds.includes(permission.id)}
                            disabled={!canWrite}
                            key={permission.id}
                            onToggle={() => togglePermission(permission.id)}
                            permission={permission}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            ))}
          </div>
        </Card>
      )}
    </main>
  );
}

function PermissionCheckbox({
  checked,
  disabled,
  onToggle,
  permission,
}: {
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
  permission: PermissionCatalogItem;
}) {
  return (
    <label
      className={cn(
        'flex min-h-11 items-start justify-between gap-3 rounded-md border px-3 py-2 text-sm transition-colors',
        checked ? 'border-blue-200 bg-blue-50/70' : 'border-slate-200 bg-background hover:bg-muted/30',
        disabled && 'cursor-not-allowed opacity-70',
      )}
    >
      <span className="flex min-w-0 items-start gap-2">
        <input checked={checked} className="mt-1" disabled={disabled} onChange={onToggle} type="checkbox" />
        <span className="min-w-0">
          <span className="block truncate font-medium">{permission.name}</span>
          <span className="block break-all text-xs text-muted-foreground">{permission.code}</span>
        </span>
      </span>
      <StatusBadge tone={permission.action === 'view' ? 'healthy' : 'mock'}>{actionLabel(permission.action)}</StatusBadge>
    </label>
  );
}
