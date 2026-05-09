'use client';

import { hasPermission } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { SolutionPackageBackground } from '@/components/solution-packages/solution-package-background';
import {
  SolutionPackageFormPanel,
  toCreateSolutionPackageInput,
  type SolutionPackageFormValues,
} from '@/components/solution-packages/solution-package-form-panel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  createSolutionPackage,
  listCustomerAssessments,
  listRoleScenarios,
  listUsers,
  type ApiClientError,
} from '@/lib/api-client';

export function SolutionPackageCreateContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'solution:package:manage'),
  );

  const ownersQuery = useQuery({ queryKey: ['solution-package-form-owners'], queryFn: () => listUsers({ page: 1, page_size: 100, status: 'ACTIVE' }) });
  const assessmentsQuery = useQuery({ queryKey: ['solution-package-form-assessments'], queryFn: () => listCustomerAssessments({ page: 1, page_size: 100 }) });
  const scenariosQuery = useQuery({ queryKey: ['solution-package-form-scenarios'], queryFn: () => listRoleScenarios({ page: 1, page_size: 100 }) });

  const mutation = useMutation({
    mutationFn: (values: SolutionPackageFormValues) => createSolutionPackage(toCreateSolutionPackageInput(values)),
    onSuccess: async (solutionPackage) => {
      await queryClient.invalidateQueries({ queryKey: ['solution-packages'] });
      router.push(`/solution-packages/${solutionPackage.id}`);
    },
    onError: (apiError: ApiClientError) => setError(apiError.message),
  });

  if (!canWrite) {
    return (
      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <SolutionPackageBackground />
        <Card className="p-6 text-sm text-muted-foreground">当前账号没有新建落地方案的权限。</Card>
      </main>
    );
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <SolutionPackageBackground />
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">新建落地方案</h1>
          <p className="mt-2 text-sm text-muted-foreground">创建可交付的 AI 落地方案包，并绑定客户评估与岗位场景。</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/solution-packages">
            <ArrowLeft className="size-4" />
            返回
          </Link>
        </Button>
      </div>
      <SolutionPackageFormPanel
        assessments={assessmentsQuery.data?.items ?? []}
        error={error}
        isPending={mutation.isPending}
        mode="create"
        onClose={() => router.push('/solution-packages')}
        onSubmit={(values) => mutation.mutate(values)}
        owners={ownersQuery.data?.items ?? []}
        roleScenarios={scenariosQuery.data?.items ?? []}
      />
    </main>
  );
}
