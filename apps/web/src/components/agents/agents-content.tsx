'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission, type AgentListItem, type AgentStatus } from '@aiaget/shared-types';
import { Bot, BriefcaseBusiness, Edit, Eye, FileText, PauseCircle, Plus, RotateCcw, Search, Send, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { AgentConfirmDialog } from '@/components/agents/agent-confirm-dialog';
import { useAuth } from '@/components/auth/auth-provider';
import { agentStatusLabel, agentStatusTone, formatDateTime } from '@/components/agents/agent-status';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  deleteAgent,
  listAgentCategories,
  listAgents,
  listUsers,
} from '@/lib/api-client';

const statusOptions: AgentStatus[] = ['DRAFT', 'TESTING', 'PENDING', 'PUBLISHED', 'DISABLED', 'ARCHIVED'];

const avatarStyles = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-cyan-100 text-cyan-700',
  'bg-orange-100 text-orange-700',
] as const;

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
      {
        helper: '租户范围',
        icon: Bot,
        iconClassName: 'bg-blue-100 text-blue-700',
        label: '智能体',
        value: `${agentsQuery.data?.total ?? 0}`,
      },
      {
        helper: '当前页',
        icon: Send,
        iconClassName: 'bg-cyan-100 text-cyan-700',
        label: '已发布',
        value: `${agents.filter((agent) => agent.status === 'PUBLISHED').length}`,
      },
      {
        helper: '当前页',
        icon: FileText,
        iconClassName: 'bg-violet-100 text-violet-700',
        label: '草稿',
        value: `${agents.filter((agent) => agent.status === 'DRAFT').length}`,
      },
      {
        helper: '当前页',
        icon: PauseCircle,
        iconClassName: 'bg-orange-100 text-orange-700',
        label: '已停用',
        value: `${agents.filter((agent) => agent.status === 'DISABLED').length}`,
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
    <main className="mx-auto grid max-w-[1536px] gap-5 px-4 py-5 lg:px-7">
      <section className="flex flex-col justify-between gap-4 py-3 md:flex-row md:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">智能体配置中心</h1>
          <StatusBadge tone="healthy">租户范围</StatusBadge>
          <StatusBadge tone="planned">配置列表</StatusBadge>
        </div>
        <Button
          asChild
          aria-disabled={!canWrite}
          className={!canWrite ? 'pointer-events-none opacity-60' : 'bg-blue-600 px-5 shadow-[0_12px_26px_rgba(37,99,235,0.28)] hover:bg-blue-700'}
        >
          <Link href="/agents/create">
            <Plus className="size-4" />
            新建智能体
          </Link>
        </Button>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <div
              className="flex min-h-[138px] items-center gap-5 rounded-xl border border-slate-200/80 bg-white/[0.86] px-6 py-5 shadow-[0_16px_45px_rgba(15,23,42,0.06)] backdrop-blur-xl"
              key={metric.label}
            >
              <span className={`grid size-16 shrink-0 place-items-center rounded-full ${metric.iconClassName}`}>
                <Icon className="size-8" />
              </span>
              <div>
                <div className="text-sm font-medium text-slate-500">{metric.label}</div>
                <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{metric.value}</div>
                <div className="mt-2 text-sm text-muted-foreground">{metric.helper}</div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/[0.86] shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        <div className="border-b border-slate-200/80 px-5 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <h2 className="text-lg font-semibold text-slate-950">智能体</h2>
              <div className="text-sm text-muted-foreground">
                显示 {agents.length} / {agentsQuery.data?.total ?? 0}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_190px_220px_220px_140px]">
              <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm">
                <Search className="size-4 text-muted-foreground" />
                <input
                  className="min-w-0 flex-1 bg-transparent outline-none"
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="搜索名称、编码"
                  value={keyword}
                />
              </label>
              <select
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition-colors hover:border-blue-200"
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
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition-colors hover:border-blue-200"
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
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition-colors hover:border-blue-200"
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
              <Button className="h-10" onClick={clearFilters} type="button" variant="outline">
                <RotateCcw className="size-4" />
                清空
              </Button>
            </div>
          </div>
        </div>

        {agentsQuery.isError ? (
          <div className="p-6 text-sm text-destructive">加载失败。</div>
        ) : agentsQuery.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">正在加载...</div>
        ) : agents.length === 0 ? (
          <div className="p-10 text-center">
            <div className="font-medium">暂无数据</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70">
                  {['', '智能体', '状态', '分类', '版本', '默认模型', '负责人', '更新时间', '操作'].map(
                    (column) => (
                      <th className="px-5 py-4 font-medium text-slate-500" key={column || 'selection'}>
                        {column}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70" key={agent.id}>
                    <td className="px-5 py-4">
                      <input aria-label={`选择 ${agent.name}`} className="size-4 rounded border-slate-300" type="checkbox" />
                    </td>
                    <td className="px-5 py-4">
                      <Link className="flex max-w-sm items-center gap-3 text-left transition-colors hover:text-blue-700" href={`/agents/${agent.id}`}>
                        <AgentAvatar agent={agent} />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-slate-900">{agent.name}</span>
                          <span className="mt-1 block truncate text-xs text-muted-foreground">{agent.code}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge tone={agentStatusTone(agent.status)}>{agentStatusLabel(agent.status)}</StatusBadge>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{agent.category?.name ?? '-'}</td>
                    <td className="px-5 py-4 font-medium text-slate-900">v{agent.version}</td>
                    <td className="max-w-[190px] truncate px-5 py-4 text-muted-foreground">{agent.default_model ?? '未绑定'}</td>
                    <td className="px-5 py-4 text-muted-foreground">{agent.owner?.name ?? '-'}</td>
                    <td className="px-5 py-4 text-muted-foreground">{formatDateTime(agent.updated_at)}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <Button asChild className="size-9 rounded-lg p-0" size="sm" title="详情" variant="outline">
                          <Link href={`/agents/${agent.id}`}>
                            <Eye className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          asChild
                          aria-disabled={!canWrite}
                          className={canWrite ? 'size-9 rounded-lg p-0' : 'pointer-events-none size-9 rounded-lg p-0 opacity-60'}
                          size="sm"
                          title="编辑"
                          variant="outline"
                        >
                          <Link href={`/agents/${agent.id}/edit`}>
                            <Edit className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          className="size-9 rounded-lg p-0 text-red-600 hover:text-red-700"
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

function AgentAvatar({ agent }: { agent: AgentListItem }) {
  const styleIndex = Math.abs(hashText(agent.id || agent.code)) % avatarStyles.length;
  const Icon = styleIndex % 2 === 0 ? Bot : BriefcaseBusiness;

  return (
    <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${avatarStyles[styleIndex]}`}>
      <Icon className="size-5" />
    </span>
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
