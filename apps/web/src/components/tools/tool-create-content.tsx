'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hasPermission } from '@aiaget/shared-types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { ToolCenterBackground } from '@/components/tools/tool-center-background';
import { toCreateToolInput } from '@/components/tools/tool-form-converters';
import { ToolFormPanel, type ToolFormValues } from '@/components/tools/tool-form-panel';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { createTool, type ApiClientError } from '@/lib/api-client';

export function ToolCreateContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'tool:definition:manage'),
  );

  const createMutation = useMutation({
    mutationFn: createTool,
    onSuccess: async (tool) => {
      await queryClient.invalidateQueries({ queryKey: ['tools'] });
      queryClient.setQueryData(['tool', tool.id], tool);
      router.push(`/tools/${tool.id}`);
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  function submitForm(values: ToolFormValues) {
    setFormError(null);
    const payload = toCreateToolInput(values);
    if (!payload.ok) {
      setFormError(payload.message);
      return;
    }

    createMutation.mutate(payload.value);
  }

  return (
    <main className="relative mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:px-6">
      <ToolCenterBackground />

      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href="/tools">
              <ArrowLeft className="size-4" />
              工具中心
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">新增页</StatusBadge>
            <StatusBadge tone={canWrite ? 'healthy' : 'degraded'}>{canWrite ? '可编辑' : '只读权限'}</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">新建工具</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            配置 HTTP 请求、鉴权方式、风险策略和输入输出结构。测试调用、调用日志和智能体引用在工具详情页维护。
          </p>
        </div>
      </section>

      {!canWrite ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
          当前账号没有新建工具权限。
        </div>
      ) : (
        <ToolFormPanel
          error={formError}
          isPending={createMutation.isPending}
          mode="create"
          onClose={() => router.push('/tools')}
          onSubmit={submitForm}
          presentation="page"
        />
      )}
    </main>
  );
}
