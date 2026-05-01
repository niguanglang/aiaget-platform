'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  hasPermission,
  type CreateToolInput,
  TestToolResult,
  ToolDetail,
  ToolListItem,
  ToolRiskLevel,
  ToolStatus,
  ToolType,
  UpdateToolInput,
} from '@aiaget/shared-types';
import { motion } from 'motion/react';
import { Copy, Edit, Eye, Plus, Power, Search, Send, Trash2, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import {
  createInputDefaultsFromSchema,
  parseJsonObjectText,
  parseJsonStringRecordText,
  stringifyJson,
} from '@/components/tools/tool-json';
import { ToolCenterBackground } from '@/components/tools/tool-center-background';
import { ToolFormPanel, type ToolFormValues } from '@/components/tools/tool-form-panel';
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
import {
  copyTool,
  createTool,
  deleteTool,
  disableTool,
  enableTool,
  getTool,
  listTools,
  testTool,
  updateTool,
  type ApiClientError,
} from '@/lib/api-client';

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
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingTool, setEditingTool] = useState<ToolDetail | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ToolListItem | ToolDetail | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [quickTestInput, setQuickTestInput] = useState('{}');
  const [quickTestResult, setQuickTestResult] = useState<TestToolResult | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'tool:definition:manage'),
  );
  const canExecute = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'tool:call:execute'),
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
  const activeToolId = selectedToolId ?? tools[0]?.id ?? null;

  const selectedToolQuery = useQuery({
    enabled: Boolean(activeToolId),
    queryKey: ['tool', activeToolId],
    queryFn: () => getTool(activeToolId ?? ''),
  });

  const selectedTool = selectedToolQuery.data ?? null;

  useEffect(() => {
    if (!selectedTool) return;

    setQuickTestInput(stringifyJson(createInputDefaultsFromSchema(selectedTool.input_schema)));
    setQuickTestResult(null);
    setTestError(null);
  }, [selectedTool]);

  const metrics = useMemo(() => {
    const activeCount = tools.filter((tool) => tool.status === 'ACTIVE').length;
    const callsToday = tools.reduce((sum, tool) => sum + tool.call_count_today, 0);
    const failuresToday = tools.reduce((sum, tool) => sum + tool.failure_count_today, 0);
    const failureRate = callsToday === 0 ? 0 : (failuresToday / callsToday) * 100;

    return [
      { label: '工具', value: `${toolsQuery.data?.total ?? 0}`, helper: '租户范围' },
      { label: '已启用', value: `${activeCount}`, helper: '当前页' },
      { label: '今日调用', value: `${callsToday}`, helper: '当前页' },
      { label: '失败率', value: formatPercent(failureRate), helper: '当前页' },
    ];
  }, [tools, toolsQuery.data?.total]);

  const createMutation = useMutation({
    mutationFn: createTool,
    onSuccess: async (tool) => {
      await queryClient.invalidateQueries({ queryKey: ['tools'] });
      queryClient.setQueryData(['tool', tool.id], tool);
      setSelectedToolId(tool.id);
      closeForm();
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: UpdateToolInput }) => updateTool(id, values),
    onSuccess: async (tool) => {
      await refreshTool(tool);
      closeForm();
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  const copyMutation = useMutation({
    mutationFn: copyTool,
    onSuccess: async (tool) => {
      await refreshTool(tool);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: 'ACTIVE' | 'DISABLED' }) =>
      nextStatus === 'ACTIVE' ? enableTool(id) : disableTool(id),
    onSuccess: async (tool) => {
      await refreshTool(tool);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTool,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tools'] });
      if (deleteTarget?.id === selectedToolId) {
        setSelectedToolId(null);
      }
      setDeleteTarget(null);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const testMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) => testTool(id, { input }),
    onSuccess: async (result) => {
      setQuickTestResult(result);
      setTestError(null);
      if (activeToolId) {
        await queryClient.invalidateQueries({ queryKey: ['tool', activeToolId] });
      }
      await queryClient.invalidateQueries({ queryKey: ['tools'] });
    },
    onError: (error: ApiClientError) => setTestError(error.message),
  });

  async function refreshTool(tool: ToolDetail) {
    queryClient.setQueryData(['tool', tool.id], tool);
    await queryClient.invalidateQueries({ queryKey: ['tools'] });
    setSelectedToolId(tool.id);
  }

  function openCreateForm() {
    setFormError(null);
    setEditingTool(null);
    setFormMode('create');
  }

  async function openEditForm(tool: ToolListItem | ToolDetail) {
    setFormError(null);
    const detail =
      'headers' in tool
        ? tool
        : await queryClient.fetchQuery({
            queryKey: ['tool', tool.id],
            queryFn: () => getTool(tool.id),
          });

    setEditingTool(detail);
    setFormMode('edit');
  }

  function closeForm() {
    setFormError(null);
    setFormMode(null);
    setEditingTool(null);
  }

  function submitForm(values: ToolFormValues) {
    setFormError(null);
    if (formMode === 'create') {
      const payload = toCreateToolInput(values);
      if (!payload.ok) {
        setFormError(payload.message);
        return;
      }
      createMutation.mutate(payload.value);
      return;
    }

    if (editingTool) {
      const payload = toUpdateToolInput(values);
      if (!payload.ok) {
        setFormError(payload.message);
        return;
      }
      updateMutation.mutate({ id: editingTool.id, values: payload.value });
    }
  }

  function runQuickTest() {
    if (!activeToolId) return;

    const parsed = parseJsonObjectText(quickTestInput, '测试输入');
    if (!parsed.ok) {
      setTestError(parsed.message);
      return;
    }

    testMutation.mutate({ id: activeToolId, input: parsed.value ?? {} });
  }

  function clearFilters() {
    setKeyword('');
    setToolType('');
    setStatus('');
    setRiskLevel('');
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
            <StatusBadge tone="ready">M07</StatusBadge>
            <StatusBadge tone="healthy">HTTP 工具</StatusBadge>
            <StatusBadge tone="planned">结构校验</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">工具中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            管理租户 HTTP 工具、输入输出结构、鉴权方式、风险策略，并运行真实测试调用。
          </p>
        </div>
        <Button className="w-full md:w-auto" disabled={!canWrite} onClick={openCreateForm}>
          <Plus className="size-4" />
          新建工具
        </Button>
      </motion.section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      {actionError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <section className="grid min-w-0 gap-4 xl:grid-cols-[1.32fr_0.88fr]">
        <Card className="min-w-0">
          <div className="border-b p-4">
            <div className="grid gap-4">
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                <div>
                  <h2 className="text-sm font-semibold">工具清单</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    搜索、筛选、复制、启停工具，并进入完整配置与调用详情。
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  显示 {tools.length} / {toolsQuery.data?.total ?? 0}
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
                <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setToolType(event.target.value)} value={toolType}>
                  <option value="">全部类型</option>
                  {toolTypes.map((type) => (
                    <option key={type} value={type}>
                      {toolTypeLabel(type)}
                    </option>
                  ))}
                </select>
                <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setStatus(event.target.value)} value={status}>
                  <option value="">全部状态</option>
                  {toolStatuses.map((toolStatus) => (
                    <option key={toolStatus} value={toolStatus}>
                      {toolStatusLabel(toolStatus)}
                    </option>
                  ))}
                </select>
                <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setRiskLevel(event.target.value)} value={riskLevel}>
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
                <Button disabled={!canWrite} onClick={openCreateForm}>
                  <Plus className="size-4" />
                  新建工具
                </Button>
              }
              description="先创建一个 HTTP 工具，再配置结构、鉴权和测试输入。"
              title="暂无工具"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {['工具', '方法', '风险', '状态', '今日调用', '绑定智能体', '最近调用', '更新时间', '操作'].map((column) => (
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
                        <button className="grid max-w-sm gap-1 text-left" onClick={() => setSelectedToolId(tool.id)} type="button">
                          <span className="font-medium">{tool.name}</span>
                          <span className="text-xs text-muted-foreground">{tool.code}</span>
                          <span className="line-clamp-1 text-xs text-muted-foreground">{tool.url}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{toolMethodLabel(tool.method)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={tool.risk_level === 'HIGH' ? 'degraded' : tool.risk_level === 'MEDIUM' ? 'planned' : 'healthy'}>
                          {toolRiskLabel(tool.risk_level)}
                        </StatusBadge>
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
                        {tool.last_call_at ? formatDateTime(tool.last_call_at) : '暂无'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(tool.updated_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button asChild size="sm" title="打开详情" variant="outline">
                            <Link href={`/tools/${tool.id}`}>
                              <Eye className="size-4" />
                            </Link>
                          </Button>
                          <Button disabled={!canWrite} onClick={() => void openEditForm(tool)} size="sm" title="编辑" variant="outline">
                            <Edit className="size-4" />
                          </Button>
                          <Button disabled={!canWrite || copyMutation.isPending} onClick={() => copyMutation.mutate(tool.id)} size="sm" title="复制" variant="outline">
                            <Copy className="size-4" />
                          </Button>
                          <Button
                            disabled={!canWrite || statusMutation.isPending}
                            onClick={() => statusMutation.mutate({ id: tool.id, nextStatus: tool.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' })}
                            size="sm"
                            title={tool.status === 'ACTIVE' ? '停用' : '启用'}
                            variant="outline"
                          >
                            <Power className="size-4" />
                          </Button>
                          <Button disabled={!canWrite} onClick={() => setDeleteTarget(tool)} size="sm" title="删除" variant="outline">
                            <Trash2 className="size-4" />
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

        <ToolQuickPanel
          canExecute={canExecute}
          error={testError}
          inputText={quickTestInput}
          loading={selectedToolQuery.isLoading}
          onChangeInput={setQuickTestInput}
          onLoadDefaults={() => setQuickTestInput(stringifyJson(createInputDefaultsFromSchema(selectedTool?.input_schema)))}
          onRun={runQuickTest}
          pending={testMutation.isPending}
          result={quickTestResult}
          tool={selectedTool}
        />
      </section>

      {formMode ? (
        <ToolFormPanel
          error={formError}
          isPending={createMutation.isPending || updateMutation.isPending}
          mode={formMode}
          onClose={closeForm}
          onSubmit={submitForm}
          tool={editingTool}
        />
      ) : null}

      {deleteTarget ? (
        <ConfirmDialog
          body={`这会软删除 ${deleteTarget.name}，并保留已有调用日志。`}
          pending={deleteMutation.isPending}
          title="删除工具？"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        />
      ) : null}
    </main>
  );
}

function ToolQuickPanel({
  canExecute,
  error,
  inputText,
  loading,
  onChangeInput,
  onLoadDefaults,
  onRun,
  pending,
  result,
  tool,
}: {
  canExecute: boolean;
  error: string | null;
  inputText: string;
  loading: boolean;
  onChangeInput: (value: string) => void;
  onLoadDefaults: () => void;
  onRun: () => void;
  pending: boolean;
  result: TestToolResult | null;
  tool: ToolDetail | null;
}) {
  if (loading) {
    return (
      <Card className="min-w-0 p-5">
        <div className="text-sm text-muted-foreground">正在加载选中工具...</div>
      </Card>
    );
  }

  if (!tool) {
    return (
      <Card className="min-w-0 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Wrench className="size-4" />
          选中的工具
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          选择一条工具记录后，可快速查看配置摘要并运行测试。
        </p>
      </Card>
    );
  }

  return (
    <Card className="grid min-w-0 gap-5 p-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={toolStatusTone(tool.status)}>{toolStatusLabel(tool.status)}</StatusBadge>
          <StatusBadge tone={tool.risk_level === 'HIGH' ? 'degraded' : tool.risk_level === 'MEDIUM' ? 'planned' : 'healthy'}>
            {toolRiskLabel(tool.risk_level)}
          </StatusBadge>
          <StatusBadge tone="planned">{toolMethodLabel(tool.method)}</StatusBadge>
        </div>
        <h2 className="mt-3 text-base font-semibold">{tool.name}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{tool.code}</p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{tool.description ?? '暂无描述。'}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <SummaryTile label="类型" value={toolTypeLabel(tool.tool_type)} />
        <SummaryTile label="鉴权" value={toolAuthLabel(tool.auth_type)} />
        <SummaryTile label="超时" value={`${tool.timeout_ms} ms`} />
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">快速测试</h3>
          <Button onClick={onLoadDefaults} size="sm" type="button" variant="outline">
            加载默认值
          </Button>
        </div>
        <textarea
          className="min-h-36 resize-y rounded-md border bg-slate-950 px-3 py-3 font-mono text-sm leading-6 text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onChange={(event) => onChangeInput(event.target.value)}
          spellCheck={false}
          value={inputText}
        />
        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        <Button disabled={!canExecute || pending} onClick={onRun} type="button">
          <Send className="size-4" />
          运行测试
        </Button>
        <Button asChild type="button" variant="outline">
          <Link href={`/tools/${tool.id}`}>
            <Eye className="size-4" />
            打开完整详情
          </Link>
        </Button>
      </div>

      {result ? (
        <div className="rounded-md border bg-muted/25 p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">最近结果</h3>
            <StatusBadge tone={toolStatusTone(result.status)}>{toolCallStatusLabel(result.status)}</StatusBadge>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {result.response_status ? `HTTP ${result.response_status}` : '无响应状态'} · {result.latency_ms} ms
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {result.approval_required
              ? '当前工具为高风险并要求审批，本次测试已创建审批请求。'
              : result.error_message ?? '测试已完成。'}
          </p>
          {result.approval_request_id ? (
            <div className="mt-3">
              <Button asChild size="sm" variant="outline">
                <Link href={`/approvals?requestId=${result.approval_request_id}`}>打开审批请求</Link>
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/25 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

function ConfirmDialog({
  body,
  pending,
  title,
  onCancel,
  onConfirm,
}: {
  body: string;
  pending: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <section className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-sm rounded-lg border bg-background p-6 shadow-xl">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={onCancel} variant="outline">
            取消
          </Button>
          <Button disabled={pending} onClick={onConfirm} variant="destructive">
            删除
          </Button>
        </div>
      </div>
    </section>
  );
}

function toCreateToolInput(values: ToolFormValues): { ok: true; value: CreateToolInput } | { ok: false; message: string } {
  const headers = parseJsonStringRecordText(values.headers_text, '默认请求头', { allowEmpty: true });
  if (!headers.ok) return headers;

  const authConfig = parseJsonObjectText(values.auth_config_text, '鉴权配置', { allowEmpty: true });
  if (!authConfig.ok) return authConfig;

  const inputSchema = parseJsonObjectText(values.input_schema_text, '输入结构', { allowEmpty: true });
  if (!inputSchema.ok) return inputSchema;

  const outputSchema = parseJsonObjectText(values.output_schema_text, '输出结构', { allowEmpty: true });
  if (!outputSchema.ok) return outputSchema;

  return {
    ok: true as const,
    value: {
      name: values.name,
      code: values.code,
      description: nullableText(values.description),
      method: values.method,
      url: values.url,
      risk_level: values.risk_level,
      timeout_ms: values.timeout_ms,
      require_approval: values.require_approval,
      auth_type: values.auth_type,
      headers: headers.value,
      auth_config: authConfig.value,
      input_schema: inputSchema.value,
      output_schema: outputSchema.value,
    },
  };
}

function toUpdateToolInput(values: ToolFormValues): { ok: true; value: UpdateToolInput } | { ok: false; message: string } {
  const created = toCreateToolInput(values);
  if (!created.ok) return created;

  return {
    ok: true,
    value: {
      ...created.value,
      status: values.status,
    },
  };
}

function nullableText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
