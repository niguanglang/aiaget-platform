'use client';

import { hasPermission } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import {
  RoleScenarioFormPanel,
  toUpdateRoleScenarioInput,
  type RoleScenarioFormValues,
} from '@/components/role-scenarios/role-scenario-form-panel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  getRoleScenario,
  listAgents,
  listKnowledgeBases,
  listPromptTemplates,
  listSkills,
  listTools,
  listUsers,
  updateRoleScenario,
  type ApiClientError,
} from '@/lib/api-client';

export function RoleScenarioEditContent({ scenarioId }: { scenarioId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'scenario:package:manage'),
  );

  const scenarioQuery = useQuery({ queryKey: ['role-scenario', scenarioId], queryFn: () => getRoleScenario(scenarioId) });
  const ownersQuery = useQuery({ queryKey: ['role-scenario-form-owners'], queryFn: () => listUsers({ page: 1, page_size: 100, status: 'ACTIVE' }) });
  const agentsQuery = useQuery({ queryKey: ['role-scenario-form-agents'], queryFn: () => listAgents({ page: 1, page_size: 100 }) });
  const skillsQuery = useQuery({ queryKey: ['role-scenario-form-skills'], queryFn: () => listSkills({ page: 1, page_size: 100 }) });
  const knowledgeQuery = useQuery({ queryKey: ['role-scenario-form-knowledge'], queryFn: () => listKnowledgeBases({ page: 1, page_size: 100 }) });
  const toolsQuery = useQuery({ queryKey: ['role-scenario-form-tools'], queryFn: () => listTools({ page: 1, page_size: 100 }) });
  const promptsQuery = useQuery({ queryKey: ['role-scenario-form-prompts'], queryFn: () => listPromptTemplates({ page: 1, page_size: 100 }) });

  const mutation = useMutation({
    mutationFn: (values: RoleScenarioFormValues) => updateRoleScenario(scenarioId, toUpdateRoleScenarioInput(values)),
    onSuccess: async (scenario) => {
      await queryClient.invalidateQueries({ queryKey: ['role-scenarios'] });
      await queryClient.invalidateQueries({ queryKey: ['role-scenario', scenarioId] });
      router.push(`/role-scenarios/${scenario.id}`);
    },
    onError: (apiError: ApiClientError) => setError(apiError.message),
  });

  if (!canWrite) {
    return (
      <main className="mx-auto grid max-w-[1680px] gap-6 rounded-xl border border-slate-200/80 bg-white/[0.9] px-4 py-6 lg:px-6">
        <Card className="p-6 text-sm text-muted-foreground">当前账号没有编辑岗位场景的权限。</Card>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-[1680px] gap-6 rounded-xl border border-slate-200/80 bg-white/[0.9] px-4 py-6 lg:px-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">编辑岗位场景</h1>
        </div>
        <Button asChild variant="outline">
          <Link href={`/role-scenarios/${scenarioId}`}>
            <ArrowLeft className="size-4" />
            返回
          </Link>
        </Button>
      </div>
      {scenarioQuery.isLoading ? (
        <Card className="p-6 text-sm text-muted-foreground">正在加载岗位场景...</Card>
      ) : scenarioQuery.isError || !scenarioQuery.data ? (
        <Card className="p-6 text-sm text-destructive">岗位场景加载失败。</Card>
      ) : (
        <RoleScenarioFormPanel
          agents={agentsQuery.data?.items ?? []}
          error={error}
          isPending={mutation.isPending}
          knowledgeBases={knowledgeQuery.data?.items ?? []}
          mode="edit"
          onClose={() => router.push(`/role-scenarios/${scenarioId}`)}
          onSubmit={(values) => mutation.mutate(values)}
          owners={ownersQuery.data?.items ?? []}
          prompts={promptsQuery.data?.items ?? []}
          scenario={scenarioQuery.data}
          skills={skillsQuery.data?.items ?? []}
          tools={toolsQuery.data?.items ?? []}
        />
      )}
    </main>
  );
}
