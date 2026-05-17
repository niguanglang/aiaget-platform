'use client';

import type {
  KnowledgeOverview,
  KnowledgeOverviewDocumentItem,
  KnowledgeOverviewRecallItem,
  KnowledgeOverviewTaskItem,
} from '@aiaget/shared-types';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  Layers3,
  RefreshCw,
  SearchCheck,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import {
  formatDateTime,
  knowledgeRetrievalModeLabel,
  knowledgeSourceTypeLabel,
  knowledgeStatusLabel,
  knowledgeStatusTone,
  knowledgeTaskTypeLabel,
} from '@/components/knowledge/knowledge-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { getKnowledgeOverview } from '@/lib/api-client';
import { cn } from '@/lib/utils';

type ActivityType = 'all' | 'documents' | 'tasks' | 'recalls';
type ActivityTone = 'healthy' | 'degraded' | 'unavailable' | 'planned' | 'ready' | 'mock' | 'loading' | 'muted';

export function KnowledgeActivityContent() {
  const [activityType, setActivityType] = useState<ActivityType>('all');
  const overviewQuery = useQuery({ queryKey: ['knowledge-activity-overview'], queryFn: getKnowledgeOverview });
  const overview = overviewQuery.data ?? null;
  const summary = overview?.summary;
  const healthScore = averagePercent(summary?.vector_ready_rate, summary?.keyword_ready_rate, summary?.recall_success_rate_24h);

  const activities = useMemo(() => {
    if (!overview) return [];

    const documents = overview.recent_documents.map((document) => ({
      id: `document-${document.id}`,
      meta: `${document.knowledge_name} / ${knowledgeSourceTypeLabel(document.source_type)} / ${formatNumber(document.segment_count)} 切片`,
      status: knowledgeStatusLabel(document.status),
      time: document.updated_at,
      title: document.title,
      tone: knowledgeStatusTone(document.status) as ActivityTone,
      type: 'documents' as const,
    }));
    const tasks = overview.recent_tasks.map((task) => ({
      id: `task-${task.id}`,
      meta: `${formatNumber(task.processed_items)} / ${formatNumber(task.total_items)} 项`,
      status: knowledgeStatusLabel(task.status),
      time: task.updated_at,
      title: `${task.knowledge_name} / ${knowledgeTaskTypeLabel(task.task_type)}`,
      tone: knowledgeStatusTone(task.status) as ActivityTone,
      type: 'tasks' as const,
    }));
    const recalls = overview.recent_recall_logs.map((recall) => ({
      id: `recall-${recall.id}`,
      meta: `${recall.knowledge_name} / ${knowledgeRetrievalModeLabel(recall.mode)} / ${formatNumber(recall.latency_ms)} ms`,
      status: knowledgeStatusLabel(recall.status),
      time: recall.created_at,
      title: recall.query,
      tone: recall.status === 'SUCCESS' ? ('healthy' as const) : ('unavailable' as const),
      type: 'recalls' as const,
    }));

    return [...documents, ...tasks, ...recalls]
      .filter((item) => activityType === 'all' || item.type === activityType)
      .sort((left, right) => new Date(right.time).getTime() - new Date(left.time).getTime())
      .slice(0, 9);
  }, [activityType, overview]);

  return (
    <main className="mx-auto grid max-w-[1680px] gap-4 px-4 py-5 lg:px-7">
      <section className="flex flex-col justify-between gap-4 py-3 md:flex-row md:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">知识库活动总览</h1>
          <StatusBadge tone="healthy">活动中心</StatusBadge>
          <StatusBadge tone="planned">最近更新</StatusBadge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="h-10" type="button" variant="outline">
            <Link href="/knowledge/tasks">文档处理任务</Link>
          </Button>
          <Button asChild className="h-10" type="button" variant="outline">
            <Link href="/knowledge/recalls">召回记录</Link>
          </Button>
          <Button
            className="h-10"
            disabled={overviewQuery.isFetching}
            onClick={() => void overviewQuery.refetch()}
            type="button"
            variant="outline"
          >
            <RefreshCw className={`size-4 ${overviewQuery.isFetching ? 'animate-spin' : ''}`} />
            刷新活动
          </Button>
          <Button asChild className="h-10" type="button" variant="outline">
            <Link href="/knowledge">返回知识库</Link>
          </Button>
        </div>
      </section>

      {overviewQuery.isError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          知识库活动加载失败。
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KnowledgeMetricTile
          helper={`文档总数 ${formatNumber(summary?.document_count)}`}
          icon={FileText}
          iconClassName="bg-blue-100 text-blue-700"
          label="最近文档"
          value={formatNumber(overview?.recent_documents.length)}
        />
        <KnowledgeMetricTile
          helper={`失败任务 ${formatNumber(summary?.failed_task_count)}`}
          icon={Clock3}
          iconClassName="bg-orange-100 text-orange-700"
          label="处理中任务"
          value={formatNumber(summary?.active_task_count)}
        />
        <KnowledgeMetricTile
          helper={`成功 ${formatNumber(summary?.recall_success_count_24h)}`}
          icon={SearchCheck}
          iconClassName="bg-emerald-100 text-emerald-700"
          label="召回次数"
          value={formatNumber(summary?.recall_log_count_24h)}
        />
        <KnowledgeHealthMetric healthScore={healthScore} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.72fr)_minmax(560px,1fr)]">
        <Card className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/[0.9] shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="flex flex-col gap-3 border-b border-slate-200/80 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-base font-semibold text-slate-950">活动时间线</h2>
            <ActivitySegmentedControl onChange={setActivityType} value={activityType} />
          </div>
          <KnowledgeActivityTimeline activities={activities} loading={overviewQuery.isLoading} />
        </Card>

        <Card className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/[0.9] shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-950">处理队列</h2>
              <div className="mt-1 text-xs text-slate-500">共 {formatNumber(overview?.recent_tasks.length)} 条</div>
            </div>
            <Button asChild className="h-8 px-3" size="sm" variant="outline">
              <Link href="/knowledge/tasks">查看任务</Link>
            </Button>
          </div>
          <KnowledgeProcessingQueueTable loading={overviewQuery.isLoading} tasks={overview?.recent_tasks ?? []} />
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.72fr)_minmax(560px,1fr)]">
        <Card className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/[0.9] shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-950">最近文档</h2>
              <div className="mt-1 text-xs text-slate-500">共 {formatNumber(overview?.recent_documents.length)} 条</div>
            </div>
            <Button asChild className="h-8 px-3" size="sm" variant="outline">
              <Link href="/knowledge">知识库列表</Link>
            </Button>
          </div>
          <RecentDocumentTable documents={overview?.recent_documents ?? []} loading={overviewQuery.isLoading} />
        </Card>

        <Card className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/[0.9] shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-950">召回质量概览</h2>
            <Button asChild className="h-8 px-3" size="sm" variant="outline">
              <Link href="/knowledge/recalls">查看召回</Link>
            </Button>
          </div>
          <div className="grid gap-0 xl:grid-cols-[minmax(0,0.9fr)_minmax(300px,1fr)]">
            <KnowledgeRecallQualityOverview loading={overviewQuery.isLoading} overview={overview} />
            <KnowledgeTopQueriesTable loading={overviewQuery.isLoading} recalls={overview?.recent_recall_logs ?? []} />
          </div>
        </Card>
      </section>
    </main>
  );
}

export function KnowledgeMetricTile({
  helper,
  icon: Icon,
  iconClassName,
  label,
  value,
}: {
  helper: string;
  icon: typeof FileText;
  iconClassName: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-[116px] items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white/[0.9] px-5 py-4 shadow-[0_16px_45px_rgba(15,23,42,0.05)] backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-4">
        <span className={`grid size-14 shrink-0 place-items-center rounded-2xl ${iconClassName}`}>
          <Icon className="size-7" />
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</div>
          <div className="mt-1 text-xs text-slate-500">{helper}</div>
        </div>
      </div>
      <MiniSparkline className="hidden w-24 text-blue-500 sm:block" />
    </div>
  );
}

function KnowledgeHealthMetric({ healthScore }: { healthScore: number | undefined }) {
  const score = healthScore ?? 0;
  const tone = score >= 90 ? '良好' : score >= 70 ? '关注' : '异常';

  return (
    <div className="flex min-h-[116px] items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white/[0.9] px-5 py-4 shadow-[0_16px_45px_rgba(15,23,42,0.05)] backdrop-blur-xl">
      <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-700">
        <ShieldCheck className="size-7" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-slate-500">知识库健康度</div>
        <div className="mt-2 flex items-center gap-3">
          <CircularScore value={score} />
          <div>
            <div className="text-sm font-semibold text-emerald-600">{tone}</div>
            <div className="mt-1 text-xs text-slate-500">综合得分</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivitySegmentedControl({ onChange, value }: { onChange: (value: ActivityType) => void; value: ActivityType }) {
  const options = [
    { label: '全部事件', value: 'all' as const },
    { label: '文档', value: 'documents' as const },
    { label: '任务', value: 'tasks' as const },
    { label: '召回', value: 'recalls' as const },
  ];

  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
      {options.map((option) => (
        <button
          className={cn(
            'h-8 rounded-md px-3 text-xs font-medium text-slate-600 transition-colors',
            value === option.value ? 'bg-white text-blue-700 shadow-sm' : 'hover:bg-white/70',
          )}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function KnowledgeActivityTimeline({
  activities,
  loading,
}: {
  activities: Array<{
    id: string;
    meta: string;
    status: string;
    time: string;
    title: string;
    tone: ActivityTone;
    type: 'documents' | 'tasks' | 'recalls';
  }>;
  loading: boolean;
}) {
  if (loading) return <div className="p-5 text-sm text-muted-foreground">加载中</div>;
  if (activities.length === 0) return <EmptyState className="p-8" title="暂无活动记录" />;

  return (
    <div className="grid p-5">
      {activities.map((activity, index) => (
        <div className="grid grid-cols-[30px_minmax(0,1fr)_auto] gap-3 pb-4 last:pb-0" key={activity.id}>
          <span className="relative flex justify-center">
            <span
              className={cn(
                'mt-0.5 grid size-6 place-items-center rounded-full border bg-white',
                activity.tone === 'unavailable'
                  ? 'border-red-200 text-red-600'
                  : activity.tone === 'mock'
                    ? 'border-orange-200 text-orange-600'
                    : 'border-emerald-200 text-emerald-600',
              )}
            >
              {activity.tone === 'unavailable' ? <AlertCircle className="size-4" /> : <CheckCircle2 className="size-4" />}
            </span>
            {index < activities.length - 1 ? <span className="absolute top-7 h-[calc(100%-1rem)] w-px bg-slate-200" /> : null}
          </span>
          <div className="min-w-0 border-b border-slate-100 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="truncate text-sm font-medium text-slate-900">{activity.title}</div>
              <StatusBadge tone={activity.tone}>{activity.status}</StatusBadge>
            </div>
            <div className="mt-1 truncate text-xs text-slate-500">{activity.meta}</div>
          </div>
          <div className="whitespace-nowrap border-b border-slate-100 pb-3 text-xs text-slate-500">{formatDateTime(activity.time)}</div>
        </div>
      ))}
    </div>
  );
}

function KnowledgeProcessingQueueTable({ loading, tasks }: { loading: boolean; tasks: KnowledgeOverviewTaskItem[] }) {
  if (loading) return <div className="p-5 text-sm text-muted-foreground">加载中</div>;
  if (tasks.length === 0) return <EmptyState className="p-8" title="暂无任务记录" />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200/80 bg-slate-50/70">
            {['任务名称', '类型', '进度', '状态', '耗时', '更新时间', '操作'].map((column) => (
              <th className="px-4 py-3 font-medium text-slate-500" key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const progress = progressPercent(task.processed_items, task.total_items);

            return (
              <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70" key={task.id}>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{task.knowledge_name}</div>
                  <div className="mt-1 text-xs text-slate-500">{task.id}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">{knowledgeTaskTypeLabel(task.task_type)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <ProgressBar value={progress} />
                    <span className="w-12 text-xs text-slate-500">{formatPercent(progress)}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge tone={knowledgeStatusTone(task.status)}>{knowledgeStatusLabel(task.status)}</StatusBadge>
                </td>
                <td className="px-4 py-3 text-slate-600">{formatDuration(task.started_at, task.ended_at, task.updated_at)}</td>
                <td className="px-4 py-3 text-slate-500">{formatDateTime(task.updated_at)}</td>
                <td className="px-4 py-3">
                  <Button asChild className="h-8 px-3" size="sm" variant="outline">
                    <Link href="/knowledge/tasks">查看</Link>
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <TableFooter total={tasks.length} />
    </div>
  );
}

function RecentDocumentTable({ documents, loading }: { documents: KnowledgeOverviewDocumentItem[]; loading: boolean }) {
  if (loading) return <div className="p-5 text-sm text-muted-foreground">加载中</div>;
  if (documents.length === 0) return <EmptyState className="p-8" title="暂无文档记录" />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200/80 bg-slate-50/70">
            {['文档名称', '知识库', '类型', '切片数', 'Token', '状态', '更新时间', '操作'].map((column) => (
              <th className="px-4 py-3 font-medium text-slate-500" key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {documents.map((document) => (
            <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70" key={document.id}>
              <td className="px-4 py-3 font-medium text-slate-900">{document.title}</td>
              <td className="px-4 py-3 text-slate-600">{document.knowledge_name}</td>
              <td className="px-4 py-3 text-slate-600">{knowledgeSourceTypeLabel(document.source_type)}</td>
              <td className="px-4 py-3 text-slate-600">{formatNumber(document.segment_count)}</td>
              <td className="px-4 py-3 text-slate-600">{formatNumber(document.token_count)}</td>
              <td className="px-4 py-3">
                <StatusBadge tone={knowledgeStatusTone(document.status)}>{knowledgeStatusLabel(document.status)}</StatusBadge>
              </td>
              <td className="px-4 py-3 text-slate-500">{formatDateTime(document.updated_at)}</td>
              <td className="px-4 py-3">
                <Button asChild className="h-8 px-3" size="sm" variant="outline">
                  <Link href={`/knowledge/${document.knowledge_id}/documents`}>查看</Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <TableFooter total={documents.length} />
    </div>
  );
}

function KnowledgeRecallQualityOverview({ loading, overview }: { loading: boolean; overview: KnowledgeOverview | null }) {
  if (loading) return <div className="p-5 text-sm text-muted-foreground">加载中</div>;
  if (!overview) return <EmptyState className="p-8" title="暂无召回数据" />;

  const summary = overview.summary;
  const recentTaskTotal = overview.recent_tasks.length;
  const recentFailedTasks = overview.recent_tasks.filter((task) => task.status === 'FAILED').length;

  return (
    <div className="grid gap-5 border-b border-slate-200/80 p-5 xl:border-b-0 xl:border-r">
      <div className="grid gap-3">
        <QualityLine label="召回准确率" value={summary.recall_success_rate_24h} />
        <QualityLine label="向量就绪率" value={summary.vector_ready_rate} />
        <QualityLine label="关键词就绪率" value={summary.keyword_ready_rate} />
        <QualityLine label="知识库启用率" value={ratioPercent(summary.active_knowledge_base_count, summary.knowledge_base_count)} />
      </div>
      <RadarGrid
        items={[
          { label: '召回成功', value: summary.recall_success_rate_24h },
          { label: '向量就绪', value: summary.vector_ready_rate },
          { label: '关键词就绪', value: summary.keyword_ready_rate },
          { label: '启用占比', value: ratioPercent(summary.active_knowledge_base_count, summary.knowledge_base_count) },
          { label: '任务稳定', value: recentTaskTotal === 0 ? 100 : ratioPercent(recentTaskTotal - recentFailedTasks, recentTaskTotal) },
        ]}
      />
    </div>
  );
}

function KnowledgeTopQueriesTable({ loading, recalls }: { loading: boolean; recalls: KnowledgeOverviewRecallItem[] }) {
  if (loading) return <div className="p-5 text-sm text-muted-foreground">加载中</div>;
  if (recalls.length === 0) return <EmptyState className="p-8" title="暂无查询记录" />;

  const rows = buildTopQueryRows(recalls);

  return (
    <div className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-950">Top 查询</h3>
        <span className="text-xs text-slate-500">共 {formatNumber(recalls.length)} 条</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[430px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/70">
              {['查询内容', '召回次数', '成功率'].map((column) => (
                <th className="px-3 py-2.5 font-medium text-slate-500" key={column}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-b border-slate-100 last:border-0" key={row.query}>
                <td className="max-w-[240px] px-3 py-2.5 font-medium text-slate-900">
                  <span className="line-clamp-1">{row.query}</span>
                </td>
                <td className="px-3 py-2.5 text-slate-600">{formatNumber(row.count)}</td>
                <td className="px-3 py-2.5 text-slate-600">{formatPercent(row.successRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button asChild className="mt-4 h-9 w-full" size="sm" variant="outline">
        <Link href="/knowledge/recalls">全部召回记录</Link>
      </Button>
    </div>
  );
}

function CircularScore({ value }: { value: number }) {
  const score = Math.max(0, Math.min(100, value));
  const background = `conic-gradient(#2563eb ${score * 3.6}deg, #e5edf8 0deg)`;

  return (
    <span className="grid size-14 place-items-center rounded-full p-1" style={{ background }}>
      <span className="grid size-11 place-items-center rounded-full bg-white text-center">
        <span>
          <span className="block text-base font-semibold leading-none text-slate-950">{Math.round(score)}</span>
          <span className="text-[10px] leading-none text-slate-500">分</span>
        </span>
      </span>
    </span>
  );
}

function MiniSparkline({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" height="42" viewBox="0 0 96 42" width="96">
      <path d="M2 28 C10 16 16 31 25 22 S38 10 48 18 60 29 70 17 83 14 94 7" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
      <path d="M2 31 C10 19 16 34 25 25 S38 13 48 21 60 32 70 20 83 17 94 10" stroke="currentColor" strokeLinecap="round" strokeOpacity="0.18" strokeWidth="8" />
    </svg>
  );
}

function ProgressBar({ value }: { value: number }) {
  const width = Math.max(0, Math.min(100, value));

  return (
    <span className="block h-2 w-full min-w-24 rounded-full bg-slate-100">
      <span className="block h-full rounded-full bg-blue-600" style={{ width: `${width}%` }} />
    </span>
  );
}

function QualityLine({ label, value }: { label: string; value: number }) {
  const normalized = Math.max(0, Math.min(100, value));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-900">{formatPercent(normalized)}</span>
      </div>
      <ProgressBar value={normalized} />
    </div>
  );
}

function RadarGrid({ items }: { items: Array<{ label: string; value: number }> }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
      <div className="mb-3 text-sm font-semibold text-slate-950">维度分布</div>
      <div className="grid grid-cols-[150px_minmax(0,1fr)] gap-4">
        <div className="relative grid size-36 place-items-center rounded-full border border-blue-100 bg-white">
          <div className="absolute size-24 rounded-full border border-blue-100" />
          <div className="absolute size-14 rounded-full border border-blue-100" />
          <div className="h-20 w-20 rotate-45 rounded-[18px] border border-blue-500/40 bg-blue-500/15" />
          <Layers3 className="absolute size-5 text-blue-600" />
        </div>
        <div className="grid gap-2">
          {items.map((item) => (
            <div className="grid grid-cols-[72px_minmax(0,1fr)_42px] items-center gap-2 text-xs" key={item.label}>
              <span className="text-slate-500">{item.label}</span>
              <ProgressBar value={Math.max(0, Math.min(100, item.value))} />
              <span className="text-right font-medium text-slate-700">{Math.round(Math.min(100, item.value))}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TableFooter({ total }: { total: number }) {
  return (
    <div className="border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
      显示最近 {formatNumber(total)} 条
    </div>
  );
}

function buildTopQueryRows(recalls: KnowledgeOverviewRecallItem[]) {
  const grouped = new Map<string, { count: number; query: string; successCount: number }>();

  for (const recall of recalls) {
    const current = grouped.get(recall.query) ?? { count: 0, query: recall.query, successCount: 0 };
    current.count += 1;
    current.successCount += recall.status === 'SUCCESS' ? 1 : 0;
    grouped.set(recall.query, current);
  }

  return Array.from(grouped.values())
    .map((row) => ({ ...row, successRate: ratioPercent(row.successCount, row.count) }))
    .sort((left, right) => right.count - left.count || right.successRate - left.successRate)
    .slice(0, 6);
}

function formatDuration(startedAt: string | null, endedAt: string | null, fallbackAt: string) {
  const start = startedAt ? new Date(startedAt).getTime() : new Date(fallbackAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  const seconds = Math.max(0, Math.round((end - start) / 1000));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  if (minutes <= 0) return `00:${rest.toString().padStart(2, '0')}`;

  return `${minutes.toString().padStart(2, '0')}:${rest.toString().padStart(2, '0')}`;
}

function progressPercent(processedItems: number, totalItems: number) {
  if (totalItems <= 0) return 0;
  return Number(((processedItems / totalItems) * 100).toFixed(1));
}

function ratioPercent(value: number, total: number) {
  if (total <= 0) return 0;
  return Number(((value / total) * 100).toFixed(1));
}

function averagePercent(...values: Array<number | undefined>) {
  const validValues = values.filter((value): value is number => value !== undefined);
  if (validValues.length === 0) return undefined;

  return Number((validValues.reduce((total, value) => total + value, 0) / validValues.length).toFixed(1));
}

function formatNumber(value: number | undefined) {
  if (value === undefined) return '-';
  return new Intl.NumberFormat('zh-CN').format(value);
}

function formatPercent(value: number | undefined) {
  if (value === undefined) return '-';
  return `${value.toFixed(1)}%`;
}
