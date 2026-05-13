'use client';

import { hasPermission } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { CustomerSuccessPlanBackground } from '@/components/customer-success-plans/customer-success-plan-background';
import {
  CustomerSuccessPlanFormPanel,
  toUpdateCustomerSuccessPlanInput,
  type CustomerSuccessPlanFormValues,
} from '@/components/customer-success-plans/customer-success-plan-form-panel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  getCustomerSuccessPlan,
  listDeliveryAssets,
  listDeliveryReviews,
  listSolutionPackages,
  listUsers,
  updateCustomerSuccessPlan,
  type ApiClientError,
} from '@/lib/api-client';

export function CustomerSuccessPlanEditContent({ planId }: { planId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'customer:success:manage'),
  );

  const planQuery = useQuery({ queryKey: ['customer-success-plan', planId], queryFn: () => getCustomerSuccessPlan(planId) });
  const ownersQuery = useQuery({ queryKey: ['customer-success-plan-form-owners'], queryFn: () => listUsers({ page: 1, page_size: 100, status: 'ACTIVE' }) });
  const reviewsQuery = useQuery({ queryKey: ['customer-success-plan-form-reviews'], queryFn: () => listDeliveryReviews({ page: 1, page_size: 100 }) });
  const assetsQuery = useQuery({ queryKey: ['customer-success-plan-form-assets'], queryFn: () => listDeliveryAssets({ page: 1, page_size: 100 }) });
  const packagesQuery = useQuery({ queryKey: ['customer-success-plan-form-packages'], queryFn: () => listSolutionPackages({ page: 1, page_size: 100 }) });

  const mutation = useMutation({
    mutationFn: (values: CustomerSuccessPlanFormValues) => updateCustomerSuccessPlan(planId, toUpdateCustomerSuccessPlanInput(values)),
    onSuccess: async (plan) => {
      await queryClient.invalidateQueries({ queryKey: ['customer-success-plans'] });
      await queryClient.invalidateQueries({ queryKey: ['customer-success-plan', planId] });
      router.push(`/customer-success-plans/${plan.id}`);
    },
    onError: (apiError: ApiClientError) => setError(apiError.message),
  });

  if (!canWrite) {
    return (
      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <CustomerSuccessPlanBackground />
        <Card className="p-6 text-sm text-muted-foreground">当前账号没有编辑客户成功计划的权限。</Card>
      </main>
    );
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <CustomerSuccessPlanBackground />
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">编辑客户成功计划</h1>
        </div>
        <Button asChild variant="outline">
          <Link href={`/customer-success-plans/${planId}`}>
            <ArrowLeft className="size-4" />
            返回
          </Link>
        </Button>
      </div>
      {planQuery.isLoading ? (
        <Card className="p-6 text-sm text-muted-foreground">正在加载客户成功计划...</Card>
      ) : planQuery.isError || !planQuery.data ? (
        <Card className="p-6 text-sm text-destructive">客户成功计划加载失败。</Card>
      ) : (
        <CustomerSuccessPlanFormPanel
          assets={assetsQuery.data?.items ?? []}
          deliveryReviews={reviewsQuery.data?.items ?? []}
          error={error}
          isPending={mutation.isPending}
          mode="edit"
          onClose={() => router.push(`/customer-success-plans/${planId}`)}
          onSubmit={(values) => mutation.mutate(values)}
          owners={ownersQuery.data?.items ?? []}
          plan={planQuery.data}
          solutionPackages={packagesQuery.data?.items ?? []}
        />
      )}
    </main>
  );
}
