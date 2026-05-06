'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  hasPermission,
  type KnowledgeBaseDetail,
  KnowledgeDocumentDetail,
  KnowledgeDocumentListItem,
  KnowledgeRetrievalMode,
  KnowledgeRetrievalTestResult,
  KnowledgeSourceType,
} from '@aiaget/shared-types';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Database,
  Edit,
  FileText,
  FileUp,
  RefreshCcw,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { KnowledgeCenterBackground } from '@/components/knowledge/knowledge-center-background';
import {
  KnowledgeDocumentFormPanel,
  type KnowledgeDocumentFormValues,
} from '@/components/knowledge/knowledge-document-form-panel';
import {
  formatDateTime,
  formatFileSize,
  knowledgeRetrievalModeLabel,
  knowledgeSourceTypeLabel,
  knowledgeStatusLabel,
  knowledgeStatusTone,
  knowledgeTaskTypeLabel,
  knowledgeVisibilityLabel,
} from '@/components/knowledge/knowledge-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  deleteKnowledgeBase,
  deleteKnowledgeDocument,
  getKnowledgeBase,
  getKnowledgeDocument,
  rebuildKnowledgeIndex,
  reprocessKnowledgeDocument,
  runKnowledgeRetrievalTest,
  uploadKnowledgeDocument,
  type ApiClientError,
} from '@/lib/api-client';

const retrievalModes: KnowledgeRetrievalMode[] = ['HYBRID', 'VECTOR', 'KEYWORD'];

export function KnowledgeDetailContent({ knowledgeId }: { knowledgeId: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { currentUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [deleteBaseTarget, setDeleteBaseTarget] = useState<KnowledgeBaseDetail | null>(null);
  const [deleteDocumentTarget, setDeleteDocumentTarget] = useState<KnowledgeDocumentListItem | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [retrievalError, setRetrievalError] = useState<string | null>(null);
  const [retrievalQuery, setRetrievalQuery] = useState('认证部署指南');
  const [retrievalMode, setRetrievalMode] = useState<KnowledgeRetrievalMode>('HYBRID');
  const [topK, setTopK] = useState(5);
  const [retrievalResult, setRetrievalResult] = useState<KnowledgeRetrievalTestResult | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'knowledge:base:manage'),
  );

  const baseQuery = useQuery({
    queryKey: ['knowledge-base', knowledgeId],
    queryFn: () => getKnowledgeBase(knowledgeId),
  });
  const base = baseQuery.data ?? null;
  const activeDocumentId = selectedDocumentId ?? base?.documents[0]?.id ?? null;
  const hasActiveBackgroundWork = hasActiveKnowledgeBackgroundWork(base);

  const documentQuery = useQuery({
    enabled: Boolean(activeDocumentId),
    queryKey: ['knowledge-document', knowledgeId, activeDocumentId],
    queryFn: () => getKnowledgeDocument(knowledgeId, activeDocumentId ?? ''),
  });
  const selectedDocument = documentQuery.data ?? null;

  useEffect(() => {
    if (!base) return;

    const hasSelectedDocument = base.documents.some((document) => document.id === selectedDocumentId);
    if (!hasSelectedDocument) {
      setSelectedDocumentId(base.documents[0]?.id ?? null);
    }
  }, [base, selectedDocumentId]);

  useEffect(() => {
    setRetrievalError(null);
    setRetrievalResult(null);
  }, [knowledgeId]);

  useEffect(() => {
    if (!hasActiveBackgroundWork) return;

    const timer = window.setInterval(() => {
      void queryClient.invalidateQueries({ queryKey: ['knowledge-base', knowledgeId] });
      void queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] });
      void queryClient.invalidateQueries({ queryKey: ['knowledge-overview'] });
      if (activeDocumentId) {
        void queryClient.invalidateQueries({ queryKey: ['knowledge-document', knowledgeId, activeDocumentId] });
      }
    }, 2500);

    return () => window.clearInterval(timer);
  }, [activeDocumentId, hasActiveBackgroundWork, knowledgeId, queryClient]);

  const metrics = useMemo(() => {
    if (!base) return [];

    return [
      { label: '文档', value: `${base.document_count}`, helper: '上传来源' },
      { label: '切片', value: `${base.segment_count}`, helper: '检索片段' },
      { label: '召回日志', value: `${base.recall_count}`, helper: '检索测试' },
      { label: '智能体', value: `${base.agent_reference_count}`, helper: '知识库绑定' },
    ];
  }, [base]);

  const uploadMutation = useMutation({
    mutationFn: (values: KnowledgeDocumentFormValues) =>
      uploadKnowledgeDocument(knowledgeId, {
        title: values.title,
        source_type: values.source_type,
        content: values.content,
        file_name: nullableText(values.file_name),
        mime_type: mimeTypeForSource(values.source_type),
      }),
    onSuccess: async (result) => {
      await applyBaseResult(result);
      setIsUploading(false);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const rebuildMutation = useMutation({
    mutationFn: rebuildKnowledgeIndex,
    onSuccess: async () => {
      await refreshBase();
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const reprocessMutation = useMutation({
    mutationFn: (documentId: string) => reprocessKnowledgeDocument(knowledgeId, documentId),
    onSuccess: async (result) => {
      await applyBaseResult(result);
      if (activeDocumentId) {
        await queryClient.invalidateQueries({ queryKey: ['knowledge-document', knowledgeId, activeDocumentId] });
      }
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId: string) => deleteKnowledgeDocument(knowledgeId, documentId),
    onSuccess: async (result) => {
      await applyBaseResult(result);
      setSelectedDocumentId(null);
      setDeleteDocumentTarget(null);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const deleteBaseMutation = useMutation({
    mutationFn: deleteKnowledgeBase,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] });
      setDeleteBaseTarget(null);
      router.push('/knowledge');
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const retrievalMutation = useMutation({
    mutationFn: () =>
      runKnowledgeRetrievalTest(knowledgeId, {
        query: retrievalQuery,
        mode: retrievalMode,
        top_k: topK,
      }),
    onSuccess: async (result) => {
      setRetrievalResult(result);
      setRetrievalError(null);
      await refreshBase();
    },
    onError: (error: ApiClientError) => setRetrievalError(error.message),
  });

  async function applyBaseResult(result: KnowledgeBaseDetail) {
    queryClient.setQueryData(['knowledge-base', result.id], result);
    await queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] });
    await queryClient.invalidateQueries({ queryKey: ['knowledge-overview'] });
  }

  async function refreshBase() {
    await queryClient.invalidateQueries({ queryKey: ['knowledge-base', knowledgeId] });
    await queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] });
    await queryClient.invalidateQueries({ queryKey: ['knowledge-overview'] });
  }

  function runRetrieval() {
    if (!retrievalQuery.trim()) {
      setRetrievalError('请输入检索问题。');
      return;
    }

    retrievalMutation.mutate();
  }

  if (baseQuery.isLoading) {
    return (
      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <KnowledgeCenterBackground />
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">正在加载知识库...</div>
        </Card>
      </main>
    );
  }

  if (baseQuery.isError || !base) {
    return (
      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <KnowledgeCenterBackground />
        <Card className="p-6">
          <div className="text-sm text-destructive">知识库加载失败。</div>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/knowledge">
              <ArrowLeft className="size-4" />
              返回知识库
            </Link>
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <KnowledgeCenterBackground />

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
      >
        <div className="min-w-0">
          <Button asChild className="mb-4" size="sm" variant="outline">
            <Link href="/knowledge">
              <ArrowLeft className="size-4" />
              知识库中心
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M28</StatusBadge>
            <StatusBadge tone="healthy">MinIO 原文</StatusBadge>
            <StatusBadge tone="healthy">Qdrant 向量库</StatusBadge>
            <StatusBadge tone="healthy">OpenSearch 关键词</StatusBadge>
            <StatusBadge tone="healthy">后台任务</StatusBadge>
            <StatusBadge tone={knowledgeStatusTone(base.status)}>{knowledgeStatusLabel(base.status)}</StatusBadge>
            <StatusBadge tone="healthy">混合检索</StatusBadge>
            <StatusBadge tone="planned">{knowledgeVisibilityLabel(base.visibility)}</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">{base.name}</h1>
          <p className="mt-1 text-xs text-muted-foreground">{base.code}</p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            {base.description ?? '暂无描述。'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canWrite ? (
            <Button asChild variant="outline">
              <Link href={`/knowledge/${knowledgeId}/edit`}>
                <Edit className="size-4" />
                编辑
              </Link>
            </Button>
          ) : (
            <Button disabled variant="outline">
              <Edit className="size-4" />
              编辑
            </Button>
          )}
          <Button disabled={!canWrite} onClick={() => setIsUploading(true)} variant="outline">
            <FileUp className="size-4" />
            上传
          </Button>
          <Button disabled={!canWrite || rebuildMutation.isPending} onClick={() => rebuildMutation.mutate(knowledgeId)} variant="outline">
            <RefreshCcw className="size-4" />
            重建索引
          </Button>
          <Button disabled={!canWrite} onClick={() => setDeleteBaseTarget(base)} variant="destructive">
            <Trash2 className="size-4" />
            删除
          </Button>
        </div>
      </motion.section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      {actionError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <section className="grid min-w-0 gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <DocumentsCard
          base={base}
          canWrite={canWrite}
          onDelete={setDeleteDocumentTarget}
          onReprocess={(documentId) => reprocessMutation.mutate(documentId)}
          onSelect={setSelectedDocumentId}
          pendingReprocess={reprocessMutation.isPending}
          selectedDocumentId={activeDocumentId}
        />
        <RetrievalCard
          base={base}
          canWrite={canWrite}
          error={retrievalError}
          mode={retrievalMode}
          onChangeMode={setRetrievalMode}
          onChangeQuery={setRetrievalQuery}
          onChangeTopK={setTopK}
          onRun={runRetrieval}
          pending={retrievalMutation.isPending}
          query={retrievalQuery}
          result={retrievalResult}
          topK={topK}
        />
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <DocumentDetailCard document={selectedDocument} loading={documentQuery.isLoading} />
        <SegmentsCard base={base} document={selectedDocument} />
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-3">
        <TasksCard base={base} />
        <RecallLogsCard base={base} />
        <AgentReferencesCard base={base} />
      </section>

      {isUploading ? (
        <KnowledgeDocumentFormPanel
          error={actionError}
          isPending={uploadMutation.isPending}
          onClose={() => setIsUploading(false)}
          onSubmit={(values) => {
            setActionError(null);
            uploadMutation.mutate(values);
          }}
        />
      ) : null}

      {deleteBaseTarget ? (
        <ConfirmDialog
          body={`这会归档 ${deleteBaseTarget.name}，并保留记录用于审计。`}
          confirmLabel="删除"
          pending={deleteBaseMutation.isPending}
          title="删除知识库？"
          onCancel={() => setDeleteBaseTarget(null)}
          onConfirm={() => deleteBaseMutation.mutate(deleteBaseTarget.id)}
        />
      ) : null}

      {deleteDocumentTarget ? (
        <ConfirmDialog
          body={`这会将 ${deleteDocumentTarget.title} 标记为已删除，并移除其活跃切片。`}
          confirmLabel="删除"
          pending={deleteDocumentMutation.isPending}
          title="删除文档？"
          onCancel={() => setDeleteDocumentTarget(null)}
          onConfirm={() => deleteDocumentMutation.mutate(deleteDocumentTarget.id)}
        />
      ) : null}
    </main>
  );
}

function DocumentsCard({
  base,
  canWrite,
  onDelete,
  onReprocess,
  onSelect,
  pendingReprocess,
  selectedDocumentId,
}: {
  base: KnowledgeBaseDetail;
  canWrite: boolean;
  onDelete: (document: KnowledgeDocumentListItem) => void;
  onReprocess: (documentId: string) => void;
  onSelect: (documentId: string) => void;
  pendingReprocess: boolean;
  selectedDocumentId: string | null;
}) {
  return (
    <Card className="min-w-0">
      <div className="flex flex-col justify-between gap-3 border-b p-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-sm font-semibold">文档</h2>
          <p className="mt-1 text-sm text-muted-foreground">上传来源、处理状态和切片覆盖情况。</p>
        </div>
        <div className="text-sm text-muted-foreground">{base.documents.length} 个文档</div>
      </div>

      {base.documents.length === 0 ? (
        <EmptyState description="上传文本或 Markdown 文档后生成检索切片。" title="暂无文档" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {['文档', '类型', '大小', '存储', '状态', '切片', '上传人', '更新时间', '操作'].map((column) => (
                  <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {base.documents.map((document, index) => (
                <motion.tr
                  animate={{ opacity: 1, y: 0 }}
                  className="border-b transition-colors last:border-0 hover:bg-muted/25"
                  initial={{ opacity: 0, y: 8 }}
                  key={document.id}
                  transition={{ delay: index * 0.025, duration: 0.22 }}
                >
                  <td className="px-4 py-3">
                    <button className="grid max-w-xs gap-1 text-left" onClick={() => onSelect(document.id)} type="button">
                      <span className="font-medium">{document.title}</span>
                      <span className="text-xs text-muted-foreground">{document.file_name ?? '内联内容'}</span>
                      {selectedDocumentId === document.id ? <span className="text-xs text-primary">已选中</span> : null}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{knowledgeSourceTypeLabel(document.source_type)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatFileSize(document.file_size)}</td>
                  <td className="px-4 py-3">
                    <div className="max-w-[180px]">
                      <StatusBadge tone={document.storage_path ? 'healthy' : 'planned'}>
                        {document.storage_path ? 'MinIO 原文' : '未入库'}
                      </StatusBadge>
                      <div className="mt-1 truncate text-xs text-muted-foreground">
                        {formatStoragePath(document.storage_path)}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge tone={knowledgeStatusTone(document.status)}>{knowledgeStatusLabel(document.status)}</StatusBadge></td>
                  <td className="px-4 py-3 text-muted-foreground">{document.segment_count}</td>
                  <td className="px-4 py-3 text-muted-foreground">{document.uploaded_by?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDateTime(document.updated_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button disabled={!canWrite || pendingReprocess} onClick={() => onReprocess(document.id)} size="sm" title="重新处理" variant="outline">
                        <RotateCcw className="size-4" />
                      </Button>
                      <Button disabled={!canWrite} onClick={() => onDelete(document)} size="sm" title="删除" variant="outline">
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function RetrievalCard({
  base,
  canWrite,
  error,
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
  base: KnowledgeBaseDetail;
  canWrite: boolean;
  error: string | null;
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
  return (
    <Card className="grid min-w-0 gap-4 p-5">
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Search className="size-4" />
          检索测试
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          针对生成的切片运行租户范围召回检查。混合检索会融合 OpenSearch 关键词分数和 Qdrant 向量分数，缺少可用后端时回退到本地近似。
        </p>
      </div>

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
      <Button disabled={!canWrite || pending || base.segment_count === 0} onClick={onRun}>
        <Search className="size-4" />
        运行检索测试
      </Button>

      {result ? (
        <div className="rounded-md border bg-muted/25 p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">结果</h3>
            <span className="text-xs text-muted-foreground">{result.results.length} 条结果 · {result.latency_ms}ms</span>
          </div>
          <div className="mt-3 grid gap-3">
            {result.results.length === 0 ? (
              <p className="text-sm text-muted-foreground">没有切片命中该问题。</p>
            ) : (
              result.results.map((item) => (
                <div className="rounded-md border bg-background px-3 py-2" key={item.segment_id}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium">{item.document_title}</div>
                    <span className="text-xs text-muted-foreground">得分 {item.score}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    关键词 {item.keyword_score?.toFixed(2) ?? '0.00'} · 向量 {item.vector_score?.toFixed(3) ?? '0.000'}
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{item.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function DocumentDetailCard({
  document,
  loading,
}: {
  document: KnowledgeDocumentDetail | null;
  loading: boolean;
}) {
  return (
    <Card className="grid min-w-0 gap-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="size-4" />
            文档详情
          </div>
          <p className="mt-1 text-sm text-muted-foreground">解析后的来源内容、文档任务和本地切片状态。</p>
        </div>
        {document ? <StatusBadge tone={knowledgeStatusTone(document.status)}>{knowledgeStatusLabel(document.status)}</StatusBadge> : null}
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载文档...</div>
      ) : !document ? (
        <EmptyState description="选择一行文档，查看解析文本和切片。" title="未选择文档" />
      ) : (
        <>
          <div className="grid gap-2 text-sm md:grid-cols-4">
            <SummaryTile label="类型" value={knowledgeSourceTypeLabel(document.source_type)} />
            <SummaryTile label="大小" value={formatFileSize(document.file_size)} />
            <SummaryTile label="词元" value={`${document.token_count}`} />
            <SummaryTile label="切片" value={`${document.segment_count}`} />
          </div>
          <div className="rounded-md border bg-muted/20 px-3 py-2">
            <div className="text-xs text-muted-foreground">对象存储路径</div>
            <div className="mt-1 break-all font-mono text-xs">
              {document.storage_path ?? '暂无 MinIO 原文路径。'}
            </div>
          </div>
          <div className="rounded-md border bg-slate-950 p-3">
            <div className="mb-2 text-xs font-medium text-slate-300">解析文本预览</div>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap text-sm leading-6 text-slate-100">
              {document.parsed_text ?? '暂无解析文本。'}
            </pre>
          </div>
          {document.error_message ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {document.error_message}
            </div>
          ) : null}
          <div className="grid gap-2">
            <h3 className="text-sm font-semibold">文档任务</h3>
            {document.tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无处理任务记录。</p>
            ) : (
              document.tasks.map((task) => (
                <div className="rounded-md border bg-muted/20 px-3 py-2" key={task.id}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{knowledgeTaskTypeLabel(task.task_type)}</span>
                    <StatusBadge tone={knowledgeStatusTone(task.status)}>{knowledgeStatusLabel(task.status)}</StatusBadge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {task.processed_items}/{task.total_items} 项 · {formatDateTime(task.ended_at ?? task.started_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </Card>
  );
}

function SegmentsCard({
  base,
  document,
}: {
  base: KnowledgeBaseDetail;
  document: KnowledgeDocumentDetail | null;
}) {
  const segments = document?.segments ?? base.segments;

  return (
    <Card className="grid min-w-0 gap-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Database className="size-4" />
            切片
          </div>
          <p className="mt-1 text-sm text-muted-foreground">切片内容、词元估算、关键词和索引状态。</p>
        </div>
        <span className="text-sm text-muted-foreground">显示 {segments.length} 条</span>
      </div>

      {segments.length === 0 ? (
        <EmptyState description="上传并处理文档后生成检索切片。" title="暂无切片" />
      ) : (
        <div className="grid max-h-[560px] gap-3 overflow-auto pr-1">
          {segments.map((segment) => (
            <div className="rounded-md border bg-background/80 p-3 shadow-sm" key={segment.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-medium">切片 {segment.sort_order + 1}</div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge tone={segment.vector_backend === 'QDRANT' ? 'healthy' : 'planned'}>
                    {segment.vector_backend === 'QDRANT' ? 'Qdrant' : '本地回退'}
                  </StatusBadge>
                  <StatusBadge tone={segment.keyword_backend === 'OPENSEARCH' ? 'healthy' : 'planned'}>
                    {segment.keyword_backend === 'OPENSEARCH' ? 'OpenSearch' : '关键词回退'}
                  </StatusBadge>
                  <StatusBadge tone={knowledgeStatusTone(segment.vector_status)}>{knowledgeStatusLabel(segment.vector_status)}</StatusBadge>
                  <StatusBadge tone={knowledgeStatusTone(segment.index_status)}>{knowledgeStatusLabel(segment.index_status)}</StatusBadge>
                </div>
              </div>
              <p className="mt-3 line-clamp-4 text-sm leading-6 text-muted-foreground">{segment.content}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-md border bg-muted/30 px-2 py-1 text-xs text-muted-foreground">{segment.token_count} 个词元</span>
                {segment.embedding_model ? (
                  <span className="rounded-md border bg-muted/30 px-2 py-1 text-xs text-muted-foreground">
                    {segment.embedding_model}
                  </span>
                ) : null}
                {segment.vector_collection ? (
                  <span className="rounded-md border bg-muted/30 px-2 py-1 text-xs text-muted-foreground">
                    {segment.vector_collection}
                  </span>
                ) : null}
                {segment.keyword_index ? (
                  <span className="rounded-md border bg-muted/30 px-2 py-1 text-xs text-muted-foreground">
                    {segment.keyword_index}
                  </span>
                ) : null}
                {segment.keywords.slice(0, 6).map((keyword) => (
                  <span className="rounded-md border bg-muted/30 px-2 py-1 text-xs text-muted-foreground" key={keyword}>{keyword}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function TasksCard({ base }: { base: KnowledgeBaseDetail }) {
  return (
    <Card className="grid min-w-0 gap-4 p-5">
      <h2 className="text-sm font-semibold">处理任务</h2>
      {base.tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">暂无任务记录。</p>
      ) : (
        <div className="grid gap-3">
          {base.tasks.slice(0, 8).map((task) => (
            <div className="rounded-md border bg-muted/20 px-3 py-2" key={task.id}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{knowledgeTaskTypeLabel(task.task_type)}</span>
                <StatusBadge tone={knowledgeStatusTone(task.status)}>{knowledgeStatusLabel(task.status)}</StatusBadge>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {task.processed_items}/{task.total_items} 项 · {formatDateTime(task.ended_at ?? task.started_at)}
              </div>
              {task.error_message ? <div className="mt-2 text-xs text-destructive">{task.error_message}</div> : null}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function RecallLogsCard({ base }: { base: KnowledgeBaseDetail }) {
  return (
    <Card className="grid min-w-0 gap-4 p-5">
      <h2 className="text-sm font-semibold">召回日志</h2>
      {base.recall_logs.length === 0 ? (
        <p className="text-sm text-muted-foreground">运行检索测试后会生成召回日志。</p>
      ) : (
        <div className="grid gap-3">
          {base.recall_logs.slice(0, 8).map((log) => (
            <div className="rounded-md border bg-muted/20 px-3 py-2" key={log.id}>
              <div className="flex items-center justify-between gap-2">
                <span className="line-clamp-1 text-sm font-medium">{log.query}</span>
                <StatusBadge tone={knowledgeStatusTone(log.status)}>{knowledgeStatusLabel(log.status)}</StatusBadge>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {knowledgeRetrievalModeLabel(log.mode)} · {log.result_count} 条结果 · {log.latency_ms}ms · {formatDateTime(log.created_at)}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function AgentReferencesCard({ base }: { base: KnowledgeBaseDetail }) {
  return (
    <Card className="grid min-w-0 gap-4 p-5">
      <h2 className="text-sm font-semibold">智能体引用</h2>
      {base.agent_references.length === 0 ? (
        <p className="text-sm text-muted-foreground">暂无智能体绑定该知识库。</p>
      ) : (
        <div className="grid gap-3">
          {base.agent_references.map((reference) => (
            <div className="rounded-md border bg-muted/20 px-3 py-2" key={reference.id}>
              <div className="text-sm font-medium">{reference.agent_name}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {reference.agent_code} · 权重 {reference.weight} · 召回前 {reference.recall_top_k}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/25 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

function formatStoragePath(value: string | null) {
  if (!value) return '-';
  return value.replace(/^minio:\/\/[^/]+\//, '');
}

function ConfirmDialog({
  body,
  confirmLabel,
  onCancel,
  onConfirm,
  pending,
  title,
}: {
  body: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
  title: string;
}) {
  return (
    <section className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-sm rounded-lg border bg-background p-6 shadow-xl">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={onCancel} variant="outline">取消</Button>
          <Button disabled={pending} onClick={onConfirm} variant="destructive">{confirmLabel}</Button>
        </div>
      </div>
    </section>
  );
}

function nullableText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
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
