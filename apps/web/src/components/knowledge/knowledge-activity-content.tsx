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
  const activeTaskCount = overviewQuery.data?.summary.active_task_count ?? 0;
  const recallCount24h = overviewQuery.data?.summary.recall_log_count_24h ?? 0;

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <KnowledgeCenterBackground />
      <motion.section animate={{ opacity: 1, y: 0 }} className="flex flex-col justify-between gap-4 md:flex-row md:items-start" initial={{ opacity: 0, y: 10 }} transition={{ duration: 0.32, ease: 'easeOut' }}>
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">活动中心</StatusBadge>
            <StatusBadge tone="healthy">最近文档</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">知识库活动总览</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild type="button" variant="outline"><Link href="/knowledge/tasks">文档处理任务</Link></Button>
          <Button asChild type="button" variant="outline"><Link href="/knowledge/recalls">召回记录</Link></Button>
          <Button disabled={overviewQuery.isFetching} onClick={() => void overviewQuery.refetch()} type="button" variant="outline">刷新活动</Button>
          <Button asChild type="button" variant="outline"><Link href="/knowledge">返回知识库</Link></Button>
        </div>
      </motion.section>
	      {overviewQuery.isError ? <Card className="p-4 text-sm text-destructive">知识库活动加载失败。</Card> : null}
      <section className="grid gap-4 md:grid-cols-3">
	        <MetricCard helper={'文档'} label="最近文档" value={`${recentDocumentCount}`} />
	        <MetricCard helper={'活跃任务'} label="处理任务" value={`${activeTaskCount}`} />
	        <MetricCard helper={'24 小时'} label="召回记录" value={`${recallCount24h}`} />
	      </section>
      <section className="grid gap-4">
        <KnowledgeActivityTimeline loading={overviewQuery.isLoading} overview={overviewQuery.data ?? null} title="最近文档" type="documents" />
      </section>
    </main>
  );
}
