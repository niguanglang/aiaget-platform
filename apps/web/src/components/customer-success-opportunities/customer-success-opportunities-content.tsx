'use client';

import { hasPermission, type CustomerSuccessOpportunityListItem } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart3, Edit, Eye, Plus, Search, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { CustomerSuccessOpportunityBackground } from '@/components/customer-success-opportunities/customer-success-opportunity-background';
import {
  customerSuccessOpportunityConfidenceLabel,
  customerSuccessOpportunityConfidenceLevels,
  customerSuccessOpportunityConfidenceTone,
  customerSuccessOpportunityPriorities,
  customerSuccessOpportunityPriorityLabel,
  customerSuccessOpportunityPriorityTone,
  customerSuccessOpportunityRiskLabel,
  customerSuccessOpportunityRiskLevels,
  customerSuccessOpportunityRiskTone,
  customerSuccessOpportunityScoreTone,
  customerSuccessOpportunityStageLabel,
  customerSuccessOpportunityStages,
  customerSuccessOpportunityStageTone,
  customerSuccessOpportunityStatusLabel,
  customerSuccessOpportunityStatuses,
  customerSuccessOpportunityStatusTone,
  customerSuccessOpportunityTypeLabel,
  customerSuccessOpportunityTypes,
  formatDateTime,
  formatMoney,
} from '@/components/customer-success-opportunities/customer-success-opportunity-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  deleteCustomerSuccessOpportunity,
  listCustomerSuccessActions,
  listCustomerSuccessOpportunities,
  listCustomerSuccessPlans,
  listDeliveryAssets,
  listDeliveryReviews,
  listSolutionPackages,
  listUsers,
  type ApiClientError,
} from '@/lib/api-client';

const pageSize = 20;

export function CustomerSuccessOpportunitiesContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [opportunityType, setOpportunityType] = useState('');
  const [stage, setStage] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [planId, setPlanId] = useState('');
  const [actionId, setActionId] = useState('');
  const [deliveryReviewId, setDeliveryReviewId] = useState('');
  const [deliveryAssetId, setDeliveryAssetId] = useState('');
  const [solutionPackageId, setSolutionPackageId] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<CustomerSuccessOpportunityListItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'customer:success_opportunity:manage'),
  );

  const opportunitiesQuery = useQuery({
    queryKey: [
      'customer-success-opportunities',
      page,
      keyword,
      opportunityType,
      stage,
      status,
      priority,
      confidenceLevel,
      riskLevel,
      ownerId,
      planId,
      actionId,
      deliveryReviewId,
      deliveryAssetId,
      solutionPackageId,
    ],
    queryFn: () =>
      listCustomerSuccessOpportunities({
        page,
        page_size: pageSize,
        keyword,
        opportunity_type: opportunityType,
        stage,
        status,
        priority,
        confidence_level: confidenceLevel,
        risk_level: riskLevel,
        owner_id: ownerId,
        customer_success_plan_id: planId,
        customer_success_action_id: actionId,
        delivery_review_id: deliveryReviewId,
        delivery_asset_id: deliveryAssetId,
        solution_package_id: solutionPackageId,
      }),
  });
  const ownersQuery = useQuery({ queryKey: ['customer-success-opportunity-owners'], queryFn: () => listUsers({ page: 1, page_size: 100, status: 'ACTIVE' }) });
  const plansQuery = useQuery({ queryKey: ['customer-success-opportunity-plans'], queryFn: () => listCustomerSuccessPlans({ page: 1, page_size: 100 }) });
  const actionsQuery = useQuery({ queryKey: ['customer-success-opportunity-actions'], queryFn: () => listCustomerSuccessActions({ page: 1, page_size: 100 }) });
  const reviewsQuery = useQuery({ queryKey: ['customer-success-opportunity-reviews'], queryFn: () => listDeliveryReviews({ page: 1, page_size: 100 }) });
  const assetsQuery = useQuery({ queryKey: ['customer-success-opportunity-assets'], queryFn: () => listDeliveryAssets({ page: 1, page_size: 100 }) });
  const packagesQuery = useQuery({ queryKey: ['customer-success-opportunity-packages'], queryFn: () => listSolutionPackages({ page: 1, page_size: 100 }) });

  const opportunities = opportunitiesQuery.data?.items ?? [];
  const owners = ownersQuery.data?.items ?? [];
  const plans = plansQuery.data?.items ?? [];
  const actions = actionsQuery.data?.items ?? [];
  const reviews = reviewsQuery.data?.items ?? [];
  const assets = assetsQuery.data?.items ?? [];
  const packages = packagesQuery.data?.items ?? [];
  const total = opportunitiesQuery.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const metrics = useMemo(
    () => [
      { label: '续约机会', value: `${total}`, helper: '租户范围' },
      { label: '高价值机会', value: `${opportunities.filter((item) => item.estimated_amount >= 500000).length}`, helper: '当前页 50 万+' },
      { label: '谈判中', value: `${opportunities.filter((item) => item.stage === 'NEGOTIATION').length}`, helper: '当前页' },
      { label: '风险机会', value: `${opportunities.filter((item) => item.status === 'AT_RISK' || item.risk_level === 'HIGH').length}`, helper: '当前页' },
    ],
    [opportunities, total],
  );

  const deleteMutation = useMutation({
    mutationFn: deleteCustomerSuccessOpportunity,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['customer-success-opportunities'] });
      setDeleteTarget(null);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  function updateFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  function clearFilters() {
    setKeyword('');
    setOpportunityType('');
    setStage('');
    setStatus('');
    setPriority('');
    setConfidenceLevel('');
    setRiskLevel('');
    setOwnerId('');
    setPlanId('');
    setActionId('');
    setDeliveryReviewId('');
    setDeliveryAssetId('');
    setSolutionPackageId('');
    setPage(1);
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <CustomerSuccessOpportunityBackground />

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
      >
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">续约机会</StatusBadge>
            <StatusBadge tone="healthy">商务闭环</StatusBadge>
            <StatusBadge tone="planned">客户成功</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">客户成功续约机会中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            把客户成功计划和成功行动转成可阶段推进、可金额预测、可风险跟踪的续约、扩展、增购和风险挽留机会。
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row md:justify-end">
          <Button asChild className="w-full md:w-auto" variant="outline">
            <Link href="/customer-success-opportunities/analytics">
              <BarChart3 className="size-4" />
              机会分析
            </Link>
          </Button>
          {canWrite ? (
            <Button asChild className="w-full md:w-auto">
              <Link href="/customer-success-opportunities/create">
                <Plus className="size-4" />
                新建机会
              </Link>
            </Button>
          ) : (
            <Button className="w-full md:w-auto" disabled>
              <Plus className="size-4" />
              新建机会
            </Button>
          )}
        </div>
      </motion.section>

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.04, duration: 0.32, ease: 'easeOut' }}
      >
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </motion.section>

      {actionError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <Card>
        <div className="border-b p-4">
          <div className="grid gap-4">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-sm font-semibold">机会清单</h2>
                <p className="mt-1 text-sm text-muted-foreground">列表只展示核心字段、阶段、金额概率、摘要预览和来源关系，完整商务策略进入详情页。</p>
              </div>
              <div className="text-sm text-muted-foreground">显示 {opportunities.length} / {total}</div>
            </div>

            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_140px_140px_120px_110px_120px_120px_170px_185px_185px_185px_185px_185px_auto]">
              <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
                <Search className="size-4 text-muted-foreground" />
                <input
                  className="min-w-0 flex-1 bg-transparent outline-none"
                  onChange={(event) => updateFilter(setKeyword, event.target.value)}
                  placeholder="搜索客户、机会、策略、风险"
                  value={keyword}
                />
              </label>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setOpportunityType, event.target.value)} value={opportunityType}>
                <option value="">全部类型</option>
                {customerSuccessOpportunityTypes.map((option) => (
                  <option key={option} value={option}>{customerSuccessOpportunityTypeLabel(option)}</option>
                ))}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setStage, event.target.value)} value={stage}>
                <option value="">全部阶段</option>
                {customerSuccessOpportunityStages.map((option) => (
                  <option key={option} value={option}>{customerSuccessOpportunityStageLabel(option)}</option>
                ))}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setStatus, event.target.value)} value={status}>
                <option value="">全部状态</option>
                {customerSuccessOpportunityStatuses.map((option) => (
                  <option key={option} value={option}>{customerSuccessOpportunityStatusLabel(option)}</option>
                ))}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setPriority, event.target.value)} value={priority}>
                <option value="">优先级</option>
                {customerSuccessOpportunityPriorities.map((option) => (
                  <option key={option} value={option}>{customerSuccessOpportunityPriorityLabel(option)}</option>
                ))}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setConfidenceLevel, event.target.value)} value={confidenceLevel}>
                <option value="">信心等级</option>
                {customerSuccessOpportunityConfidenceLevels.map((option) => (
                  <option key={option} value={option}>{customerSuccessOpportunityConfidenceLabel(option)}</option>
                ))}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setRiskLevel, event.target.value)} value={riskLevel}>
                <option value="">风险等级</option>
                {customerSuccessOpportunityRiskLevels.map((option) => (
                  <option key={option} value={option}>{customerSuccessOpportunityRiskLabel(option)}</option>
                ))}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setOwnerId, event.target.value)} value={ownerId}>
                <option value="">全部负责人</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>{owner.name}</option>
                ))}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setPlanId, event.target.value)} value={planId}>
                <option value="">全部计划</option>
                {plans.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setActionId, event.target.value)} value={actionId}>
                <option value="">全部行动</option>
                {actions.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setDeliveryReviewId, event.target.value)} value={deliveryReviewId}>
                <option value="">全部复盘</option>
                {reviews.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setDeliveryAssetId, event.target.value)} value={deliveryAssetId}>
                <option value="">全部资产</option>
                {assets.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setSolutionPackageId, event.target.value)} value={solutionPackageId}>
                <option value="">全部方案包</option>
                {packages.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
              <Button onClick={clearFilters} type="button" variant="outline">清空</Button>
            </div>
          </div>
        </div>

        {opportunitiesQuery.isError ? (
          <div className="p-6 text-sm text-destructive">续约机会加载失败。</div>
        ) : opportunitiesQuery.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">正在加载续约机会...</div>
        ) : opportunities.length === 0 ? (
          <EmptyState
            action={
              canWrite ? (
                <Button asChild>
                  <Link href="/customer-success-opportunities/create">
                    <Plus className="size-4" />
                    新建机会
                  </Link>
                </Button>
              ) : null
            }
            description="先从客户成功计划和成功行动沉淀续约机会，再在详情页维护完整商务策略、决策路径和风险摘要。"
            title="暂无续约机会"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1580px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {['机会', '客户', '类型/阶段', '状态/优先级', '信心/风险', '评分', '金额/概率', '机会摘要', '下一步动作', '来源关系', '负责人', '关键时间', '操作'].map((column) => (
                    <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {opportunities.map((item, index) => (
                  <motion.tr
                    animate={{ opacity: 1, y: 0 }}
                    className="border-b transition-colors last:border-0 hover:bg-muted/25"
                    initial={{ opacity: 0, y: 8 }}
                    key={item.id}
                    transition={{ delay: index * 0.025, duration: 0.22 }}
                  >
                    <td className="px-4 py-3">
                      <div className="grid max-w-64 gap-1">
                        <Link className="font-medium hover:text-primary" href={`/customer-success-opportunities/${item.id}`}>{item.name}</Link>
                        <span className="text-xs text-muted-foreground">{item.code}</span>
                        <div className="flex flex-wrap gap-1">
                          {item.tags.slice(0, 3).map((tag) => (
                            <span className="rounded-md border bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground" key={tag}>{tag}</span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">{item.customer_name}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <StatusBadge tone="planned">{customerSuccessOpportunityTypeLabel(item.opportunity_type)}</StatusBadge>
                        <StatusBadge tone={customerSuccessOpportunityStageTone(item.stage)}>{customerSuccessOpportunityStageLabel(item.stage)}</StatusBadge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <StatusBadge tone={customerSuccessOpportunityStatusTone(item.status)}>{customerSuccessOpportunityStatusLabel(item.status)}</StatusBadge>
                        <StatusBadge tone={customerSuccessOpportunityPriorityTone(item.priority)}>{customerSuccessOpportunityPriorityLabel(item.priority)}</StatusBadge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <StatusBadge tone={customerSuccessOpportunityConfidenceTone(item.confidence_level)}>{customerSuccessOpportunityConfidenceLabel(item.confidence_level)}</StatusBadge>
                        <StatusBadge tone={customerSuccessOpportunityRiskTone(item.risk_level)}>{customerSuccessOpportunityRiskLabel(item.risk_level)}</StatusBadge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={customerSuccessOpportunityScoreTone(item.opportunity_score)}>{item.opportunity_score} 分</StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="grid gap-1">
                        <span className="font-medium text-foreground">{formatMoney(item.estimated_amount)}</span>
                        <span className="text-xs">概率 {item.probability}% / 加权 {formatMoney(item.weighted_amount)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground"><div className="max-w-60">{item.opportunity_summary_preview}</div></td>
                    <td className="px-4 py-3 text-muted-foreground"><div className="max-w-60">{item.next_action_preview}</div></td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="grid max-w-56 gap-1">
                        <span>{item.linked_resources.customer_success_plan?.name ?? '未绑定计划'}</span>
                        <span className="text-xs">{item.linked_resources.customer_success_action?.name ?? item.linked_resources.delivery_asset?.name ?? '未绑定行动或资产'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.owner?.name ?? '未分配'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="grid gap-1">
                        <span>预计 {formatDateTime(item.expected_close_at)}</span>
                        <span className="text-xs">关闭 {formatDateTime(item.closed_at)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/customer-success-opportunities/${item.id}`}><Eye className="size-4" />详情</Link>
                        </Button>
                        {canWrite ? (
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/customer-success-opportunities/${item.id}/edit`}><Edit className="size-4" />编辑</Link>
                          </Button>
                        ) : null}
                        {canWrite ? (
                          <Button onClick={() => setDeleteTarget(item)} size="sm" variant="ghost">
                            <Trash2 className="size-4" />归档
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

        <div className="flex flex-col gap-3 border-t p-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span>第 {page} / {pageCount} 页</span>
          <div className="flex gap-2">
            <Button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} size="sm" variant="outline">上一页</Button>
            <Button disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} size="sm" variant="outline">下一页</Button>
          </div>
        </div>
      </Card>

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/20 px-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-5">
            <h2 className="text-lg font-semibold">归档续约机会</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              确认归档「{deleteTarget.name}」？归档后列表不再展示该机会，历史审计和关联资源仍保留。
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button onClick={() => setDeleteTarget(null)} variant="outline">取消</Button>
              <Button disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleteTarget.id)} variant="destructive">
                {deleteMutation.isPending ? '归档中...' : '确认归档'}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </main>
  );
}
