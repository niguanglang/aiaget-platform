'use client';

import { hasPermission } from '@aiaget/shared-types';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/components/auth/auth-provider';
import { DeliveryAssetBackground } from '@/components/delivery-assets/delivery-asset-background';
import {
  deliveryAssetScoreTone,
  deliveryAssetStatusLabel,
  deliveryAssetStatusTone,
  deliveryAssetTypeLabel,
  deliveryAssetVisibilityLabel,
  deliveryAssetVisibilityTone,
  formatDateTime,
} from '@/components/delivery-assets/delivery-asset-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { getDeliveryAsset } from '@/lib/api-client';

export function DeliveryAssetDetailContent({ assetId }: { assetId: string }) {
  const { currentUser } = useAuth();
  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'delivery:asset:manage'),
  );
  const assetQuery = useQuery({
    queryKey: ['delivery-asset', assetId],
    queryFn: () => getDeliveryAsset(assetId),
  });

  if (assetQuery.isLoading) {
    return (
      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <DeliveryAssetBackground />
        <Card className="p-6 text-sm text-muted-foreground">正在加载成果资产...</Card>
      </main>
    );
  }

  if (assetQuery.isError || !assetQuery.data) {
    return (
      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <DeliveryAssetBackground />
        <Card className="p-6 text-sm text-destructive">成果资产加载失败。</Card>
      </main>
    );
  }

  const item = assetQuery.data;

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <DeliveryAssetBackground />

      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="planned">{deliveryAssetTypeLabel(item.asset_type)}</StatusBadge>
            <StatusBadge tone={deliveryAssetStatusTone(item.status)}>{deliveryAssetStatusLabel(item.status)}</StatusBadge>
            <StatusBadge tone={deliveryAssetVisibilityTone(item.visibility)}>{deliveryAssetVisibilityLabel(item.visibility)}</StatusBadge>
            <StatusBadge tone={deliveryAssetScoreTone(item.reuse_score)}>{item.reuse_score} 分</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">{item.name}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {item.customer_name} / 负责人 {item.owner?.name ?? '未分配'} / 更新时间 {formatDateTime(item.updated_at)}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/delivery-assets">
              <ArrowLeft className="size-4" />
              返回列表
            </Link>
          </Button>
          {canWrite ? (
            <Button asChild>
              <Link href={`/delivery-assets/${item.id}/edit`}>
                <Edit className="size-4" />
                编辑资产
              </Link>
            </Button>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-5">
          <h2 className="text-sm font-semibold">资产摘要</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{item.summary}</p>
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-semibold">关联资源</h2>
          <div className="mt-3 grid gap-3 text-sm">
            <ResourceLine label="关联复盘" value={item.linked_resources.delivery_review?.name ?? '未绑定'} />
            <ResourceLine label="关联方案包" value={item.linked_resources.solution_package?.name ?? '未绑定'} />
            <ResourceLine label="关联 Skill" value={item.linked_resources.skill?.name ?? '未绑定'} />
            <ResourceLine label="关联 Agent" value={item.linked_resources.agent?.name ?? '未绑定'} />
            <ResourceLine label="关联知识库" value={item.linked_resources.knowledge_base?.name ?? '未绑定'} />
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <DetailCard title="业务价值" value={item.business_value} />
        <DetailCard title="复用指引" value={item.reuse_guidance} />
        <DetailCard title="来源上下文" value={item.source_context} />
        <DetailCard title="风险说明" value={item.risk_notes} />
        <DetailCard title="下一步动作" value={item.next_action} />
        <DetailCard title="内部备注" value={item.notes || '暂无备注'} />
      </section>

      <Card className="p-5">
        <h2 className="text-sm font-semibold">标签</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {item.tags.length > 0 ? item.tags.map((tag) => (
            <span className="rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground" key={tag}>{tag}</span>
          )) : <span className="text-sm text-muted-foreground">暂无标签</span>}
        </div>
      </Card>
    </main>
  );
}

function DetailCard({ title, value }: { title: string; value: string }) {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{value}</p>
    </Card>
  );
}

function ResourceLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-64 text-right font-medium">{value}</span>
    </div>
  );
}
