'use client';

import { hasPermission } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { SkillCenterBackground } from '@/components/skills/skill-center-background';
import { SkillFormPanel, toUpdateSkillInput, type SkillFormValues } from '@/components/skills/skill-form-panel';
import { Button } from '@/components/ui/button';
import { getSkill, listUsers, updateSkill, type ApiClientError } from '@/lib/api-client';

export function SkillEditContent({ skillId }: { skillId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'skill:hub:manage'),
  );

  const skillQuery = useQuery({
    queryKey: ['skill', skillId],
    queryFn: () => getSkill(skillId),
  });
  const ownersQuery = useQuery({
    queryKey: ['skill-owners'],
    queryFn: () => listUsers({ page: 1, page_size: 100, status: 'ACTIVE' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: SkillFormValues }) => updateSkill(id, toUpdateSkillInput(values)),
    onSuccess: async (skill) => {
      queryClient.setQueryData(['skill', skill.id], skill);
      await queryClient.invalidateQueries({ queryKey: ['skills'] });
      router.push(`/skills/${skill.id}`);
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  const skill = skillQuery.data ?? null;

  function submitForm(values: SkillFormValues) {
    setFormError(null);
    updateMutation.mutate({ id: skillId, values });
  }

  return (
    <main className="relative mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:px-6">
      <SkillCenterBackground />

      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href={skill ? `/skills/${skill.id}` : '/skills'}>
              <ArrowLeft className="size-4" />
              {skill ? '返回 Skill 详情' : '返回技能资产中心'}
            </Link>
          </Button>
          <h1 className="break-words text-2xl font-semibold">{skill ? `编辑 ${skill.name}` : '编辑 Skill'}</h1>
        </div>
      </section>

      {skillQuery.isLoading ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">正在加载 Skill...</div>
      ) : skillQuery.isError || !skill ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-destructive">Skill 加载失败。</div>
      ) : !canWrite ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">当前账号没有编辑 Skill 权限。</div>
      ) : (
        <SkillFormPanel
          error={formError}
          isPending={updateMutation.isPending}
          mode="edit"
          onClose={() => router.push(`/skills/${skill.id}`)}
          onSubmit={submitForm}
          owners={ownersQuery.data?.items ?? []}
          skill={skill}
        />
      )}
    </main>
  );
}
