'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import Link from 'next/link';

import { KnowledgeCenterBackground } from '@/components/knowledge/knowledge-center-background';
import { KnowledgeActivityTimeline } from '@/components/knowledge/knowledge-overview-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { getKnowledgeOverview } from '@/lib/api-client';

export function KnowledgeActivityContent() {
  const overviewQuery = useQuery({ queryKey: ['knowledge-activity-overview'], queryFn: getKnowledgeOverview });
  const recentDocumentCount = overviewQuery.data?.recent_documents.length ?? 0;
  const recentTaskCount = overviewQuery.data?.recent_tasks.length ?? 0;
  const recentRecallCount = overviewQuery.data?.recent_recall_logs.length ?? 0;

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <KnowledgeCenterBackground />
      <motion.section animate={{ opacity: 1, y: 0 }} className="flex flex-col justify-between gap-4 md:flex-row md:items-start" initial={{ opacity: 0, y: 10 }} transition={{ duration: 0.32, ease: 'easeOut' }}>
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">活动中心</StatusBadge>
            <StatusBadge tone="healthy">最近文档</StatusBadge>
            <StatusBadge tone="healthy">最近任务</StatusBadge>
            <StatusBadge tone="healthy">最近召回</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">知识库处理活动</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            最近文档、后台任务和召回日志。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={overviewQuery.isFetching} onClick={() => void overviewQuery.refetch()} type="button" variant="outline">刷新活动</Button>
          <Button asChild type="button" variant="outline"><Link href="/knowledge">返回知识库</Link></Button>
        </div>
      </motion.section>
      {overviewQuery.isError ? <Card className="p-4 text-sm text-destructive">知识库活动加载失败。</Card> : null}
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard helper="最近处理文档" label="最近文档" value={`${recentDocumentCount}`} />
        <MetricCard helper="解析 / 切片 / 索引任务" label="最近任务" value={`${recentTaskCount}`} />
        <MetricCard helper="检索测试与召回日志" label="最近召回" value={`${recentRecallCount}`} />
      </section>
      <section className="grid gap-4 xl:grid-cols-3">
        <KnowledgeActivityTimeline loading={overviewQuery.isLoading} overview={overviewQuery.data ?? null} title="最近文档" type="documents" />
        <KnowledgeActivityTimeline loading={overviewQuery.isLoading} overview={overviewQuery.data ?? null} title="最近任务" type="tasks" />
        <KnowledgeActivityTimeline loading={overviewQuery.isLoading} overview={overviewQuery.data ?? null} title="最近召回" type="recalls" />
      </section>
    </main>
  );
}
