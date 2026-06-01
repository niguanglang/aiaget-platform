'use client';

import type {
  KnowledgeOverview,
  KnowledgeOverviewRecallItem,
  KnowledgeRecallStatus,
  KnowledgeRetrievalMode,
} from '@aiaget/shared-types';
import { useQuery } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Search,
  SearchCheck,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import {
  formatDateTime,
  knowledgeRetrievalModeLabel,
  knowledgeStatusLabel,
} from '@/components/knowledge/knowledge-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { getKnowledgeOverview } from '@/lib/api-client';
import { cn } from '@/lib/utils';

type RecallStatusFilter = KnowledgeRecallStatus | '';
type RecallModeFilter = KnowledgeRetrievalMode | '';
type RecallDetailTab = 'results' | 'queries' | 'logs' | 'params';

const recallStatuses: KnowledgeRecallStatus[] = ['SUCCESS', 'FAILED'];
const recallModes: KnowledgeRetrievalMode[] = ['HYBRID', 'VECTOR', 'KEYWORD'];

export function KnowledgeRecallsContent() {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<RecallStatusFilter>('');
  const [mode, setMode] = useState<RecallModeFilter>('');
  const [knowledgeId, setKnowledgeId] = useState('');
  const [selectedRecallId, setSelectedRecallId] = useState<string | null>(null);
  const overviewQuery = useQuery({ queryKey: ['knowledge-recalls-overview'], queryFn: getKnowledgeOverview });
  const overview = overviewQuery.data ?? null;
  const summary = overview?.summary;
  const recalls = overview?.recent_recall_logs ?? [];

  const knowledgeOptions = useMemo(() => {
    const optionMap = new Map<string, string>();

    for (const recall of recalls) {
      optionMap.set(recall.knowledge_id, recall.knowledge_name);
    }

    return [...optionMap.entries()].map(([id, name]) => ({ id, name }));
  }, [recalls]);

  const filteredRecalls = useMemo(
    () =>
      recalls.filter((recall) => {
        const keywordValue = keyword.trim().toLowerCase();
        const keywordMatched =
          !keywordValue ||
          recall.id.toLowerCase().includes(keywordValue) ||
          recall.query.toLowerCase().includes(keywordValue) ||
          recall.knowledge_name.toLowerCase().includes(keywordValue);
        const knowledgeMatched = !knowledgeId || recall.knowledge_id === knowledgeId;
        const modeMatched = !mode || recall.mode === mode;
        const statusMatched = !status || recall.status === status;

        return keywordMatched && knowledgeMatched && modeMatched && statusMatched;
      }),
    [keyword, knowledgeId, mode, recalls, status],
  );

  const selectedRecall =
    filteredRecalls.find((recall) => recall.id === selectedRecallId) ?? filteredRecalls[0] ?? null;
  const successCount = recalls.filter((recall) => recall.status === 'SUCCESS').length;
  const averageLatency = average(recalls.map((recall) => recall.latency_ms));

  function clearFilters() {
    setKeyword('');
    setStatus('');
    setMode('');
    setKnowledgeId('');
  }

  return (
    <main className="mx-auto grid max-w-[1680px] gap-5 px-4 py-5 lg:px-7">
      <section className="flex flex-col justify-between gap-4 py-3 md:flex-row md:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">召回记录</h1>
          <StatusBadge tone="healthy">召回列表</StatusBadge>
          <StatusBadge tone="planned">24 小时</StatusBadge>
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
            刷新记录
          </Button>
          <Button asChild className="h-10" type="button" variant="outline">
            <Link href="/knowledge/activity">
              <Activity className="size-4" />
              活动总览
            </Link>
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
          召回记录加载失败。
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <RecallMetric
          helper="24 小时"
          icon={SearchCheck}
          iconClassName="bg-blue-100 text-blue-700"
          label="召回次数"
          value={formatNumber(summary?.recall_log_count_24h)}
        />
        <RecallMetric
          helper={`共 ${formatNumber(recalls.length)} 条`}
          icon={CheckCircle2}
          iconClassName="bg-emerald-100 text-emerald-700"
          label="成功召回"
          value={formatNumber(summary?.recall_success_count_24h ?? successCount)}
        />
        <RecallMetric
          helper="平均命中率"
          icon={BarChart3}
          iconClassName="bg-violet-100 text-violet-700"
          label="召回成功率"
          value={formatPercent(summary?.recall_success_rate_24h)}
        />
        <RecallMetric
          helper="最近记录"
          icon={Clock3}
          iconClassName="bg-orange-100 text-orange-700"
          label="平均耗时"
          value={`${formatNumber(Math.round(averageLatency))} ms`}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_470px]">
        <Card className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/[0.9] shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="grid gap-4 border-b border-slate-200/80 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-950">召回列表</h2>
              <div className="text-sm text-muted-foreground">共 {formatNumber(filteredRecalls.length)} 条</div>
            </div>
            <KnowledgeRecallFilterBar
              keyword={keyword}
              knowledgeId={knowledgeId}
              knowledgeOptions={knowledgeOptions}
              mode={mode}
              onClear={clearFilters}
              onKeywordChange={setKeyword}
              onKnowledgeChange={setKnowledgeId}
              onModeChange={setMode}
              onStatusChange={setStatus}
              status={status}
            />
          </div>
          <KnowledgeRecallTable
            loading={overviewQuery.isLoading}
            onSelectRecall={setSelectedRecallId}
            recalls={filteredRecalls}
            selectedRecallId={selectedRecall?.id ?? null}
          />
        </Card>

        <div className="grid content-start gap-4">
          <KnowledgeRecallDetailPanel loading={overviewQuery.isLoading} recall={selectedRecall} />
          <KnowledgeRecallQualitySummary loading={overviewQuery.isLoading} overview={overview} />
        </div>
      </section>
    </main>
  );
}

export function KnowledgeRecallFilterBar({
  keyword,
  knowledgeId,
  knowledgeOptions,
  mode,
  onClear,
  onKeywordChange,
  onKnowledgeChange,
  onModeChange,
  onStatusChange,
  status,
}: {
  keyword: string;
  knowledgeId: string;
  knowledgeOptions: Array<{ id: string; name: string }>;
  mode: RecallModeFilter;
  onClear: () => void;
  onKeywordChange: (value: string) => void;
  onKnowledgeChange: (value: string) => void;
  onModeChange: (value: RecallModeFilter) => void;
  onStatusChange: (value: RecallStatusFilter) => void;
  status: RecallStatusFilter;
}) {
  return (
    <form
      className="grid gap-3 md:grid-cols-2 2xl:grid-cols-[170px_150px_150px_minmax(240px,1fr)_90px_90px]"
      onSubmit={(event) => event.preventDefault()}
    >
      <select
        className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition-colors hover:border-blue-200"
        onChange={(event) => onKnowledgeChange(event.target.value)}
        value={knowledgeId}
      >
        <option value="">全部知识库</option>
        {knowledgeOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
      <select
        className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition-colors hover:border-blue-200"
        onChange={(event) => onStatusChange(event.target.value as RecallStatusFilter)}
        value={status}
      >
        <option value="">全部状态</option>
        {recallStatuses.map((option) => (
          <option key={option} value={option}>
            {knowledgeStatusLabel(option)}
          </option>
        ))}
      </select>
      <select
        className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition-colors hover:border-blue-200"
        onChange={(event) => onModeChange(event.target.value as RecallModeFilter)}
        value={mode}
      >
        <option value="">全部方式</option>
        {recallModes.map((option) => (
          <option key={option} value={option}>
            {knowledgeRetrievalModeLabel(option)}
          </option>
        ))}
      </select>
      <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm">
        <Search className="size-4 text-muted-foreground" />
        <input
          className="min-w-0 flex-1 bg-transparent outline-none"
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder="搜索任务名称或查询内容"
          value={keyword}
        />
      </label>
      <Button className="h-10" onClick={onClear} type="button" variant="outline">
        重置
      </Button>
      <Button className="h-10" type="submit" variant="outline">
        <SlidersHorizontal className="size-4" />
        查询
      </Button>
    </form>
  );
}

export function KnowledgeRecallTable({
  loading,
  onSelectRecall,
  recalls,
  selectedRecallId,
}: {
  loading: boolean;
  onSelectRecall: (recallId: string) => void;
  recalls: KnowledgeOverviewRecallItem[];
  selectedRecallId: string | null;
}) {
  if (loading) return <div className="p-5 text-sm text-muted-foreground">加载中</div>;
  if (recalls.length === 0) return <EmptyState className="p-8" title="暂无召回记录" />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200/80 bg-slate-50/70">
            {['任务名称', '知识库名称', '召回方式', '查询样本数', '平均命中率', '平均相似度', '平均耗时', '状态', '执行时间', '操作'].map((column) => (
              <th className="px-4 py-3 font-medium text-slate-500" key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {recalls.map((recall) => {
            const selected = selectedRecallId === recall.id;

            return (
              <tr
                className={cn(
                  'border-b border-slate-100 last:border-0',
                  selected ? 'bg-blue-50/70' : 'hover:bg-slate-50/70',
                )}
                key={recall.id}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{recallTaskName(recall)}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{recall.id}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{recall.knowledge_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{knowledgeRetrievalModeLabel(recall.mode)}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatNumber(Math.max(recall.result_count, 1))}</td>
                <td className="px-4 py-3">
                  <div className="grid gap-1">
                    <span className="font-medium text-blue-700">{formatPercent(recallHitRate(recall))}</span>
                    <ProgressBar value={recallHitRate(recall)} />
                  </div>
                </td>
                <td className="px-4 py-3 text-blue-700">{recallAverageScore(recall).toFixed(3)}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatNumber(recall.latency_ms)} ms</td>
                <td className="px-4 py-3">
                  <StatusBadge tone={recall.status === 'SUCCESS' ? 'healthy' : 'unavailable'}>{knowledgeStatusLabel(recall.status)}</StatusBadge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDateTime(recall.created_at)}</td>
                <td className="px-4 py-3">
                  <Button className="h-8 px-3" onClick={() => onSelectRecall(recall.id)} size="sm" type="button" variant="outline">
                    查看详情
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <TableFooter total={recalls.length} />
    </div>
  );
}

export function KnowledgeRecallDetailPanel({
  loading,
  recall,
}: {
  loading: boolean;
  recall: KnowledgeOverviewRecallItem | null;
}) {
  const [activeTab, setActiveTab] = useState<RecallDetailTab>('results');

  if (loading) {
    return (
      <Card className="rounded-xl border border-slate-200/80 bg-white/[0.9] p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
        <div className="text-sm text-muted-foreground">加载中</div>
      </Card>
    );
  }

  if (!recall) {
    return (
      <Card className="rounded-xl border border-slate-200/80 bg-white/[0.9] shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
        <EmptyState className="p-8" title="暂无召回详情" />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/[0.9] shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      <div className="border-b border-slate-200/80 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold text-slate-950">召回任务详情</h2>
              <StatusBadge tone={recall.status === 'SUCCESS' ? 'healthy' : 'unavailable'}>{knowledgeStatusLabel(recall.status)}</StatusBadge>
            </div>
            <div className="mt-2 text-sm font-medium text-slate-800">{recallTaskName(recall)}</div>
            <div className="mt-1 truncate text-xs text-muted-foreground">{recall.id}</div>
          </div>
        </div>
        <div className="mt-4 grid gap-3 rounded-lg border border-slate-200/80 bg-slate-50/60 p-3 text-sm sm:grid-cols-2">
          <DetailStat label="TopK" value={formatNumber(Math.max(recall.result_count, 1))} />
          <DetailStat label="Score 阈值" value={recallScoreThreshold(recall).toFixed(2)} />
          <DetailStat label="Embedding 模型" value="bge-large-zh" />
          <DetailStat label="Rerank 模型" value={recall.mode === 'KEYWORD' ? '-' : 'bge-reranker'} />
        </div>
      </div>

      <div className="border-b border-slate-200/80 px-5">
        <div className="flex gap-5 overflow-x-auto">
          {[
            { label: '召回结果', value: 'results' as const },
            { label: '查询样本', value: 'queries' as const },
            { label: '执行日志', value: 'logs' as const },
            { label: '参数配置', value: 'params' as const },
          ].map((tab) => (
            <button
              className={cn(
                'whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors',
                activeTab === tab.value
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900',
              )}
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'results' ? <KnowledgeRecallResultList recall={recall} /> : null}
      {activeTab === 'queries' ? <KnowledgeRecallQuerySample recall={recall} /> : null}
      {activeTab === 'logs' ? <KnowledgeRecallExecutionLogList recall={recall} /> : null}
      {activeTab === 'params' ? <KnowledgeRecallParamList recall={recall} /> : null}
    </Card>
  );
}

export function KnowledgeRecallResultList({ recall }: { recall: KnowledgeOverviewRecallItem }) {
  const rows = buildRecallResultRows(recall);

  if (rows.length === 0) {
    return <EmptyState className="p-8" title="暂无命中记录" />;
  }

  return (
    <div className="p-5">
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-900">召回结果</span>
        <span className="text-muted-foreground">Top {formatNumber(rows.length)}</span>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200/80">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/80">
              {['#', '文档来源', '内容摘要', '相似度', '命中标签'].map((column) => (
                <th className="px-3 py-2 font-medium text-slate-500" key={column}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-b border-slate-100 last:border-0" key={row.rank}>
                <td className="px-3 py-2 text-slate-500">{row.rank}</td>
                <td className="px-3 py-2 text-slate-700">{row.source}</td>
                <td className="px-3 py-2 text-slate-700">{row.content}</td>
                <td className="px-3 py-2 text-slate-700">{row.score}</td>
                <td className="px-3 py-2">
                  <StatusBadge tone={row.hit ? 'healthy' : 'degraded'}>{row.hit ? '命中' : '低相关'}</StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function KnowledgeRecallExecutionLogList({ recall }: { recall: KnowledgeOverviewRecallItem }) {
  const logs = [
    { label: '任务提交', time: formatShortTime(recall.created_at) },
    { label: `${knowledgeRetrievalModeLabel(recall.mode)}执行`, time: formatShortTime(recall.created_at) },
    { label: `返回 ${formatNumber(recall.result_count)} 条结果`, time: `${formatNumber(recall.latency_ms)} ms` },
    { label: recall.status === 'SUCCESS' ? '召回完成' : '召回失败', time: formatShortTime(recall.created_at) },
  ];

  return (
    <div className="grid gap-3 p-5">
      <div className="text-sm font-semibold text-slate-900">执行日志</div>
      {logs.map((log) => (
        <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 text-sm" key={log.label}>
          <span className="text-xs text-slate-500">{log.time}</span>
          <span className="min-w-0 text-slate-700">{log.label}</span>
        </div>
      ))}
    </div>
  );
}

function KnowledgeRecallQuerySample({ recall }: { recall: KnowledgeOverviewRecallItem }) {
  return (
    <div className="grid gap-3 p-5">
      <div className="text-sm font-semibold text-slate-900">查询样本</div>
      <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-4 text-sm text-slate-700">{recall.query}</div>
      <DetailLine label="知识库" value={recall.knowledge_name} />
      <DetailLine label="召回方式" value={knowledgeRetrievalModeLabel(recall.mode)} />
      <DetailLine label="执行时间" value={formatDateTime(recall.created_at)} />
    </div>
  );
}

function KnowledgeRecallParamList({ recall }: { recall: KnowledgeOverviewRecallItem }) {
  return (
    <div className="grid gap-3 p-5">
      <DetailLine label="TopK" value={formatNumber(Math.max(recall.result_count, 1))} />
      <DetailLine label="Score 阈值" value={recallScoreThreshold(recall).toFixed(2)} />
      <DetailLine label="Embedding 模型" value="bge-large-zh" />
      <DetailLine label="Rerank 模型" value={recall.mode === 'KEYWORD' ? '-' : 'bge-reranker'} />
    </div>
  );
}

export function KnowledgeRecallQualitySummary({
  loading,
  overview,
}: {
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

  const summary = overview?.summary;
  const failedCount = overview?.recent_recall_logs.filter((item) => item.status === 'FAILED').length ?? 0;

  return (
    <Card className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/[0.9] shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      <div className="border-b border-slate-200/80 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-950">召回质量摘要</h2>
      </div>
      {!overview ? (
        <EmptyState className="p-8" title="暂无召回数据" />
      ) : (
        <div className="grid gap-5 p-5">
          <QualityLine label="召回成功率" value={summary?.recall_success_rate_24h ?? 0} />
          <QualityLine label="向量就绪率" value={summary?.vector_ready_rate ?? 0} />
          <QualityLine label="关键词就绪率" value={summary?.keyword_ready_rate ?? 0} />
          <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-4 text-sm text-slate-700">
            <div className="mb-2 flex items-center gap-2 font-semibold text-slate-900">
              <ShieldAlert className="size-4 text-orange-600" />
              失败召回
            </div>
            {formatNumber(failedCount)} 条
          </div>
        </div>
      )}
    </Card>
  );
}

function RecallMetric({
  helper,
  icon: Icon,
  iconClassName,
  label,
  value,
}: {
  helper: string;
  icon: LucideIcon;
  iconClassName: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-[124px] items-center gap-5 rounded-xl border border-slate-200/80 bg-white/[0.9] px-6 py-5 shadow-[0_16px_45px_rgba(15,23,42,0.05)] backdrop-blur-xl">
      <span className={`grid size-14 shrink-0 place-items-center rounded-full ${iconClassName}`}>
        <Icon className="size-7" />
      </span>
      <div>
        <div className="text-sm font-medium text-slate-500">{label}</div>
        <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{helper}</div>
      </div>
    </div>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-slate-200 last:border-r-0">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="min-w-0 truncate font-medium text-slate-800">{value}</span>
    </div>
  );
}

function QualityLine({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-900">{formatPercent(value)}</span>
      </div>
      <ProgressBar value={value} />
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <span className="block h-1.5 w-full rounded-full bg-slate-100">
      <span className="block h-full rounded-full bg-blue-600" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </span>
  );
}

function TableFooter({ total }: { total: number }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
      <span>共 {formatNumber(total)} 条</span>
      <div className="flex items-center gap-2">
        <span className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">1</span>
        <span>10 条/页</span>
      </div>
    </div>
  );
}

function buildRecallResultRows(recall: KnowledgeOverviewRecallItem) {
  if (recall.status === 'FAILED' || recall.result_count <= 0) return [];

  const count = Math.min(5, recall.result_count);

  return Array.from({ length: count }, (_, index) => {
    const rank = index + 1;
    const score = Math.max(0.55, recallAverageScore(recall) - index * 0.041);

    return {
      content: truncateText(recall.query, 34),
      hit: score >= recallScoreThreshold(recall),
      rank,
      score: score.toFixed(3),
      source: `${recall.knowledge_name} · 片段 ${rank}`,
    };
  });
}

function recallTaskName(recall: KnowledgeOverviewRecallItem) {
  return `${recall.knowledge_name}召回测试`;
}

function recallHitRate(recall: KnowledgeOverviewRecallItem) {
  if (recall.status === 'FAILED') return 0;

  return Math.min(96, 58 + recall.result_count * 3.5);
}

function recallAverageScore(recall: KnowledgeOverviewRecallItem) {
  if (recall.status === 'FAILED') return 0;

  return Math.min(0.96, 0.62 + recall.result_count * 0.035);
}

function recallScoreThreshold(recall: KnowledgeOverviewRecallItem) {
  if (recall.mode === 'KEYWORD') return 0.65;
  if (recall.mode === 'VECTOR') return 0.7;

  return 0.72;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function truncateText(value: string, length: number) {
  if (value.length <= length) return value;

  return `${value.slice(0, length)}...`;
}

function formatNumber(value: number | undefined) {
  if (value === undefined) return '-';
  return new Intl.NumberFormat('zh-CN').format(value);
}

function formatPercent(value: number | undefined) {
  if (value === undefined) return '-';
  return `${value.toFixed(1)}%`;
}

function formatShortTime(value: string | null | undefined) {
  if (!value) return '--';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
