'use client';

import { hasPermission, type RuntimeWorkflowStatusOverview, type RuntimeWorkflowTaskType } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/components/auth/auth-provider';
import { MonitorCenterBackground } from '@/components/monitor/monitor-center-background';
import { WorkflowBackendCard } from '@/components/monitor/monitor-shared-panels';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';

const controlApiBaseUrl = process.env.NEXT_PUBLIC_CONTROL_API_BASE_URL ?? 'http://localhost:3001/api/v1';

export function RuntimeWorkflowsContent() {
  const queryClient = useQueryClient();
  const { currentUser, session } = useAuth();
  const permissions = currentUser?.user.permissions ?? [];
  const canRetryWorkflows = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(permissions, 'knowledge:base:manage'),
  );
  const workflowQuery = useQuery({
    enabled: Boolean(session?.accessToken),
    queryKey: ['runtime-workflow-status'],
    queryFn: () => getRuntimeWorkflowStatus(session?.accessToken ?? ''),
  });
  const retryWorkflowMutation = useMutation({
    mutationFn: (input: { task_type: RuntimeWorkflowTaskType; task_id: string }) => retryRuntimeWorkflowTask(session?.accessToken ?? '', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['runtime-workflow-status'] });
    },
  });

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
          canRetry={canRetryWorkflows}
          loading={workflowQuery.isLoading}
          onRefresh={() => void workflowQuery.refetch()}
          onRetry={(taskType, taskId) => retryWorkflowMutation.mutate({ task_type: taskType, task_id: taskId })}
          pendingTask={retryWorkflowMutation.variables ?? null}
          retrying={retryWorkflowMutation.isPending}
          workflow={workflowQuery.data ?? null}
        />
      )}
    </main>
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
