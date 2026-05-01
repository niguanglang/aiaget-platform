'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission, type TestToolResult, type ToolDetail, type UpdateToolInput } from '@aiaget/shared-types';
import { motion } from 'motion/react';
import { ArrowLeft, Copy, Edit, Power, Send, ShieldAlert, Trash2, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  formatLatency,
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
  deleteTool,
  disableTool,
  enableTool,
  getTool,
  testTool,
  updateTool,
  type ApiClientError,
} from '@/lib/api-client';

export function ToolDetailContent({ toolId }: { toolId: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ToolDetail | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [testInput, setTestInput] = useState('{}');
  const [testResult, setTestResult] = useState<TestToolResult | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'tool:definition:manage'),
  );
  const canExecute = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'tool:call:execute'),
  );

  const toolQuery = useQuery({
    queryKey: ['tool', toolId],
    queryFn: () => getTool(toolId),
  });

  const tool = toolQuery.data ?? null;

  useEffect(() => {
    if (!tool) return;

    setTestInput(stringifyJson(createInputDefaultsFromSchema(tool.input_schema)));
    setTestResult(null);
    setTestError(null);
  }, [tool]);

  const metrics = useMemo(() => {
    if (!tool) return [];

    const failureCount = tool.call_logs.filter((log) => log.status === 'FAILED').length;
    const approvalCount = tool.call_logs.filter((log) => log.status === 'APPROVAL_REQUIRED').length;

    return [
      { label: '今日调用', value: `${tool.call_count_today}`, helper: '列表聚合' },
      { label: '最近日志', value: `${tool.call_logs.length}`, helper: '最新 20 条' },
      { label: '失败', value: `${failureCount}`, helper: '最近 20 条' },
      { label: '待审批', value: `${approvalCount}`, helper: '最近 20 条' },
    ];
  }, [tool]);

  const updateMutation = useMutation({
    mutationFn: (values: UpdateToolInput) => updateTool(toolId, values),
    onSuccess: async (result) => {
      await refreshTool(result);
      setIsEditing(false);
      setFormError(null);
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  const copyMutation = useMutation({
    mutationFn: copyTool,
    onSuccess: async (result) => {
      queryClient.setQueryData(['tool', result.id], result);
      await queryClient.invalidateQueries({ queryKey: ['tools'] });
      router.push(`/tools/${result.id}`);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const statusMutation = useMutation({
    mutationFn: (nextStatus: 'ACTIVE' | 'DISABLED') => (nextStatus === 'ACTIVE' ? enableTool(toolId) : disableTool(toolId)),
    onSuccess: async (result) => {
      await refreshTool(result);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTool,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tools'] });
      setDeleteTarget(null);
      router.push('/tools');
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const testMutation = useMutation({
    mutationFn: (input: Record<string, unknown>) => testTool(toolId, { input }),
    onSuccess: async (result) => {
      setTestResult(result);
      setTestError(null);
      await queryClient.invalidateQueries({ queryKey: ['tool', toolId] });
      await queryClient.invalidateQueries({ queryKey: ['tools'] });
    },
    onError: (error: ApiClientError) => setTestError(error.message),
  });

  async function refreshTool(result: ToolDetail) {
    queryClient.setQueryData(['tool', result.id], result);
    await queryClient.invalidateQueries({ queryKey: ['tools'] });
  }

  function submitForm(values: ToolFormValues) {
    setFormError(null);
    const payload = toUpdateToolInput(values);
    if (!payload.ok) {
      setFormError(payload.message);
      return;
    }

    updateMutation.mutate(payload.value);
  }

  function runTest() {
    const parsed = parseJsonObjectText(testInput, '测试输入');
    if (!parsed.ok) {
      setTestError(parsed.message);
      return;
    }

    testMutation.mutate(parsed.value ?? {});
  }

  if (toolQuery.isLoading) {
    return (
      <main className="relative mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <ToolCenterBackground />
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">正在加载工具详情...</div>
        </Card>
      </main>
    );
  }

  if (toolQuery.isError || !tool) {
    return (
      <main className="relative mx-auto grid max-w-7xl gap-4 px-4 py-6 lg:px-6">
        <ToolCenterBackground />
        <Button asChild className="w-fit" variant="outline">
          <Link href="/tools">
            <ArrowLeft className="size-4" />
            返回工具中心
          </Link>
        </Button>
        <Card className="p-6">
          <div className="text-sm text-destructive">工具详情加载失败。</div>
        </Card>
      </main>
    );
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
        <div className="min-w-0">
          <Button asChild className="mb-4" size="sm" variant="outline">
            <Link href="/tools">
              <ArrowLeft className="size-4" />
              工具中心
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M07</StatusBadge>
            <StatusBadge tone={toolStatusTone(tool.status)}>{toolStatusLabel(tool.status)}</StatusBadge>
            <StatusBadge tone={tool.risk_level === 'HIGH' ? 'degraded' : tool.risk_level === 'MEDIUM' ? 'planned' : 'healthy'}>
              {toolRiskLabel(tool.risk_level)}
            </StatusBadge>
            <StatusBadge tone="planned">{toolMethodLabel(tool.method)}</StatusBadge>
          </div>
          <h1 className="break-words text-2xl font-semibold">{tool.name}</h1>
          <p className="mt-1 text-xs text-muted-foreground">{tool.code}</p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            {tool.description ?? '暂无描述。'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={!canWrite} onClick={() => setIsEditing(true)} variant="outline">
            <Edit className="size-4" />
            编辑
          </Button>
          <Button disabled={!canWrite || copyMutation.isPending} onClick={() => copyMutation.mutate(tool.id)} variant="outline">
            <Copy className="size-4" />
            复制
          </Button>
          <Button
            disabled={!canWrite || statusMutation.isPending}
            onClick={() => statusMutation.mutate(tool.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE')}
            variant="outline"
          >
            <Power className="size-4" />
            {tool.status === 'ACTIVE' ? '停用' : '启用'}
          </Button>
          <Button disabled={!canWrite} onClick={() => setDeleteTarget(tool)} variant="destructive">
            <Trash2 className="size-4" />
            删除
          </Button>
        </div>
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

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <ConfigCard tool={tool} />
        <PolicyCard tool={tool} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <SchemaCard schema={tool.input_schema} title="输入结构" />
        <SchemaCard schema={tool.output_schema} title="输出结构" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <TestPanel
          canExecute={canExecute}
          error={testError}
          inputText={testInput}
          onChangeInput={setTestInput}
          onLoadDefaults={() => setTestInput(stringifyJson(createInputDefaultsFromSchema(tool.input_schema)))}
          onRun={runTest}
          pending={testMutation.isPending}
          result={testResult}
          tool={tool}
        />
        <CallLogsCard logs={tool.call_logs} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <AgentReferencesCard tool={tool} />
        <UsageCard tool={tool} />
      </section>

      {isEditing ? (
        <ToolFormPanel
          error={formError}
          isPending={updateMutation.isPending}
          mode="edit"
          onClose={() => {
            setFormError(null);
            setIsEditing(false);
          }}
          onSubmit={submitForm}
          tool={tool}
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

function ConfigCard({ tool }: { tool: ToolDetail }) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Wrench className="size-4" />
        HTTP 配置
      </div>
      <div className="grid gap-3 text-sm md:grid-cols-2">
        <DetailRow label="工具类型" value={toolTypeLabel(tool.tool_type)} />
        <DetailRow label="请求方法" value={toolMethodLabel(tool.method)} />
        <DetailRow label="接口链接" value={tool.url} />
        <DetailRow label="超时毫秒" value={`${tool.timeout_ms}`} />
        <DetailRow label="更新时间" value={formatDateTime(tool.updated_at)} />
        <DetailRow label="最近调用" value={tool.last_call_at ? formatDateTime(tool.last_call_at) : '暂无'} />
      </div>
      <div className="rounded-md border bg-slate-950 p-3">
        <div className="mb-2 text-xs font-medium text-slate-300">默认请求头</div>
        <pre className="max-h-56 overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-100">
          {stringifyJson(tool.headers, '{}')}
        </pre>
      </div>
    </Card>
  );
}

function PolicyCard({ tool }: { tool: ToolDetail }) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <ShieldAlert className="size-4" />
        鉴权与风险策略
      </div>
      <div className="grid gap-3 text-sm md:grid-cols-2">
        <DetailRow label="工具状态" value={toolStatusLabel(tool.status)} />
        <DetailRow label="风险级别" value={toolRiskLabel(tool.risk_level)} />
        <DetailRow label="鉴权方式" value={toolAuthLabel(tool.auth_type)} />
        <DetailRow label="审批要求" value={tool.require_approval ? '需要审批' : '无需审批'} />
      </div>
      <div className="rounded-md border bg-slate-950 p-3">
        <div className="mb-2 text-xs font-medium text-slate-300">鉴权配置</div>
        <pre className="max-h-56 overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-100">
          {stringifyJson(tool.auth_config, '{}')}
        </pre>
      </div>
    </Card>
  );
}

function SchemaCard({ schema, title }: { schema: Record<string, unknown> | null; title: string }) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="text-sm font-semibold">{title}</div>
      <pre className="max-h-[480px] overflow-auto rounded-md border bg-slate-950 p-4 text-xs leading-6 text-slate-100">
        {stringifyJson(schema, '{}')}
      </pre>
    </Card>
  );
}

function TestPanel({
  canExecute,
  error,
  inputText,
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
  onChangeInput: (value: string) => void;
  onLoadDefaults: () => void;
  onRun: () => void;
  pending: boolean;
  result: TestToolResult | null;
  tool: ToolDetail;
}) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">测试面板</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            使用 JSON 输入运行真实 HTTP 测试，并将结果记录为调用日志。
          </p>
        </div>
        <Button onClick={onLoadDefaults} size="sm" type="button" variant="outline">
          加载默认值
        </Button>
      </div>

      <textarea
        className="min-h-56 resize-y rounded-md border bg-slate-950 px-3 py-3 font-mono text-sm leading-6 text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onChange={(event) => onChangeInput(event.target.value)}
        spellCheck={false}
        value={inputText}
      />
      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      <Button disabled={!canExecute || pending || tool.status !== 'ACTIVE'} onClick={onRun} type="button">
        <Send className="size-4" />
        运行测试
      </Button>

      {result ? (
        <div className="rounded-md border bg-muted/25 p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">最新测试结果</h3>
            <StatusBadge tone={toolStatusTone(result.status)}>{toolCallStatusLabel(result.status)}</StatusBadge>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {result.response_status ? `HTTP ${result.response_status}` : '无响应状态'} · {formatLatency(result.latency_ms)}
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {result.approval_required
              ? '当前工具为高风险并要求审批，本次测试已创建审批请求。'
              : result.error_message ?? '测试调用已完成。'}
          </p>
          <div className="mt-4 grid gap-3 xl:grid-cols-2">
            <PreviewCard title="请求体" value={result.request_body} />
            <PreviewCard title="响应体" value={result.response_body} />
          </div>
          {result.approval_request_id ? (
            <div className="mt-4">
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

function CallLogsCard({ logs }: { logs: ToolDetail['call_logs'] }) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">调用日志</h2>
        <span className="text-xs text-muted-foreground">{logs.length} 条</span>
      </div>
      {logs.length === 0 ? (
        <EmptyState description="运行测试后会在这里看到最新调用日志。" title="暂无调用日志" />
      ) : (
        <div className="grid max-h-[620px] gap-3 overflow-auto pr-1">
          {logs.map((log) => (
            <div className="rounded-md border bg-muted/20 p-3" key={log.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StatusBadge tone={toolStatusTone(log.status)}>{toolCallStatusLabel(log.status)}</StatusBadge>
                  <span className="text-xs text-muted-foreground">{log.request_method}</span>
                </div>
                <span className="text-xs text-muted-foreground">{formatDateTime(log.created_at)}</span>
              </div>
              <div className="mt-2 text-sm font-medium">{log.request_url}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {log.response_status ? `HTTP ${log.response_status}` : '无响应状态'} · {formatLatency(log.latency_ms)} · 操作人 {log.created_by?.email ?? '系统'}
              </div>
              {log.error_message ? <p className="mt-2 text-xs text-destructive">{log.error_message}</p> : null}
              {log.approval_request_id ? (
                <div className="mt-3">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/approvals?requestId=${log.approval_request_id}`}>打开审批请求</Link>
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function AgentReferencesCard({ tool }: { tool: ToolDetail }) {
  return (
    <Card className="grid gap-4 p-5">
      <h2 className="text-sm font-semibold">智能体引用</h2>
      {tool.agent_references.length === 0 ? (
        <p className="text-sm text-muted-foreground">暂无智能体绑定该工具。</p>
      ) : (
        <div className="grid gap-3">
          {tool.agent_references.map((reference) => (
            <div className="rounded-md border bg-muted/20 px-3 py-2" key={reference.id}>
              <div className="text-sm font-medium">{reference.agent_name}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {reference.agent_code} · {reference.require_approval ? '绑定时要求审批' : '绑定时无需审批'} · {formatDateTime(reference.created_at)}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function UsageCard({ tool }: { tool: ToolDetail }) {
  return (
    <Card className="grid gap-4 p-5">
      <h2 className="text-sm font-semibold">使用摘要</h2>
      <div className="grid gap-3 text-sm">
        <DetailRow label="今日调用" value={`${tool.call_count_today}`} />
        <DetailRow label="今日失败" value={`${tool.failure_count_today}`} />
        <DetailRow label="最近调用状态" value={tool.last_call_status ? toolCallStatusLabel(tool.last_call_status) : '暂无'} />
        <DetailRow label="绑定智能体" value={`${tool.agent_reference_count}`} />
      </div>
    </Card>
  );
}

function PreviewCard({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="mb-2 text-xs font-medium text-muted-foreground">{title}</div>
      <pre className="max-h-52 overflow-auto whitespace-pre-wrap break-words text-xs leading-5">
        {stringifyJson(value, 'null')}
      </pre>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-md border bg-muted/25 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="break-words font-medium">{value}</div>
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

function toUpdateToolInput(values: ToolFormValues): { ok: true; value: UpdateToolInput } | { ok: false; message: string } {
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
      description: nullableText(values.description),
      method: values.method,
      url: values.url,
      status: values.status,
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

function nullableText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
