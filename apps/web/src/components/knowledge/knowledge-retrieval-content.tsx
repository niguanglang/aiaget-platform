'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import type { KnowledgeRetrievalMode, KnowledgeRetrievalTestResult } from '@aiaget/shared-types';
import { Database, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

import { KnowledgeCenterBackground } from '@/components/knowledge/knowledge-center-background';
import { formatDateTime, knowledgeRetrievalModeLabel, knowledgeStatusLabel, knowledgeStatusTone } from '@/components/knowledge/knowledge-status';
import {
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
import { getKnowledgeBase, rebuildKnowledgeIndex, runKnowledgeRetrievalTest, type ApiClientError } from '@/lib/api-client';

const retrievalModes: KnowledgeRetrievalMode[] = ['HYBRID', 'VECTOR', 'KEYWORD'];

export function KnowledgeRetrievalContent({ knowledgeId }: { knowledgeId: string }) {
  const canWrite = useKnowledgeWritePermission();
  const [retrievalError, setRetrievalError] = useState<string | null>(null);
  const [retrievalQuery, setRetrievalQuery] = useState('认证部署指南');
  const [retrievalMode, setRetrievalMode] = useState<KnowledgeRetrievalMode>('HYBRID');
  const [topK, setTopK] = useState(5);
  const [retrievalResult, setRetrievalResult] = useState<KnowledgeRetrievalTestResult | null>(null);

  const baseQuery = useQuery({
    queryKey: ['knowledge-base', knowledgeId],
    queryFn: () => getKnowledgeBase(knowledgeId),
  });
  const base = baseQuery.data ?? null;

  useEffect(() => {
    setRetrievalError(null);
    setRetrievalResult(null);
  }, [knowledgeId]);

  const rebuildMutation = useMutation({
    mutationFn: rebuildKnowledgeIndex,
    onSuccess: async () => {
      await baseQuery.refetch();
      setRetrievalError(null);
    },
    onError: (error: ApiClientError) => setRetrievalError(error.message),
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
      await baseQuery.refetch();
    },
    onError: (error: ApiClientError) => setRetrievalError(error.message),
  });

  function runRetrieval() {
    if (!retrievalQuery.trim()) {
      setRetrievalError('请输入检索问题。');
      return;
    }

    retrievalMutation.mutate();
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <KnowledgeCenterBackground />
      <KnowledgeWorkspaceHeader
        actions={
          <>
            <RefreshButton loading={baseQuery.isFetching} onClick={() => void baseQuery.refetch()} />
            <Button disabled={!canWrite || rebuildMutation.isPending} onClick={() => rebuildMutation.mutate(knowledgeId)} variant="outline">
              <Database className="size-4" />
              {rebuildMutation.isPending ? '正在重建...' : '重建索引'}
            </Button>
          </>
        }
        base={base}
        description="运行混合检索、向量检索或关键词检索测试，查看最新召回结果和历史召回日志。"
        eyebrow="检索测试"
        title={base ? `${base.name} / 检索测试` : '检索测试'}
      />

      {retrievalError ? <PageMessage tone="error" value={retrievalError} /> : null}
      {rebuildMutation.isSuccess ? <PageMessage tone="success" value="索引重建任务已提交。" /> : null}

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <RetrievalFormCard
          canWrite={canWrite}
          mode={retrievalMode}
          onChangeMode={setRetrievalMode}
          onChangeQuery={setRetrievalQuery}
          onChangeTopK={setTopK}
          onRun={runRetrieval}
          pending={retrievalMutation.isPending}
          query={retrievalQuery}
          segmentCount={base?.segment_count ?? 0}
          topK={topK}
        />
        <RetrievalResultCard result={retrievalResult} />
      </section>

      <Card className="grid gap-4 p-5">
        <h2 className="text-sm font-semibold">召回日志</h2>
        {!base || base.recall_logs.length === 0 ? (
          <EmptyState description="运行检索测试后会生成召回日志。" title="暂无召回日志" />
        ) : (
          <div className="grid gap-3">
            {base.recall_logs.slice(0, 12).map((log) => (
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
    </main>
  );
}

function RetrievalFormCard({
  canWrite,
  mode,
  onChangeMode,
  onChangeQuery,
  onChangeTopK,
  onRun,
  pending,
  query,
  segmentCount,
  topK,
}: {
  canWrite: boolean;
  mode: KnowledgeRetrievalMode;
  onChangeMode: (mode: KnowledgeRetrievalMode) => void;
  onChangeQuery: (query: string) => void;
  onChangeTopK: (topK: number) => void;
  onRun: () => void;
  pending: boolean;
  query: string;
  segmentCount: number;
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
          混合检索会融合 OpenSearch 关键词分数和 Qdrant 向量分数，缺少可用后端时回退到本地近似。
        </p>
      </div>
      <SummaryTile label="可检索切片" value={`${segmentCount}`} />
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
      <Button disabled={!canWrite || pending || segmentCount === 0} onClick={onRun}>
        <Search className="size-4" />
        {pending ? '检索中...' : '运行检索测试'}
      </Button>
    </Card>
  );
}

function RetrievalResultCard({ result }: { result: KnowledgeRetrievalTestResult | null }) {
  return (
    <Card className="grid min-w-0 gap-4 p-5">
      <h2 className="text-sm font-semibold">最新结果</h2>
      {!result ? (
        <EmptyState description="运行检索测试后展示命中切片和分数。" title="暂无检索结果" />
      ) : result.results.length === 0 ? (
        <EmptyState description="没有切片命中该问题。" title="无召回结果" />
      ) : (
        <div className="grid gap-3">
          {result.results.map((item) => (
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
          ))}
        </div>
      )}
    </Card>
  );
}
