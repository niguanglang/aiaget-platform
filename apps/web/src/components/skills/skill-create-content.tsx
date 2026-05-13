'use client';

import { hasPermission } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { SkillCenterBackground } from '@/components/skills/skill-center-background';
import { SkillFormPanel, toCreateSkillInput, type SkillFormValues } from '@/components/skills/skill-form-panel';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { createSkill, listUsers, type ApiClientError } from '@/lib/api-client';

export function SkillCreateContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'skill:hub:manage'),
  );

  const ownersQuery = useQuery({
    queryKey: ['skill-owners'],
    queryFn: () => listUsers({ page: 1, page_size: 100, status: 'ACTIVE' }),
  });

  const createMutation = useMutation({
    mutationFn: createSkill,
    onSuccess: async (skill) => {
      await queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.setQueryData(['skill', skill.id], skill);
      router.push(`/skills/${skill.id}`);
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  function submitForm(values: SkillFormValues) {
    setFormError(null);
    createMutation.mutate(toCreateSkillInput(values));
  }

  return (
    <main className="relative mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:px-6">
      <SkillCenterBackground />

      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href="/skills">
              <ArrowLeft className="size-4" />
              技能资产中心
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">新增页</StatusBadge>
            <StatusBadge tone={canWrite ? 'healthy' : 'degraded'}>{canWrite ? '可编辑' : '只读权限'}</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">新建 Skill</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            创建可复用业务 Skill，并填写触发场景、输入要求、执行步骤、输出结构和质量标准。
          </p>
        </div>
      </section>

      {!canWrite ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">当前账号没有新建 Skill 权限。</div>
      ) : (
        <SkillFormPanel
          error={formError}
          isPending={createMutation.isPending}
          mode="create"
          onClose={() => router.push('/skills')}
          onSubmit={submitForm}
          owners={ownersQuery.data?.items ?? []}
        />
      )}
    </main>
  );
}
