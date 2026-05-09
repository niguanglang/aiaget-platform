'use client';

import { hasPermission } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { CustomerSuccessOpportunityBackground } from '@/components/customer-success-opportunities/customer-success-opportunity-background';
import {
  CustomerSuccessOpportunityFormPanel,
  toCreateCustomerSuccessOpportunityInput,
  type CustomerSuccessOpportunityFormValues,
} from '@/components/customer-success-opportunities/customer-success-opportunity-form-panel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  createCustomerSuccessOpportunity,
  listCustomerSuccessActions,
  listCustomerSuccessPlans,
  listDeliveryAssets,
  listDeliveryReviews,
  listSolutionPackages,
  listUsers,
  type ApiClientError,
} from '@/lib/api-client';

export function CustomerSuccessOpportunityCreateContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'customer:success_opportunity:manage'),
  );

  const ownersQuery = useQuery({ queryKey: ['customer-success-opportunity-form-owners'], queryFn: () => listUsers({ page: 1, page_size: 100, status: 'ACTIVE' }) });
  const plansQuery = useQuery({ queryKey: ['customer-success-opportunity-form-plans'], queryFn: () => listCustomerSuccessPlans({ page: 1, page_size: 100 }) });
  const actionsQuery = useQuery({ queryKey: ['customer-success-opportunity-form-actions'], queryFn: () => listCustomerSuccessActions({ page: 1, page_size: 100 }) });
  const reviewsQuery = useQuery({ queryKey: ['customer-success-opportunity-form-reviews'], queryFn: () => listDeliveryReviews({ page: 1, page_size: 100 }) });
  const assetsQuery = useQuery({ queryKey: ['customer-success-opportunity-form-assets'], queryFn: () => listDeliveryAssets({ page: 1, page_size: 100 }) });
  const packagesQuery = useQuery({ queryKey: ['customer-success-opportunity-form-packages'], queryFn: () => listSolutionPackages({ page: 1, page_size: 100 }) });

  const mutation = useMutation({
    mutationFn: (values: CustomerSuccessOpportunityFormValues) => createCustomerSuccessOpportunity(toCreateCustomerSuccessOpportunityInput(values)),
    onSuccess: async (opportunity) => {
      await queryClient.invalidateQueries({ queryKey: ['customer-success-opportunities'] });
      router.push(`/customer-success-opportunities/${opportunity.id}`);
    },
    onError: (apiError: ApiClientError) => setError(apiError.message),
  });

  if (!canWrite) {
    return (
      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <CustomerSuccessOpportunityBackground />
        <Card className="p-6 text-sm text-muted-foreground">当前账号没有新建续约机会的权限。</Card>
      </main>
    );
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <CustomerSuccessOpportunityBackground />
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">新建续约机会</h1>
          <p className="mt-2 text-sm text-muted-foreground">把客户成功计划和成功行动转成可阶段推进、可金额预测、可风险跟踪的商务机会。</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/customer-success-opportunities">
            <ArrowLeft className="size-4" />
            返回
          </Link>
        </Button>
      </div>
      <CustomerSuccessOpportunityFormPanel
        actions={actionsQuery.data?.items ?? []}
        assets={assetsQuery.data?.items ?? []}
        deliveryReviews={reviewsQuery.data?.items ?? []}
        error={error}
        isPending={mutation.isPending}
        mode="create"
        onClose={() => router.push('/customer-success-opportunities')}
        onSubmit={(values) => mutation.mutate(values)}
        owners={ownersQuery.data?.items ?? []}
        plans={plansQuery.data?.items ?? []}
        solutionPackages={packagesQuery.data?.items ?? []}
      />
    </main>
  );
}
