'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { KnowledgeBaseDetail, KnowledgeDocumentDetail, KnowledgeDocumentListItem } from '@aiaget/shared-types';
import { motion } from 'motion/react';
import { Database, FileText, RotateCcw, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { KnowledgeCenterBackground } from '@/components/knowledge/knowledge-center-background';
import {
  formatDateTime,
  formatFileSize,
  knowledgeSourceTypeLabel,
  knowledgeStatusLabel,
  knowledgeStatusTone,
  knowledgeTaskTypeLabel,
} from '@/components/knowledge/knowledge-status';
import {
  ConfirmDialog,
  formatStoragePath,
  hasActiveKnowledgeBackgroundWork,
  KnowledgeWorkspaceHeader,
  PageMessage,
  RefreshButton,
  SummaryTile,
  useKnowledgeWritePermission,
} from '@/components/knowledge/knowledge-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  deleteKnowledgeDocument,
  getKnowledgeBase,
  getKnowledgeDocument,
  reprocessKnowledgeDocument,
  type ApiClientError,
} from '@/lib/api-client';

export function KnowledgeDocumentsContent({ knowledgeId }: { knowledgeId: string }) {
  const queryClient = useQueryClient();
  const canWrite = useKnowledgeWritePermission();
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [deleteDocumentTarget, setDeleteDocumentTarget] = useState<KnowledgeDocumentListItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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

  const reprocessMutation = useMutation({
    mutationFn: (documentId: string) => reprocessKnowledgeDocument(knowledgeId, documentId),
    onSuccess: async (result) => {
      await applyBaseResult(queryClient, result);
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
      await applyBaseResult(queryClient, result);
      setSelectedDocumentId(null);
      setDeleteDocumentTarget(null);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  if (baseQuery.isLoading) {
    return (
      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <KnowledgeCenterBackground />
        <Card className="p-6 text-sm text-muted-foreground">正在加载文档管理...</Card>
      </main>
    );
  }

  if (baseQuery.isError || !base) {
    return (
      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <KnowledgeCenterBackground />
        <Card className="p-6 text-sm text-destructive">知识库加载失败。</Card>
      </main>
    );
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <KnowledgeCenterBackground />
      <KnowledgeWorkspaceHeader
        actions={
          <>
            <RefreshButton loading={baseQuery.isFetching || documentQuery.isFetching} onClick={() => void baseQuery.refetch()} />
            <Button asChild disabled={!canWrite} variant="outline">
              <Link href={`/knowledge/${knowledgeId}/upload`}>上传文档</Link>
            </Button>
          </>
        }
        base={base}
        description="文档、解析文本、切片和处理任务。"
        eyebrow="文档管理"
        title={`${base.name} / 文档管理`}
      />

      {actionError ? <PageMessage tone="error" value={actionError} /> : null}

      <section className="grid min-w-0 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <DocumentsCard
          base={base}
          canWrite={canWrite}
          onDelete={setDeleteDocumentTarget}
          onReprocess={(documentId) => reprocessMutation.mutate(documentId)}
          onSelect={setSelectedDocumentId}
          pendingReprocess={reprocessMutation.isPending}
          selectedDocumentId={activeDocumentId}
        />
        <DocumentDetailCard document={selectedDocument} loading={documentQuery.isLoading} />
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <SegmentsCard base={base} document={selectedDocument} />
        <TasksCard base={base} document={selectedDocument} />
      </section>

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
          <h2 className="text-sm font-semibold">文档管理</h2>
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
                      <div className="mt-1 truncate text-xs text-muted-foreground">{formatStoragePath(document.storage_path)}</div>
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

function DocumentDetailCard({ document, loading }: { document: KnowledgeDocumentDetail | null; loading: boolean }) {
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
        <EmptyState description="请选择文档。" title="未选择文档" />
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
            <div className="mt-1 break-all font-mono text-xs">{document.storage_path ?? '暂无 MinIO 原文路径。'}</div>
          </div>
          <div className="rounded-md border bg-slate-950 p-3">
            <div className="mb-2 text-xs font-medium text-slate-300">解析文本预览</div>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap text-sm leading-6 text-slate-100">
              {document.parsed_text ?? '暂无解析文本。'}
            </pre>
          </div>
          {document.error_message ? <PageMessage tone="error" value={document.error_message} /> : null}
        </>
      )}
    </Card>
  );
}

function SegmentsCard({ base, document }: { base: KnowledgeBaseDetail; document: KnowledgeDocumentDetail | null }) {
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

function TasksCard({ base, document }: { base: KnowledgeBaseDetail; document: KnowledgeDocumentDetail | null }) {
  const tasks = useMemo(() => document?.tasks ?? base.tasks, [base.tasks, document?.tasks]);

  return (
    <Card className="grid min-w-0 gap-4 p-5">
      <h2 className="text-sm font-semibold">处理任务</h2>
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">暂无任务记录。</p>
      ) : (
        <div className="grid gap-3">
          {tasks.slice(0, 10).map((task) => (
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

async function applyBaseResult(queryClient: ReturnType<typeof useQueryClient>, result: KnowledgeBaseDetail) {
  queryClient.setQueryData(['knowledge-base', result.id], result);
  await queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] });
  await queryClient.invalidateQueries({ queryKey: ['knowledge-overview'] });
}
