'use client';

import { useQuery } from '@tanstack/react-query';
import { hasPermission, type DataScopeResourceType } from '@aiaget/shared-types';
import Link from 'next/link';
import { ArrowLeft, Edit3 } from 'lucide-react';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import {
  RoleSummaryCard,
  ScopeMatrix,
  ScopeValueSummary,
  StaticPreviewSummary,
} from '@/components/data-scopes/data-scope-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { getRoleDataScopes } from '@/lib/api-client';

export function DataScopeDetailContent({ roleId }: { roleId: string }) {
  const { currentUser } = useAuth();
  const [selectedResourceType, setSelectedResourceType] = useState<DataScopeResourceType>('AGENT');
  const detailQuery = useQuery({
    queryKey: ['role-data-scopes', roleId],
    queryFn: () => getRoleDataScopes(roleId),
  });

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'system:data_scope:manage'),
  );
  const detail = detailQuery.data;
  const selectedScope = detail?.scopes.find((scope) => scope.resource_type === selectedResourceType) ?? detail?.scopes[0] ?? null;
  const isTenantAdmin = detail?.role.code === 'tenant_admin';

  return (
    <main className="mx-auto grid max-w-[1680px] gap-6 rounded-xl border border-slate-200/80 bg-white/[0.9] p-4 shadow-sm lg:p-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="healthy">数据权限</StatusBadge>
            <StatusBadge tone="planned">角色详情</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">角色数据范围详情</h1>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/data-scopes">
              <ArrowLeft className="size-4" />
              返回列表
            </Link>
          </Button>
          {detail ? (
            <Button asChild disabled={!canWrite || isTenantAdmin}>
              <Link
                aria-disabled={!canWrite || isTenantAdmin}
                className={!canWrite || isTenantAdmin ? 'pointer-events-none opacity-60' : undefined}
                href={`/data-scopes/roles/${roleId}/edit`}
              >
                <Edit3 className="size-4" />
                编辑
              </Link>
            </Button>
          ) : null}
        </div>
      </section>

      {detailQuery.isLoading ? (
        <Card className="p-6 text-sm text-muted-foreground">正在加载角色数据范围...</Card>
      ) : detailQuery.isError ? (
        <Card className="p-6 text-sm text-destructive">角色数据范围加载失败。</Card>
      ) : !detail ? (
        <EmptyState className="py-12" title="暂无数据" />
      ) : (
        <>
          <RoleSummaryCard role={detail.role} />
          {isTenantAdmin ? (
            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
              租户管理员默认拥有全部资源范围。
            </div>
          ) : null}
          <section className="grid min-w-0 items-start gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <ScopeMatrix
              editable
              onSelectResource={setSelectedResourceType}
              scopes={detail.scopes}
              selectedResourceType={selectedScope?.resource_type ?? selectedResourceType}
            />
            {selectedScope ? <ScopeValueSummary scope={selectedScope} /> : null}
          </section>
          <StaticPreviewSummary scopes={detail.scopes} />
        </>
      )}
    </main>
  );
}
