'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission, type ToolListItem, type ToolRiskLevel, type ToolStatus, type ToolType } from '@aiaget/shared-types';
import { motion } from 'motion/react';
import { Copy, Edit, Eye, Plus, Power, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { ToolCenterBackground } from '@/components/tools/tool-center-background';
import {
  formatDateTime,
  formatPercent,
  toolAuthLabel,
  toolCallStatusLabel,
  toolMethodLabel,
  toolRiskLabel,
  toolStatusLabel,
  toolStatusTone,
  toolTypeLabel,
} from '@/components/tools/tool-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { copyTool, deleteTool, disableTool, enableTool, listTools, type ApiClientError } from '@/lib/api-client';

const toolTypes: ToolType[] = ['HTTP'];
const toolStatuses: ToolStatus[] = ['ACTIVE', 'DISABLED', 'DELETED'];
const riskLevels: ToolRiskLevel[] = ['LOW', 'MEDIUM', 'HIGH'];

export function ToolContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [toolType, setToolType] = useState('');
  const [status, setStatus] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [copyTarget, setCopyTarget] = useState<ToolListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ToolListItem | null>(null);
  const [statusTarget, setStatusTarget] = useState<ToolListItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'tool:definition:manage'),
  );

  const toolsQuery = useQuery({
    queryKey: ['tools', keyword, toolType, status, riskLevel],
    queryFn: () =>
      listTools({
        page: 1,
        page_size: 20,
        keyword,
        tool_type: toolType,
        status,
        risk_level: riskLevel,
      }),
  });

  const tools = toolsQuery.data?.items ?? [];
  const total = toolsQuery.data?.total ?? 0;

  const metrics = useMemo(() => {
    const activeCount = tools.filter((tool) => tool.status === 'ACTIVE').length;
    const callsToday = tools.reduce((sum, tool) => sum + tool.call_count_today, 0);
    const failuresToday = tools.reduce((sum, tool) => sum + tool.failure_count_today, 0);
    const failureRate = callsToday === 0 ? 0 : (failuresToday / callsToday) * 100;

    return [
      { label: '工具', value: `${total}`, helper: '租户范围' },
      { label: '已启用', value: `${activeCount}`, helper: '当前页' },
      { label: '今日调用', value: `${callsToday}`, helper: '当前页' },
      { label: '失败率', value: formatPercent(failureRate), helper: '当前页' },
    ];
  }, [tools, total]);

  const copyMutation = useMutation({
    mutationFn: copyTool,
    onSuccess: async (tool) => {
      queryClient.setQueryData(['tool', tool.id], tool);
      await queryClient.invalidateQueries({ queryKey: ['tools'] });
      setCopyTarget(null);
      setStatusTarget(null);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: 'ACTIVE' | 'DISABLED' }) =>
      nextStatus === 'ACTIVE' ? enableTool(id) : disableTool(id),
    onSuccess: async (tool) => {
      queryClient.setQueryData(['tool', tool.id], tool);
      await queryClient.invalidateQueries({ queryKey: ['tools'] });
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTool,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tools'] });
      setDeleteTarget(null);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  function clearFilters() {
    setKeyword('');
    setToolType('');
    setStatus('');
    setRiskLevel('');
  }

  function confirmCopyTool() {
    if (!copyTarget) return;
    copyMutation.mutate(copyTarget.id);
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <ToolCenterBackground />

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
      >
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">工具中心</StatusBadge>
            <StatusBadge tone="healthy">HTTP 工具</StatusBadge>
            <StatusBadge tone="planned">调用日志</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">工具中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">HTTP 工具、鉴权方式、风险等级、调用统计和智能体引用。</p>
        </div>
        {canWrite ? (
          <Button asChild className="w-full md:w-auto">
            <Link href="/tools/create">
              <Plus className="size-4" />
              新建工具
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
                <h2 className="text-sm font-semibold">工具清单</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  名称、方法、鉴权、风险、状态、今日调用和最近调用。
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                显示 {tools.length} / {total}
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_140px_160px_160px_auto]">
              <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
                <Search className="size-4 text-muted-foreground" />
                <input
                  className="min-w-0 flex-1 bg-transparent outline-none"
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="搜索名称、编码、链接"
                  value={keyword}
                />
              </label>
              <select
                className="h-9 rounded-md border bg-background/80 px-3 text-sm"
                onChange={(event) => setToolType(event.target.value)}
                value={toolType}
              >
                <option value="">全部类型</option>
                {toolTypes.map((type) => (
                  <option key={type} value={type}>
                    {toolTypeLabel(type)}
                  </option>
                ))}
              </select>
              <select
                className="h-9 rounded-md border bg-background/80 px-3 text-sm"
                onChange={(event) => setStatus(event.target.value)}
                value={status}
              >
                <option value="">全部状态</option>
                {toolStatuses.map((toolStatus) => (
                  <option key={toolStatus} value={toolStatus}>
                    {toolStatusLabel(toolStatus)}
                  </option>
                ))}
              </select>
              <select
                className="h-9 rounded-md border bg-background/80 px-3 text-sm"
                onChange={(event) => setRiskLevel(event.target.value)}
                value={riskLevel}
              >
                <option value="">全部风险</option>
                {riskLevels.map((level) => (
                  <option key={level} value={level}>
                    {toolRiskLabel(level)}
                  </option>
                ))}
              </select>
              <Button onClick={clearFilters} type="button" variant="outline">
                清空
              </Button>
            </div>
          </div>
        </div>

        {toolsQuery.isError ? (
          <div className="p-6 text-sm text-destructive">工具加载失败。</div>
        ) : toolsQuery.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">正在加载工具...</div>
        ) : tools.length === 0 ? (
          <EmptyState
            action={
              canWrite ? (
                <Button asChild>
                  <Link href="/tools/create">
                    <Plus className="size-4" />
                    新建工具
                  </Link>
                </Button>
              ) : null
            }
            description="先创建一个 HTTP 工具，再配置结构、鉴权策略和测试输入。"
            title="暂无工具"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {['工具', '方法', '鉴权', '风险', '状态', '今日调用', '绑定智能体', '最近调用', '更新时间', '操作'].map((column) => (
                    <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tools.map((tool, index) => (
                  <motion.tr
                    animate={{ opacity: 1, y: 0 }}
                    className="border-b transition-colors last:border-0 hover:bg-muted/25"
                    initial={{ opacity: 0, y: 8 }}
                    key={tool.id}
                    transition={{ delay: index * 0.025, duration: 0.22 }}
                  >
                    <td className="px-4 py-3">
                      <div className="grid max-w-md gap-1">
                        <Link className="font-medium hover:text-primary" href={`/tools/${tool.id}`}>
                          {tool.name}
                        </Link>
                        <span className="text-xs text-muted-foreground">{tool.code}</span>
                        <span className="line-clamp-1 break-all text-xs text-muted-foreground">{tool.url}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{toolMethodLabel(tool.method)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{toolAuthLabel(tool.auth_type)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge tone={tool.risk_level === 'HIGH' ? 'degraded' : tool.risk_level === 'MEDIUM' ? 'planned' : 'healthy'}>
                          {toolRiskLabel(tool.risk_level)}
                        </StatusBadge>
                        {tool.require_approval ? <StatusBadge tone="degraded">需审批</StatusBadge> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={toolStatusTone(tool.status)}>{toolStatusLabel(tool.status)}</StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {tool.call_count_today}
                      <div className="text-xs">{tool.failure_count_today} 次失败</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{tool.agent_reference_count}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div>{tool.last_call_at ? formatDateTime(tool.last_call_at) : '暂无'}</div>
                      {tool.last_call_status ? (
                        <div className="mt-1 text-xs">{toolCallStatusLabel(tool.last_call_status)}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(tool.updated_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/tools/${tool.id}`}>
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
                          <Link href={`/tools/${tool.id}/edit`}>
                            <Edit className="size-4" />
                            编辑
                          </Link>
                        </Button>
                        <Button disabled={!canWrite || copyMutation.isPending} onClick={() => setCopyTarget(tool)} size="sm" variant="outline">
                          <Copy className="size-4" />
                          复制
                        </Button>
                        <Button
                          disabled={!canWrite || statusMutation.isPending || tool.status === 'DELETED'}
                          onClick={() => setStatusTarget(tool)}
                          size="sm"
                          variant="outline"
                        >
                          <Power className="size-4" />
                          {tool.status === 'ACTIVE' ? '停用' : '启用'}
                        </Button>
                        <Button disabled={!canWrite} onClick={() => setDeleteTarget(tool)} size="sm" variant="outline">
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
        )}
      </Card>

      {copyTarget ? (
        <ConfirmDialog
          body={`确认复制工具 ${copyTarget.name}？系统会创建一份新的工具配置副本，包含 HTTP 方法、鉴权、风险等级和 Schema 配置。`}
          confirmLabel="确认复制"
          onCancel={() => setCopyTarget(null)}
          onConfirm={confirmCopyTool}
          pending={copyMutation.isPending}
          title="确认复制工具"
        />
      ) : null}

      {deleteTarget ? (
        <ConfirmDialog
          body={`这会软删除 ${deleteTarget.name}，并保留已有调用日志。`}
          confirmLabel="确认删除"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          pending={deleteMutation.isPending}
          title="删除工具？"
        />
      ) : null}
      {statusTarget ? (
        <ConfirmDialog
          body={
            statusTarget.status === 'ACTIVE'
              ? `这会停用工具 ${statusTarget.name}，已绑定该工具的 Agent 将无法继续调用它。`
              : `这会启用工具 ${statusTarget.name}，已授权 Agent 将可以重新调用它。`
          }
          confirmLabel={statusTarget.status === 'ACTIVE' ? '确认停用' : '确认启用'}
          onCancel={() => setStatusTarget(null)}
          onConfirm={() =>
            statusMutation.mutate({
              id: statusTarget.id,
              nextStatus: statusTarget.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
            })
          }
          pending={statusMutation.isPending}
          title={statusTarget.status === 'ACTIVE' ? '停用工具？' : '启用工具？'}
        />
      ) : null}
    </main>
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
