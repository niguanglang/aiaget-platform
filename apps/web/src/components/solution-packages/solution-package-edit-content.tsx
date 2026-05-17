'use client';

import { hasPermission } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import {
  SolutionPackageFormPanel,
  toUpdateSolutionPackageInput,
  type SolutionPackageFormValues,
} from '@/components/solution-packages/solution-package-form-panel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  getSolutionPackage,
  listCustomerAssessments,
  listRoleScenarios,
  listUsers,
  updateSolutionPackage,
  type ApiClientError,
} from '@/lib/api-client';

export function SolutionPackageEditContent({ packageId }: { packageId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'solution:package:manage'),
  );

  const packageQuery = useQuery({ queryKey: ['solution-package', packageId], queryFn: () => getSolutionPackage(packageId) });
  const ownersQuery = useQuery({ queryKey: ['solution-package-form-owners'], queryFn: () => listUsers({ page: 1, page_size: 100, status: 'ACTIVE' }) });
  const assessmentsQuery = useQuery({ queryKey: ['solution-package-form-assessments'], queryFn: () => listCustomerAssessments({ page: 1, page_size: 100 }) });
  const scenariosQuery = useQuery({ queryKey: ['solution-package-form-scenarios'], queryFn: () => listRoleScenarios({ page: 1, page_size: 100 }) });

  const mutation = useMutation({
    mutationFn: (values: SolutionPackageFormValues) => updateSolutionPackage(packageId, toUpdateSolutionPackageInput(values)),
    onSuccess: async (solutionPackage) => {
      await queryClient.invalidateQueries({ queryKey: ['solution-packages'] });
      await queryClient.invalidateQueries({ queryKey: ['solution-package', packageId] });
      router.push(`/solution-packages/${solutionPackage.id}`);
    },
    onError: (apiError: ApiClientError) => setError(apiError.message),
  });

  if (!canWrite) {
    return (
      <main className="mx-auto grid max-w-[1680px] gap-6 rounded-xl border border-slate-200/80 bg-white/[0.9] px-4 py-6 lg:px-6">
        <Card className="p-6 text-sm text-muted-foreground">当前账号没有编辑方案包的权限。</Card>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-[1680px] gap-6 rounded-xl border border-slate-200/80 bg-white/[0.9] px-4 py-6 lg:px-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">编辑方案包</h1>
        </div>
        <Button asChild variant="outline">
          <Link href={`/solution-packages/${packageId}`}>
            <ArrowLeft className="size-4" />
            返回
          </Link>
        </Button>
      </div>
      {packageQuery.isLoading ? (
        <Card className="p-6 text-sm text-muted-foreground">正在加载方案包...</Card>
      ) : packageQuery.isError || !packageQuery.data ? (
        <Card className="p-6 text-sm text-destructive">方案包加载失败。</Card>
      ) : (
        <SolutionPackageFormPanel
          assessments={assessmentsQuery.data?.items ?? []}
          error={error}
          isPending={mutation.isPending}
          mode="edit"
          onClose={() => router.push(`/solution-packages/${packageId}`)}
          onSubmit={(values) => mutation.mutate(values)}
          owners={ownersQuery.data?.items ?? []}
          roleScenarios={scenariosQuery.data?.items ?? []}
          solutionPackage={packageQuery.data}
        />
      )}
    </main>
  );
}
