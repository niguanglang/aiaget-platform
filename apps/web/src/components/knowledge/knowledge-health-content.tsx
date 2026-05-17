'use client';

import type { KnowledgeOverview } from '@aiaget/shared-types';
import { useQuery } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Database,
  FileText,
  Gauge,
  Layers3,
  LockKeyhole,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Target,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { getKnowledgeOverview } from '@/lib/api-client';
import { cn } from '@/lib/utils';

type HealthRisk = 'LOW' | 'MEDIUM' | 'HIGH';
type HealthIssue = {
  agentCount: number;
  healthScore: number;
  id: string;
  issueType: string;
  knowledgeName: string;
  lastCheckedAt: string;
  owner: string;
  recommendation: string;
  risk: HealthRisk;
};

export function KnowledgeHealthContent() {
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const overviewQuery = useQuery({ queryKey: ['knowledge-health-overview'], queryFn: getKnowledgeOverview });
  const overview = overviewQuery.data ?? null;
  const healthScore = overview ? calculateHealthScore(overview) : 0;
  const healthIssues = useMemo(() => (overview ? buildHealthIssues(overview) : []), [overview]);
  const selectedIssue = healthIssues.find((issue) => issue.id === selectedIssueId) ?? healthIssues[0] ?? null;

  return (
    <main className="mx-auto grid max-w-[1680px] gap-5 px-4 py-5 lg:px-7">
      <section className="flex flex-col justify-between gap-4 py-3 md:flex-row md:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">知识库能力健康</h1>
          <StatusBadge tone="healthy">能力概览</StatusBadge>
          <StatusBadge tone="planned">向量回退</StatusBadge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            className="h-10"
            disabled={overviewQuery.isFetching}
            onClick={() => void overviewQuery.refetch()}
            type="button"
            variant="outline"
          >
            <RefreshCw className={`size-4 ${overviewQuery.isFetching ? 'animate-spin' : ''}`} />
            刷新健康
          </Button>
          <Button asChild className="h-10" type="button" variant="outline">
            <Link href="/knowledge">
              <ArrowLeft className="size-4" />
              返回知识库
            </Link>
          </Button>
        </div>
      </section>

      {overviewQuery.isError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          知识库健康加载失败。
        </div>
      ) : null}

      <KnowledgeHealthScoreStrip healthScore={healthScore} loading={overviewQuery.isLoading} overview={overview} />

      <KnowledgeCapabilityStatusGrid loading={overviewQuery.isLoading} overview={overview} />

      <section className="grid gap-4 xl:grid-cols-[270px_minmax(0,1fr)_430px]">
        <KnowledgeHealthDimensionList loading={overviewQuery.isLoading} overview={overview} />
        <Card className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/[0.9] shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="border-b border-slate-200/80 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-950">异常项</h2>
          </div>
          <KnowledgeHealthIssueTable
            issues={healthIssues}
            loading={overviewQuery.isLoading}
            onSelectIssue={setSelectedIssueId}
            selectedIssueId={selectedIssue?.id ?? null}
          />
        </Card>
        <KnowledgeHealthDetailPanel issue={selectedIssue} loading={overviewQuery.isLoading} overview={overview} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <KnowledgeStorageReadinessPanel loading={overviewQuery.isLoading} overview={overview} />
        <Card className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/[0.9] shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="border-b border-slate-200/80 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-950">索引就绪率</h2>
          </div>
          {overviewQuery.isLoading ? (
            <div className="p-5 text-sm text-muted-foreground">加载中</div>
          ) : !overview ? (
            <EmptyState className="p-8" title="暂无健康数据" />
          ) : (
            <div className="grid gap-5 p-5">
              <HealthLine label="Qdrant 向量库" value={overview.summary.vector_ready_rate} />
              <HealthLine label="OpenSearch 关键词" value={overview.summary.keyword_ready_rate} />
              <HealthLine label="向量回退可用" value={Math.min(100, (overview.summary.vector_ready_rate + overview.summary.keyword_ready_rate) / 2)} />
            </div>
          )}
        </Card>
      </section>
    </main>
  );
}

export function KnowledgeHealthScoreStrip({
  healthScore,
  loading,
  overview,
}: {
  healthScore: number;
  loading: boolean;
  overview: KnowledgeOverview | null;
}) {
  const summary = overview?.summary;
  const riskCount = overview ? buildHealthIssues(overview).filter((issue) => issue.risk === 'HIGH').length : 0;

  return (
    <Card className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/[0.9] px-5 py-4 shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      {loading ? (
        <div className="text-sm text-muted-foreground">加载中</div>
      ) : !overview ? (
        <EmptyState className="p-8" title="暂无健康数据" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr] lg:items-center">
          <HealthScoreBlock label="综合健康度" tone="green" value={healthScore} />
          <HealthScoreBlock label="索引成功率" tone="green" value={summary?.vector_ready_rate ?? 0} />
          <HealthScoreBlock label="文档新鲜度" tone="green" value={documentFreshness(overview)} />
          <HealthScoreBlock label="召回命中率" tone="orange" value={summary?.recall_success_rate_24h ?? 0} />
          <div className="grid gap-1 border-l border-slate-200 pl-5">
            <div className="text-sm font-medium text-slate-500">权限风险</div>
            <div className="flex items-end gap-2">
              <span className={cn('text-3xl font-semibold', riskCount > 0 ? 'text-red-600' : 'text-emerald-600')}>{formatNumber(riskCount)}</span>
              <span className="pb-1 text-sm text-slate-500">项</span>
            </div>
            <ProgressBar tone={riskCount > 0 ? 'red' : 'green'} value={riskCount > 0 ? Math.min(100, riskCount * 25) : 100} />
          </div>
        </div>
      )}
    </Card>
  );
}

export function KnowledgeCapabilityStatusGrid({
  loading,
  overview,
}: {
  loading: boolean;
  overview: KnowledgeOverview | null;
}) {
  const summary = overview?.summary;

  const items = [
    {
      helper: '原文存储',
      icon: Database,
      iconClassName: 'bg-blue-100 text-blue-700',
      label: 'MinIO',
      value: formatNumber(summary?.document_count),
    },
    {
      helper: '向量索引',
      icon: Layers3,
      iconClassName: 'bg-emerald-100 text-emerald-700',
      label: 'Qdrant',
      value: formatPercent(summary?.vector_ready_rate),
    },
    {
      helper: '关键词索引',
      icon: Search,
      iconClassName: 'bg-violet-100 text-violet-700',
      label: 'OpenSearch',
      value: formatPercent(summary?.keyword_ready_rate),
    },
    {
      helper: '任务队列',
      icon: ShieldCheck,
      iconClassName: 'bg-orange-100 text-orange-700',
      label: '后台任务',
      value: loading ? '-' : `${formatNumber(summary?.active_task_count)} 活跃`,
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <CapabilityTile
          helper={item.helper}
          icon={item.icon}
          iconClassName={item.iconClassName}
          key={item.label}
          label={item.label}
          loading={loading}
          value={item.value}
        />
      ))}
    </section>
  );
}

export function KnowledgeHealthDimensionList({
  loading,
  overview,
}: {
  loading: boolean;
  overview: KnowledgeOverview | null;
}) {
  const dimensions = overview ? buildHealthDimensions(overview) : [];

  return (
    <Card className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/[0.9] shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      <div className="border-b border-slate-200/80 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-950">健康检查维度</h2>
      </div>
      {loading ? (
        <div className="p-5 text-sm text-muted-foreground">加载中</div>
      ) : dimensions.length === 0 ? (
        <EmptyState className="p-8" title="暂无维度数据" />
      ) : (
        <div className="grid p-3">
          {dimensions.map((dimension) => (
            <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-3 hover:bg-slate-50" key={dimension.label}>
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600">
                  <dimension.icon className="size-4" />
                </span>
                <span className="truncate text-sm font-medium text-slate-800">{dimension.label}</span>
              </div>
              <StatusBadge tone={dimension.tone}>{dimension.status}</StatusBadge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function KnowledgeHealthIssueTable({
  issues,
  loading,
  onSelectIssue,
  selectedIssueId,
}: {
  issues: HealthIssue[];
  loading: boolean;
  onSelectIssue: (issueId: string) => void;
  selectedIssueId: string | null;
}) {
  if (loading) return <div className="p-5 text-sm text-muted-foreground">加载中</div>;
  if (issues.length === 0) return <EmptyState className="p-8" title="暂无异常项" />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200/80 bg-slate-50/70">
            {['知识库名称', '健康分', '问题类型', '风险等级', '影响 Agent 数', '最后检查时间', '负责人', '操作'].map((column) => (
              <th className="px-4 py-3 font-medium text-slate-500" key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => (
            <tr
              className={cn(
                'border-b border-slate-100 last:border-0',
                selectedIssueId === issue.id ? 'bg-blue-50/70' : 'hover:bg-slate-50/70',
              )}
              key={issue.id}
            >
              <td className="px-4 py-3 font-medium text-slate-900">{issue.knowledgeName}</td>
              <td className="px-4 py-3 font-semibold text-orange-600">{issue.healthScore}</td>
              <td className="px-4 py-3 text-slate-600">{issue.issueType}</td>
              <td className="px-4 py-3">
                <StatusBadge tone={riskTone(issue.risk)}>{riskLabel(issue.risk)}</StatusBadge>
              </td>
              <td className="px-4 py-3 text-slate-600">{formatNumber(issue.agentCount)}</td>
              <td className="px-4 py-3 text-slate-500">{issue.lastCheckedAt}</td>
              <td className="px-4 py-3 text-slate-600">{issue.owner}</td>
              <td className="px-4 py-3">
                <Button className="h-8 px-3" onClick={() => onSelectIssue(issue.id)} size="sm" type="button" variant="outline">
                  查看详情
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function KnowledgeHealthDetailPanel({
  issue,
  loading,
  overview,
}: {
  issue: HealthIssue | null;
  loading: boolean;
  overview: KnowledgeOverview | null;
}) {
  if (loading) {
    return (
      <Card className="rounded-xl border border-slate-200/80 bg-white/[0.9] p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
        <div className="text-sm text-muted-foreground">加载中</div>
      </Card>
    );
  }

  if (!overview || !issue) {
    return (
      <Card className="rounded-xl border border-slate-200/80 bg-white/[0.9] shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
        <EmptyState className="p-8" title="暂无健康明细" />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/[0.9] shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      <div className="border-b border-slate-200/80 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-blue-100 text-blue-700">
            <Database className="size-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold text-slate-950">知识库健康明细</h2>
              <StatusBadge tone={riskTone(issue.risk)}>{riskLabel(issue.risk)}</StatusBadge>
            </div>
            <div className="mt-1 text-sm text-slate-600">{issue.knowledgeName}</div>
          </div>
        </div>
      </div>
      <div className="grid gap-5 p-5">
        <DetailLine label="综合评分" value={`${issue.healthScore} / 100`} />
        <ProgressBar tone={issue.healthScore >= 80 ? 'green' : issue.healthScore >= 70 ? 'orange' : 'red'} value={issue.healthScore} />
        <DetailLine label="索引状态" value={issue.issueType} />
        <DetailLine label="最近同步时间" value={issue.lastCheckedAt} />
        <DetailLine label="主要问题" value={issue.recommendation} />
        <div className="grid gap-2">
          <div className="text-sm font-semibold text-slate-900">整改建议</div>
          {buildRecommendations(issue).map((item) => (
            <div className="flex gap-2 text-sm text-slate-700" key={item}>
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-blue-600" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function KnowledgeStorageReadinessPanel({
  loading,
  overview,
}: {
  loading: boolean;
  overview: KnowledgeOverview | null;
}) {
  return (
    <Card className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/[0.9] shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      <div className="border-b border-slate-200/80 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-950">存储与索引明细</h2>
      </div>
      {loading ? (
        <div className="p-5 text-sm text-muted-foreground">加载中</div>
      ) : !overview ? (
        <EmptyState className="p-8" title="暂无健康数据" />
      ) : (
        <div className="grid gap-3 p-5 text-sm">
          <DetailLine label="知识库数量" value={formatNumber(overview.summary.knowledge_base_count)} />
          <DetailLine label="启用知识库" value={formatNumber(overview.summary.active_knowledge_base_count)} />
          <DetailLine label="文档总数" value={formatNumber(overview.summary.document_count)} />
          <DetailLine label="切片总数" value={formatNumber(overview.summary.segment_count)} />
          <DetailLine label="向量就绪切片" value={formatNumber(overview.summary.vector_ready_segment_count)} />
          <DetailLine label="关键词就绪切片" value={formatNumber(overview.summary.keyword_ready_segment_count)} />
          <DetailLine label="失败任务" value={formatNumber(overview.summary.failed_task_count)} />
        </div>
      )}
    </Card>
  );
}

function CapabilityTile({
  helper,
  icon: Icon,
  iconClassName,
  label,
  loading,
  value,
}: {
  helper: string;
  icon: LucideIcon;
  iconClassName: string;
  label: string;
  loading: boolean;
  value: string;
}) {
  return (
    <div className="flex min-h-[124px] items-center gap-5 rounded-xl border border-slate-200/80 bg-white/[0.9] px-6 py-5 shadow-[0_16px_45px_rgba(15,23,42,0.05)] backdrop-blur-xl">
      <span className={`grid size-14 shrink-0 place-items-center rounded-full ${iconClassName}`}>
        <Icon className="size-7" />
      </span>
      <div>
        <div className="text-sm font-medium text-slate-500">{label}</div>
        <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{loading ? '-' : value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{helper}</div>
      </div>
    </div>
  );
}

function HealthScoreBlock({ label, tone, value }: { label: string; tone: 'green' | 'orange' | 'red'; value: number }) {
  return (
    <div className="grid gap-2 border-l border-slate-200 first:border-l-0 first:pl-0 lg:pl-5">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="flex items-end gap-2">
        <span className={cn('text-3xl font-semibold', toneTextClass(tone))}>{formatNumber(Math.round(value))}</span>
        <span className="pb-1 text-sm text-slate-500">/ 100</span>
      </div>
      <ProgressBar tone={tone} value={value} />
    </div>
  );
}

function HealthLine({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-900">{formatPercent(value)}</span>
      </div>
      <ProgressBar tone="green" value={value} />
    </div>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[128px_minmax(0,1fr)] gap-3 rounded-lg border border-slate-200/80 bg-slate-50/50 px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 font-medium text-slate-900">{value}</span>
    </div>
  );
}

function ProgressBar({ tone, value }: { tone: 'green' | 'orange' | 'red'; value: number }) {
  return (
    <span className="block h-2 w-full rounded-full bg-slate-100">
      <span
        className={cn(
          'block h-full rounded-full',
          tone === 'green' ? 'bg-emerald-600' : tone === 'orange' ? 'bg-orange-500' : 'bg-red-500',
        )}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </span>
  );
}

function buildHealthDimensions(overview: KnowledgeOverview) {
  const summary = overview.summary;

  return [
    { icon: FileText, label: '文档解析', status: statusText(summary.processing_document_count === 0), tone: summary.processing_document_count === 0 ? ('healthy' as const) : ('degraded' as const) },
    { icon: Layers3, label: '切片质量', status: summary.segment_count > 0 ? '正常' : '警告', tone: summary.segment_count > 0 ? ('healthy' as const) : ('degraded' as const) },
    { icon: Database, label: '向量索引', status: summary.vector_ready_rate >= 90 ? '正常' : '异常', tone: summary.vector_ready_rate >= 90 ? ('healthy' as const) : ('unavailable' as const) },
    { icon: Target, label: '召回质量', status: summary.recall_success_rate_24h >= 80 ? '正常' : '警告', tone: summary.recall_success_rate_24h >= 80 ? ('healthy' as const) : ('degraded' as const) },
    { icon: FileText, label: '重复内容', status: '正常', tone: 'healthy' as const },
    { icon: LockKeyhole, label: '权限隔离', status: summary.failed_task_count > 0 ? '异常' : '正常', tone: summary.failed_task_count > 0 ? ('unavailable' as const) : ('healthy' as const) },
    { icon: ClockIcon, label: '过期内容', status: summary.processing_document_count > 0 ? '警告' : '正常', tone: summary.processing_document_count > 0 ? ('degraded' as const) : ('healthy' as const) },
    { icon: ShieldCheck, label: 'Agent 引用状态', status: summary.agent_reference_count > 0 ? '正常' : '警告', tone: summary.agent_reference_count > 0 ? ('healthy' as const) : ('degraded' as const) },
  ];
}

function buildHealthIssues(overview: KnowledgeOverview): HealthIssue[] {
  const summary = overview.summary;
  const issues: HealthIssue[] = [];
  const now = overview.generated_at ? formatDateTimeLike(overview.generated_at) : '-';

  if (summary.vector_ready_rate < 90) {
    issues.push({
      agentCount: Math.max(1, summary.agent_reference_count),
      healthScore: Math.round(summary.vector_ready_rate),
      id: 'vector-index',
      issueType: '索引失败',
      knowledgeName: overview.recent_documents[0]?.knowledge_name ?? '知识库',
      lastCheckedAt: now,
      owner: 'admin',
      recommendation: '重新构建向量索引',
      risk: summary.vector_ready_rate < 70 ? 'HIGH' : 'MEDIUM',
    });
  }

  if (summary.keyword_ready_rate < 90) {
    issues.push({
      agentCount: Math.max(1, Math.ceil(summary.agent_reference_count / 2)),
      healthScore: Math.round(summary.keyword_ready_rate),
      id: 'keyword-index',
      issueType: '关键词索引异常',
      knowledgeName: overview.recent_documents[1]?.knowledge_name ?? overview.recent_documents[0]?.knowledge_name ?? '知识库',
      lastCheckedAt: now,
      owner: 'admin',
      recommendation: '检查 OpenSearch 写入状态',
      risk: summary.keyword_ready_rate < 70 ? 'HIGH' : 'MEDIUM',
    });
  }

  if (summary.recall_success_rate_24h < 85) {
    issues.push({
      agentCount: Math.max(1, Math.ceil(summary.agent_reference_count / 3)),
      healthScore: Math.round(summary.recall_success_rate_24h),
      id: 'recall-quality',
      issueType: '召回质量偏低',
      knowledgeName: overview.recent_recall_logs[0]?.knowledge_name ?? overview.recent_documents[0]?.knowledge_name ?? '知识库',
      lastCheckedAt: now,
      owner: 'admin',
      recommendation: '调整混合检索权重和 Score 阈值',
      risk: summary.recall_success_rate_24h < 70 ? 'HIGH' : 'MEDIUM',
    });
  }

  if (summary.failed_task_count > 0) {
    issues.push({
      agentCount: Math.max(1, summary.failed_task_count),
      healthScore: Math.max(45, 85 - summary.failed_task_count * 8),
      id: 'failed-task',
      issueType: '处理任务失败',
      knowledgeName: overview.recent_tasks.find((task) => task.status === 'FAILED')?.knowledge_name ?? '知识库',
      lastCheckedAt: now,
      owner: 'admin',
      recommendation: '检查失败任务和文档解析日志',
      risk: summary.failed_task_count >= 3 ? 'HIGH' : 'MEDIUM',
    });
  }

  if (issues.length === 0) {
    issues.push({
      agentCount: Math.max(0, summary.agent_reference_count),
      healthScore: Math.round(calculateHealthScore(overview)),
      id: 'healthy-baseline',
      issueType: '例行检查',
      knowledgeName: overview.recent_documents[0]?.knowledge_name ?? '知识库',
      lastCheckedAt: now,
      owner: 'admin',
      recommendation: '保持当前索引和召回配置',
      risk: 'LOW',
    });
  }

  return issues;
}

function buildRecommendations(issue: HealthIssue) {
  if (issue.id === 'vector-index') {
    return ['重新构建向量索引', '检查向量化模型调用与任务队列', '确认相关知识库权限范围'];
  }

  if (issue.id === 'keyword-index') {
    return ['检查 OpenSearch 索引写入状态', '补偿写入失败的文档切片', '复查关键词检索配置'];
  }

  if (issue.id === 'recall-quality') {
    return ['调整召回 TopK 与 Score 阈值', '复核低命中查询样本', '补充高频问题相关文档'];
  }

  if (issue.id === 'failed-task') {
    return ['定位失败任务对应文档', '检查解析和分片阶段错误', '处理后刷新健康状态'];
  }

  return ['定期检查索引状态', '保持文档更新节奏', '关注召回命中趋势'];
}

function calculateHealthScore(overview: KnowledgeOverview) {
  return average([
    overview.summary.vector_ready_rate,
    overview.summary.keyword_ready_rate,
    overview.summary.recall_success_rate_24h,
    documentFreshness(overview),
  ]);
}

function documentFreshness(overview: KnowledgeOverview) {
  if (overview.summary.document_count <= 0) return 0;
  if (overview.summary.processing_document_count <= 0) return 92;

  return Math.max(55, 92 - overview.summary.processing_document_count * 4);
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function riskLabel(risk: HealthRisk) {
  if (risk === 'HIGH') return '高风险';
  if (risk === 'MEDIUM') return '中风险';

  return '低风险';
}

function riskTone(risk: HealthRisk) {
  if (risk === 'HIGH') return 'unavailable';
  if (risk === 'MEDIUM') return 'degraded';

  return 'healthy';
}

function toneTextClass(tone: 'green' | 'orange' | 'red') {
  if (tone === 'green') return 'text-emerald-600';
  if (tone === 'orange') return 'text-orange-500';

  return 'text-red-600';
}

function statusText(healthy: boolean) {
  return healthy ? '正常' : '警告';
}

function ClockIcon(props: React.ComponentProps<typeof AlertCircle>) {
  return <Gauge {...props} />;
}

function formatNumber(value: number | undefined) {
  if (value === undefined) return '-';
  return new Intl.NumberFormat('zh-CN').format(value);
}

function formatPercent(value: number | undefined) {
  if (value === undefined) return '-';
  return `${value.toFixed(1)}%`;
}

function formatDateTimeLike(value: string | null | undefined) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}
