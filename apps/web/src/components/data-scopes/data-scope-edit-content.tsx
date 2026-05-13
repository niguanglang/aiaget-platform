'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  hasPermission,
  type DataScopePreviewResult,
  type DataScopeResourceType,
  type ReplaceRoleDataScopeInput,
  type RoleDataScopeItem,
  type RoleDataScopeValue,
} from '@aiaget/shared-types';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, RefreshCcw, Save } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { DataScopeBackground } from '@/components/data-scopes/data-scope-background';
import {
  RoleSummaryCard,
  ScopeEditor,
  ScopeMatrix,
} from '@/components/data-scopes/data-scope-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  getDepartmentTree,
  getRoleDataScopes,
  listUsers,
  previewDataScope,
  replaceRoleDataScopes,
  type ApiClientError,
} from '@/lib/api-client';

export function DataScopeEditContent({ roleId }: { roleId: string }) {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [selectedResourceType, setSelectedResourceType] = useState<DataScopeResourceType>('AGENT');
  const [draftScopes, setDraftScopes] = useState<RoleDataScopeItem[]>([]);
  const [previewResult, setPreviewResult] = useState<DataScopePreviewResult | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const detailQuery = useQuery({
    queryKey: ['role-data-scopes', roleId],
    queryFn: () => getRoleDataScopes(roleId),
  });
  const departmentsQuery = useQuery({
    queryKey: ['data-scope-departments'],
    queryFn: getDepartmentTree,
  });
  const usersQuery = useQuery({
    queryKey: ['data-scope-users'],
    queryFn: () => listUsers({ page: 1, page_size: 100, status: 'ACTIVE' }),
  });

  const role = detailQuery.data?.role ?? null;
  const selectedScope = draftScopes.find((scope) => scope.resource_type === selectedResourceType) ?? draftScopes[0] ?? null;
  const isTenantAdmin = role?.code === 'tenant_admin';
  const canWrite = Boolean(
    !isTenantAdmin &&
      (currentUser?.user.roles.some((item) => item.code === 'tenant_admin') ||
        hasPermission(currentUser?.user.permissions ?? [], 'system:data_scope:manage')),
  );

  useEffect(() => {
    if (detailQuery.data?.scopes) {
      setDraftScopes(detailQuery.data.scopes);
      setSelectedResourceType(detailQuery.data.scopes[0]?.resource_type ?? 'AGENT');
      setPreviewResult(null);
      setSaveMessage(null);
      setActionError(null);
    }
  }, [detailQuery.data]);

  const saveMutation = useMutation({
    mutationFn: ({ scopes }: { scopes: ReplaceRoleDataScopeInput }) => replaceRoleDataScopes(roleId, scopes),
    onSuccess: async (detail) => {
      setDraftScopes(detail.scopes);
      setActionError(null);
      setSaveMessage('数据权限已保存。');
      queryClient.setQueryData(['role-data-scopes', detail.role.id], detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['role-data-scopes'] }),
        queryClient.invalidateQueries({ queryKey: ['data-scope-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['data-scope-records'] }),
      ]);
    },
    onError: (error: ApiClientError) => {
      setSaveMessage(null);
      setActionError(error.message);
    },
  });

  const previewMutation = useMutation({
    mutationFn: previewDataScope,
    onSuccess: (result) => {
      setPreviewResult(result);
      setActionError(null);
    },
    onError: (error: ApiClientError) => {
      setPreviewResult(null);
      setActionError(error.message);
    },
  });

  function patchSelectedScope(patch: Partial<RoleDataScopeItem>) {
    setDraftScopes((current) =>
      current.map((scope) => (scope.resource_type === selectedResourceType ? { ...scope, ...patch } : scope)),
    );
    setSaveMessage(null);
    setPreviewResult(null);
  }

  function patchScopeValue(patch: Partial<RoleDataScopeValue>) {
    if (!selectedScope) return;
    patchSelectedScope({ scope_value: { ...selectedScope.scope_value, ...patch } });
  }

  function saveScopes() {
    if (!canWrite || draftScopes.length === 0) return;
    saveMutation.mutate({
      scopes: {
        scopes: draftScopes.map((scope) => ({
          resource_type: scope.resource_type,
          scope_type: scope.scope_type,
          scope_value: scope.scope_value,
          status: scope.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE',
        })),
      },
    });
  }

  function previewScope() {
    if (!selectedScope) return;
    previewMutation.mutate({
      role_id: roleId,
      resource_type: selectedScope.resource_type,
      scope_type: selectedScope.scope_type,
      scope_value: selectedScope.scope_value,
    });
  }

  function resetDraft() {
    setDraftScopes(detailQuery.data?.scopes ?? []);
    setPreviewResult(null);
    setSaveMessage(null);
    setActionError(null);
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <DataScopeBackground />
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="healthy">数据权限</StatusBadge>
            <StatusBadge tone="planned">角色编辑</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">编辑角色数据范围</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">资源数据范围和生效预览。</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline">
            <Link href={`/data-scopes/roles/${roleId}`}>
              <ArrowLeft className="size-4" />
              返回详情
            </Link>
          </Button>
          <Button disabled={saveMutation.isPending || draftScopes.length === 0} onClick={resetDraft} variant="outline">
            <RefreshCcw className="size-4" />
            重置
          </Button>
          <Button disabled={!canWrite || saveMutation.isPending || draftScopes.length === 0} onClick={saveScopes}>
            <Save className="size-4" />
            保存数据范围
          </Button>
        </div>
      </section>

      {isTenantAdmin ? (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
          租户管理员默认拥有全部资源范围，仅支持预览。
        </div>
      ) : null}
      {!canWrite && !isTenantAdmin ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          当前账号缺少 system:data_scope:manage 权限，无法保存数据范围。
        </div>
      ) : null}
      {actionError ? <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{actionError}</div> : null}
      {saveMessage ? (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <CheckCircle2 className="size-4" />
          {saveMessage}
        </div>
      ) : null}

      {detailQuery.isLoading ? (
        <Card className="p-6 text-sm text-muted-foreground">正在加载角色数据范围...</Card>
      ) : detailQuery.isError ? (
        <Card className="p-6 text-sm text-destructive">角色数据范围加载失败。</Card>
      ) : !role ? (
        <EmptyState className="py-12" description="未找到对应角色的数据权限配置。" title="暂无数据" />
      ) : (
        <>
          <RoleSummaryCard role={role} />
          <section className="grid min-w-0 items-start gap-4 xl:grid-cols-[1fr_1fr]">
            <ScopeMatrix
              editable
              onSelectResource={setSelectedResourceType}
              scopes={draftScopes}
              selectedResourceType={selectedScope?.resource_type ?? selectedResourceType}
            />
            <ScopeEditor
              canWrite={canWrite}
              departments={departmentsQuery.data ?? []}
              loading={detailQuery.isLoading}
              onPatchScope={patchSelectedScope}
              onPatchScopeValue={patchScopeValue}
              onPreview={previewScope}
              pendingPreview={previewMutation.isPending}
              previewResult={previewResult}
              scope={selectedScope}
              users={usersQuery.data?.items ?? []}
            />
          </section>
        </>
      )}
    </main>
  );
}
