'use client';

import { hasPermission } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import {
  DeliveryAssetFormPanel,
  toCreateDeliveryAssetInput,
  type DeliveryAssetFormValues,
} from '@/components/delivery-assets/delivery-asset-form-panel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  createDeliveryAsset,
  listAgents,
  listDeliveryReviews,
  listKnowledgeBases,
  listSkills,
  listSolutionPackages,
  listUsers,
  type ApiClientError,
} from '@/lib/api-client';

export function DeliveryAssetCreateContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'delivery:asset:manage'),
  );

  const ownersQuery = useQuery({ queryKey: ['delivery-asset-form-owners'], queryFn: () => listUsers({ page: 1, page_size: 100, status: 'ACTIVE' }) });
  const reviewsQuery = useQuery({ queryKey: ['delivery-asset-form-reviews'], queryFn: () => listDeliveryReviews({ page: 1, page_size: 100 }) });
  const packagesQuery = useQuery({ queryKey: ['delivery-asset-form-packages'], queryFn: () => listSolutionPackages({ page: 1, page_size: 100 }) });
  const skillsQuery = useQuery({ queryKey: ['delivery-asset-form-skills'], queryFn: () => listSkills({ page: 1, page_size: 100 }) });
  const agentsQuery = useQuery({ queryKey: ['delivery-asset-form-agents'], queryFn: () => listAgents({ page: 1, page_size: 100 }) });
  const knowledgeQuery = useQuery({ queryKey: ['delivery-asset-form-knowledge'], queryFn: () => listKnowledgeBases({ page: 1, page_size: 100 }) });

  const mutation = useMutation({
    mutationFn: (values: DeliveryAssetFormValues) => createDeliveryAsset(toCreateDeliveryAssetInput(values)),
    onSuccess: async (asset) => {
      await queryClient.invalidateQueries({ queryKey: ['delivery-assets'] });
      router.push(`/delivery-assets/${asset.id}`);
    },
    onError: (apiError: ApiClientError) => setError(apiError.message),
  });

  if (!canWrite) {
    return (
      <main className="mx-auto grid max-w-[1680px] gap-6 rounded-xl border border-slate-200/80 bg-white/[0.9] px-4 py-6 lg:px-6">
        <Card className="p-6 text-sm text-muted-foreground">当前账号没有新建成果资产的权限。</Card>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-[1680px] gap-6 rounded-xl border border-slate-200/80 bg-white/[0.9] px-4 py-6 lg:px-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">新建成果资产</h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/delivery-assets">
            <ArrowLeft className="size-4" />
            返回
          </Link>
        </Button>
      </div>
      <DeliveryAssetFormPanel
        agents={agentsQuery.data?.items ?? []}
        deliveryReviews={reviewsQuery.data?.items ?? []}
        error={error}
        isPending={mutation.isPending}
        knowledgeBases={knowledgeQuery.data?.items ?? []}
        mode="create"
        onClose={() => router.push('/delivery-assets')}
        onSubmit={(values) => mutation.mutate(values)}
        owners={ownersQuery.data?.items ?? []}
        skills={skillsQuery.data?.items ?? []}
        solutionPackages={packagesQuery.data?.items ?? []}
      />
    </main>
  );
}
