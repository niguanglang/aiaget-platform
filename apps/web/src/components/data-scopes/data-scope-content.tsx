'use client';

import { useQuery } from '@tanstack/react-query';
import { hasPermission } from '@aiaget/shared-types';
import { motion } from 'motion/react';
import Link from 'next/link';
import { Edit3, Eye, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { DataScopeBackground } from '@/components/data-scopes/data-scope-background';
import {
  DataScopeMetricGrid,
  RoleDirectoryList,
  ScopeCountPills,
} from '@/components/data-scopes/data-scope-shared';
import {
  dataScopeResourceLabels,
  dataScopeTypeLabels,
  dataScopeTypeTone,
  formatDateTime,
} from '@/components/data-scopes/data-scope-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { getDataScopeOverview, listRoleDataScopes, listRoles } from '@/lib/api-client';

export function DataScopeContent() {
  const { currentUser } = useAuth();
  const [roleKeyword, setRoleKeyword] = useState('');
  const [roleStatus, setRoleStatus] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [scopeType, setScopeType] = useState('');
  const [scopeStatus, setScopeStatus] = useState('');

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'system:data_scope:manage'),
  );

  const overviewQuery = useQuery({
    queryKey: ['data-scope-overview'],
    queryFn: getDataScopeOverview,
  });
  const rolesQuery = useQuery({
    queryKey: ['data-scope-roles', roleKeyword, roleStatus],
    queryFn: () =>
      listRoles({
        page: 1,
        page_size: 200,
        keyword: roleKeyword,
        status: roleStatus,
      }),
  });
  const scopesQuery = useQuery({
    queryKey: ['data-scope-records', resourceType, scopeType, scopeStatus],
    queryFn: () =>
      listRoleDataScopes({
        resource_type: resourceType,
        scope_type: scopeType,
        status: scopeStatus,
      }),
  });

  const roles = rolesQuery.data?.items ?? [];
  const scopes = scopesQuery.data ?? [];
  const scopesByRole = useMemo(() => {
    const grouped = new Map<string, typeof scopes>();
    for (const scope of scopes) {
      grouped.set(scope.role_id, [...(grouped.get(scope.role_id) ?? []), scope]);
    }
    return grouped;
  }, [scopes]);

  function clearRoleFilters() {
    setRoleKeyword('');
    setRoleStatus('');
  }

  function clearScopeFilters() {
    setResourceType('');
    setScopeType('');
    setScopeStatus('');
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <DataScopeBackground />

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
      >
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">角色范围</StatusBadge>
            <StatusBadge tone="healthy">数据权限</StatusBadge>
            <StatusBadge tone="mock">RBAC + ABAC</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">数据权限中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            角色、资源类型、数据范围、命中对象和状态。
          </p>
        </div>
      </motion.section>

      <DataScopeMetricGrid overview={overviewQuery.data} roleTotal={rolesQuery.data?.total ?? 0} />

      {!canWrite ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          当前账号缺少 system:data_scope:manage 权限，只能查看数据范围。
        </div>
      ) : null}

      <section className="grid min-w-0 items-start gap-4 xl:grid-cols-[0.78fr_1.22fr]">
        <RoleDirectoryList
          action={(role) => (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={`/data-scopes/roles/${role.id}`}>
                  <Eye className="size-4" />
                  详情
                </Link>
              </Button>
              {canWrite && role.code !== 'tenant_admin' ? (
                <Button asChild size="sm">
                  <Link href={`/data-scopes/roles/${role.id}/edit`}>
                    <Edit3 className="size-4" />
                    编辑
                  </Link>
                </Button>
              ) : null}
            </div>
          )}
          keyword={roleKeyword}
          loading={rolesQuery.isLoading}
          onClear={clearRoleFilters}
          onKeywordChange={setRoleKeyword}
          onStatusChange={setRoleStatus}
          roles={roles}
          status={roleStatus}
          title="角色目录"
          total={rolesQuery.data?.total ?? 0}
        />

        <Card className="min-w-0">
          <div className="border-b p-4">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
              <div>
                <h2 className="text-sm font-semibold">数据权限列表</h2>
                <p className="mt-1 text-sm text-muted-foreground">按资源、范围和状态筛选当前租户所有角色的数据范围。</p>
              </div>
              <StatusBadge tone="planned">{scopes.length} 项</StatusBadge>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto]">
              <select
                className="h-9 rounded-md border bg-background/80 px-3 text-sm"
                onChange={(event) => setResourceType(event.target.value)}
                value={resourceType}
              >
                <option value="">全部资源</option>
                {Object.entries(dataScopeResourceLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                className="h-9 rounded-md border bg-background/80 px-3 text-sm"
                onChange={(event) => setScopeType(event.target.value)}
                value={scopeType}
              >
                <option value="">全部范围</option>
                {Object.entries(dataScopeTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                className="h-9 rounded-md border bg-background/80 px-3 text-sm"
                onChange={(event) => setScopeStatus(event.target.value)}
                value={scopeStatus}
              >
                <option value="">全部状态</option>
                <option value="ACTIVE">启用</option>
                <option value="DISABLED">停用</option>
                <option value="DELETED">已删除</option>
              </select>
              <Button onClick={clearScopeFilters} type="button" variant="outline">
                清空
              </Button>
            </div>
          </div>

          {scopesQuery.isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">正在加载数据权限列表...</div>
          ) : scopes.length === 0 ? (
            <EmptyState className="py-12" description="当前筛选条件没有匹配的数据范围。" title="暂无数据权限" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {['角色', '资源类型', '数据范围', '命中对象', '状态', '更新时间', '操作'].map((column) => (
                      <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scopes.map((scope, index) => (
                    <motion.tr
                      animate={{ opacity: 1, y: 0 }}
                      className="border-b last:border-0 hover:bg-muted/25"
                      initial={{ opacity: 0, y: 8 }}
                      key={scope.id}
                      transition={{ delay: index * 0.012, duration: 0.2 }}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{scope.role_name}</div>
                        <div className="text-xs text-muted-foreground">{scope.role_code}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="grid size-8 place-items-center rounded-md border bg-background">
                            <SlidersHorizontal className="size-4 text-teal-700" />
                          </span>
                          <div>
                            <div className="font-medium">{dataScopeResourceLabels[scope.resource_type]}</div>
                            <div className="text-xs text-muted-foreground">{scope.resource_type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={dataScopeTypeTone(scope.scope_type)}>
                          {dataScopeTypeLabels[scope.scope_type]}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        <ScopeCountPills scope={scope} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={scope.status === 'ACTIVE' ? 'healthy' : 'planned'}>
                          {scope.status === 'ACTIVE' ? '启用' : scope.status === 'DISABLED' ? '停用' : '已删除'}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(scope.updated_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/data-scopes/roles/${scope.role_id}`}>
                              <Eye className="size-4" />
                              详情
                            </Link>
                          </Button>
                          {canWrite && scope.role_code !== 'tenant_admin' ? (
                            <Button asChild size="sm">
                              <Link href={`/data-scopes/roles/${scope.role_id}/edit`}>
                                <Edit3 className="size-4" />
                                编辑
                              </Link>
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>

      <Card className="min-w-0 p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-9 place-items-center rounded-md border bg-background">
            <ShieldCheck className="size-4 text-teal-700" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">角色覆盖摘要</h2>
            <p className="mt-1 text-sm text-muted-foreground">筛选命中 {scopesByRole.size} 个角色。</p>
          </div>
        </div>
      </Card>
    </main>
  );
}
