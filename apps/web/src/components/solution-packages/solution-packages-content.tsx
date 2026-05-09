'use client';

import { hasPermission, type SolutionPackageListItem } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Eye, Plus, Search, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { SolutionPackageBackground } from '@/components/solution-packages/solution-package-background';
import {
  formatDateTime,
  solutionCustomerTypeLabel,
  solutionCustomerTypes,
  solutionPriorities,
  solutionPriorityLabel,
  solutionPriorityTone,
  solutionScoreTone,
  solutionStageLabel,
  solutionStages,
  solutionStatusLabel,
  solutionStatuses,
  solutionStatusTone,
} from '@/components/solution-packages/solution-package-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { deleteSolutionPackage, listSolutionPackages, listUsers, type ApiClientError } from '@/lib/api-client';

const pageSize = 20;

export function SolutionPackagesContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [customerType, setCustomerType] = useState('');
  const [stage, setStage] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<SolutionPackageListItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'solution:package:manage'),
  );

  const packagesQuery = useQuery({
    queryKey: ['solution-packages', page, keyword, customerType, stage, status, priority, ownerId],
    queryFn: () =>
      listSolutionPackages({
        page,
        page_size: pageSize,
        keyword,
        customer_type: customerType,
        package_stage: stage,
        status,
        priority,
        owner_id: ownerId,
      }),
  });
  const ownersQuery = useQuery({
    queryKey: ['solution-package-owners'],
    queryFn: () => listUsers({ page: 1, page_size: 100, status: 'ACTIVE' }),
  });

  const packages = packagesQuery.data?.items ?? [];
  const owners = ownersQuery.data?.items ?? [];
  const total = packagesQuery.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const metrics = useMemo(
    () => [
      { label: '方案包', value: `${total}`, helper: '租户范围' },
      { label: '高完整度', value: `${packages.filter((item) => item.package_score >= 85).length}`, helper: '当前页 85+' },
      { label: '交付中', value: `${packages.filter((item) => item.status === 'DELIVERING').length}`, helper: '当前页' },
      { label: '资源绑定', value: `${packages.filter((item) => item.linked_resources.customer_assessment && item.linked_resources.role_scenario).length}`, helper: '评估 + 场景' },
    ],
    [packages, total],
  );

  const deleteMutation = useMutation({
    mutationFn: deleteSolutionPackage,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['solution-packages'] });
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
    setCustomerType('');
    setStage('');
    setStatus('');
    setPriority('');
    setOwnerId('');
    setPage(1);
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <SolutionPackageBackground />

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
      >
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">落地方案包</StatusBadge>
            <StatusBadge tone="mock">客户评估 + 岗位场景</StatusBadge>
            <StatusBadge tone="planned">交付验收闭环</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">AI 落地方案包</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            把客户分层、六问判断和岗位场景转成可交付的方案摘要、交付路线图、验收计划、ROI 摘要和商务推进策略。
          </p>
        </div>
        {canWrite ? (
          <Button asChild className="w-full md:w-auto">
            <Link href="/solution-packages/create">
              <Plus className="size-4" />
              新建方案包
            </Link>
          </Button>
        ) : (
          <Button className="w-full md:w-auto" disabled>
            <Plus className="size-4" />
            新建方案包
          </Button>
        )}
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
                <h2 className="text-sm font-semibold">方案包清单</h2>
                <p className="mt-1 text-sm text-muted-foreground">列表只展示核心识别字段、状态、评分、摘要预览和行内操作，完整交付内容进入详情页。</p>
              </div>
              <div className="text-sm text-muted-foreground">显示 {packages.length} / {total}</div>
            </div>

            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_130px_140px_120px_120px_180px_auto]">
              <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
                <Search className="size-4 text-muted-foreground" />
                <input
                  className="min-w-0 flex-1 bg-transparent outline-none"
                  onChange={(event) => updateFilter(setKeyword, event.target.value)}
                  placeholder="搜索客户、方案、路线图、ROI"
                  value={keyword}
                />
              </label>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setCustomerType, event.target.value)} value={customerType}>
                <option value="">全部客户</option>
                {solutionCustomerTypes.map((option) => (
                  <option key={option} value={option}>{solutionCustomerTypeLabel(option)}</option>
                ))}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setStage, event.target.value)} value={stage}>
                <option value="">全部阶段</option>
                {solutionStages.map((option) => (
                  <option key={option} value={option}>{solutionStageLabel(option)}</option>
                ))}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setStatus, event.target.value)} value={status}>
                <option value="">全部状态</option>
                {solutionStatuses.map((option) => (
                  <option key={option} value={option}>{solutionStatusLabel(option)}</option>
                ))}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setPriority, event.target.value)} value={priority}>
                <option value="">全部优先级</option>
                {solutionPriorities.map((option) => (
                  <option key={option} value={option}>{solutionPriorityLabel(option)}</option>
                ))}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setOwnerId, event.target.value)} value={ownerId}>
                <option value="">全部负责人</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>{owner.name}</option>
                ))}
              </select>
              <Button onClick={clearFilters} type="button" variant="outline">清空</Button>
            </div>
          </div>
        </div>

        {packagesQuery.isError ? (
          <div className="p-6 text-sm text-destructive">落地方案加载失败。</div>
        ) : packagesQuery.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">正在加载落地方案...</div>
        ) : packages.length === 0 ? (
          <EmptyState
            action={
              canWrite ? (
                <Button asChild>
                  <Link href="/solution-packages/create">
                    <Plus className="size-4" />
                    新建方案包
                  </Link>
                </Button>
              ) : null
            }
            description="先新建一个方案包，再在详情页查看完整交付路线图、验收、ROI、风险和关联资源。"
            title="暂无落地方案"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1280px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {['方案包', '客户', '阶段/状态', '评分', '方案摘要', '路线图预览', 'ROI 预览', '关联资源', '负责人', '更新时间', '操作'].map((column) => (
                    <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {packages.map((item, index) => (
                  <motion.tr
                    animate={{ opacity: 1, y: 0 }}
                    className="border-b transition-colors last:border-0 hover:bg-muted/25"
                    initial={{ opacity: 0, y: 8 }}
                    key={item.id}
                    transition={{ delay: index * 0.025, duration: 0.22 }}
                  >
                    <td className="px-4 py-3">
                      <div className="grid max-w-64 gap-1">
                        <Link className="font-medium hover:text-primary" href={`/solution-packages/${item.id}`}>{item.name}</Link>
                        <span className="text-xs text-muted-foreground">{item.code}</span>
                        <div className="flex flex-wrap gap-1">
                          {item.tags.slice(0, 3).map((tag) => (
                            <span className="rounded-md border bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground" key={tag}>{tag}</span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="grid gap-1">
                        <span className="font-medium">{item.customer_name}</span>
                        <span className="text-xs text-muted-foreground">{item.industry ?? '未填写行业'} / {solutionCustomerTypeLabel(item.customer_type)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <StatusBadge tone="planned">{solutionStageLabel(item.package_stage)}</StatusBadge>
                        <StatusBadge tone={solutionStatusTone(item.status)}>{solutionStatusLabel(item.status)}</StatusBadge>
                        <StatusBadge tone={solutionPriorityTone(item.priority)}>{solutionPriorityLabel(item.priority)}</StatusBadge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={solutionScoreTone(item.package_score)}>{item.package_score} 分</StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground"><div className="max-w-64">{item.executive_summary_preview}</div></td>
                    <td className="px-4 py-3 text-muted-foreground"><div className="max-w-64">{item.roadmap_preview}</div></td>
                    <td className="px-4 py-3 text-muted-foreground"><div className="max-w-56">{item.roi_preview}</div></td>
                    <td className="px-4 py-3">
                      <div className="grid gap-1 text-xs text-muted-foreground">
                        <span>评估：{item.linked_resources.customer_assessment ? item.linked_resources.customer_assessment.customer_name : '未绑定'}</span>
                        <span>场景：{item.linked_resources.role_scenario ? item.linked_resources.role_scenario.name : '未绑定'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.owner?.name ?? '未分配'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(item.updated_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/solution-packages/${item.id}`}><Eye className="size-4" />详情</Link>
                        </Button>
                        {canWrite ? (
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/solution-packages/${item.id}/edit`}><Edit className="size-4" />编辑</Link>
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
            <h2 className="text-lg font-semibold">归档落地方案</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              确认归档「{deleteTarget.name}」？归档后列表不再展示该方案包，历史审计仍保留。
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
