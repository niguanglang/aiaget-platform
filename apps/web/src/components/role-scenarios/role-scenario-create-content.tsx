'use client';

import { hasPermission } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { RoleScenarioBackground } from '@/components/role-scenarios/role-scenario-background';
import {
  RoleScenarioFormPanel,
  toCreateRoleScenarioInput,
  type RoleScenarioFormValues,
} from '@/components/role-scenarios/role-scenario-form-panel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  createRoleScenario,
  listAgents,
  listKnowledgeBases,
  listPromptTemplates,
  listSkills,
  listTools,
  listUsers,
  type ApiClientError,
} from '@/lib/api-client';

export function RoleScenarioCreateContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'scenario:package:manage'),
  );

  const ownersQuery = useQuery({ queryKey: ['role-scenario-form-owners'], queryFn: () => listUsers({ page: 1, page_size: 100, status: 'ACTIVE' }) });
  const agentsQuery = useQuery({ queryKey: ['role-scenario-form-agents'], queryFn: () => listAgents({ page: 1, page_size: 100 }) });
  const skillsQuery = useQuery({ queryKey: ['role-scenario-form-skills'], queryFn: () => listSkills({ page: 1, page_size: 100 }) });
  const knowledgeQuery = useQuery({ queryKey: ['role-scenario-form-knowledge'], queryFn: () => listKnowledgeBases({ page: 1, page_size: 100 }) });
  const toolsQuery = useQuery({ queryKey: ['role-scenario-form-tools'], queryFn: () => listTools({ page: 1, page_size: 100 }) });
  const promptsQuery = useQuery({ queryKey: ['role-scenario-form-prompts'], queryFn: () => listPromptTemplates({ page: 1, page_size: 100 }) });

  const mutation = useMutation({
    mutationFn: (values: RoleScenarioFormValues) => createRoleScenario(toCreateRoleScenarioInput(values)),
    onSuccess: async (scenario) => {
      await queryClient.invalidateQueries({ queryKey: ['role-scenarios'] });
      router.push(`/role-scenarios/${scenario.id}`);
    },
    onError: (apiError: ApiClientError) => setError(apiError.message),
  });

  if (!canWrite) {
    return (
      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <RoleScenarioBackground />
        <Card className="p-6 text-sm text-muted-foreground">当前账号没有新建岗位场景的权限。</Card>
      </main>
    );
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <RoleScenarioBackground />
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">新建岗位场景</h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/role-scenarios">
            <ArrowLeft className="size-4" />
            返回
          </Link>
        </Button>
      </div>
      <RoleScenarioFormPanel
        agents={agentsQuery.data?.items ?? []}
        error={error}
        isPending={mutation.isPending}
        knowledgeBases={knowledgeQuery.data?.items ?? []}
        mode="create"
        onClose={() => router.push('/role-scenarios')}
        onSubmit={(values) => mutation.mutate(values)}
        owners={ownersQuery.data?.items ?? []}
        prompts={promptsQuery.data?.items ?? []}
        skills={skillsQuery.data?.items ?? []}
        tools={toolsQuery.data?.items ?? []}
      />
    </main>
  );
}
