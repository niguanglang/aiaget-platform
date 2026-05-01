'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  hasPermission,
  type KnowledgeBaseDetail,
  KnowledgeBaseListItem,
  KnowledgeBaseStatus,
  type KnowledgeOverview,
  KnowledgeRetrievalMode,
  KnowledgeRetrievalTestResult,
  KnowledgeSourceType,
  KnowledgeVisibility,
} from '@aiaget/shared-types';
import { motion } from 'motion/react';
import {
  type LucideIcon,
  Activity,
  Database,
  Edit,
  Eye,
  FileUp,
  Layers3,
  Lock,
  Plus,
  RefreshCcw,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { KnowledgeCenterBackground } from '@/components/knowledge/knowledge-center-background';
import {
  KnowledgeDocumentFormPanel,
  type KnowledgeDocumentFormValues,
} from '@/components/knowledge/knowledge-document-form-panel';
import { KnowledgeFormPanel, type KnowledgeFormValues } from '@/components/knowledge/knowledge-form-panel';
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
  createKnowledgeBase,
  deleteKnowledgeBase,
  getKnowledgeBase,
  getKnowledgeOverview,
  listKnowledgeBases,
  listUsers,
  rebuildKnowledgeIndex,
  runKnowledgeRetrievalTest,
  updateKnowledgeBase,
  uploadKnowledgeDocument,
  type ApiClientError,
} from '@/lib/api-client';

const statuses: KnowledgeBaseStatus[] = ['ACTIVE', 'DISABLED', 'ARCHIVED'];
const visibilities: KnowledgeVisibility[] = ['PRIVATE', 'TENANT', 'PUBLIC'];
const retrievalModes: KnowledgeRetrievalMode[] = ['HYBRID', 'VECTOR', 'KEYWORD'];

export function KnowledgeContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [visibility, setVisibility] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingBase, setEditingBase] = useState<KnowledgeBaseDetail | null>(null);
  const [uploadTarget, setUploadTarget] = useState<KnowledgeBaseListItem | KnowledgeBaseDetail | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeBaseListItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [retrievalError, setRetrievalError] = useState<string | null>(null);
  const [retrievalQuery, setRetrievalQuery] = useState('部署指南 认证');
  const [retrievalMode, setRetrievalMode] = useState<KnowledgeRetrievalMode>('HYBRID');
  const [topK, setTopK] = useState(5);
  const [retrievalResult, setRetrievalResult] = useState<KnowledgeRetrievalTestResult | null>(null);

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
  const activeId = selectedId ?? bases[0]?.id ?? null;

  const selectedQuery = useQuery({
    enabled: canView && Boolean(activeId),
    queryKey: ['knowledge-base', activeId],
    queryFn: () => getKnowledgeBase(activeId ?? ''),
  });

  const selectedBase = selectedQuery.data ?? null;
  const hasActiveBackgroundWork = hasActiveKnowledgeBackgroundWork(selectedBase);
  const permissionDenied = !canView || getErrorStatus(basesQuery.error) === 403 || getErrorStatus(overviewQuery.error) === 403;
  useEffect(() => {
    setRetrievalError(null);
    setRetrievalResult(null);
  }, [activeId]);

  useEffect(() => {
    if (!activeId || !hasActiveBackgroundWork) return;

    const timer = window.setInterval(() => {
      void queryClient.invalidateQueries({ queryKey: ['knowledge-base', activeId] });
      void queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] });
      void queryClient.invalidateQueries({ queryKey: ['knowledge-overview'] });
    }, 2500);

    return () => window.clearInterval(timer);
  }, [activeId, hasActiveBackgroundWork, queryClient]);

  const createMutation = useMutation({
    mutationFn: createKnowledgeBase,
    onSuccess: async (base) => {
      await applyBaseResult(base);
      closeForm();
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: KnowledgeFormValues }) => updateKnowledgeBase(id, toUpdateInput(values)),
    onSuccess: async (base) => {
      await applyBaseResult(base);
      closeForm();
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: KnowledgeDocumentFormValues }) =>
      uploadKnowledgeDocument(id, {
        title: values.title,
        source_type: values.source_type,
        content: values.content,
        file_name: nullableText(values.file_name),
        mime_type: mimeTypeForSource(values.source_type),
      }),
    onSuccess: async (base) => {
      await applyBaseResult(base);
      setUploadTarget(null);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteKnowledgeBase,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] });
      await queryClient.invalidateQueries({ queryKey: ['knowledge-overview'] });
      if (deleteTarget?.id === selectedId) setSelectedId(null);
      setDeleteTarget(null);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const rebuildMutation = useMutation({
    mutationFn: rebuildKnowledgeIndex,
    onSuccess: async () => {
      if (activeId) await queryClient.invalidateQueries({ queryKey: ['knowledge-base', activeId] });
      await queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] });
      await queryClient.invalidateQueries({ queryKey: ['knowledge-overview'] });
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const retrievalMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => runKnowledgeRetrievalTest(id, { query: retrievalQuery, mode: retrievalMode, top_k: topK }),
    onSuccess: async (result) => {
      setRetrievalResult(result);
      setRetrievalError(null);
      if (activeId) await queryClient.invalidateQueries({ queryKey: ['knowledge-base', activeId] });
      await queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] });
      await queryClient.invalidateQueries({ queryKey: ['knowledge-overview'] });
    },
    onError: (error: ApiClientError) => setRetrievalError(error.message),
  });

  async function applyBaseResult(base: KnowledgeBaseDetail) {
    queryClient.setQueryData(['knowledge-base', base.id], base);
    await queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] });
    await queryClient.invalidateQueries({ queryKey: ['knowledge-overview'] });
    setSelectedId(base.id);
  }

  function openCreateForm() {
    setFormError(null);
    setEditingBase(null);
    setFormMode('create');
  }

  async function openEditForm(base: KnowledgeBaseListItem) {
    setFormError(null);
    const detail = await queryClient.fetchQuery({ queryKey: ['knowledge-base', base.id], queryFn: () => getKnowledgeBase(base.id) });
    setEditingBase(detail);
    setFormMode('edit');
  }

  function closeForm() {
    setFormError(null);
    setFormMode(null);
    setEditingBase(null);
  }

  function submitForm(values: KnowledgeFormValues) {
    setFormError(null);
    if (formMode === 'create') {
      createMutation.mutate(toCreateInput(values));
      return;
    }
    if (editingBase) updateMutation.mutate({ id: editingBase.id, values });
  }

  function submitUpload(values: KnowledgeDocumentFormValues) {
    if (!uploadTarget) return;
    setActionError(null);
    uploadMutation.mutate({ id: uploadTarget.id, values });
  }

  function clearFilters() {
    setKeyword('');
    setStatus('');
    setVisibility('');
    setOwnerId('');
  }

  function runRetrieval() {
    if (!activeId || !retrievalQuery.trim()) {
      setRetrievalError('请输入检索问题。');
      return;
    }
    retrievalMutation.mutate({ id: activeId });
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
            聚合知识库健康、文档处理、索引就绪率和最近召回情况，继续保留知识库创建、上传、重建索引与检索测试能力。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="w-full md:w-auto" disabled={overviewQuery.isFetching} onClick={() => void overviewQuery.refetch()} variant="outline">
            <RefreshCcw className="size-4" />
            刷新总览
          </Button>
          <Button className="w-full md:w-auto" disabled={!canWrite} onClick={openCreateForm}>
            <Plus className="size-4" />
            新建知识库
          </Button>
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

      <section className="grid min-w-0 gap-4 xl:grid-cols-[1.35fr_0.85fr]">
        <Card className="min-w-0">
          <div className="border-b p-4">
            <div className="grid gap-4">
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                <div>
                  <h2 className="text-sm font-semibold">知识库</h2>
                  <p className="mt-1 text-sm text-muted-foreground">搜索、筛选、上传、重建索引，并进入完整知识库操作。</p>
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
            <EmptyState action={<Button disabled={!canWrite} onClick={openCreateForm}><Plus className="size-4" />新建知识库</Button>} description="创建知识库，上传文本或 Markdown 文档，生成切片后运行检索测试。" title="暂无知识库" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {['知识库', '可见范围', '状态', '文档', '切片', '失败', '更新时间', '操作'].map((column) => <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>{column}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {bases.map((base, index) => (
                    <motion.tr animate={{ opacity: 1, y: 0 }} className="border-b transition-colors last:border-0 hover:bg-muted/25" initial={{ opacity: 0, y: 8 }} key={base.id} transition={{ delay: index * 0.025, duration: 0.22 }}>
                      <td className="px-4 py-3">
                        <button className="grid max-w-sm gap-1 text-left" onClick={() => setSelectedId(base.id)} type="button">
                          <span className="font-medium">{base.name}</span>
                          <span className="text-xs text-muted-foreground">{base.code}</span>
                          <span className="line-clamp-1 text-xs text-muted-foreground">{base.description ?? '暂无描述。'}</span>
                        </button>
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
                          <Button disabled={!canWrite} onClick={() => void openEditForm(base)} size="sm" title="编辑" variant="outline"><Edit className="size-4" /></Button>
                          <Button disabled={!canWrite} onClick={() => setUploadTarget(base)} size="sm" title="上传" variant="outline"><FileUp className="size-4" /></Button>
                          <Button disabled={!canWrite || rebuildMutation.isPending} onClick={() => rebuildMutation.mutate(base.id)} size="sm" title="重建索引" variant="outline"><RefreshCcw className="size-4" /></Button>
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

        <RetrievalPanel
          base={selectedBase}
          canWrite={canWrite}
          loading={selectedQuery.isLoading}
          mode={retrievalMode}
          onChangeMode={setRetrievalMode}
          onChangeQuery={setRetrievalQuery}
          onChangeTopK={setTopK}
          onRun={runRetrieval}
          pending={retrievalMutation.isPending}
          query={retrievalQuery}
          result={retrievalResult}
          error={retrievalError}
          topK={topK}
        />
      </section>

      {formMode ? <KnowledgeFormPanel base={editingBase} error={formError} isPending={createMutation.isPending || updateMutation.isPending} mode={formMode} onClose={closeForm} onSubmit={submitForm} owners={owners} /> : null}
      {uploadTarget ? <KnowledgeDocumentFormPanel error={actionError} isPending={uploadMutation.isPending} onClose={() => setUploadTarget(null)} onSubmit={submitUpload} /> : null}
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

function RetrievalPanel({
  base,
  canWrite,
  error,
  loading,
  mode,
  onChangeMode,
  onChangeQuery,
  onChangeTopK,
  onRun,
  pending,
  query,
  result,
  topK,
}: {
  base: KnowledgeBaseDetail | null;
  canWrite: boolean;
  error: string | null;
  loading: boolean;
  mode: KnowledgeRetrievalMode;
  onChangeMode: (mode: KnowledgeRetrievalMode) => void;
  onChangeQuery: (query: string) => void;
  onChangeTopK: (topK: number) => void;
  onRun: () => void;
  pending: boolean;
  query: string;
  result: KnowledgeRetrievalTestResult | null;
  topK: number;
}) {
  if (loading) return <Card className="min-w-0 p-5"><div className="text-sm text-muted-foreground">正在加载选中的知识库...</div></Card>;
  if (!base) {
    return <Card className="min-w-0 p-5"><div className="flex items-center gap-2 text-sm font-semibold"><Database className="size-4" />选中的知识库</div><p className="mt-3 text-sm leading-6 text-muted-foreground">选择一行后运行检索测试，并查看文档处理覆盖情况。</p></Card>;
  }

  return (
    <Card className="grid min-w-0 gap-5 p-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={knowledgeStatusTone(base.status)}>{knowledgeStatusLabel(base.status)}</StatusBadge>
          <StatusBadge tone="planned">{knowledgeVisibilityLabel(base.visibility)}</StatusBadge>
        </div>
        <h2 className="mt-3 text-base font-semibold">{base.name}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{base.code}</p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{base.description ?? '暂无描述。'}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <SummaryTile label="文档" value={`${base.document_count}`} />
        <SummaryTile label="切片" value={`${base.segment_count}`} />
        <SummaryTile label="智能体" value={`${base.agent_reference_count}`} />
      </div>

      <div className="grid gap-3">
        <label className="grid gap-2 text-sm font-medium">
          检索问题
          <textarea className="min-h-24 resize-y rounded-md border bg-background/80 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => onChangeQuery(event.target.value)} value={query} />
        </label>
        <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
          <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => onChangeMode(event.target.value as KnowledgeRetrievalMode)} value={mode}>
            {retrievalModes.map((option) => <option key={option} value={option}>{knowledgeRetrievalModeLabel(option)}</option>)}
          </select>
          <input className="h-9 rounded-md border bg-background/80 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" max="20" min="1" onChange={(event) => onChangeTopK(Number(event.target.value))} type="number" value={topK} />
        </div>
        {error ? <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div> : null}
        <Button disabled={!canWrite || pending || base.segment_count === 0} onClick={onRun} type="button">
          <Search className="size-4" />
          运行检索测试
        </Button>
      </div>

      {result ? (
        <div className="rounded-md border bg-muted/25 p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">召回结果</h3>
            <span className="text-xs text-muted-foreground">{result.results.length} 条结果 · {result.latency_ms}ms</span>
          </div>
          <div className="mt-3 grid gap-3">
            {result.results.length === 0 ? <p className="text-sm text-muted-foreground">没有切片命中该问题。</p> : result.results.map((item) => (
              <div className="rounded-md border bg-background px-3 py-2" key={item.segment_id}>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium">{item.document_title}</div>
                  <span className="text-xs text-muted-foreground">得分 {item.score}</span>
                </div>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{item.content}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border bg-muted/25 px-3 py-2"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 text-sm font-semibold">{value}</div></div>;
}

function toCreateInput(values: KnowledgeFormValues) {
  return {
    name: values.name,
    code: values.code,
    visibility: values.visibility,
    description: nullableText(values.description),
    owner_id: nullableId(values.owner_id),
  };
}

function toUpdateInput(values: KnowledgeFormValues) {
  return {
    name: values.name,
    visibility: values.visibility,
    status: values.status,
    description: nullableText(values.description),
    owner_id: nullableId(values.owner_id),
  };
}

function nullableText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function nullableId(value?: string) {
  return value || null;
}

function mimeTypeForSource(sourceType: KnowledgeSourceType) {
  if (sourceType === 'MARKDOWN') return 'text/markdown';
  if (sourceType === 'HTML') return 'text/html';
  return 'text/plain';
}

function hasActiveKnowledgeBackgroundWork(base: KnowledgeBaseDetail | null) {
  if (!base) return false;

  return (
    base.documents.some((document) => document.status === 'PROCESSING') ||
    base.tasks.some((task) => task.status === 'PENDING' || task.status === 'RUNNING')
  );
}

function getErrorStatus(error: unknown) {
  if (!error || typeof error !== 'object') return null;
  const status = (error as { status?: unknown }).status;

  return typeof status === 'number' ? status : null;
}
