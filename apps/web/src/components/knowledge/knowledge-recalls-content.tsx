'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import Link from 'next/link';

import { KnowledgeCenterBackground } from '@/components/knowledge/knowledge-center-background';
import { KnowledgeActivityTimeline } from '@/components/knowledge/knowledge-overview-shared';
import { formatPercent } from '@/components/monitor/monitor-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { getKnowledgeOverview } from '@/lib/api-client';

export function KnowledgeRecallsContent() {
  const overviewQuery = useQuery({ queryKey: ['knowledge-recalls-overview'], queryFn: getKnowledgeOverview });
  const summary = overviewQuery.data?.summary;

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <KnowledgeCenterBackground />
      <motion.section animate={{ opacity: 1, y: 0 }} className="flex flex-col justify-between gap-4 md:flex-row md:items-start" initial={{ opacity: 0, y: 10 }} transition={{ duration: 0.32, ease: 'easeOut' }}>
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">检索召回</StatusBadge>
            <StatusBadge tone="healthy">召回记录</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">召回记录</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={overviewQuery.isFetching} onClick={() => void overviewQuery.refetch()} type="button" variant="outline">刷新记录</Button>
          <Button asChild type="button" variant="outline"><Link href="/knowledge/activity">活动总览</Link></Button>
          <Button asChild type="button" variant="outline"><Link href="/knowledge">返回知识库</Link></Button>
        </div>
      </motion.section>
      {overviewQuery.isError ? <Card className="p-4 text-sm text-destructive">召回记录加载失败。</Card> : null}
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard helper="24 小时" label="召回次数" value={`${summary?.recall_log_count_24h ?? 0}`} />
        <MetricCard helper="24 小时" label="成功召回" value={`${summary?.recall_success_count_24h ?? 0}`} />
        <MetricCard helper="成功率" label="召回成功率" value={formatPercent(summary?.recall_success_rate_24h ?? 0)} />
      </section>
      <KnowledgeActivityTimeline loading={overviewQuery.isLoading} overview={overviewQuery.data ?? null} title="召回记录" type="recalls" />
    </main>
  );
}
