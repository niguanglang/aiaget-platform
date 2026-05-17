'use client';

import { hasPermission } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import {
  DeliveryReviewFormPanel,
  toCreateDeliveryReviewInput,
  type DeliveryReviewFormValues,
} from '@/components/delivery-reviews/delivery-review-form-panel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  createDeliveryReview,
  listSolutionPackages,
  listUsers,
  type ApiClientError,
} from '@/lib/api-client';

export function DeliveryReviewCreateContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'delivery:review:manage'),
  );

  const ownersQuery = useQuery({ queryKey: ['delivery-review-form-owners'], queryFn: () => listUsers({ page: 1, page_size: 100, status: 'ACTIVE' }) });
  const packagesQuery = useQuery({ queryKey: ['delivery-review-form-packages'], queryFn: () => listSolutionPackages({ page: 1, page_size: 100 }) });

  const mutation = useMutation({
    mutationFn: (values: DeliveryReviewFormValues) => createDeliveryReview(toCreateDeliveryReviewInput(values)),
    onSuccess: async (review) => {
      await queryClient.invalidateQueries({ queryKey: ['delivery-reviews'] });
      router.push(`/delivery-reviews/${review.id}`);
    },
    onError: (apiError: ApiClientError) => setError(apiError.message),
  });

  if (!canWrite) {
    return (
      <main className="grid gap-6 px-4 py-6 lg:px-6">
        <Card className="p-6 text-sm text-muted-foreground">当前账号没有新建验收复盘的权限。</Card>
      </main>
    );
  }

  return (
    <main className="grid gap-6 px-4 py-6 lg:px-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">新建验收复盘</h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/delivery-reviews">
            <ArrowLeft className="size-4" />
            返回
          </Link>
        </Button>
      </div>
      <DeliveryReviewFormPanel
        error={error}
        isPending={mutation.isPending}
        mode="create"
        onClose={() => router.push('/delivery-reviews')}
        onSubmit={(values) => mutation.mutate(values)}
        owners={ownersQuery.data?.items ?? []}
        solutionPackages={packagesQuery.data?.items ?? []}
      />
    </main>
  );
}
