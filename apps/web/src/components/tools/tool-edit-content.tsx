'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission } from '@aiaget/shared-types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { ToolCenterBackground } from '@/components/tools/tool-center-background';
import { toUpdateToolInput } from '@/components/tools/tool-form-converters';
import { ToolFormPanel, type ToolFormValues } from '@/components/tools/tool-form-panel';
import { toolMethodLabel, toolRiskLabel, toolStatusLabel, toolStatusTone } from '@/components/tools/tool-status';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { getTool, updateTool, type ApiClientError } from '@/lib/api-client';

export function ToolEditContent({ toolId }: { toolId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'tool:definition:manage'),
  );

  const toolQuery = useQuery({
    queryKey: ['tool', toolId],
    queryFn: () => getTool(toolId),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: ToolFormValues }) => {
      const payload = toUpdateToolInput(values);
      if (!payload.ok) {
        throw new Error(payload.message);
      }

      return updateTool(id, payload.value);
    },
    onSuccess: async (tool) => {
      queryClient.setQueryData(['tool', tool.id], tool);
      await queryClient.invalidateQueries({ queryKey: ['tools'] });
      router.push(`/tools/${tool.id}`);
    },
    onError: (error: ApiClientError | Error) => setFormError(error.message),
  });

  const tool = toolQuery.data ?? null;

  function submitForm(values: ToolFormValues) {
    setFormError(null);
    updateMutation.mutate({ id: toolId, values });
  }

  return (
    <main className="relative mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:px-6">
      <ToolCenterBackground />

      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href={tool ? `/tools/${tool.id}` : '/tools'}>
              <ArrowLeft className="size-4" />
              {tool ? '返回工具详情' : '返回工具中心'}
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">编辑页</StatusBadge>
            {tool ? <StatusBadge tone={toolStatusTone(tool.status)}>{toolStatusLabel(tool.status)}</StatusBadge> : null}
            {tool ? <StatusBadge tone="planned">{toolMethodLabel(tool.method)}</StatusBadge> : null}
            {tool ? (
              <StatusBadge tone={tool.risk_level === 'HIGH' ? 'degraded' : tool.risk_level === 'MEDIUM' ? 'planned' : 'healthy'}>
                {toolRiskLabel(tool.risk_level)}
              </StatusBadge>
            ) : null}
            <StatusBadge tone={canWrite ? 'healthy' : 'degraded'}>{canWrite ? '可编辑' : '只读权限'}</StatusBadge>
          </div>
          <h1 className="break-words text-2xl font-semibold">{tool ? `编辑 ${tool.name}` : '编辑工具'}</h1>
        </div>
      </section>

      {toolQuery.isLoading ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">正在加载工具...</div>
      ) : toolQuery.isError || !tool ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-destructive">工具加载失败。</div>
      ) : !canWrite ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
          当前账号没有编辑工具权限。
        </div>
      ) : (
        <ToolFormPanel
          error={formError}
          isPending={updateMutation.isPending}
          mode="edit"
          onClose={() => router.push(`/tools/${tool.id}`)}
          onSubmit={submitForm}
          presentation="page"
          tool={tool}
        />
      )}
    </main>
  );
}
