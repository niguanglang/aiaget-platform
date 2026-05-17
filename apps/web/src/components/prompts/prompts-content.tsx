'use client';

import {
  hasPermission,
  type PromptStatus,
  type PromptTemplateDetail,
  type PromptTemplateListItem,
  type PromptType,
} from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Braces,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  Copy,
  Edit,
  Eye,
  FileText,
  FlaskConical,
  Layers3,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  SquareCode,
  Trash2,
  UsersRound,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import {
  formatDateTime,
  promptStatusLabel,
  promptStatusTone,
  promptTypeLabel,
} from '@/components/prompts/prompt-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  copyPromptTemplate,
  deletePromptTemplate,
  getPromptTemplate,
  listPromptTemplates,
  listUsers,
  type ApiClientError,
} from '@/lib/api-client';

const promptTypes: PromptType[] = ['SYSTEM', 'USER', 'ASSISTANT', 'TOOL'];
const promptStatuses: PromptStatus[] = ['DRAFT', 'PUBLISHED', 'DISABLED', 'ARCHIVED'];
const pageSize = 20;

const promptTypeFilters: Array<{ label: string; value: '' | PromptType }> = [
  { label: '全部', value: '' },
  { label: '系统提示词', value: 'SYSTEM' },
  { label: '业务模板', value: 'USER' },
  { label: '工具调用', value: 'TOOL' },
  { label: '助手回复', value: 'ASSISTANT' },
];

const promptTypeTree: Array<{ children?: Array<{ label: string; value: PromptType }>; label: string; value: '' | PromptType }> = [
  {
    children: [
      { label: '通用能力', value: 'SYSTEM' },
      { label: '安全合规', value: 'SYSTEM' },
    ],
    label: '系统提示词',
    value: 'SYSTEM',
  },
  {
    children: [
      { label: '客服场景', value: 'USER' },
      { label: '营销场景', value: 'USER' },
    ],
    label: '业务模板',
    value: 'USER',
  },
  { label: '工具调用', value: 'TOOL' },
  { label: 'RAG 检索', value: 'ASSISTANT' },
];

const promptAvatarStyles = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-orange-100 text-orange-700',
  'bg-cyan-100 text-cyan-700',
] as const;

export function PromptsContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [page, setPage] = useState(1);
  const [copyTarget, setCopyTarget] = useState<PromptTemplateListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PromptTemplateListItem | null>(null);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'prompt:template:manage'),
  );

  const promptsQuery = useQuery({
    queryKey: ['prompt-templates', page, keyword, type, status, ownerId],
    queryFn: () =>
      listPromptTemplates({
        page,
        page_size: pageSize,
        keyword,
        type,
        status,
        owner_id: ownerId,
      }),
  });
  const ownersQuery = useQuery({
    queryKey: ['prompt-owners'],
    queryFn: () =>
      listUsers({
        page: 1,
        page_size: 100,
        status: 'ACTIVE',
      }),
  });

  const prompts = promptsQuery.data?.items ?? [];
  const owners = ownersQuery.data?.items ?? [];
  const total = promptsQuery.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const activePrompt = prompts.find((prompt) => prompt.id === selectedPromptId) ?? prompts[0] ?? null;
  const activePromptId = selectedPromptId ?? activePrompt?.id ?? null;

  const metrics = useMemo(
    () => [
      {
        helper: '租户范围',
        icon: Layers3,
        iconClassName: 'bg-blue-100 text-blue-700',
        label: '总提示词',
        value: `${total}`,
      },
      {
        helper: '当前页',
        icon: CheckCircle2,
        iconClassName: 'bg-emerald-100 text-emerald-700',
        label: '已发布',
        value: `${prompts.filter((prompt) => prompt.status === 'PUBLISHED').length}`,
      },
      {
        helper: '当前页',
        icon: FileText,
        iconClassName: 'bg-orange-100 text-orange-700',
        label: '草稿',
        value: `${prompts.filter((prompt) => prompt.status === 'DRAFT').length}`,
      },
      {
        helper: '当前页',
        icon: Circle,
        iconClassName: 'bg-slate-100 text-slate-700',
        label: '已停用',
        value: `${prompts.filter((prompt) => prompt.status === 'DISABLED').length}`,
      },
      {
        helper: '当前页',
        icon: UsersRound,
        iconClassName: 'bg-violet-100 text-violet-700',
        label: '智能体引用',
        value: `${prompts.reduce((sum, prompt) => sum + prompt.agent_reference_count, 0)}`,
      },
      {
        helper: '当前页',
        icon: FlaskConical,
        iconClassName: 'bg-cyan-100 text-cyan-700',
        label: '测试记录',
        value: `${prompts.reduce((sum, prompt) => sum + prompt.test_count, 0)}`,
      },
    ],
    [prompts, total],
  );

  const copyMutation = useMutation({
    mutationFn: copyPromptTemplate,
    onSuccess: async (prompt) => {
      queryClient.setQueryData(['prompt-template', prompt.id], prompt);
      await queryClient.invalidateQueries({ queryKey: ['prompt-templates'] });
      setCopyTarget(null);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePromptTemplate,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['prompt-templates'] });
      setDeleteTarget(null);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  function clearFilters() {
    setKeyword('');
    setType('');
    setStatus('');
    setOwnerId('');
    setPage(1);
  }

  function updateFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  function confirmCopyPrompt() {
    if (!copyTarget) return;
    copyMutation.mutate(copyTarget.id);
  }

  return (
    <main className="mx-auto grid max-w-[1680px] gap-5 px-4 py-5 lg:px-7">
      <section className="flex flex-col justify-between gap-4 py-3 md:flex-row md:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">提示词中心</h1>
          <StatusBadge tone="healthy">模板管理</StatusBadge>
          <StatusBadge tone="planned">版本测试</StatusBadge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="h-10" disabled={promptsQuery.isFetching} onClick={() => void promptsQuery.refetch()} type="button" variant="outline">
            <RefreshCw className={`size-4 ${promptsQuery.isFetching ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          {canWrite ? (
            <Button asChild className="h-10 bg-blue-600 px-5 shadow-[0_12px_26px_rgba(37,99,235,0.28)] hover:bg-blue-700">
              <Link href="/prompts/create">
                <Plus className="size-4" />
                新建提示词
              </Link>
            </Button>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <div
              className="flex min-h-[116px] items-center gap-4 rounded-xl border border-slate-200/80 bg-white/[0.9] px-5 py-4 shadow-[0_16px_45px_rgba(15,23,42,0.05)] backdrop-blur-xl"
              key={metric.label}
            >
              <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${metric.iconClassName}`}>
                <Icon className="size-5" />
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-slate-500">{metric.label}</div>
                <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{metric.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{metric.helper}</div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="flex flex-wrap gap-2">
        {promptTypeFilters.map((item) => {
          const isActive = type === item.value;
          const count = item.value ? prompts.filter((prompt) => prompt.type === item.value).length : total;

          return (
            <button
              className={`inline-flex h-9 items-center gap-2 rounded-lg border px-4 text-sm transition-colors ${
                isActive
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700'
              }`}
              key={item.label}
              onClick={() => updateFilter(setType, item.value)}
              type="button"
            >
              <span>{item.label}</span>
              <span className={`rounded-md px-1.5 py-0.5 text-xs ${isActive ? 'bg-blue-100' : 'bg-slate-100 text-slate-500'}`}>{count}</span>
            </button>
          );
        })}
      </section>

      {actionError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)_380px]">
        <PromptFilterPanel
          keyword={keyword}
          onClear={clearFilters}
          onKeywordChange={(value) => updateFilter(setKeyword, value)}
          onOwnerChange={(value) => updateFilter(setOwnerId, value)}
          onStatusChange={(value) => updateFilter(setStatus, value)}
          onTypeChange={(value) => updateFilter(setType, value)}
          ownerId={ownerId}
          owners={owners}
          status={status}
          type={type}
        />

        <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/[0.9] shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="border-b border-slate-200/80 px-5 py-4">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <h2 className="text-lg font-semibold text-slate-950">提示词列表</h2>
              <div className="text-sm text-muted-foreground">
                共 {total} 条
              </div>
            </div>
          </div>

          {promptsQuery.isError ? (
            <div className="p-6 text-sm text-destructive">加载失败。</div>
          ) : promptsQuery.isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">正在加载...</div>
          ) : prompts.length === 0 ? (
            <div className="p-10 text-center">
              <div className="font-medium">暂无数据</div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50/70">
                      {['提示词名称', '类型', '状态', '版本', '变量数', '测试', '引用智能体', '最近更新', '操作'].map((column) => (
                        <th className="px-4 py-3 font-medium text-slate-500" key={column}>
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {prompts.map((prompt) => (
                      <tr
                        className={`border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70 ${
                          activePrompt?.id === prompt.id ? 'bg-blue-50/45' : ''
                        }`}
                        key={prompt.id}
                        onClick={() => setSelectedPromptId(prompt.id)}
                      >
                        <td className="px-4 py-3">
                          <Link className="flex max-w-[260px] items-center gap-3 text-left transition-colors hover:text-blue-700" href={`/prompts/${prompt.id}`}>
                            <PromptAvatar prompt={prompt} />
                            <span className="min-w-0">
                              <span className="block truncate font-medium text-slate-900">{prompt.name}</span>
                              <span className="mt-1 block truncate text-xs text-muted-foreground">{prompt.code}</span>
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{promptTypeLabel(prompt.type)}</td>
                        <td className="px-4 py-3">
                          <StatusBadge tone={promptStatusTone(prompt.status)}>{promptStatusLabel(prompt.status)}</StatusBadge>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">v{prompt.version}</td>
                        <td className="px-4 py-3 text-muted-foreground">{prompt.variable_count}</td>
                        <td className="px-4 py-3 text-muted-foreground">{prompt.test_count}</td>
                        <td className="px-4 py-3 text-muted-foreground">{prompt.agent_reference_count}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <div>{formatDateTime(prompt.updated_at)}</div>
                          <div className="mt-1 text-xs">{prompt.owner?.name ?? '-'}</div>
                        </td>
                        <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                          <div className="flex gap-1.5">
                            <Button asChild className="size-8 rounded-md p-0" size="sm" title="查看" variant="outline">
                              <Link href={`/prompts/${prompt.id}`}>
                                <Eye className="size-4" />
                              </Link>
                            </Button>
                            <Button
                              asChild
                              aria-disabled={!canWrite}
                              className={canWrite ? 'size-8 rounded-md p-0' : 'pointer-events-none size-8 rounded-md p-0 opacity-60'}
                              size="sm"
                              title="编辑"
                              variant="outline"
                            >
                              <Link href={`/prompts/${prompt.id}/edit`}>
                                <Edit className="size-4" />
                              </Link>
                            </Button>
                            <Button
                              className="size-8 rounded-md p-0"
                              disabled={!canWrite || copyMutation.isPending}
                              onClick={() => setCopyTarget(prompt)}
                              size="sm"
                              title="复制"
                              type="button"
                              variant="outline"
                            >
                              <Copy className="size-4" />
                            </Button>
                            <Button
                              className="size-8 rounded-md p-0 text-red-600 hover:text-red-700"
                              disabled={!canWrite}
                              onClick={() => setDeleteTarget(prompt)}
                              size="sm"
                              title="删除"
                              type="button"
                              variant="outline"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-slate-200/80 px-5 py-4">
                <PaginationBar onPageChange={setPage} page={page} pageCount={pageCount} total={total} />
              </div>
            </>
          )}
        </section>

        <PromptPreviewPanel promptId={activePromptId} />
      </section>

      {copyTarget ? (
        <ConfirmDialog
          body={`确认复制提示词 ${copyTarget.name}？系统会创建一份新的模板副本，后续可调整内容、变量和版本。`}
          confirmLabel="确认复制"
          onCancel={() => setCopyTarget(null)}
          onConfirm={confirmCopyPrompt}
          pending={copyMutation.isPending}
          title="确认复制提示词"
        />
      ) : null}

      {deleteTarget ? (
        <ConfirmDialog
          body={`这会归档提示词 ${deleteTarget.name}，并保留版本历史和审计记录。`}
          confirmLabel="确认删除"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          pending={deleteMutation.isPending}
          title="删除提示词？"
        />
      ) : null}
    </main>
  );
}

function PromptFilterPanel({
  keyword,
  onClear,
  onKeywordChange,
  onOwnerChange,
  onStatusChange,
  onTypeChange,
  ownerId,
  owners,
  status,
  type,
}: {
  keyword: string;
  onClear: () => void;
  onKeywordChange: (value: string) => void;
  onOwnerChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  ownerId: string;
  owners: Array<{ id: string; name: string }>;
  status: string;
  type: string;
}) {
  return (
    <aside className="rounded-xl border border-slate-200/80 bg-white/[0.9] p-4 shadow-[0_18px_55px_rgba(15,23,42,0.05)] backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-950">筛选器</h2>
        <Button className="size-8 rounded-md p-0" onClick={onClear} title="清空" type="button" variant="outline">
          <RotateCcw className="size-4" />
        </Button>
      </div>

      <div className="grid gap-3">
        <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm">
          <Search className="size-4 text-muted-foreground" />
          <input
            className="min-w-0 flex-1 bg-transparent outline-none"
            onChange={(event) => onKeywordChange(event.target.value)}
            placeholder="搜索提示词名称"
            value={keyword}
          />
        </label>

        <FilterSelect label="类型" onChange={onTypeChange} value={type}>
          <option value="">全部类型</option>
          {promptTypes.map((option) => (
            <option key={option} value={option}>
              {promptTypeLabel(option)}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect label="状态" onChange={onStatusChange} value={status}>
          <option value="">全部状态</option>
          {promptStatuses.map((option) => (
            <option key={option} value={option}>
              {promptStatusLabel(option)}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect label="负责人" onChange={onOwnerChange} value={ownerId}>
          <option value="">全部负责人</option>
          {owners.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.name}
            </option>
          ))}
        </FilterSelect>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
          <SlidersHorizontal className="size-4" />
          目录
        </div>
        <div className="grid gap-1 text-sm text-slate-600">
          <button
            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${type === '' ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50'}`}
            onClick={() => onTypeChange('')}
            type="button"
          >
            <ChevronDown className="size-4" />
            全部目录
          </button>
          {promptTypeTree.map((item) => (
            <div key={item.label}>
              <button
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${
                  type === item.value ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50'
                }`}
                onClick={() => onTypeChange(item.value)}
                type="button"
              >
                <ChevronRight className="size-4" />
                {item.label}
              </button>
              {item.children ? (
                <div className="ml-6 grid gap-1">
                  {item.children.map((child) => (
                    <button
                      className={`rounded-md px-2 py-1.5 text-left transition-colors ${
                        type === child.value ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50'
                      }`}
                      key={child.label}
                      onClick={() => onTypeChange(child.value)}
                      type="button"
                    >
                      {child.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function FilterSelect({
  children,
  label,
  onChange,
  value,
}: {
  children: React.ReactNode;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-medium text-slate-500">
      {label}
      <select
        className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700 shadow-sm outline-none transition-colors hover:border-blue-200"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </label>
  );
}

function PromptPreviewPanel({ promptId }: { promptId: string | null }) {
  const [activeTab, setActiveTab] = useState<'detail' | 'tests' | 'references' | 'audit'>('detail');
  const promptQuery = useQuery({
    enabled: Boolean(promptId),
    queryKey: ['prompt-detail-preview', promptId],
    queryFn: () => getPromptTemplate(promptId as string),
  });

  if (!promptId) {
    return (
      <aside className="hidden rounded-xl border border-slate-200/80 bg-white/[0.9] p-5 shadow-[0_18px_55px_rgba(15,23,42,0.05)] backdrop-blur-xl xl:block">
        <div className="text-sm text-muted-foreground">暂无数据</div>
      </aside>
    );
  }

  if (promptQuery.isError) {
    return (
      <aside className="hidden rounded-xl border border-slate-200/80 bg-white/[0.9] p-5 shadow-[0_18px_55px_rgba(15,23,42,0.05)] backdrop-blur-xl xl:block">
        <div className="text-sm text-destructive">加载失败。</div>
      </aside>
    );
  }

  if (promptQuery.isLoading || !promptQuery.data) {
    return (
      <aside className="hidden rounded-xl border border-slate-200/80 bg-white/[0.9] p-5 shadow-[0_18px_55px_rgba(15,23,42,0.05)] backdrop-blur-xl xl:block">
        <div className="text-sm text-muted-foreground">正在加载...</div>
      </aside>
    );
  }

  const prompt = promptQuery.data;
  const tabs: Array<{ key: typeof activeTab; label: string }> = [
    { key: 'detail', label: '详情' },
    { key: 'tests', label: '测试结果' },
    { key: 'references', label: '引用关系' },
    { key: 'audit', label: '审批记录' },
  ];

  return (
    <aside className="hidden overflow-hidden rounded-xl border border-slate-200/80 bg-white/[0.9] shadow-[0_18px_55px_rgba(15,23,42,0.05)] backdrop-blur-xl xl:block">
      <div className="border-b border-slate-200/80 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-slate-950">{prompt.name}</h2>
            <div className="mt-1 text-xs text-muted-foreground">
              {prompt.code} · v{prompt.version}
            </div>
          </div>
          <StatusBadge tone={promptStatusTone(prompt.status)}>{promptStatusLabel(prompt.status)}</StatusBadge>
        </div>

        <div className="mt-4 flex gap-4 border-b border-slate-100 text-sm">
          {tabs.map((tab) => (
            <button
              className={`border-b-2 pb-2 transition-colors ${activeTab === tab.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 px-5 py-4">
        {activeTab === 'detail' ? <PromptDetailPreview prompt={prompt} /> : null}
        {activeTab === 'tests' ? <PromptTestsPreview prompt={prompt} /> : null}
        {activeTab === 'references' ? <PromptReferencesPreview prompt={prompt} /> : null}
        {activeTab === 'audit' ? <PromptAuditPreview prompt={prompt} /> : null}
      </div>
    </aside>
  );
}

function PromptDetailPreview({ prompt }: { prompt: PromptTemplateDetail }) {
  return (
    <>
      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-950">基本信息</h3>
        <div className="grid gap-2 text-sm">
          <PreviewRow label="类型" value={promptTypeLabel(prompt.type)} />
          <PreviewRow label="负责人" value={prompt.owner?.name ?? '-'} />
          <PreviewRow label="更新时间" value={formatDateTime(prompt.updated_at)} />
          <PreviewRow label="变量数" value={`${prompt.variables.length}`} />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-950">提示词内容</h3>
          <Button asChild className="h-8 px-3" variant="outline">
            <Link href={`/prompts/${prompt.id}`}>
              全屏
            </Link>
          </Button>
        </div>
        <div className="max-h-[210px] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-6 text-slate-700">
          {prompt.content || '-'}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-950">变量</h3>
        <div className="flex flex-wrap gap-2">
          {prompt.variables.length > 0 ? (
            prompt.variables.map((variable) => (
              <span className="rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-700" key={variable.id}>
                {variable.name} · {variable.variable_type}
              </span>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          )}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-950">版本历史</h3>
        <div className="grid gap-3 text-sm">
          {prompt.versions.slice(0, 5).length > 0 ? (
            prompt.versions.slice(0, 5).map((version) => (
              <div className="flex items-start gap-3" key={version.id}>
                <span className={`mt-1 size-2 rounded-full ${version.version === prompt.version ? 'bg-blue-600' : 'bg-slate-300'}`} />
                <div>
                  <div className="font-medium text-slate-800">
                    v{version.version} · {promptStatusLabel(version.status)}
                  </div>
                  <div className="text-xs text-muted-foreground">{formatDateTime(version.created_at)}</div>
                </div>
              </div>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          )}
        </div>
      </section>
    </>
  );
}

function PromptTestsPreview({ prompt }: { prompt: PromptTemplateDetail }) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-slate-950">测试结果</h3>
      <div className="grid gap-3">
        {prompt.test_records.slice(0, 6).length > 0 ? (
          prompt.test_records.slice(0, 6).map((record) => (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm" key={record.id}>
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-slate-800">{record.status === 'SUCCESS' ? '成功' : '失败'}</span>
                <span className="text-xs text-muted-foreground">{formatDateTime(record.created_at)}</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {record.request_model ?? record.model_provider_name ?? '-'} · {record.latency_ms}ms
              </div>
            </div>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">暂无数据</span>
        )}
      </div>
    </section>
  );
}

function PromptReferencesPreview({ prompt }: { prompt: PromptTemplateDetail }) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-slate-950">引用关系</h3>
      <div className="grid gap-3">
        {prompt.agent_references.slice(0, 8).length > 0 ? (
          prompt.agent_references.slice(0, 8).map((reference) => (
            <Link className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm hover:border-blue-200 hover:text-blue-700" href={`/agents/${reference.agent_id}`} key={reference.id}>
              <div className="font-medium">{reference.agent_name}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {reference.agent_code} · {reference.prompt_type} · {formatDateTime(reference.created_at)}
              </div>
            </Link>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">暂无数据</span>
        )}
      </div>
    </section>
  );
}

function PromptAuditPreview({ prompt }: { prompt: PromptTemplateDetail }) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-slate-950">审批记录</h3>
      <div className="grid gap-3">
        {prompt.audit_records.slice(0, 8).length > 0 ? (
          prompt.audit_records.slice(0, 8).map((record) => (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm" key={record.id}>
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-slate-800">{record.action}</span>
                <span className="text-xs text-muted-foreground">{formatDateTime(record.created_at)}</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{record.operator?.name ?? '-'}</div>
              <div className="mt-2 text-slate-700">{record.message}</div>
            </div>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">暂无数据</span>
        )}
      </div>
    </section>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="min-w-0 break-words text-slate-700">{value}</span>
    </div>
  );
}

function PaginationBar({
  onPageChange,
  page,
  pageCount,
  total,
}: {
  onPageChange: (value: number) => void;
  page: number;
  pageCount: number;
  total: number;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="text-sm text-muted-foreground">共 {total} 条</div>
      <div className="flex items-center gap-2">
        <Button
          className="size-8 p-0"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          size="sm"
          title="上一页"
          type="button"
          variant="outline"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="grid h-8 min-w-8 place-items-center rounded-md border border-blue-500 bg-blue-50 px-2 text-sm text-blue-700">{page}</span>
        <span className="text-sm text-muted-foreground">/ {pageCount}</span>
        <Button
          className="size-8 p-0"
          disabled={page >= pageCount}
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
          size="sm"
          title="下一页"
          type="button"
          variant="outline"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function PromptAvatar({ prompt }: { prompt: PromptTemplateListItem }) {
  const styleIndex = Math.abs(hashText(prompt.id || prompt.code)) % promptAvatarStyles.length;
  const Icon = prompt.type === 'TOOL' ? SquareCode : prompt.type === 'ASSISTANT' ? Braces : FileText;

  return (
    <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${promptAvatarStyles[styleIndex]}`}>
      <Icon className="size-5" />
    </span>
  );
}

function ConfirmDialog({
  body,
  confirmLabel = '确认删除',
  onCancel,
  onConfirm,
  pending,
  title,
}: {
  body: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 px-4 backdrop-blur-sm">
      <Card className="w-full max-w-md p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button className="size-8 p-0" onClick={onCancel} type="button" variant="ghost">
            <X className="size-4" />
          </Button>
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={onCancel} type="button" variant="outline">
            取消
          </Button>
          <Button disabled={pending} onClick={onConfirm} type="button" variant="destructive">
            {confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function hashText(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return hash;
}
