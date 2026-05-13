'use client';

import type { KnowledgeOverview } from '@aiaget/shared-types';
import type { LucideIcon } from 'lucide-react';

import {
  formatDateTime,
  knowledgeRetrievalModeLabel,
} from '@/components/knowledge/knowledge-status';
import { formatPercent } from '@/components/monitor/monitor-status';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';

export function KnowledgeHealthSummaryCard({ overview, loading }: { overview: KnowledgeOverview | null; loading: boolean }) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">知识库健康</div>
          <p className="mt-1 text-sm text-muted-foreground">总览租户级知识库数量、处理状态和索引就绪情况。</p>
        </div>
        <StatusBadge tone={overview ? 'healthy' : 'planned'}>{overview ? '已更新' : '等待加载'}</StatusBadge>
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载知识库总览...</div>
      ) : !overview ? (
        <EmptyState description="暂无知识库治理总览。" title="没有总览数据" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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

export function KnowledgeActivityTimeline({ overview, loading, title, type }: { overview: KnowledgeOverview | null; loading: boolean; title: string; type: 'documents' | 'tasks' | 'recalls' }) {
  const items = buildTimelineItems(overview, type);

  return (
    <Card className="grid gap-4 p-5">
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <p className="mt-1 text-sm text-muted-foreground">最近处理、任务和召回记录。</p>
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载活动记录...</div>
      ) : !overview ? (
        <EmptyState description="暂无知识库活动数据。" title="没有活动数据" />
      ) : (
        <TimelineList items={items} />
      )}
    </Card>
  );
}

function buildTimelineItems(overview: KnowledgeOverview | null, type: 'documents' | 'tasks' | 'recalls') {
  if (!overview) return [];
  if (type === 'documents') {
    return overview.recent_documents.map((item) => ({
      id: item.id,
      title: item.title,
      subtitle: `${item.knowledge_name} · ${item.segment_count} 切片 · ${formatDateTime(item.updated_at)}`,
      status: item.status,
    }));
  }
  if (type === 'tasks') {
    return overview.recent_tasks.map((item) => ({
      id: item.id,
      title: `${item.knowledge_name} · ${item.task_type}`,
      subtitle: `${item.processed_items}/${item.total_items} 项 · ${item.started_at ? formatDateTime(item.started_at) : '未开始'}`,
      status: item.status,
    }));
  }

  return overview.recent_recall_logs.map((item) => ({
    id: item.id,
    title: `${item.knowledge_name} · ${item.query}`,
    subtitle: `${knowledgeRetrievalModeLabel(item.mode)} · ${item.result_count} 条结果 · ${item.latency_ms}ms`,
    status: item.status,
  }));
}

function TimelineList({ items }: { items: Array<{ id: string; title: string; subtitle: string; status: string }> }) {
  return items.length === 0 ? (
    <EmptyState className="rounded-md border bg-muted/20 p-4" description="暂无记录。" title="空" />
  ) : (
    <div className="grid gap-2">
      {items.map((item) => (
        <div className="rounded-md border bg-muted/20 px-3 py-2" key={item.id}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{item.title}</div>
              <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.subtitle}</div>
            </div>
            <StatusBadge tone={statusTone(item.status)}>{item.status}</StatusBadge>
          </div>
        </div>
      ))}
    </div>
  );
}

export function KnowledgeCapabilityCard({ icon: Icon, title, value, description }: { icon: LucideIcon; title: string; value: string; description: string }) {
  return (
    <Card className="grid gap-3 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="size-4 text-primary" />
        {title}
      </div>
      <div className="text-2xl font-semibold">{value}</div>
      <p className="text-sm leading-6 text-muted-foreground">{description}</p>
    </Card>
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
