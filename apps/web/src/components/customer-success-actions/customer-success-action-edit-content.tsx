'use client';

import { hasPermission } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import {
  CustomerSuccessActionFormPanel,
  toUpdateCustomerSuccessActionInput,
  type CustomerSuccessActionFormValues,
} from '@/components/customer-success-actions/customer-success-action-form-panel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  getCustomerSuccessAction,
  listCustomerSuccessPlans,
  listDeliveryAssets,
  listDeliveryReviews,
  listSolutionPackages,
  listUsers,
  updateCustomerSuccessAction,
  type ApiClientError,
} from '@/lib/api-client';

export function CustomerSuccessActionEditContent({ actionId }: { actionId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'customer:success_action:manage'),
  );

  const actionQuery = useQuery({ queryKey: ['customer-success-action', actionId], queryFn: () => getCustomerSuccessAction(actionId) });
  const ownersQuery = useQuery({ queryKey: ['customer-success-action-form-owners'], queryFn: () => listUsers({ page: 1, page_size: 100, status: 'ACTIVE' }) });
  const plansQuery = useQuery({ queryKey: ['customer-success-action-form-plans'], queryFn: () => listCustomerSuccessPlans({ page: 1, page_size: 100 }) });
  const reviewsQuery = useQuery({ queryKey: ['customer-success-action-form-reviews'], queryFn: () => listDeliveryReviews({ page: 1, page_size: 100 }) });
  const assetsQuery = useQuery({ queryKey: ['customer-success-action-form-assets'], queryFn: () => listDeliveryAssets({ page: 1, page_size: 100 }) });
  const packagesQuery = useQuery({ queryKey: ['customer-success-action-form-packages'], queryFn: () => listSolutionPackages({ page: 1, page_size: 100 }) });

  const mutation = useMutation({
    mutationFn: (values: CustomerSuccessActionFormValues) => updateCustomerSuccessAction(actionId, toUpdateCustomerSuccessActionInput(values)),
    onSuccess: async (action) => {
      await queryClient.invalidateQueries({ queryKey: ['customer-success-actions'] });
      await queryClient.invalidateQueries({ queryKey: ['customer-success-action', actionId] });
      router.push(`/customer-success-actions/${action.id}`);
    },
    onError: (apiError: ApiClientError) => setError(apiError.message),
  });

  if (!canWrite) {
    return (
      <main className="grid gap-6 px-4 py-6 lg:px-6">
        <Card className="p-6 text-sm text-muted-foreground">当前账号没有编辑客户成功行动的权限。</Card>
      </main>
    );
  }

  return (
    <main className="grid gap-6 px-4 py-6 lg:px-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">编辑客户成功行动</h1>
        </div>
        <Button asChild variant="outline">
          <Link href={`/customer-success-actions/${actionId}`}>
            <ArrowLeft className="size-4" />
            返回
          </Link>
        </Button>
      </div>
      {actionQuery.isLoading ? (
        <Card className="p-6 text-sm text-muted-foreground">正在加载客户成功行动...</Card>
      ) : actionQuery.isError || !actionQuery.data ? (
        <Card className="p-6 text-sm text-destructive">客户成功行动加载失败。</Card>
      ) : (
        <CustomerSuccessActionFormPanel
          action={actionQuery.data}
          assets={assetsQuery.data?.items ?? []}
          deliveryReviews={reviewsQuery.data?.items ?? []}
          error={error}
          isPending={mutation.isPending}
          mode="edit"
          onClose={() => router.push(`/customer-success-actions/${actionId}`)}
          onSubmit={(values) => mutation.mutate(values)}
          owners={ownersQuery.data?.items ?? []}
          plans={plansQuery.data?.items ?? []}
          solutionPackages={packagesQuery.data?.items ?? []}
        />
      )}
    </main>
  );
}
