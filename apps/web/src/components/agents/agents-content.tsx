'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission, type AgentListItem, type AgentStatus } from '@aiaget/shared-types';
import { Edit, Eye, Plus, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { AgentConfirmDialog } from '@/components/agents/agent-confirm-dialog';
import { useAuth } from '@/components/auth/auth-provider';
import { agentStatusLabel, agentStatusTone, formatDateTime } from '@/components/agents/agent-status';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  deleteAgent,
  listAgentCategories,
  listAgents,
  listUsers,
} from '@/lib/api-client';

const statusOptions: AgentStatus[] = ['DRAFT', 'TESTING', 'PENDING', 'PUBLISHED', 'DISABLED', 'ARCHIVED'];

export function AgentsContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AgentListItem | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'agent:agent:manage'),
  );

  const agentsQuery = useQuery({
    queryKey: ['agents', keyword, status, categoryId, ownerId],
    queryFn: () =>
      listAgents({
        page: 1,
        page_size: 20,
        keyword,
        status,
        category_id: categoryId,
        owner_id: ownerId,
      }),
  });
  const categoriesQuery = useQuery({
    queryKey: ['agent-categories'],
    queryFn: listAgentCategories,
  });
  const ownersQuery = useQuery({
    queryKey: ['agent-owners'],
    queryFn: () =>
      listUsers({
        page: 1,
        page_size: 100,
        status: 'ACTIVE',
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAgent,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['agents'] });
      setDeleteTarget(null);
    },
  });

  const agents = agentsQuery.data?.items ?? [];
  const categories = categoriesQuery.data ?? [];
  const owners = ownersQuery.data?.items ?? [];
  const metrics = useMemo(
    () => [
      { label: '智能体', value: `${agentsQuery.data?.total ?? 0}`, helper: '租户范围' },
      {
        label: '已发布',
        value: `${agents.filter((agent) => agent.status === 'PUBLISHED').length}`,
        helper: '当前页',
      },
      {
        label: '草稿',
        value: `${agents.filter((agent) => agent.status === 'DRAFT').length}`,
        helper: '当前页',
      },
      {
        label: '已停用',
        value: `${agents.filter((agent) => agent.status === 'DISABLED').length}`,
        helper: '当前页',
      },
    ],
    [agents, agentsQuery.data?.total],
  );

  function clearFilters() {
    setKeyword('');
    setStatus('');
    setCategoryId('');
    setOwnerId('');
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="healthy">智能体增删改查</StatusBadge>
            <StatusBadge tone="planned">版本化发布</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">智能体配置中心</h1>
        </div>
        <Button asChild aria-disabled={!canWrite} className={!canWrite ? 'pointer-events-none opacity-60' : undefined}>
          <Link href="/agents/create">
            <Plus className="size-4" />
            新建智能体
          </Link>
        </Button>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      <section className="rounded-lg border bg-background">
        <div className="border-b p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-sm font-semibold">智能体</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  搜索、筛选、创建、编辑、删除，并打开完整智能体详情。
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                显示 {agents.length} / {agentsQuery.data?.total ?? 0}
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_180px_220px_220px_auto]">
              <label className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
                <Search className="size-4 text-muted-foreground" />
                <input
                  className="min-w-0 flex-1 bg-transparent outline-none"
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="搜索名称、编码、描述"
                  value={keyword}
                />
              </label>
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                onChange={(event) => setStatus(event.target.value)}
                value={status}
              >
                <option value="">全部状态</option>
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {agentStatusLabel(option)}
                  </option>
                ))}
              </select>
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                onChange={(event) => setCategoryId(event.target.value)}
                value={categoryId}
              >
                <option value="">全部分类</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                onChange={(event) => setOwnerId(event.target.value)}
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

        {agentsQuery.isError ? (
          <div className="p-6 text-sm text-destructive">智能体加载失败。</div>
        ) : agentsQuery.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">正在加载智能体...</div>
        ) : agents.length === 0 ? (
          <div className="p-10 text-center">
            <div className="font-medium">暂无智能体</div>
            <p className="mt-2 text-sm text-muted-foreground">
              新建智能体，或调整关键词、状态、分类和负责人筛选。
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {['智能体', '状态', '分类', '版本', '默认模型', '负责人', '更新时间', '操作'].map(
                    (column) => (
                      <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                        {column}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr className="border-b last:border-0" key={agent.id}>
                    <td className="px-4 py-3">
                      <Link className="grid max-w-sm gap-1 text-left transition-colors hover:text-blue-700" href={`/agents/${agent.id}`}>
                        <span className="font-medium">{agent.name}</span>
                        <span className="text-xs text-muted-foreground">{agent.code}</span>
                        {agent.description ? (
                          <span className="line-clamp-1 text-xs text-muted-foreground">{agent.description}</span>
                        ) : null}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={agentStatusTone(agent.status)}>{agentStatusLabel(agent.status)}</StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{agent.category?.name ?? '-'}</td>
                    <td className="px-4 py-3 font-medium">v{agent.version}</td>
                    <td className="px-4 py-3 text-muted-foreground">{agent.default_model ?? '未绑定'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{agent.owner?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(agent.updated_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button asChild size="sm" title="详情" variant="outline">
                          <Link href={`/agents/${agent.id}`}>
                            <Eye className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          asChild
                          aria-disabled={!canWrite}
                          className={!canWrite ? 'pointer-events-none opacity-60' : undefined}
                          size="sm"
                          title="编辑"
                          variant="outline"
                        >
                          <Link href={`/agents/${agent.id}/edit`}>
                            <Edit className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          disabled={!canWrite}
                          onClick={() => setDeleteTarget(agent)}
                          size="sm"
                          title="删除"
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
        )}
      </section>

      {deleteTarget ? (
        <AgentConfirmDialog
          body={`这会软删除「${deleteTarget.name}」，并保留版本和审计历史。已发布入口和绑定关系会受到影响。`}
          confirmLabel="确认删除"
          pending={deleteMutation.isPending}
          title="删除智能体？"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        />
      ) : null}
    </main>
  );
}
