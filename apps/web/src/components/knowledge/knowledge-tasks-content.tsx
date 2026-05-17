'use client';

import type { KnowledgeOverviewTaskItem, KnowledgeTaskStatus, KnowledgeTaskType } from '@aiaget/shared-types';
import { useQuery } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Database,
  FileClock,
  Filter,
  Layers3,
  RefreshCw,
  Search,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import {
  formatDateTime,
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

type TaskStatusFilter = KnowledgeTaskStatus | '';
type TaskTypeFilter = KnowledgeTaskType | '';
type TaskDetailTab = 'detail' | 'logs' | 'documents';
type TaskStageState = 'done' | 'running' | 'waiting' | 'failed';

const taskStatuses: KnowledgeTaskStatus[] = ['PENDING', 'RUNNING', 'SUCCESS', 'FAILED'];
const taskTypes: KnowledgeTaskType[] = ['PROCESS', 'PARSE', 'SEGMENT', 'EMBED', 'INDEX', 'REBUILD'];

export function KnowledgeTasksContent() {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<TaskStatusFilter>('');
  const [taskType, setTaskType] = useState<TaskTypeFilter>('');
  const [knowledgeId, setKnowledgeId] = useState('');
  const [createdDate, setCreatedDate] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const overviewQuery = useQuery({ queryKey: ['knowledge-tasks-overview'], queryFn: getKnowledgeOverview });
  const summary = overviewQuery.data?.summary;
  const tasks = overviewQuery.data?.recent_tasks ?? [];

  const knowledgeOptions = useMemo(() => {
    const optionMap = new Map<string, string>();

    for (const task of tasks) {
      optionMap.set(task.knowledge_id, task.knowledge_name);
    }

    return [...optionMap.entries()].map(([id, name]) => ({ id, name }));
  }, [tasks]);

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const keywordValue = keyword.trim().toLowerCase();
        const keywordMatched =
          !keywordValue ||
          task.id.toLowerCase().includes(keywordValue) ||
          task.knowledge_name.toLowerCase().includes(keywordValue) ||
          knowledgeTaskTypeLabel(task.task_type).toLowerCase().includes(keywordValue);
        const statusMatched = !status || task.status === status;
        const typeMatched = !taskType || task.task_type === taskType;
        const knowledgeMatched = !knowledgeId || task.knowledge_id === knowledgeId;
        const dateMatched = !createdDate || dateKey(taskCreatedAt(task)) === createdDate;

        return keywordMatched && statusMatched && typeMatched && knowledgeMatched && dateMatched;
      }),
    [createdDate, keyword, knowledgeId, status, taskType, tasks],
  );

  const selectedTask =
    filteredTasks.find((task) => task.id === selectedTaskId) ?? filteredTasks[0] ?? null;

  const statusCounts = useMemo(
    () => ({
      all: tasks.length,
      PENDING: tasks.filter((task) => task.status === 'PENDING').length,
      RUNNING: tasks.filter((task) => task.status === 'RUNNING').length,
      SUCCESS: tasks.filter((task) => task.status === 'SUCCESS').length,
      FAILED: tasks.filter((task) => task.status === 'FAILED').length,
    }),
    [tasks],
  );

  const successRate = ratioPercent(statusCounts.SUCCESS, tasks.length);

  function clearFilters() {
    setKeyword('');
    setStatus('');
    setTaskType('');
    setKnowledgeId('');
    setCreatedDate('');
  }

  return (
    <main className="mx-auto grid max-w-[1680px] gap-4 px-4 py-5 lg:px-7">
      <section className="flex flex-col justify-between gap-4 py-3 xl:flex-row xl:items-center">
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">文档处理任务</h1>
            <StatusBadge tone="planned">任务列表</StatusBadge>
            <StatusBadge tone="mock">处理队列</StatusBadge>
          </div>
          <KnowledgeTaskStatusTabs counts={statusCounts} onChange={setStatus} value={status} />
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
            刷新任务
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
          文档处理任务加载失败。
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-5">
        <KnowledgeTaskMetricTile
          helper="等待或运行"
          icon={FileClock}
          iconClassName="bg-blue-100 text-blue-700"
          label="活跃任务"
          value={formatNumber(summary?.active_task_count)}
        />
        <KnowledgeTaskMetricTile
          helper="需要处理"
          icon={ShieldAlert}
          iconClassName="bg-red-100 text-red-700"
          label="失败任务"
          value={formatNumber(summary?.failed_task_count)}
        />
        <KnowledgeTaskMetricTile
          helper="当前处理中"
          icon={Layers3}
          iconClassName="bg-violet-100 text-violet-700"
          label="处理中项"
          value={formatNumber(summary?.processing_document_count)}
        />
        <KnowledgeTaskMetricTile
          helper="等待执行"
          icon={Clock3}
          iconClassName="bg-orange-100 text-orange-700"
          label="队列等待"
          value={formatNumber(statusCounts.PENDING)}
        />
        <KnowledgeTaskMetricTile
          helper={`成功 ${formatNumber(statusCounts.SUCCESS)} / ${formatNumber(tasks.length)}`}
          icon={CheckCircle2}
          iconClassName="bg-emerald-100 text-emerald-700"
          label="成功率"
          value={formatPercent(successRate)}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_430px]">
        <Card className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/[0.9] shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="border-b border-slate-200/80 px-5 py-4">
            <div className="grid gap-4">
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                <h2 className="text-lg font-semibold text-slate-950">任务列表</h2>
                <div className="text-sm text-muted-foreground">共 {formatNumber(filteredTasks.length)} 条</div>
              </div>
              <form
                className="grid gap-3 md:grid-cols-2 2xl:grid-cols-[170px_150px_150px_170px_minmax(230px,1fr)_90px_90px]"
                onSubmit={(event) => event.preventDefault()}
              >
                <select
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition-colors hover:border-blue-200"
                  onChange={(event) => setKnowledgeId(event.target.value)}
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
                  onChange={(event) => setTaskType(event.target.value as TaskTypeFilter)}
                  value={taskType}
                >
                  <option value="">全部类型</option>
                  {taskTypes.map((option) => (
                    <option key={option} value={option}>
                      {knowledgeTaskTypeLabel(option)}
                    </option>
                  ))}
                </select>
                <select
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition-colors hover:border-blue-200"
                  onChange={(event) => setStatus(event.target.value as TaskStatusFilter)}
                  value={status}
                >
                  <option value="">全部状态</option>
                  {taskStatuses.map((option) => (
                    <option key={option} value={option}>
                      {knowledgeStatusLabel(option)}
                    </option>
                  ))}
                </select>
                <input
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition-colors hover:border-blue-200"
                  onChange={(event) => setCreatedDate(event.target.value)}
                  type="date"
                  value={createdDate}
                />
                <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm">
                  <Search className="size-4 text-muted-foreground" />
                  <input
                    className="min-w-0 flex-1 bg-transparent outline-none"
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="搜索任务名称或ID"
                    value={keyword}
                  />
                </label>
                <Button className="h-10" onClick={clearFilters} type="button" variant="outline">
                  重置
                </Button>
                <Button className="h-10" type="submit" variant="outline">
                  <Filter className="size-4" />
                  筛选
                </Button>
              </form>
            </div>
          </div>
          <KnowledgeTaskListTable
            loading={overviewQuery.isLoading}
            onSelectTask={setSelectedTaskId}
            selectedTaskId={selectedTask?.id ?? null}
            tasks={filteredTasks}
          />
        </Card>

        <KnowledgeTaskDetailPanel loading={overviewQuery.isLoading} task={selectedTask} />
      </section>
    </main>
  );
}

export function KnowledgeTaskStatusTabs({
  counts,
  onChange,
  value,
}: {
  counts: Record<'all' | KnowledgeTaskStatus, number>;
  onChange: (value: TaskStatusFilter) => void;
  value: TaskStatusFilter;
}) {
  const options: Array<{ label: string; tone: string; value: TaskStatusFilter; count: number }> = [
    { label: '全部', tone: 'text-slate-600', value: '', count: counts.all },
    { label: '进行中', tone: 'text-blue-600', value: 'RUNNING', count: counts.RUNNING },
    { label: '成功', tone: 'text-emerald-600', value: 'SUCCESS', count: counts.SUCCESS },
    { label: '失败', tone: 'text-red-600', value: 'FAILED', count: counts.FAILED },
    { label: '等待中', tone: 'text-slate-600', value: 'PENDING', count: counts.PENDING },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          className={cn(
            'inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors',
            value === option.value
              ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm'
              : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50/60',
          )}
          key={option.label}
          onClick={() => onChange(option.value)}
          type="button"
        >
          <span>{option.label}</span>
          <span className={cn('rounded-md bg-slate-100 px-1.5 py-0.5 text-xs', option.tone)}>
            {formatNumber(option.count)}
          </span>
        </button>
      ))}
    </div>
  );
}

export function KnowledgeTaskMetricTile({
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
      <TaskMiniSparkline className="hidden w-20 text-blue-500 sm:block" />
    </div>
  );
}

export function KnowledgeTaskListTable({
  loading,
  onSelectTask,
  selectedTaskId,
  tasks,
}: {
  loading: boolean;
  onSelectTask: (taskId: string) => void;
  selectedTaskId: string | null;
  tasks: KnowledgeOverviewTaskItem[];
}) {
  if (loading) return <div className="p-5 text-sm text-muted-foreground">加载中</div>;
  if (tasks.length === 0) return <EmptyState className="p-8" title="暂无任务记录" />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200/80 bg-slate-50/70">
            <th className="w-10 px-4 py-3">
              <input aria-label="选择全部任务" className="size-4 rounded border-slate-300" type="checkbox" />
            </th>
            {['任务名称 / ID', '知识库', '类型', '进度', '文档数', '状态', '创建时间', '耗时', '操作'].map((column) => (
              <th className="px-4 py-3 font-medium text-slate-500" key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const progress = progressPercent(task.processed_items, task.total_items);
            const selected = selectedTaskId === task.id;

            return (
              <tr
                className={cn(
                  'border-b border-slate-100 last:border-0',
                  selected ? 'bg-blue-50/70' : 'hover:bg-slate-50/70',
                )}
                key={task.id}
              >
                <td className="px-4 py-3">
                  <input
                    aria-label={`选择任务 ${task.id}`}
                    checked={selected}
                    className="size-4 rounded border-slate-300"
                    onChange={() => onSelectTask(task.id)}
                    type="checkbox"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{taskDisplayName(task)}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{task.id}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Database className="size-3.5" />
                    {task.knowledge_name}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge tone="planned">{knowledgeTaskTypeLabel(task.task_type)}</StatusBadge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <ProgressBar value={progress} />
                    <span className="w-12 text-xs text-muted-foreground">{formatPercent(progress)}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatNumber(task.processed_items)} / {formatNumber(task.total_items)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge tone={knowledgeStatusTone(task.status)}>{knowledgeStatusLabel(task.status)}</StatusBadge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDateTime(taskCreatedAt(task))}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDuration(task.started_at, task.ended_at, task.updated_at)}</td>
                <td className="px-4 py-3">
                  <Button className="h-8 px-3" onClick={() => onSelectTask(task.id)} size="sm" type="button" variant="outline">
                    详情
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

export function KnowledgeTaskDetailPanel({
  loading,
  task,
}: {
  loading: boolean;
  task: KnowledgeOverviewTaskItem | null;
}) {
  const [activeTab, setActiveTab] = useState<TaskDetailTab>('detail');

  if (loading) {
    return (
      <Card className="rounded-xl border border-slate-200/80 bg-white/[0.9] p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
        <div className="text-sm text-muted-foreground">加载中</div>
      </Card>
    );
  }

  if (!task) {
    return (
      <Card className="rounded-xl border border-slate-200/80 bg-white/[0.9] shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
        <EmptyState className="p-8" title="暂无任务详情" />
      </Card>
    );
  }

  const progress = progressPercent(task.processed_items, task.total_items);

  return (
    <Card className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/[0.9] shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 px-5 py-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-semibold text-slate-950">任务详情</h2>
            <StatusBadge tone={knowledgeStatusTone(task.status)}>{knowledgeStatusLabel(task.status)}</StatusBadge>
          </div>
          <div className="mt-1 truncate text-xs text-muted-foreground">{task.id}</div>
        </div>
      </div>
      <div className="border-b border-slate-200/80 px-5">
        <div className="flex gap-5">
          {[
            { label: '任务详情', value: 'detail' as const },
            { label: '处理日志', value: 'logs' as const },
            { label: '文档列表', value: 'documents' as const },
          ].map((tab) => (
            <button
              className={cn(
                'border-b-2 px-1 py-3 text-sm font-medium transition-colors',
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

      {activeTab === 'detail' ? (
        <div className="grid gap-5 p-5">
          <div className="grid gap-3 text-sm">
            <DetailLine label="知识库" value={task.knowledge_name} />
            <DetailLine label="任务类型" value={knowledgeTaskTypeLabel(task.task_type)} />
            <DetailLine label="当前状态" value={knowledgeStatusLabel(task.status)} />
            <DetailLine label="创建时间" value={formatDateTime(taskCreatedAt(task))} />
            <DetailLine label="开始时间" value={formatDateTime(task.started_at)} />
            <DetailLine label="结束时间" value={formatDateTime(task.ended_at)} />
            <DetailLine label="耗时" value={formatDuration(task.started_at, task.ended_at, task.updated_at)} />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">总体进度</span>
              <span className="text-muted-foreground">
                已处理 {formatNumber(task.processed_items)} / {formatNumber(task.total_items)} 文档
              </span>
            </div>
            <ProgressBar value={progress} />
            <div className="mt-2 text-sm font-medium text-slate-900">{formatPercent(progress)}</div>
          </div>
          <KnowledgeTaskStageList task={task} />
        </div>
      ) : null}

      {activeTab === 'logs' ? (
        <div className="p-5">
          <KnowledgeTaskLogList task={task} />
        </div>
      ) : null}

      {activeTab === 'documents' ? (
        <div className="grid gap-3 p-5">
          <DocumentCountLine label="已处理文档" value={task.processed_items} />
          <DocumentCountLine label="未处理文档" value={Math.max(task.total_items - task.processed_items, 0)} />
          <DocumentCountLine label="文档总数" value={task.total_items} />
        </div>
      ) : null}
    </Card>
  );
}

export function KnowledgeTaskStageList({ task }: { task: KnowledgeOverviewTaskItem }) {
  const stages = buildTaskStages(task);

  return (
    <div className="grid gap-3">
      <div className="text-sm font-semibold text-slate-900">处理阶段</div>
      <div className="grid gap-0">
        {stages.map((stage, index) => (
          <div className="grid grid-cols-[26px_minmax(0,1fr)] gap-3 pb-4 last:pb-0" key={stage.label}>
            <span className="relative flex justify-center">
              <span
                className={cn(
                  'mt-0.5 grid size-6 place-items-center rounded-full border bg-white',
                  stage.state === 'done'
                    ? 'border-emerald-200 text-emerald-600'
                    : stage.state === 'failed'
                      ? 'border-red-200 text-red-600'
                      : stage.state === 'running'
                        ? 'border-blue-200 text-blue-600'
                        : 'border-slate-200 text-slate-400',
                )}
              >
                {stage.state === 'done' ? <CheckCircle2 className="size-4" /> : <span className="size-2 rounded-full bg-current" />}
              </span>
              {index < stages.length - 1 ? <span className="absolute top-7 h-[calc(100%-1rem)] w-px bg-slate-200" /> : null}
            </span>
            <div className="min-w-0 border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-slate-900">{stage.label}</span>
                <span className="text-xs text-slate-500">{stage.meta}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function KnowledgeTaskLogList({ task }: { task: KnowledgeOverviewTaskItem }) {
  const logs = buildTaskLogs(task);

  return (
    <div className="grid gap-3">
      <div className="text-sm font-semibold text-slate-900">处理日志</div>
      <div className="grid gap-2">
        {logs.map((log) => (
          <div className="grid grid-cols-[82px_minmax(0,1fr)] gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 text-sm" key={log.label}>
            <span className="text-xs text-slate-500">{log.time}</span>
            <span className="min-w-0 text-slate-700">{log.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate font-medium text-slate-800">{value}</span>
    </div>
  );
}

function DocumentCountLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900">{formatNumber(value)}</span>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  const width = Math.max(0, Math.min(100, value));
  const color = width >= 100 ? 'bg-emerald-600' : 'bg-blue-600';

  return (
    <span className="block h-2 w-full rounded-full bg-slate-100">
      <span className={`block h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
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

function TaskMiniSparkline({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" height="36" viewBox="0 0 96 36" width="96">
      <path d="M2 28 C12 18 18 25 26 18 S42 10 50 17 66 27 76 16 86 10 94 12" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
      <path d="M2 32 C16 24 26 29 38 21 S58 14 70 20 84 24 94 18" opacity="0.25" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}

function buildTaskStages(task: KnowledgeOverviewTaskItem) {
  const progress = progressPercent(task.processed_items, task.total_items);
  const baseStages = [
    { label: '任务提交', threshold: 0 },
    { label: '文档解析', threshold: 20 },
    { label: '文本分片', threshold: 45 },
    { label: '向量化', threshold: 70 },
    { label: '索引写入', threshold: 90 },
    { label: '完成', threshold: 100 },
  ];

  const currentIndex = Math.max(
    0,
    baseStages.findIndex((stage) => progress < stage.threshold),
  );
  const runningIndex = currentIndex === -1 ? baseStages.length - 1 : currentIndex;

  return baseStages.map((stage, index) => {
    let state: TaskStageState = 'waiting';

    if (task.status === 'SUCCESS') {
      state = 'done';
    } else if (task.status === 'FAILED' && index === runningIndex) {
      state = 'failed';
    } else if (task.status === 'FAILED' && index < runningIndex) {
      state = 'done';
    } else if (task.status === 'RUNNING' && index === runningIndex) {
      state = 'running';
    } else if (progress >= stage.threshold && task.status !== 'PENDING') {
      state = 'done';
    } else if (task.status === 'PENDING' && index === 0) {
      state = 'done';
    }

    return {
      label: stage.label,
      meta: stageMeta(state, task),
      state,
    };
  });
}

function buildTaskLogs(task: KnowledgeOverviewTaskItem) {
  const logs = [
    { label: '任务进入队列', time: formatShortTime(taskCreatedAt(task)) },
  ];

  if (task.started_at) {
    logs.push({ label: '开始处理', time: formatShortTime(task.started_at) });
  }

  logs.push({
    label: `已处理 ${formatNumber(task.processed_items)} / ${formatNumber(task.total_items)} 项`,
    time: formatShortTime(task.updated_at),
  });

  if (task.status === 'SUCCESS') {
    logs.push({ label: '任务完成', time: formatShortTime(task.ended_at ?? task.updated_at) });
  } else if (task.status === 'FAILED') {
    logs.push({ label: '任务失败', time: formatShortTime(task.ended_at ?? task.updated_at) });
  } else if (task.status === 'PENDING') {
    logs.push({ label: '等待执行', time: formatShortTime(task.updated_at) });
  } else {
    logs.push({ label: '任务运行中', time: formatShortTime(task.updated_at) });
  }

  return logs;
}

function stageMeta(state: TaskStageState, task: KnowledgeOverviewTaskItem) {
  if (state === 'done') return formatDateTime(task.ended_at ?? task.updated_at);
  if (state === 'running') return `${formatNumber(task.processed_items)} / ${formatNumber(task.total_items)}`;
  if (state === 'failed') return formatDateTime(task.ended_at ?? task.updated_at);

  return '待处理';
}

function taskDisplayName(task: KnowledgeOverviewTaskItem) {
  return `${task.knowledge_name} ${knowledgeTaskTypeLabel(task.task_type)}`;
}

function taskCreatedAt(task: KnowledgeOverviewTaskItem) {
  return task.started_at ?? task.updated_at;
}

function progressPercent(processed_items: number, total_items: number) {
  if (total_items <= 0) return 0;
  return Number(((processed_items / total_items) * 100).toFixed(1));
}

function ratioPercent(value: number, total: number) {
  if (total <= 0) return 0;
  return Number(((value / total) * 100).toFixed(1));
}

function formatNumber(value: number | undefined) {
  if (value === undefined) return '-';
  return new Intl.NumberFormat('zh-CN').format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatDuration(startedAt: string | null, endedAt: string | null, updatedAt: string) {
  if (!startedAt) return '--';

  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt ?? updatedAt).getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) return '-';

  const seconds = Math.max(0, Math.floor((end - start) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const restSeconds = seconds % 60;

  if (hours > 0) return `${hours}时${minutes}分`;
  if (minutes > 0) return `${minutes}分${restSeconds}秒`;

  return `${restSeconds}秒`;
}

function dateKey(value: string | null | undefined) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${date.getFullYear()}-${month}-${day}`;
}

function formatShortTime(value: string | null | undefined) {
  if (!value) return '--';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
