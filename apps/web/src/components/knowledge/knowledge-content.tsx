'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  hasPermission,
  type KnowledgeBaseListItem,
  KnowledgeBaseStatus,
  KnowledgeVisibility,
} from '@aiaget/shared-types';
import { motion } from 'motion/react';
import {
  Edit,
  Eye,
  Lock,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { KnowledgeCenterBackground } from '@/components/knowledge/knowledge-center-background';
import {
  formatDateTime,
  knowledgeStatusLabel,
  knowledgeStatusTone,
  knowledgeVisibilityLabel,
} from '@/components/knowledge/knowledge-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  deleteKnowledgeBase,
  listKnowledgeBases,
  listUsers,
  type ApiClientError,
} from '@/lib/api-client';

const statuses: KnowledgeBaseStatus[] = ['ACTIVE', 'DISABLED', 'ARCHIVED'];
const visibilities: KnowledgeVisibility[] = ['PRIVATE', 'TENANT', 'PUBLIC'];

export function KnowledgeContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [visibility, setVisibility] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeBaseListItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const canView = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'knowledge:base:view'),
  );
  const canWrite = Boolean(
    canView &&
      (currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
        hasPermission(currentUser?.user.permissions ?? [], 'knowledge:base:manage')),
  );

  const basesQuery = useQuery({
    queryKey: ['knowledge-bases', keyword, status, visibility, ownerId],
    enabled: canView,
    queryFn: () =>
      listKnowledgeBases({
        page: 1,
        page_size: 20,
        keyword,
        status,
        visibility,
        owner_id: ownerId,
      }),
  });
  const ownersQuery = useQuery({
    queryKey: ['knowledge-owners'],
    enabled: canView,
    queryFn: () => listUsers({ page: 1, page_size: 100, status: 'ACTIVE' }),
  });

  const bases = basesQuery.data?.items ?? [];
  const owners = ownersQuery.data?.items ?? [];
  const activeCount = bases.filter((base) => base.status === 'ACTIVE').length;
  const documentCount = bases.reduce((sum, base) => sum + base.document_count, 0);
  const segmentCount = bases.reduce((sum, base) => sum + base.segment_count, 0);
  const failedTaskCount = bases.reduce((sum, base) => sum + base.failed_task_count, 0);

  const permissionDenied = !canView || getErrorStatus(basesQuery.error) === 403;

  const deleteMutation = useMutation({
    mutationFn: deleteKnowledgeBase,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] });
      setDeleteTarget(null);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  function clearFilters() {
    setKeyword('');
    setStatus('');
    setVisibility('');
    setOwnerId('');
  }

  if (permissionDenied) {
    return (
      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <KnowledgeCenterBackground />
        <Card className="grid gap-4 p-6">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Lock className="size-4 text-primary" />
            知识库访问受限
          </div>
          <EmptyState
            action={(
              <Button asChild variant="outline">
                <Link href="/dashboard">返回工作台</Link>
              </Button>
            )}
            description="请联系租户管理员开通 knowledge:base:view 权限后再访问知识库中心。"
            title="暂无访问权限"
          />
        </Card>
      </main>
    );
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <KnowledgeCenterBackground />

      <motion.section animate={{ opacity: 1, y: 0 }} className="flex flex-col justify-between gap-4 md:flex-row md:items-start" initial={{ opacity: 0, y: 10 }} transition={{ duration: 0.32, ease: 'easeOut' }}>
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">知识库</StatusBadge>
            <StatusBadge tone="healthy">目录列表</StatusBadge>
            <StatusBadge tone="planned">处理活动</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">知识库中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">知识库状态、可见范围、文档数量、切片数量和失败任务。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="w-full md:w-auto" variant="outline">
            <Link href="/knowledge/activity">处理活动</Link>
          </Button>
          <Button asChild className="w-full md:w-auto" variant="outline">
            <Link href="/knowledge/health">能力健康</Link>
          </Button>
          {canWrite ? (
            <Button asChild className="w-full md:w-auto">
              <Link href="/knowledge/create">
                <Plus className="size-4" />
                新建知识库
              </Link>
            </Button>
          ) : null}
        </div>
      </motion.section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {basesQuery.isLoading && !basesQuery.data
          ? Array.from({ length: 4 }).map((_, index) => <div className="h-28 rounded-lg border bg-muted/30" key={index} />)
          : (
              [
                { label: '知识库', value: `${basesQuery.data?.total ?? bases.length}`, helper: '当前筛选结果' },
                { label: '启用中', value: `${activeCount}`, helper: '当前页启用数' },
                { label: '文档', value: `${documentCount}`, helper: '当前页文档数' },
                { label: '失败任务', value: `${failedTaskCount}`, helper: `${segmentCount} 个切片` },
              ] as const
            ).map((metric) => (
              <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
            ))}
      </section>

      {canView && !canWrite ? (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
          当前账号仅可查看知识库，无法新建、编辑、上传或重建索引。
        </div>
      ) : null}

      {actionError ? <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{actionError}</div> : null}

      <section className="grid min-w-0 gap-4">
        <Card className="min-w-0">
          <div className="border-b p-4">
            <div className="grid gap-4">
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                <div>
                  <h2 className="text-sm font-semibold">知识库</h2>
                  <p className="mt-1 text-sm text-muted-foreground">搜索、筛选，并进入详情查看、编辑或删除知识库。</p>
                </div>
                <div className="text-sm text-muted-foreground">显示 {bases.length} / {basesQuery.data?.total ?? 0}</div>
              </div>

              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_150px_150px_190px_auto]">
                <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
                  <Search className="size-4 text-muted-foreground" />
                  <input className="min-w-0 flex-1 bg-transparent outline-none" onChange={(event) => setKeyword(event.target.value)} placeholder="搜索名称、编码、描述" value={keyword} />
                </label>
                <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setStatus(event.target.value)} value={status}>
                  <option value="">全部状态</option>
                  {statuses.map((option) => <option key={option} value={option}>{knowledgeStatusLabel(option)}</option>)}
                </select>
                <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setVisibility(event.target.value)} value={visibility}>
                  <option value="">全部可见范围</option>
                  {visibilities.map((option) => <option key={option} value={option}>{knowledgeVisibilityLabel(option)}</option>)}
                </select>
                <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setOwnerId(event.target.value)} value={ownerId}>
                  <option value="">全部负责人</option>
                  {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
                </select>
                <Button onClick={clearFilters} type="button" variant="outline">清空</Button>
              </div>
            </div>
          </div>

          {basesQuery.isError ? (
            <div className="p-6 text-sm text-destructive">知识库加载失败。</div>
          ) : basesQuery.isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">正在加载知识库...</div>
          ) : bases.length === 0 ? (
            <EmptyState
              action={
                canWrite ? (
                  <Button asChild>
                    <Link href="/knowledge/create">
                      <Plus className="size-4" />
                      新建知识库
                    </Link>
                  </Button>
                ) : null
              }
              description="创建知识库后可上传文档、重建索引并运行检索测试。"
              title="暂无知识库"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {['知识库', '可见范围', '状态', '文档', '切片', '失败', '更新时间', '操作'].map((column) => <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>{column}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {bases.map((base, index) => (
                    <motion.tr animate={{ opacity: 1, y: 0 }} className="border-b transition-colors last:border-0 hover:bg-muted/25" initial={{ opacity: 0, y: 8 }} key={base.id} transition={{ delay: index * 0.025, duration: 0.22 }}>
                      <td className="px-4 py-3">
                        <Link className="grid max-w-sm gap-1 text-left hover:text-primary" href={`/knowledge/${base.id}`}>
                          <span className="font-medium">{base.name}</span>
                          <span className="text-xs text-muted-foreground">{base.code}</span>
                          <span className="line-clamp-1 text-xs text-muted-foreground">{base.description ?? '暂无描述。'}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{knowledgeVisibilityLabel(base.visibility)}</td>
                      <td className="px-4 py-3"><StatusBadge tone={knowledgeStatusTone(base.status)}>{knowledgeStatusLabel(base.status)}</StatusBadge></td>
                      <td className="px-4 py-3 text-muted-foreground">{base.document_count}</td>
                      <td className="px-4 py-3 text-muted-foreground">{base.segment_count}</td>
                      <td className="px-4 py-3 text-muted-foreground">{base.failed_task_count}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(base.updated_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button asChild size="sm" title="打开详情" variant="outline"><Link href={`/knowledge/${base.id}`}><Eye className="size-4" /></Link></Button>
                          {canWrite ? (
                            <Button asChild size="sm" title="编辑" variant="outline">
                              <Link href={`/knowledge/${base.id}/edit`}>
                                <Edit className="size-4" />
                              </Link>
                            </Button>
                          ) : null}
                          {canWrite ? (
                            <Button onClick={() => setDeleteTarget(base)} size="sm" title="删除" variant="outline"><Trash2 className="size-4" /></Button>
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

      {deleteTarget ? (
        <section className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-sm rounded-lg border bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">删除知识库？</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">这会归档 `{deleteTarget.name}`，并保留文档记录用于审计。</p>
            <div className="mt-6 flex justify-end gap-2">
              <Button onClick={() => setDeleteTarget(null)} variant="outline">取消</Button>
              <Button disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleteTarget.id)} variant="destructive">删除</Button>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function getErrorStatus(error: unknown) {
  if (!error || typeof error !== 'object') return null;
  const status = (error as { status?: unknown }).status;

  return typeof status === 'number' ? status : null;
}
