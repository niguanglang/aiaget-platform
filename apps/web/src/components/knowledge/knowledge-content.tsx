'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  hasPermission,
  type KnowledgeBaseListItem,
  KnowledgeBaseStatus,
  type KnowledgeOverview,
  KnowledgeVisibility,
} from '@aiaget/shared-types';
import { motion } from 'motion/react';
import {
  type LucideIcon,
  Activity,
  Database,
  Edit,
  Eye,
  Layers3,
  Lock,
  Plus,
  RefreshCcw,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { KnowledgeCenterBackground } from '@/components/knowledge/knowledge-center-background';
import {
  formatDateTime,
  knowledgeRetrievalModeLabel,
  knowledgeStatusLabel,
  knowledgeStatusTone,
  knowledgeVisibilityLabel,
} from '@/components/knowledge/knowledge-status';
import { formatPercent } from '@/components/monitor/monitor-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  deleteKnowledgeBase,
  getKnowledgeOverview,
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
  const overviewQuery = useQuery({
    queryKey: ['knowledge-overview'],
    enabled: canView,
    queryFn: getKnowledgeOverview,
  });

  const bases = basesQuery.data?.items ?? [];
  const owners = ownersQuery.data?.items ?? [];

  const permissionDenied = !canView || getErrorStatus(basesQuery.error) === 403 || getErrorStatus(overviewQuery.error) === 403;

  const deleteMutation = useMutation({
    mutationFn: deleteKnowledgeBase,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] });
      await queryClient.invalidateQueries({ queryKey: ['knowledge-overview'] });
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
            <StatusBadge tone="ready">M48</StatusBadge>
            <StatusBadge tone="healthy">治理总览</StatusBadge>
            <StatusBadge tone="healthy">MinIO 原文</StatusBadge>
            <StatusBadge tone="healthy">Qdrant 向量库</StatusBadge>
            <StatusBadge tone="healthy">OpenSearch 关键词</StatusBadge>
            <StatusBadge tone="healthy">后台任务</StatusBadge>
            <StatusBadge tone="healthy">混合检索</StatusBadge>
            <StatusBadge tone="healthy">向量回退</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">知识库中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            聚合知识库健康、文档处理、索引就绪率和最近召回情况。列表页用于总览、筛选和进入知识库操作。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="w-full md:w-auto" disabled={overviewQuery.isFetching} onClick={() => void overviewQuery.refetch()} variant="outline">
            <RefreshCcw className="size-4" />
            刷新总览
          </Button>
          {canWrite ? (
            <Button asChild className="w-full md:w-auto">
              <Link href="/knowledge/create">
                <Plus className="size-4" />
                新建知识库
              </Link>
            </Button>
          ) : (
            <Button className="w-full md:w-auto" disabled variant="default">
              <Plus className="size-4" />
              新建知识库
            </Button>
          )}
        </div>
      </motion.section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overviewQuery.isLoading && !overviewQuery.data
          ? Array.from({ length: 4 }).map((_, index) => <div className="h-28 rounded-lg border bg-muted/30" key={index} />)
          : (
              [
                { label: '知识库', value: `${overviewQuery.data?.summary.knowledge_base_count ?? basesQuery.data?.total ?? 0}`, helper: '租户范围' },
                { label: '处理中', value: `${overviewQuery.data?.summary.processing_document_count ?? 0}`, helper: '文档队列' },
                { label: '索引就绪率', value: formatPercent(overviewQuery.data?.summary.keyword_ready_rate ?? 0), helper: 'OpenSearch' },
                { label: '近 24h 召回成功率', value: formatPercent(overviewQuery.data?.summary.recall_success_rate_24h ?? 0), helper: '检索测试' },
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

      {overviewQuery.isError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          知识库总览加载失败。
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <KnowledgeHealthCard overview={overviewQuery.data ?? null} loading={overviewQuery.isLoading} />
        <KnowledgeQueueCard overview={overviewQuery.data ?? null} loading={overviewQuery.isLoading} />
      </section>

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
                ) : (
                  <Button disabled variant="default">
                    <Plus className="size-4" />
                    新建知识库
                  </Button>
                )
              }
              description="创建知识库后，可在详情页上传文档、重建索引并运行检索测试。"
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
                          ) : (
                            <Button disabled size="sm" title="编辑" variant="outline">
                              <Edit className="size-4" />
                            </Button>
                          )}
                          <Button disabled={!canWrite} onClick={() => setDeleteTarget(base)} size="sm" title="删除" variant="outline"><Trash2 className="size-4" /></Button>
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

function KnowledgeHealthCard({ overview, loading }: { overview: KnowledgeOverview | null; loading: boolean }) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="size-4 text-primary" />
            知识库健康
          </div>
          <p className="mt-1 text-sm text-muted-foreground">总览租户级知识库数量、处理状态和索引就绪情况。</p>
        </div>
        <StatusBadge tone={overview ? 'healthy' : 'planned'}>{overview ? '已更新' : '等待加载'}</StatusBadge>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载知识库总览...</div>
      ) : !overview ? (
        <EmptyState description="暂无知识库治理总览。" title="没有总览数据" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          <StatTile label="启用知识库" value={`${overview.summary.active_knowledge_base_count}/${overview.summary.knowledge_base_count}`} />
          <StatTile label="文档总数" value={`${overview.summary.document_count}`} />
          <StatTile label="切片总数" value={`${overview.summary.segment_count}`} />
          <StatTile label="处理任务" value={`${overview.summary.active_task_count} 活跃 / ${overview.summary.failed_task_count} 失败`} />
          <StatTile label="向量就绪率" value={formatPercent(overview.summary.vector_ready_rate)} />
          <StatTile label="关键词就绪率" value={formatPercent(overview.summary.keyword_ready_rate)} />
        </div>
      )}
    </Card>
  );
}

function KnowledgeQueueCard({ overview, loading }: { overview: KnowledgeOverview | null; loading: boolean }) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Layers3 className="size-4 text-primary" />
            任务与召回
          </div>
          <p className="mt-1 text-sm text-muted-foreground">最近文档、任务和召回记录，便于排查处理链路。</p>
        </div>
        <StatusBadge tone={overview ? 'healthy' : 'planned'}>{overview ? '在线' : '等待加载'}</StatusBadge>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载队列数据...</div>
      ) : !overview ? (
        <EmptyState description="暂无任务队列数据。" title="没有队列数据" />
      ) : (
        <div className="grid gap-4">
          <TimelineList title="最近文档" icon={Database} items={overview.recent_documents.map((item) => ({
            id: item.id,
            title: item.title,
            subtitle: `${item.knowledge_name} · ${item.segment_count} 切片 · ${formatDateTime(item.updated_at)}`,
            status: item.status,
          }))} />
          <TimelineList title="最近任务" icon={Activity} items={overview.recent_tasks.map((item) => ({
            id: item.id,
            title: `${item.knowledge_name} · ${item.task_type}`,
            subtitle: `${item.processed_items}/${item.total_items} 项 · ${item.started_at ? formatDateTime(item.started_at) : '未开始'}`,
            status: item.status,
          }))} />
          <TimelineList title="最近召回" icon={Search} items={overview.recent_recall_logs.map((item) => ({
            id: item.id,
            title: `${item.knowledge_name} · ${item.query}`,
            subtitle: `${knowledgeRetrievalModeLabel(item.mode)} · ${item.result_count} 条结果 · ${item.latency_ms}ms`,
            status: item.status,
          }))} />
        </div>
      )}
    </Card>
  );
}

function TimelineList({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: LucideIcon;
  items: Array<{ id: string; title: string; subtitle: string; status: string }>;
}) {
  return (
    <div className="grid gap-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {items.length === 0 ? (
        <EmptyState className="rounded-md border bg-muted/20 p-4" description="暂无记录。" title="空" />
      ) : (
        <div className="grid gap-2">
          {items.map((item) => (
            <div className="flex items-start gap-3 rounded-md border bg-muted/20 px-3 py-2" key={item.id}>
              <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md border bg-background">
                <Icon className="size-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{item.title}</div>
                    <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.subtitle}</div>
                  </div>
                  <StatusBadge tone={statusTone(item.status)}>{item.status}</StatusBadge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/20 px-3 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

type BadgeTone = Parameters<typeof StatusBadge>[0]['tone'];

function statusTone(status: string): BadgeTone {
  if (status === 'FAILED' || status === 'DELETED') return 'unavailable';
  if (status === 'PROCESSING' || status === 'RUNNING' || status === 'PENDING') return 'degraded';
  if (status === 'READY' || status === 'SUCCESS' || status === 'ACTIVE') return 'healthy';
  return 'planned';
}

function getErrorStatus(error: unknown) {
  if (!error || typeof error !== 'object') return null;
  const status = (error as { status?: unknown }).status;

  return typeof status === 'number' ? status : null;
}
