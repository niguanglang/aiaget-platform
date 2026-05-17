'use client';

import { hasPermission, type SecurityPolicyEffect, type SecurityPolicyStatus } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, FileSearch, Power, Search, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import {
  formatDateTime,
  securityPolicyDecisionLabel,
  securityPolicyDecisionTone,
  securityPolicyEffectLabel,
  securityPolicyEffectTone,
  securityPolicyStatusLabel,
  securityPolicyStatusTone,
} from '@/components/security/security-policy-status';
import {
  LoadingRows,
  PageError,
  RefreshButton,
  SECURITY_PAGE_SHELL_CLASS,
  SecurityConfirmDialog,
  SecurityStatTile,
  SecurityWorkspaceHeader,
  formatNumber,
} from '@/components/security/security-page-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  disableSecurityPolicy,
  enableSecurityPolicy,
  getSecurityPolicyOverview,
  listSecurityPolicies,
  listSecurityPolicyEvaluations,
  type ApiClientError,
} from '@/lib/api-client';

const policyStatuses: SecurityPolicyStatus[] = ['ACTIVE', 'DISABLED', 'DELETED'];
const policyEffects: SecurityPolicyEffect[] = ['DENY', 'ALLOW'];

type PolicyStatusTarget = {
  nextStatus: 'ACTIVE' | 'DISABLED';
  policyCode: string;
  policyId: string;
  policyName: string;
};

export function SecurityPoliciesContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [effect, setEffect] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [policyStatusTarget, setPolicyStatusTarget] = useState<PolicyStatusTarget | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'security:rule:manage'),
  );

  const overviewQuery = useQuery({
    queryKey: ['security-policies-page-overview'],
    queryFn: getSecurityPolicyOverview,
  });

  const policiesQuery = useQuery({
    queryKey: ['security-policies-page-list', keyword, status, effect, resourceType],
    queryFn: () =>
      listSecurityPolicies({
        page: 1,
        page_size: 30,
        keyword,
        status,
        effect,
        resource_type: resourceType,
      }),
  });

  const evaluationsQuery = useQuery({
    queryKey: ['security-policies-page-evaluations'],
    queryFn: () => listSecurityPolicyEvaluations({ page: 1, page_size: 12 }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ policyId, nextStatus }: { policyId: string; nextStatus: 'ACTIVE' | 'DISABLED' }) =>
      nextStatus === 'ACTIVE' ? enableSecurityPolicy(policyId) : disableSecurityPolicy(policyId),
    onSuccess: async () => {
      setActionError(null);
      setPolicyStatusTarget(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['security-policies-page-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['security-policies-page-list'] }),
        queryClient.invalidateQueries({ queryKey: ['security-center-overview'] }),
      ]);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const overview = overviewQuery.data;
  const policies = policiesQuery.data?.items ?? [];
  const evaluations = evaluationsQuery.data?.items ?? [];
  const hasFilters = Boolean(keyword || status || effect || resourceType);

  function confirmPolicyStatusChange() {
    if (!policyStatusTarget) return;
    statusMutation.mutate({ nextStatus: policyStatusTarget.nextStatus, policyId: policyStatusTarget.policyId });
  }

  return (
    <main className={SECURITY_PAGE_SHELL_CLASS}>
      <SecurityWorkspaceHeader
        actions={
          <>
            <RefreshButton
              loading={overviewQuery.isFetching || policiesQuery.isFetching || evaluationsQuery.isFetching}
              onClick={() => {
                void overviewQuery.refetch();
                void policiesQuery.refetch();
                void evaluationsQuery.refetch();
              }}
            />
            {canWrite ? (
              <Button asChild>
                <Link href="/security">
                  <ArrowRight className="size-4" />
                  新建或编辑策略
                </Link>
              </Button>
            ) : null}
          </>
	        }
	        badge="ABAC"
	        title="策略治理"
	      />

      {!canWrite ? (
        <PageError>当前账号无策略写入权限，启停和编辑入口已禁用。需要 security:rule:manage 或租户管理员角色。</PageError>
      ) : null}
      {actionError ? <PageError>{actionError}</PageError> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
	        <SecurityStatTile helper="总数" label="策略总数" value={formatNumber(overview?.total)} />
	        <SecurityStatTile helper="生效" label="生效中" value={formatNumber(overview?.active)} />
	        <SecurityStatTile helper="拒绝" label="拒绝策略" value={formatNumber(overview?.deny)} />
	        <SecurityStatTile helper="日志" label="评估日志" value={formatNumber(evaluationsQuery.data?.total)} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card className="min-w-0 overflow-hidden">
          <div className="border-b p-4">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold">策略清单</h2>
                </div>
	                <p className="mt-1 text-sm text-muted-foreground">
	                  {policies.length} / {policiesQuery.data?.total ?? 0} 条
	                </p>
              </div>
              <Button disabled={!hasFilters} onClick={() => {
                setKeyword('');
                setStatus('');
                setEffect('');
                setResourceType('');
              }} type="button" variant="outline">
                清空筛选
              </Button>
            </div>

            <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_150px_150px_150px]">
              <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
                <Search className="size-4 shrink-0 text-muted-foreground" />
                <input
                  className="min-w-0 flex-1 bg-transparent outline-none"
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="搜索名称、编码、动作"
                  value={keyword}
                />
              </label>
              <select
                className="h-9 rounded-md border bg-background/80 px-3 text-sm"
                onChange={(event) => setStatus(event.target.value)}
                value={status}
              >
                <option value="">全部状态</option>
                {policyStatuses.map((item) => (
                  <option key={item} value={item}>{securityPolicyStatusLabel(item)}</option>
                ))}
              </select>
              <select
                className="h-9 rounded-md border bg-background/80 px-3 text-sm"
                onChange={(event) => setEffect(event.target.value)}
                value={effect}
              >
                <option value="">全部效果</option>
                {policyEffects.map((item) => (
                  <option key={item} value={item}>{securityPolicyEffectLabel(item)}</option>
                ))}
              </select>
              <Input
                onChange={(event) => setResourceType(event.target.value)}
                placeholder="资源类型"
                value={resourceType}
              />
            </div>
          </div>

          {policiesQuery.isError ? (
            <div className="p-4"><PageError>策略清单加载失败。</PageError></div>
          ) : policiesQuery.isLoading ? (
            <LoadingRows count={5} />
          ) : policies.length === 0 ? (
	            <EmptyState title="暂无策略" />
          ) : (
            <div className="divide-y">
              {policies.map((policy) => {
                const nextStatus = policy.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
                const pending = statusMutation.isPending && statusMutation.variables?.policyId === policy.id;

                return (
                  <div className="grid gap-3 p-4 xl:grid-cols-[1fr_170px_170px_170px] xl:items-center" key={policy.id}>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{policy.name}</span>
                        <StatusBadge tone={securityPolicyStatusTone(policy.status)}>{securityPolicyStatusLabel(policy.status)}</StatusBadge>
                        <StatusBadge tone={securityPolicyEffectTone(policy.effect)}>{securityPolicyEffectLabel(policy.effect)}</StatusBadge>
                      </div>
                      <p className="mt-1 break-all text-sm text-muted-foreground">
                        {policy.code} · {policy.resource_type}:{policy.action} · 优先级 {policy.priority}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        条件 {policy.condition_count} 个 · 评估 {policy.evaluation_count} 次 · 最近 {formatDateTime(policy.last_evaluated_at)}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">创建人：{policy.created_by?.name ?? '系统'}</div>
                    <div className="text-sm text-muted-foreground">更新：{formatDateTime(policy.updated_at)}</div>
                    <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
                      <Button
                        disabled={!canWrite || policy.status === 'DELETED' || pending}
                        onClick={() =>
                          setPolicyStatusTarget({
                            nextStatus,
                            policyCode: policy.code,
                            policyId: policy.id,
                            policyName: policy.name,
                          })
                        }
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <Power className="size-4" />
                        {pending ? '处理中' : nextStatus === 'ACTIVE' ? '启用' : '停用'}
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href="/security">
                          <ArrowRight className="size-4" />
                          详情/编辑
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="h-fit p-5">
          <div className="flex items-center gap-2">
            <FileSearch className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">评估日志</h2>
          </div>
          {evaluationsQuery.isError ? (
            <PageError>评估日志加载失败。</PageError>
          ) : evaluationsQuery.isLoading ? (
            <LoadingRows count={4} />
          ) : evaluations.length === 0 ? (
	            <EmptyState className="px-0" title="暂无评估" />
          ) : (
            <div className="mt-4 grid gap-3">
              {evaluations.map((evaluation) => (
                <div className="rounded-md border bg-muted/15 p-3" key={evaluation.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={securityPolicyDecisionTone(evaluation.decision)}>{securityPolicyDecisionLabel(evaluation.decision)}</StatusBadge>
                    <span className="text-sm font-medium">{evaluation.action}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{evaluation.reason}</p>
                  <p className="mt-2 break-all text-xs text-muted-foreground">
                    {evaluation.matched_policy_code ?? '未命中策略'} · request_id {evaluation.request_id} · {formatDateTime(evaluation.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
      {policyStatusTarget ? (
        <SecurityConfirmDialog
          body={`确认将安全策略「${policyStatusTarget.policyName}」更新为「${securityPolicyStatusLabel(policyStatusTarget.nextStatus)}」？策略编码 ${policyStatusTarget.policyCode} 的启停会立即影响后续 ABAC、资源授权和安全拦截判断。`}
          confirmLabel={policyStatusTarget.nextStatus === 'ACTIVE' ? '确认启用' : '确认停用'}
          onCancel={() => setPolicyStatusTarget(null)}
          onConfirm={confirmPolicyStatusChange}
          pending={statusMutation.isPending}
          title="确认更新策略状态"
        />
      ) : null}
    </main>
  );
}
