'use client';

import { hasPermission, type RuntimeWorkflowRecoverableTaskItem, type RuntimeWorkflowStatusOverview, type RuntimeWorkflowTaskType } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { MonitorCenterBackground } from '@/components/monitor/monitor-center-background';
import { WorkflowBackendCard } from '@/components/monitor/monitor-shared-panels';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';

const controlApiBaseUrl = process.env.NEXT_PUBLIC_CONTROL_API_BASE_URL ?? 'http://localhost:3001/api/v1';
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
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <MonitorCenterBackground />
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">Runtime</StatusBadge>
            <StatusBadge tone="planned">工作流恢复</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">Runtime 工作流</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">查看运行时工作流后端状态、最近派发失败和可恢复任务。</p>
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
        <WorkflowBackendCard
          canRetry={canRetryWorkflowTask}
          loading={workflowQuery.isLoading}
          onRefresh={() => void workflowQuery.refetch()}
          onRetry={(taskType, taskId) => setWorkflowRetryTarget({ task_type: taskType, task_id: taskId })}
          pendingTask={retryWorkflowMutation.variables ?? null}
          retrying={retryWorkflowMutation.isPending}
          workflow={workflowQuery.data ?? null}
        />
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

async function retryRuntimeWorkflowTask(accessToken: string, input: { task_type: RuntimeWorkflowTaskType; task_id: string }) {
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
  headers.set('x-request-id', `req_${crypto.randomUUID().replaceAll('-', '')}`);
  if (accessToken) {
    headers.set('authorization', `Bearer ${accessToken}`);
  }
  return headers;
}
