'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Database, Layers3, RefreshCcw, Search, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import { KnowledgeCenterBackground } from '@/components/knowledge/knowledge-center-background';
import {
  KnowledgeCapabilityCard,
  KnowledgeHealthSummaryCard,
} from '@/components/knowledge/knowledge-overview-shared';
import { formatPercent } from '@/components/monitor/monitor-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { getKnowledgeOverview } from '@/lib/api-client';

export function KnowledgeHealthContent() {
  const overviewQuery = useQuery({ queryKey: ['knowledge-health-overview'], queryFn: getKnowledgeOverview });
  const summary = overviewQuery.data?.summary;

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <KnowledgeCenterBackground />
      <motion.section animate={{ opacity: 1, y: 0 }} className="flex flex-col justify-between gap-4 md:flex-row md:items-start" initial={{ opacity: 0, y: 10 }} transition={{ duration: 0.32, ease: 'easeOut' }}>
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">能力健康</StatusBadge>
            <StatusBadge tone="healthy">MinIO 原文</StatusBadge>
            <StatusBadge tone="healthy">Qdrant 向量库</StatusBadge>
            <StatusBadge tone="healthy">OpenSearch 关键词</StatusBadge>
            <StatusBadge tone="healthy">向量回退</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">知识库能力健康</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            对象存储、向量库、关键词索引和后台任务健康概览。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={overviewQuery.isFetching} onClick={() => void overviewQuery.refetch()} type="button" variant="outline">
            <RefreshCcw className="size-4" />
            刷新健康
          </Button>
          <Button asChild type="button" variant="outline"><Link href="/knowledge">返回知识库</Link></Button>
        </div>
      </motion.section>
      {overviewQuery.isError ? <Card className="p-4 text-sm text-destructive">知识库健康加载失败。</Card> : null}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KnowledgeCapabilityCard description="原文文件与上传内容进入对象存储，作为解析和重处理的审计来源。" icon={Database} title="MinIO 原文" value={`${summary?.document_count ?? 0} 文档`} />
        <KnowledgeCapabilityCard description="向量索引用于语义召回；向量回退在异常时保留 PostgreSQL fallback 能力。" icon={Layers3} title="Qdrant 向量库" value={formatPercent(summary?.vector_ready_rate ?? 0)} />
        <KnowledgeCapabilityCard description="关键词索引用于混合检索，补充向量召回的精确匹配能力。" icon={Search} title="OpenSearch 关键词" value={formatPercent(summary?.keyword_ready_rate ?? 0)} />
        <KnowledgeCapabilityCard description="后台任务负责解析、切片、Embedding、索引写入和失败重试边界。" icon={ShieldCheck} title="后台任务" value={`${summary?.active_task_count ?? 0} 活跃`} />
      </section>
      <KnowledgeHealthSummaryCard loading={overviewQuery.isLoading} overview={overviewQuery.data ?? null} />
    </main>
  );
}
