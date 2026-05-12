'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission, type PromptStatus, type PromptTemplateListItem, type PromptType } from '@aiaget/shared-types';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Copy, Edit, Eye, Plus, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { PromptCenterBackground } from '@/components/prompts/prompt-center-background';
import {
  formatDateTime,
  promptStatusLabel,
  promptStatusTone,
  promptTypeLabel,
} from '@/components/prompts/prompt-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  copyPromptTemplate,
  deletePromptTemplate,
  listPromptTemplates,
  listUsers,
  type ApiClientError,
} from '@/lib/api-client';

const promptTypes: PromptType[] = ['SYSTEM', 'USER', 'ASSISTANT', 'TOOL'];
const promptStatuses: PromptStatus[] = ['DRAFT', 'PUBLISHED', 'DISABLED', 'ARCHIVED'];
const pageSize = 20;

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

  const metrics = useMemo(
    () => [
      { label: '模板', value: `${total}`, helper: '租户范围' },
      {
        label: '已发布',
        value: `${prompts.filter((prompt) => prompt.status === 'PUBLISHED').length}`,
        helper: '当前页',
      },
      {
        label: '草稿',
        value: `${prompts.filter((prompt) => prompt.status === 'DRAFT').length}`,
        helper: '当前页',
      },
      {
        label: '智能体引用',
        value: `${prompts.reduce((sum, prompt) => sum + prompt.agent_reference_count, 0)}`,
        helper: '当前页',
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
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <PromptCenterBackground />

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
      >
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">提示词中心</StatusBadge>
            <StatusBadge tone="healthy">模板列表</StatusBadge>
            <StatusBadge tone="planned">版本测试</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">提示词中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">模板类型、状态、版本、变量、测试记录和智能体引用。</p>
        </div>
        {canWrite ? (
          <Button asChild className="w-full md:w-auto">
            <Link href="/prompts/create">
              <Plus className="size-4" />
              新建提示词
            </Link>
          </Button>
        ) : null}
      </motion.section>

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.04, duration: 0.32, ease: 'easeOut' }}
      >
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </motion.section>

      {actionError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <Card>
        <div className="border-b p-4">
          <div className="grid gap-4">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-sm font-semibold">模板列表</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  名称、类型、状态、版本、变量、测试记录和引用数量。
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                显示 {prompts.length} / {total}
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_150px_160px_190px_auto]">
              <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
                <Search className="size-4 text-muted-foreground" />
                <input
                  className="min-w-0 flex-1 bg-transparent outline-none"
                  onChange={(event) => updateFilter(setKeyword, event.target.value)}
                  placeholder="搜索提示词、编码、内容"
                  value={keyword}
                />
              </label>
              <select
                className="h-9 rounded-md border bg-background/80 px-3 text-sm"
                onChange={(event) => updateFilter(setType, event.target.value)}
                value={type}
              >
                <option value="">全部类型</option>
                {promptTypes.map((option) => (
                  <option key={option} value={option}>
                    {promptTypeLabel(option)}
                  </option>
                ))}
              </select>
              <select
                className="h-9 rounded-md border bg-background/80 px-3 text-sm"
                onChange={(event) => updateFilter(setStatus, event.target.value)}
                value={status}
              >
                <option value="">全部状态</option>
                {promptStatuses.map((option) => (
                  <option key={option} value={option}>
                    {promptStatusLabel(option)}
                  </option>
                ))}
              </select>
              <select
                className="h-9 rounded-md border bg-background/80 px-3 text-sm"
                onChange={(event) => updateFilter(setOwnerId, event.target.value)}
                value={ownerId}
              >
                <option value="">全部负责人</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name}
                  </option>
                ))}
              </select>
              <Button onClick={clearFilters} type="button" variant="outline">
                清空
              </Button>
            </div>
          </div>
        </div>

        {promptsQuery.isError ? (
          <div className="p-6 text-sm text-destructive">提示词模板加载失败。</div>
        ) : promptsQuery.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">正在加载提示词模板...</div>
        ) : prompts.length === 0 ? (
          <EmptyState
            action={
              canWrite ? (
                <Button asChild>
                  <Link href="/prompts/create">
                    <Plus className="size-4" />
                    新建提示词
                  </Link>
                </Button>
              ) : null
            }
            description="创建提示词模板后可定义变量、执行渲染测试并发布不可变版本。"
            title="暂无提示词模板"
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {['模板', '类型', '状态', '版本', '变量', '测试', '智能体', '更新时间', '操作'].map((column) => (
                      <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {prompts.map((prompt, index) => (
                    <motion.tr
                      animate={{ opacity: 1, y: 0 }}
                      className="border-b transition-colors last:border-0 hover:bg-muted/25"
                      initial={{ opacity: 0, y: 8 }}
                      key={prompt.id}
                      transition={{ delay: index * 0.025, duration: 0.22 }}
                    >
                      <td className="px-4 py-3">
                        <div className="grid max-w-md gap-1">
                          <Link className="font-medium hover:text-primary" href={`/prompts/${prompt.id}`}>
                            {prompt.name}
                          </Link>
                          <span className="text-xs text-muted-foreground">{prompt.code}</span>
                          <span className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                            {prompt.content_preview}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{promptTypeLabel(prompt.type)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={promptStatusTone(prompt.status)}>{promptStatusLabel(prompt.status)}</StatusBadge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">v{prompt.version}</td>
                      <td className="px-4 py-3 text-muted-foreground">{prompt.variable_count}</td>
                      <td className="px-4 py-3 text-muted-foreground">{prompt.test_count}</td>
                      <td className="px-4 py-3 text-muted-foreground">{prompt.agent_reference_count}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(prompt.updated_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/prompts/${prompt.id}`}>
                              <Eye className="size-4" />
                              查看
                            </Link>
                          </Button>
                          <Button
                            asChild
                            aria-disabled={!canWrite}
                            className={!canWrite ? 'pointer-events-none opacity-60' : undefined}
                            size="sm"
                            variant="outline"
                          >
                            <Link href={`/prompts/${prompt.id}/edit`}>
                              <Edit className="size-4" />
                              编辑
                            </Link>
                          </Button>
                          <Button
                            disabled={!canWrite || copyMutation.isPending}
                            onClick={() => setCopyTarget(prompt)}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            <Copy className="size-4" />
                            复制
                          </Button>
                          <Button
                            disabled={!canWrite}
                            onClick={() => setDeleteTarget(prompt)}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            <Trash2 className="size-4" />
                            删除
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t p-4">
              <PaginationBar onPageChange={setPage} page={page} pageCount={pageCount} total={total} />
            </div>
          </>
        )}
      </Card>

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
      <div className="text-sm text-muted-foreground">
        第 {page} / {pageCount} 页 · 共 {total} 条
      </div>
      <div className="flex items-center gap-2">
        <Button
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          size="sm"
          type="button"
          variant="outline"
        >
          <ChevronLeft className="size-4" />
          上一页
        </Button>
        <Button
          disabled={page >= pageCount}
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
          size="sm"
          type="button"
          variant="outline"
        >
          下一页
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
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
        <h2 className="text-lg font-semibold">{title}</h2>
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
