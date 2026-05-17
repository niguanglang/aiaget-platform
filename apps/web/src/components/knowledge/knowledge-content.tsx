'use client';

import {
  hasPermission,
  type KnowledgeBaseListItem,
  type KnowledgeBaseStatus,
  type KnowledgeVisibility,
} from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Edit, Eye, FileText, Layers3, Lock, Plus, Search, ShieldAlert, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import {
  formatDateTime,
  knowledgeStatusLabel,
  knowledgeStatusTone,
  knowledgeVisibilityLabel,
} from '@/components/knowledge/knowledge-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
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
    enabled: canView,
    queryKey: ['knowledge-bases', keyword, status, visibility, ownerId],
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
    enabled: canView,
    queryKey: ['knowledge-owners'],
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
      <main className="mx-auto grid max-w-[1680px] gap-5 px-4 py-5 lg:px-7">
        <Card className="rounded-xl border border-slate-200/80 bg-white/[0.9] p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Lock className="size-4 text-primary" />
            知识库访问受限
          </div>
          <EmptyState
            action={(
              <Button asChild variant="outline">
                <Link href="/dashboard">返回工作台</Link>
              </Button>
            )}
            title="暂无访问权限"
          />
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-[1680px] gap-5 px-4 py-5 lg:px-7">
      <section className="flex flex-col justify-between gap-4 py-3 md:flex-row md:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">知识库中心</h1>
          <StatusBadge tone="healthy">知识库列表</StatusBadge>
          <StatusBadge tone="planned">目录管理</StatusBadge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="h-10" variant="outline">
            <Link href="/knowledge/activity">活动总览</Link>
          </Button>
          <Button asChild className="h-10" variant="outline">
            <Link href="/knowledge/tasks">文档处理任务</Link>
          </Button>
          <Button asChild className="h-10" variant="outline">
            <Link href="/knowledge/recalls">召回记录</Link>
          </Button>
          <Button asChild className="h-10" variant="outline">
            <Link href="/knowledge/health">检索健康度</Link>
          </Button>
          {canWrite ? (
            <Button asChild className="h-10 bg-blue-600 px-5 shadow-[0_12px_26px_rgba(37,99,235,0.28)] hover:bg-blue-700">
              <Link href="/knowledge/create">
                <Plus className="size-4" />
                新建知识库
              </Link>
            </Button>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KnowledgeListMetricTile
          helper="筛选结果"
          icon={BookOpen}
          iconClassName="bg-blue-100 text-blue-700"
          label="知识库"
          value={formatNumber(basesQuery.data?.total ?? bases.length)}
        />
        <KnowledgeListMetricTile
          helper="当前页"
          icon={Layers3}
          iconClassName="bg-emerald-100 text-emerald-700"
          label="启用中"
          value={formatNumber(activeCount)}
        />
        <KnowledgeListMetricTile
          helper={`${formatNumber(segmentCount)} 个切片`}
          icon={FileText}
          iconClassName="bg-violet-100 text-violet-700"
          label="文档"
          value={formatNumber(documentCount)}
        />
        <KnowledgeListMetricTile
          helper="当前页"
          icon={ShieldAlert}
          iconClassName="bg-orange-100 text-orange-700"
          label="失败任务"
          value={formatNumber(failedTaskCount)}
        />
      </section>

      {canView && !canWrite ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
          当前账号仅可查看知识库。
        </div>
      ) : null}
      {actionError ? <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{actionError}</div> : null}

      <Card className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/[0.9] shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        <div className="border-b border-slate-200/80 px-5 py-4">
          <div className="grid gap-4">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <h2 className="text-lg font-semibold text-slate-950">知识库列表</h2>
              <div className="text-sm text-muted-foreground">显示 {formatNumber(bases.length)} / {formatNumber(basesQuery.data?.total ?? 0)}</div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_160px_170px_190px_110px]">
              <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm">
                <Search className="size-4 text-muted-foreground" />
                <input
                  className="min-w-0 flex-1 bg-transparent outline-none"
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="搜索名称或编码"
                  value={keyword}
                />
              </label>
              <select className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none" onChange={(event) => setStatus(event.target.value)} value={status}>
                <option value="">全部状态</option>
                {statuses.map((option) => <option key={option} value={option}>{knowledgeStatusLabel(option)}</option>)}
              </select>
              <select className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none" onChange={(event) => setVisibility(event.target.value)} value={visibility}>
                <option value="">全部可见范围</option>
                {visibilities.map((option) => <option key={option} value={option}>{knowledgeVisibilityLabel(option)}</option>)}
              </select>
              <select className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none" onChange={(event) => setOwnerId(event.target.value)} value={ownerId}>
                <option value="">全部负责人</option>
                {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
              </select>
              <Button className="h-10" onClick={clearFilters} type="button" variant="outline">重置</Button>
            </div>
          </div>
        </div>

        {basesQuery.isError ? (
          <div className="p-6 text-sm text-destructive">知识库加载失败。</div>
        ) : basesQuery.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">加载中</div>
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
            title="暂无知识库"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70">
                  {['知识库', '可见范围', '状态', '文档', '切片', '失败', '更新时间', '操作'].map((column) => (
                    <th className="px-4 py-3 font-medium text-slate-500" key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bases.map((base) => (
                  <tr className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70" key={base.id}>
                    <td className="px-4 py-3">
                      <Link className="grid max-w-sm gap-1 text-left hover:text-blue-700" href={`/knowledge/${base.id}`}>
                        <span className="font-medium text-slate-900">{base.name}</span>
                        <span className="text-xs text-muted-foreground">{base.code}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{knowledgeVisibilityLabel(base.visibility)}</td>
                    <td className="px-4 py-3"><StatusBadge tone={knowledgeStatusTone(base.status)}>{knowledgeStatusLabel(base.status)}</StatusBadge></td>
                    <td className="px-4 py-3 text-muted-foreground">{formatNumber(base.document_count)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatNumber(base.segment_count)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatNumber(base.failed_task_count)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(base.updated_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <Button asChild className="size-8 rounded-md p-0" size="sm" title="打开详情" variant="outline"><Link href={`/knowledge/${base.id}`}><Eye className="size-4" /></Link></Button>
                        {canWrite ? (
                          <Button asChild className="size-8 rounded-md p-0" size="sm" title="编辑" variant="outline"><Link href={`/knowledge/${base.id}/edit`}><Edit className="size-4" /></Link></Button>
                        ) : null}
                        {canWrite ? (
                          <Button className="size-8 rounded-md p-0" onClick={() => setDeleteTarget(base)} size="sm" title="删除" variant="outline"><Trash2 className="size-4" /></Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {deleteTarget ? (
        <section className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-sm rounded-lg border bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">删除知识库？</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">这会归档 {deleteTarget.name}，并保留文档审计记录。</p>
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

function KnowledgeListMetricTile({
  helper,
  icon: Icon,
  iconClassName,
  label,
  value,
}: {
  helper: string;
  icon: typeof BookOpen;
  iconClassName: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-[124px] items-center gap-5 rounded-xl border border-slate-200/80 bg-white/[0.9] px-6 py-5 shadow-[0_16px_45px_rgba(15,23,42,0.05)] backdrop-blur-xl">
      <span className={`grid size-14 shrink-0 place-items-center rounded-full ${iconClassName}`}>
        <Icon className="size-7" />
      </span>
      <div>
        <div className="text-sm font-medium text-slate-500">{label}</div>
        <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{helper}</div>
      </div>
    </div>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('zh-CN').format(value);
}

function getErrorStatus(error: unknown) {
  if (!error || typeof error !== 'object') return null;
  const status = (error as { status?: unknown }).status;

  return typeof status === 'number' ? status : null;
}
