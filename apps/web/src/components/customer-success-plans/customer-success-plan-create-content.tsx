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
  toCreateCustomerSuccessPlanInput,
  type CustomerSuccessPlanFormValues,
} from '@/components/customer-success-plans/customer-success-plan-form-panel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  createCustomerSuccessPlan,
  listDeliveryAssets,
  listDeliveryReviews,
  listSolutionPackages,
  listUsers,
  type ApiClientError,
} from '@/lib/api-client';

export function CustomerSuccessPlanCreateContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'customer:success:manage'),
  );

  const ownersQuery = useQuery({ queryKey: ['customer-success-plan-form-owners'], queryFn: () => listUsers({ page: 1, page_size: 100, status: 'ACTIVE' }) });
  const reviewsQuery = useQuery({ queryKey: ['customer-success-plan-form-reviews'], queryFn: () => listDeliveryReviews({ page: 1, page_size: 100 }) });
  const assetsQuery = useQuery({ queryKey: ['customer-success-plan-form-assets'], queryFn: () => listDeliveryAssets({ page: 1, page_size: 100 }) });
  const packagesQuery = useQuery({ queryKey: ['customer-success-plan-form-packages'], queryFn: () => listSolutionPackages({ page: 1, page_size: 100 }) });

  const mutation = useMutation({
    mutationFn: (values: CustomerSuccessPlanFormValues) => createCustomerSuccessPlan(toCreateCustomerSuccessPlanInput(values)),
    onSuccess: async (plan) => {
      await queryClient.invalidateQueries({ queryKey: ['customer-success-plans'] });
      router.push(`/customer-success-plans/${plan.id}`);
    },
    onError: (apiError: ApiClientError) => setError(apiError.message),
  });

  if (!canWrite) {
    return (
      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <CustomerSuccessPlanBackground />
        <Card className="p-6 text-sm text-muted-foreground">当前账号没有新建客户成功计划的权限。</Card>
      </main>
    );
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <CustomerSuccessPlanBackground />
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">新建客户成功计划</h1>
          <p className="mt-2 text-sm text-muted-foreground">从验收复盘和成果资产创建扩展推广、续约准备、健康风险和下一步动作。</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/customer-success-plans">
            <ArrowLeft className="size-4" />
            返回
          </Link>
        </Button>
      </div>
      <CustomerSuccessPlanFormPanel
        assets={assetsQuery.data?.items ?? []}
        deliveryReviews={reviewsQuery.data?.items ?? []}
        error={error}
        isPending={mutation.isPending}
        mode="create"
        onClose={() => router.push('/customer-success-plans')}
        onSubmit={(values) => mutation.mutate(values)}
        owners={ownersQuery.data?.items ?? []}
        solutionPackages={packagesQuery.data?.items ?? []}
      />
    </main>
  );
}
