'use client';

import { hasPermission, type DeliveryReviewListItem } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Eye, Plus, Search, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { DeliveryReviewBackground } from '@/components/delivery-reviews/delivery-review-background';
import {
  deliveryReviewResultLabel,
  deliveryReviewResults,
  deliveryReviewResultTone,
  deliveryReviewSatisfactionLabel,
  deliveryReviewSatisfactionLevels,
  deliveryReviewSatisfactionTone,
  deliveryReviewScoreTone,
  deliveryReviewStageLabel,
  deliveryReviewStages,
  deliveryReviewStatusLabel,
  deliveryReviewStatuses,
  deliveryReviewStatusTone,
  formatDateTime,
} from '@/components/delivery-reviews/delivery-review-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  deleteDeliveryReview,
  listDeliveryReviews,
  listSolutionPackages,
  listUsers,
  type ApiClientError,
} from '@/lib/api-client';

const pageSize = 20;

export function DeliveryReviewsContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [stage, setStage] = useState('');
  const [result, setResult] = useState('');
  const [status, setStatus] = useState('');
  const [satisfactionLevel, setSatisfactionLevel] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [solutionPackageId, setSolutionPackageId] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<DeliveryReviewListItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'delivery:review:manage'),
  );

  const reviewsQuery = useQuery({
    queryKey: ['delivery-reviews', page, keyword, stage, result, status, satisfactionLevel, ownerId, solutionPackageId],
    queryFn: () =>
      listDeliveryReviews({
        page,
        page_size: pageSize,
        keyword,
        review_stage: stage,
        result,
        status,
        satisfaction_level: satisfactionLevel,
        owner_id: ownerId,
        solution_package_id: solutionPackageId,
      }),
  });
  const ownersQuery = useQuery({
    queryKey: ['delivery-review-owners'],
    queryFn: () => listUsers({ page: 1, page_size: 100, status: 'ACTIVE' }),
  });
  const packagesQuery = useQuery({
    queryKey: ['delivery-review-packages'],
    queryFn: () => listSolutionPackages({ page: 1, page_size: 100 }),
  });

  const reviews = reviewsQuery.data?.items ?? [];
  const owners = ownersQuery.data?.items ?? [];
  const packages = packagesQuery.data?.items ?? [];
  const total = reviewsQuery.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const metrics = useMemo(
    () => [
      { label: '验收复盘', value: `${total}`, helper: '租户范围' },
      { label: '高分验收', value: `${reviews.filter((item) => item.acceptance_score >= 85).length}`, helper: '当前页 85+' },
      { label: '已完成', value: `${reviews.filter((item) => item.status === 'COMPLETED').length}`, helper: '当前页' },
      { label: '待改进', value: `${reviews.filter((item) => item.status === 'ACTION_REQUIRED').length}`, helper: '当前页' },
    ],
    [reviews, total],
  );

  const deleteMutation = useMutation({
    mutationFn: deleteDeliveryReview,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['delivery-reviews'] });
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
    setStage('');
    setResult('');
    setStatus('');
    setSatisfactionLevel('');
    setOwnerId('');
    setSolutionPackageId('');
    setPage(1);
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <DeliveryReviewBackground />

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
      >
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">验收复盘</StatusBadge>
            <StatusBadge tone="mock">绑定落地方案包</StatusBadge>
            <StatusBadge tone="planned">改进行动 + 扩展计划</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">交付验收复盘</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            承接落地方案包，记录客户验收结果、问题复盘、改进行动、扩展计划和可复用资产。
          </p>
        </div>
        {canWrite ? (
          <Button asChild className="w-full md:w-auto">
            <Link href="/delivery-reviews/create">
              <Plus className="size-4" />
              新建复盘
            </Link>
          </Button>
        ) : null}
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
                <h2 className="text-sm font-semibold">复盘清单</h2>
                <p className="mt-1 text-sm text-muted-foreground">核心字段、状态、评分、验收结论和摘要预览。</p>
              </div>
              <div className="text-sm text-muted-foreground">显示 {reviews.length} / {total}</div>
            </div>

            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_130px_130px_130px_120px_180px_190px_auto]">
              <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
                <Search className="size-4 text-muted-foreground" />
                <input
                  className="min-w-0 flex-1 bg-transparent outline-none"
                  onChange={(event) => updateFilter(setKeyword, event.target.value)}
                  placeholder="搜索客户、结论、问题、扩展计划"
                  value={keyword}
                />
              </label>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setStage, event.target.value)} value={stage}>
                <option value="">全部阶段</option>
                {deliveryReviewStages.map((option) => (
                  <option key={option} value={option}>{deliveryReviewStageLabel(option)}</option>
                ))}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setResult, event.target.value)} value={result}>
                <option value="">全部结果</option>
                {deliveryReviewResults.map((option) => (
                  <option key={option} value={option}>{deliveryReviewResultLabel(option)}</option>
                ))}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setStatus, event.target.value)} value={status}>
                <option value="">全部状态</option>
                {deliveryReviewStatuses.map((option) => (
                  <option key={option} value={option}>{deliveryReviewStatusLabel(option)}</option>
                ))}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setSatisfactionLevel, event.target.value)} value={satisfactionLevel}>
                <option value="">满意度</option>
                {deliveryReviewSatisfactionLevels.map((option) => (
                  <option key={option} value={option}>{deliveryReviewSatisfactionLabel(option)}</option>
                ))}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setOwnerId, event.target.value)} value={ownerId}>
                <option value="">全部负责人</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>{owner.name}</option>
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

        {reviewsQuery.isError ? (
          <div className="p-6 text-sm text-destructive">验收复盘加载失败。</div>
        ) : reviewsQuery.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">正在加载验收复盘...</div>
        ) : reviews.length === 0 ? (
          <EmptyState
            action={
              canWrite ? (
                <Button asChild>
                  <Link href="/delivery-reviews/create">
                    <Plus className="size-4" />
                    新建复盘
                  </Link>
                </Button>
              ) : null
            }
            description="暂无交付范围、问题改进、扩展机会和可复用资产。"
            title="暂无验收复盘"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1240px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {['复盘', '客户', '阶段/结果/状态', '评分', '验收结论', '问题预览', '关联方案包', '负责人', '复盘时间', '操作'].map((column) => (
                    <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reviews.map((item, index) => (
                  <motion.tr
                    animate={{ opacity: 1, y: 0 }}
                    className="border-b transition-colors last:border-0 hover:bg-muted/25"
                    initial={{ opacity: 0, y: 8 }}
                    key={item.id}
                    transition={{ delay: index * 0.025, duration: 0.22 }}
                  >
                    <td className="px-4 py-3">
                      <div className="grid max-w-64 gap-1">
                        <Link className="font-medium hover:text-primary" href={`/delivery-reviews/${item.id}`}>{item.name}</Link>
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
                        <StatusBadge tone="planned">{deliveryReviewStageLabel(item.review_stage)}</StatusBadge>
                        <StatusBadge tone={deliveryReviewResultTone(item.result)}>{deliveryReviewResultLabel(item.result)}</StatusBadge>
                        <StatusBadge tone={deliveryReviewStatusTone(item.status)}>{deliveryReviewStatusLabel(item.status)}</StatusBadge>
                        <StatusBadge tone={deliveryReviewSatisfactionTone(item.satisfaction_level)}>{deliveryReviewSatisfactionLabel(item.satisfaction_level)}</StatusBadge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={deliveryReviewScoreTone(item.acceptance_score)}>{item.acceptance_score} 分</StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground"><div className="max-w-64">{item.acceptance_summary_preview}</div></td>
                    <td className="px-4 py-3 text-muted-foreground"><div className="max-w-64">{item.issue_summary_preview}</div></td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="max-w-56">{item.linked_resources.solution_package?.name ?? '未绑定方案包'}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.owner?.name ?? '未分配'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(item.reviewed_at ?? item.updated_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/delivery-reviews/${item.id}`}><Eye className="size-4" />详情</Link>
                        </Button>
                        {canWrite ? (
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/delivery-reviews/${item.id}/edit`}><Edit className="size-4" />编辑</Link>
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
            <h2 className="text-lg font-semibold">归档验收复盘</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              确认归档「{deleteTarget.name}」？归档后列表不再展示该复盘，历史审计仍保留。
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
