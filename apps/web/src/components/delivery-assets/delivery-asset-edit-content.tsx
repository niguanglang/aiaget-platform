'use client';

import { hasPermission } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { DeliveryAssetBackground } from '@/components/delivery-assets/delivery-asset-background';
import {
  DeliveryAssetFormPanel,
  toUpdateDeliveryAssetInput,
  type DeliveryAssetFormValues,
} from '@/components/delivery-assets/delivery-asset-form-panel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  getDeliveryAsset,
  listAgents,
  listDeliveryReviews,
  listKnowledgeBases,
  listSkills,
  listSolutionPackages,
  listUsers,
  updateDeliveryAsset,
  type ApiClientError,
} from '@/lib/api-client';

export function DeliveryAssetEditContent({ assetId }: { assetId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'delivery:asset:manage'),
  );

  const assetQuery = useQuery({ queryKey: ['delivery-asset', assetId], queryFn: () => getDeliveryAsset(assetId) });
  const ownersQuery = useQuery({ queryKey: ['delivery-asset-form-owners'], queryFn: () => listUsers({ page: 1, page_size: 100, status: 'ACTIVE' }) });
  const reviewsQuery = useQuery({ queryKey: ['delivery-asset-form-reviews'], queryFn: () => listDeliveryReviews({ page: 1, page_size: 100 }) });
  const packagesQuery = useQuery({ queryKey: ['delivery-asset-form-packages'], queryFn: () => listSolutionPackages({ page: 1, page_size: 100 }) });
  const skillsQuery = useQuery({ queryKey: ['delivery-asset-form-skills'], queryFn: () => listSkills({ page: 1, page_size: 100 }) });
  const agentsQuery = useQuery({ queryKey: ['delivery-asset-form-agents'], queryFn: () => listAgents({ page: 1, page_size: 100 }) });
  const knowledgeQuery = useQuery({ queryKey: ['delivery-asset-form-knowledge'], queryFn: () => listKnowledgeBases({ page: 1, page_size: 100 }) });

  const mutation = useMutation({
    mutationFn: (values: DeliveryAssetFormValues) => updateDeliveryAsset(assetId, toUpdateDeliveryAssetInput(values)),
    onSuccess: async (asset) => {
      await queryClient.invalidateQueries({ queryKey: ['delivery-assets'] });
      await queryClient.invalidateQueries({ queryKey: ['delivery-asset', assetId] });
      router.push(`/delivery-assets/${asset.id}`);
    },
    onError: (apiError: ApiClientError) => setError(apiError.message),
  });

  if (!canWrite) {
    return (
      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <DeliveryAssetBackground />
        <Card className="p-6 text-sm text-muted-foreground">当前账号没有编辑成果资产的权限。</Card>
      </main>
    );
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <DeliveryAssetBackground />
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">编辑成果资产</h1>
          <p className="mt-2 text-sm text-muted-foreground">调整资产内容、复用评分、来源上下文、风险说明和关联资源。</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/delivery-assets/${assetId}`}>
            <ArrowLeft className="size-4" />
            返回
          </Link>
        </Button>
      </div>
      {assetQuery.isLoading ? (
        <Card className="p-6 text-sm text-muted-foreground">正在加载成果资产...</Card>
      ) : assetQuery.isError || !assetQuery.data ? (
        <Card className="p-6 text-sm text-destructive">成果资产加载失败。</Card>
      ) : (
        <DeliveryAssetFormPanel
          agents={agentsQuery.data?.items ?? []}
          asset={assetQuery.data}
          deliveryReviews={reviewsQuery.data?.items ?? []}
          error={error}
          isPending={mutation.isPending}
          knowledgeBases={knowledgeQuery.data?.items ?? []}
          mode="edit"
          onClose={() => router.push(`/delivery-assets/${assetId}`)}
          onSubmit={(values) => mutation.mutate(values)}
          owners={ownersQuery.data?.items ?? []}
          skills={skillsQuery.data?.items ?? []}
          solutionPackages={packagesQuery.data?.items ?? []}
        />
      )}
    </main>
  );
}
