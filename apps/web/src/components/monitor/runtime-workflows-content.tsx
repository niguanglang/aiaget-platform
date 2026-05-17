'use client';

import {
  hasPermission,
  type RuntimeWorkflowRecoverableTaskItem,
  type RuntimeWorkflowRetryResult,
  type RuntimeWorkflowStatusOverview,
  type RuntimeWorkflowTaskType,
} from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { WorkflowBackendCard } from '@/components/monitor/monitor-shared-panels';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { resolveControlApiBaseUrl } from '@/lib/control-api-base-url';

const controlApiBaseUrl = resolveControlApiBaseUrl();
type WorkflowRetryTarget = {
  task_type: RuntimeWorkflowTaskType;
  task_id: string;
};

export function RuntimeWorkflowsContent() {
  const queryClient = useQueryClient();
  const { currentUser, session } = useAuth();
  const [workflowRetryTarget, setWorkflowRetryTarget] = useState<WorkflowRetryTarget | null>(null);
  const permissions = currentUser?.user.permissions ?? [];
  const isTenantAdmin = Boolean(currentUser?.user.roles.some((role) => role.code === 'tenant_admin'));
  const canRetryKnowledgeWorkflow = isTenantAdmin || hasPermission(permissions, 'knowledge:base:manage');
  const canRetryChannelWorkflow = isTenantAdmin || hasPermission(permissions, 'channel:publish:deploy');
  const canRetryAgentTeamWorkflow = isTenantAdmin || hasPermission(permissions, 'agent:team:run');
  const canRetryPluginWorkflow = isTenantAdmin || hasPermission(permissions, 'plugin:center:manage');
  const workflowQuery = useQuery({
    enabled: Boolean(session?.accessToken),
    queryKey: ['runtime-workflow-status'],
    queryFn: () => getRuntimeWorkflowStatus(session?.accessToken ?? ''),
  });
  const retryWorkflowMutation = useMutation({
    mutationFn: (input: { task_type: RuntimeWorkflowTaskType; task_id: string }) => retryRuntimeWorkflowTask(session?.accessToken ?? '', input),
    onSuccess: () => {
      setWorkflowRetryTarget(null);
      void queryClient.invalidateQueries({ queryKey: ['runtime-workflow-status'] });
    },
  });

  function confirmWorkflowRetry() {
    if (!workflowRetryTarget) return;

    retryWorkflowMutation.mutate(workflowRetryTarget);
  }

  function canRetryWorkflowTask(task: RuntimeWorkflowRecoverableTaskItem) {
    if (task.task_type === 'knowledge_task') {
      return canRetryKnowledgeWorkflow;
    }

    if (task.task_type === 'agent_team_run') {
      return canRetryAgentTeamWorkflow;
    }

    if (task.task_type === 'plugin_rollback') {
      return canRetryPluginWorkflow;
    }

    return canRetryChannelWorkflow;
  }

  return (
    <main className="mx-auto grid max-w-[1680px] gap-6 rounded-xl border border-slate-200/80 bg-white/[0.9] p-4 shadow-sm lg:p-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">Runtime</StatusBadge>
            <StatusBadge tone="planned">工作流恢复</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">Runtime 工作流</h1>
        </div>
        <Button asChild type="button" variant="outline">
          <Link href="/monitor">
            <ArrowLeft className="size-4" />
            返回监控
          </Link>
        </Button>
      </section>

      {!session?.accessToken ? (
        <Card className="p-5 text-sm text-muted-foreground">登录会话加载后将读取工作流状态。</Card>
      ) : workflowQuery.isError ? (
        <Card className="p-5 text-sm text-destructive">工作流状态加载失败。</Card>
      ) : (
        <div className="grid gap-4">
          <WorkflowBackendCard
            canRetry={canRetryWorkflowTask}
            loading={workflowQuery.isLoading}
            onRefresh={() => void workflowQuery.refetch()}
            onRetry={(taskType, taskId) => setWorkflowRetryTarget({ task_type: taskType, task_id: taskId })}
            pendingTask={retryWorkflowMutation.variables ?? null}
            retrying={retryWorkflowMutation.isPending}
            workflow={workflowQuery.data ?? null}
          />
          {retryWorkflowMutation.data ? (
            <WorkflowRetryResultCard
              result={retryWorkflowMutation.data}
              workflowBackend={retryWorkflowMutation.data?.workflow_backend ?? '-'}
              workflowId={retryWorkflowMutation.data?.workflow_id ?? '-'}
              workflowRunId={retryWorkflowMutation.data?.workflow_run_id ?? '-'}
              retryEventId={retryWorkflowMutation.data?.retry_event_id ?? '-'}
              retryTraceId={retryWorkflowMutation.data?.retry_trace_id ?? '-'}
              retryRequestId={retryWorkflowMutation.data?.retry_request_id ?? '-'}
            />
          ) : null}
        </div>
      )}

      {workflowRetryTarget ? (
        <WorkflowRetryConfirmDialog
          pending={retryWorkflowMutation.isPending}
          target={workflowRetryTarget}
          onCancel={() => setWorkflowRetryTarget(null)}
          onConfirm={confirmWorkflowRetry}
        />
      ) : null}
    </main>
  );
}

function WorkflowRetryConfirmDialog({
  onCancel,
  onConfirm,
  pending,
  target,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
  target: WorkflowRetryTarget;
}) {
  return (
    <section className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
      <Card className="w-full max-w-md p-5">
        <h2 className="text-lg font-semibold">确认恢复工作流任务</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          将重新派发任务 {target.task_id}。如果外部工具或文档处理具备副作用，请确认当前任务确实需要恢复重试。
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={onCancel} type="button" variant="outline">
            取消
          </Button>
          <Button disabled={pending} onClick={onConfirm} type="button">
            确认重试
          </Button>
        </div>
      </Card>
    </section>
  );
}

async function getRuntimeWorkflowStatus(accessToken: string) {
  const response = await fetch(`${controlApiBaseUrl}/runtime/workflows/status`, {
    headers: buildWorkflowHeaders(accessToken),
  });

  if (!response.ok) {
    throw new Error(`Workflow status request failed with HTTP ${response.status}`);
  }

  return (await response.json()) as RuntimeWorkflowStatusOverview;
}

function WorkflowRetryResultCard({
  result,
  workflowBackend,
  workflowId,
  workflowRunId,
  retryEventId,
  retryTraceId,
  retryRequestId,
}: {
  result: RuntimeWorkflowRetryResult;
  workflowBackend: string;
  workflowId: string;
  workflowRunId: string;
  retryEventId: string;
  retryTraceId: string;
  retryRequestId: string;
}) {
  return (
    <Card className="grid gap-3 border-emerald-200/70 bg-emerald-50/60 p-5">
      <div>
        <div className="text-sm font-semibold text-emerald-950">最近重试结果</div>
        <p className="mt-1 text-sm leading-6 text-emerald-900">{result.message}</p>
      </div>
      <div className="grid gap-2 md:grid-cols-4">
        <ResultField label="任务" value={`${result.task_type} / ${result.task_id}`} />
        <ResultField label="工作流后端" value={workflowBackend} />
        <ResultField label="Workflow ID" value={workflowId} />
        <ResultField label="Workflow Run ID" value={workflowRunId} />
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        <ActionField actionLabel="查看事件" label="事件" href={retryEventId !== '-' ? `/monitor/events/${retryEventId}` : null} value={retryEventId} />
        <ActionField actionLabel="查看 Trace" label="Trace" href={retryTraceId !== '-' ? `/monitor/traces/${retryTraceId}` : null} value={retryTraceId} />
        <ActionField actionLabel="查看请求" label="Request ID" href={retryRequestId !== '-' ? `/monitor?requestId=${encodeURIComponent(retryRequestId)}` : null} value={retryRequestId} />
      </div>
    </Card>
  );
}

function ResultField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background/75 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 break-words font-mono text-xs">{value}</div>
    </div>
  );
}

function ActionField({ actionLabel, label, value, href }: { actionLabel: string; label: string; value: string; href: string | null }) {
  return (
    <div className="rounded-md border bg-background/75 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center gap-2">
        <div className="min-w-0 flex-1 break-words font-mono text-xs">{value}</div>
        {href ? (
          <Button asChild size="sm" type="button" variant="outline">
            <Link href={href}>{actionLabel}</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

async function retryRuntimeWorkflowTask(accessToken: string, input: { task_type: RuntimeWorkflowTaskType; task_id: string }): Promise<RuntimeWorkflowRetryResult> {
  const headers = buildWorkflowHeaders(accessToken);
  headers.set('content-type', 'application/json');
  const response = await fetch(`${controlApiBaseUrl}/runtime/workflows/retry`, {
    body: JSON.stringify(input),
    headers,
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Workflow retry request failed with HTTP ${response.status}`);
  }

  return response.json();
}

function buildWorkflowHeaders(accessToken: string) {
  const headers = new Headers();
  headers.set('accept', 'application/json');
  headers.set('x-request-id', createBrowserRequestId());
  if (accessToken) {
    headers.set('authorization', `Bearer ${accessToken}`);
  }
  return headers;
}

function createBrowserRequestId() {
  const randomUUID = globalThis.crypto?.randomUUID;

  if (randomUUID) {
    return `req_${randomUUID.call(globalThis.crypto).replaceAll('-', '')}`;
  }

  return `req_${Date.now().toString(16)}${Math.random().toString(16).slice(2, 18)}`;
}
