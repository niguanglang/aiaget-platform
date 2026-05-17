'use client';

import { hasPermission, type DeliveryAssetListItem } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Eye, Plus, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import {
  deliveryAssetScoreTone,
  deliveryAssetStatusLabel,
  deliveryAssetStatuses,
  deliveryAssetStatusTone,
  deliveryAssetTypeLabel,
  deliveryAssetTypes,
  deliveryAssetVisibilityLabel,
  deliveryAssetVisibilities,
  deliveryAssetVisibilityTone,
  formatDateTime,
} from '@/components/delivery-assets/delivery-asset-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  deleteDeliveryAsset,
  listDeliveryAssets,
  listDeliveryReviews,
  listSolutionPackages,
  listUsers,
  type ApiClientError,
} from '@/lib/api-client';

const pageSize = 20;

export function DeliveryAssetsContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [assetType, setAssetType] = useState('');
  const [status, setStatus] = useState('');
  const [visibility, setVisibility] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [deliveryReviewId, setDeliveryReviewId] = useState('');
  const [solutionPackageId, setSolutionPackageId] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<DeliveryAssetListItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'delivery:asset:manage'),
  );

  const assetsQuery = useQuery({
    queryKey: ['delivery-assets', page, keyword, assetType, status, visibility, ownerId, deliveryReviewId, solutionPackageId],
    queryFn: () =>
      listDeliveryAssets({
        page,
        page_size: pageSize,
        keyword,
        asset_type: assetType,
        status,
        visibility,
        owner_id: ownerId,
        delivery_review_id: deliveryReviewId,
        solution_package_id: solutionPackageId,
      }),
  });
  const ownersQuery = useQuery({
    queryKey: ['delivery-asset-owners'],
    queryFn: () => listUsers({ page: 1, page_size: 100, status: 'ACTIVE' }),
  });
  const reviewsQuery = useQuery({
    queryKey: ['delivery-asset-reviews'],
    queryFn: () => listDeliveryReviews({ page: 1, page_size: 100 }),
  });
  const packagesQuery = useQuery({
    queryKey: ['delivery-asset-packages'],
    queryFn: () => listSolutionPackages({ page: 1, page_size: 100 }),
  });

  const assets = assetsQuery.data?.items ?? [];
  const owners = ownersQuery.data?.items ?? [];
  const reviews = reviewsQuery.data?.items ?? [];
  const packages = packagesQuery.data?.items ?? [];
  const total = assetsQuery.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const metrics = useMemo(
    () => [
      { label: '成果资产', value: `${total}`, helper: '租户范围' },
      { label: '高复用', value: `${assets.filter((item) => item.reuse_score >= 85).length}`, helper: '当前页 85+' },
      { label: '已发布', value: `${assets.filter((item) => item.status === 'PUBLISHED').length}`, helper: '当前页' },
      { label: '租户可见', value: `${assets.filter((item) => item.visibility === 'TENANT').length}`, helper: '当前页' },
    ],
    [assets, total],
  );

  const deleteMutation = useMutation({
    mutationFn: deleteDeliveryAsset,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['delivery-assets'] });
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
    setAssetType('');
    setStatus('');
    setVisibility('');
    setOwnerId('');
    setDeliveryReviewId('');
    setSolutionPackageId('');
    setPage(1);
  }

  return (
    <main className="mx-auto grid max-w-[1680px] gap-6 rounded-xl border border-slate-200/80 bg-white/[0.9] px-4 py-6 lg:px-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h1 className="text-2xl font-semibold">交付资产</h1>
        </div>
        {canWrite ? (
          <Button asChild className="w-full md:w-auto">
            <Link href="/delivery-assets/create">
              <Plus className="size-4" />
              新建资产
            </Link>
          </Button>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricSummary helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      {actionError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <Card>
        <div className="border-b p-4">
          <div className="grid gap-4">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <h2 className="text-sm font-semibold">资产清单</h2>
              <div className="text-sm text-muted-foreground">显示 {assets.length} / {total}</div>
            </div>

            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_150px_130px_120px_180px_190px_190px_auto]">
              <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
                <Search className="size-4 text-muted-foreground" />
                <input
                  className="min-w-0 flex-1 bg-transparent outline-none"
                  onChange={(event) => updateFilter(setKeyword, event.target.value)}
                  placeholder="搜索客户、资产、指引、风险"
                  value={keyword}
                />
              </label>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setAssetType, event.target.value)} value={assetType}>
                <option value="">全部类型</option>
                {deliveryAssetTypes.map((option) => (
                  <option key={option} value={option}>{deliveryAssetTypeLabel(option)}</option>
                ))}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setStatus, event.target.value)} value={status}>
                <option value="">全部状态</option>
                {deliveryAssetStatuses.map((option) => (
                  <option key={option} value={option}>{deliveryAssetStatusLabel(option)}</option>
                ))}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setVisibility, event.target.value)} value={visibility}>
                <option value="">可见范围</option>
                {deliveryAssetVisibilities.map((option) => (
                  <option key={option} value={option}>{deliveryAssetVisibilityLabel(option)}</option>
                ))}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setOwnerId, event.target.value)} value={ownerId}>
                <option value="">全部负责人</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>{owner.name}</option>
                ))}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setDeliveryReviewId, event.target.value)} value={deliveryReviewId}>
                <option value="">全部复盘</option>
                {reviews.map((item) => (
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

        {assetsQuery.isError ? (
          <div className="p-6 text-sm text-destructive">交付资产加载失败。</div>
        ) : assetsQuery.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">正在加载交付资产...</div>
        ) : assets.length === 0 ? (
          <EmptyState
            action={
              canWrite ? (
                <Button asChild>
                  <Link href="/delivery-assets/create">
                    <Plus className="size-4" />
                    新建资产
                  </Link>
                </Button>
              ) : null
            }
            title="暂无交付资产"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {['资产', '客户', '类型/状态', '评分', '摘要预览', '指引', '来源关系', '负责人', '更新时间', '操作'].map((column) => (
                    <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assets.map((item) => (
                  <tr className="border-b transition-colors last:border-0 hover:bg-muted/25" key={item.id}>
                    <td className="px-4 py-3">
                      <div className="grid max-w-64 gap-1">
                        <Link className="font-medium hover:text-primary" href={`/delivery-assets/${item.id}`}>{item.name}</Link>
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
                        <StatusBadge tone="planned">{deliveryAssetTypeLabel(item.asset_type)}</StatusBadge>
                        <StatusBadge tone={deliveryAssetStatusTone(item.status)}>{deliveryAssetStatusLabel(item.status)}</StatusBadge>
                        <StatusBadge tone={deliveryAssetVisibilityTone(item.visibility)}>{deliveryAssetVisibilityLabel(item.visibility)}</StatusBadge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={deliveryAssetScoreTone(item.reuse_score)}>{item.reuse_score} 分</StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground"><div className="max-w-60">{item.summary_preview}</div></td>
                    <td className="px-4 py-3 text-muted-foreground"><div className="max-w-60">{item.reuse_guidance_preview}</div></td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="grid max-w-56 gap-1">
                        <span>{item.linked_resources.delivery_review?.name ?? '未绑定复盘'}</span>
                        <span className="text-xs">{item.linked_resources.solution_package?.name ?? '未绑定方案包'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.owner?.name ?? '未分配'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(item.updated_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/delivery-assets/${item.id}`}><Eye className="size-4" />详情</Link>
                        </Button>
                        {canWrite ? (
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/delivery-assets/${item.id}/edit`}><Edit className="size-4" />编辑</Link>
                          </Button>
                        ) : null}
                        {canWrite ? (
                          <Button onClick={() => setDeleteTarget(item)} size="sm" variant="ghost">
                            <Trash2 className="size-4" />归档
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
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
            <h2 className="text-lg font-semibold">归档交付资产</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              确认归档「{deleteTarget.name}」？归档后列表不再展示该资产，历史审计和来源复盘仍保留。
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

function MetricSummary({ helper, label, value }: { helper: string; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/[0.9] p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{helper}</div>
    </div>
  );
}
