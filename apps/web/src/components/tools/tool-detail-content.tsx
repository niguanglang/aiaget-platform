'use client';

import { hasPermission, type TestToolResult, type ToolDetail } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  copyTool,
  deleteTool,
  disableTool,
  enableTool,
  getTool,
  testTool,
  type ApiClientError,
} from '@/lib/api-client';

import { ToolCallLogsCard } from './tool-call-logs-card';
import { ToolConfirmDialog } from './tool-confirm-dialog';
import {
  ToolConfigCard,
  ToolPolicyCard,
  ToolReferencesCard,
  ToolSchemaCard,
  ToolUsageCard,
} from './tool-detail-cards';
import { ToolDetailHeader } from './tool-detail-header';
import { createInputDefaultsFromSchema, parseJsonObjectText, stringifyJson } from './tool-json';
import { ToolStatTile } from './tool-stat-tile';
import { ToolTestPanel } from './tool-test-panel';

export function ToolDetailContent({ toolId }: { toolId: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { currentUser } = useAuth();
  const [deleteTarget, setDeleteTarget] = useState<ToolDetail | null>(null);
  const [statusTarget, setStatusTarget] = useState<'ACTIVE' | 'DISABLED' | null>(null);
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
      setStatusTarget(null);
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
      <main className="mx-auto max-w-[1536px] rounded-xl border border-slate-200/80 bg-white/[0.9] px-4 py-6 lg:px-7">
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">正在加载工具详情...</div>
        </Card>
      </main>
    );
  }

  if (toolQuery.isError || !tool) {
    return (
      <main className="mx-auto grid max-w-[1536px] gap-4 rounded-xl border border-slate-200/80 bg-white/[0.9] px-4 py-6 lg:px-7">
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
    <main className="mx-auto grid max-w-[1536px] gap-6 rounded-xl border border-slate-200/80 bg-white/[0.9] px-4 py-6 lg:px-7">
      <ToolDetailHeader
        canWrite={canWrite}
        copyPending={copyMutation.isPending}
        statusPending={statusMutation.isPending}
        tool={tool}
        toolId={toolId}
        onCopy={() => copyMutation.mutate(tool.id)}
        onDelete={() => setDeleteTarget(tool)}
        onToggleStatus={() => setStatusTarget(tool.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE')}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <ToolStatTile helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      {actionError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <ToolConfigCard tool={tool} />
        <ToolPolicyCard tool={tool} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <ToolSchemaCard schema={tool.input_schema} title="输入结构" />
        <ToolSchemaCard schema={tool.output_schema} title="输出结构" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <ToolTestPanel
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
        <ToolCallLogsCard logs={tool.call_logs} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <ToolReferencesCard tool={tool} />
        <ToolUsageCard tool={tool} />
      </section>

      {deleteTarget ? (
        <ToolConfirmDialog
          body={`这会软删除 ${deleteTarget.name}，并保留已有调用日志。`}
          confirmLabel="删除"
          pending={deleteMutation.isPending}
          title="删除工具？"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        />
      ) : null}
      {statusTarget ? (
        <ToolConfirmDialog
          body={
            statusTarget === 'DISABLED'
              ? `这会停用工具 ${tool.name}，已绑定该工具的 Agent 将无法继续调用它。`
              : `这会启用工具 ${tool.name}，已授权 Agent 将可以重新调用它。`
          }
          confirmLabel={statusTarget === 'DISABLED' ? '确认停用' : '确认启用'}
          pending={statusMutation.isPending}
          title={statusTarget === 'DISABLED' ? '停用工具？' : '启用工具？'}
          onCancel={() => setStatusTarget(null)}
          onConfirm={() => statusMutation.mutate(statusTarget)}
        />
      ) : null}
    </main>
  );
}
