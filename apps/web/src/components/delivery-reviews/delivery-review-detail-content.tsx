'use client';

import { hasPermission } from '@aiaget/shared-types';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/components/auth/auth-provider';
import { DeliveryReviewBackground } from '@/components/delivery-reviews/delivery-review-background';
import {
  deliveryReviewResultLabel,
  deliveryReviewResultTone,
  deliveryReviewSatisfactionLabel,
  deliveryReviewScoreTone,
  deliveryReviewStageLabel,
  deliveryReviewStatusLabel,
  deliveryReviewStatusTone,
  formatDateTime,
} from '@/components/delivery-reviews/delivery-review-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { getDeliveryReview } from '@/lib/api-client';

export function DeliveryReviewDetailContent({ reviewId }: { reviewId: string }) {
  const { currentUser } = useAuth();
  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'delivery:review:manage'),
  );
  const reviewQuery = useQuery({
    queryKey: ['delivery-review', reviewId],
    queryFn: () => getDeliveryReview(reviewId),
  });

  if (reviewQuery.isLoading) {
    return (
      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <DeliveryReviewBackground />
        <Card className="p-6 text-sm text-muted-foreground">正在加载验收复盘...</Card>
      </main>
    );
  }

  if (reviewQuery.isError || !reviewQuery.data) {
    return (
      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <DeliveryReviewBackground />
        <Card className="p-6 text-sm text-destructive">验收复盘加载失败。</Card>
      </main>
    );
  }

  const item = reviewQuery.data;

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <DeliveryReviewBackground />

      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="planned">{deliveryReviewStageLabel(item.review_stage)}</StatusBadge>
            <StatusBadge tone={deliveryReviewResultTone(item.result)}>{deliveryReviewResultLabel(item.result)}</StatusBadge>
            <StatusBadge tone={deliveryReviewStatusTone(item.status)}>{deliveryReviewStatusLabel(item.status)}</StatusBadge>
            <StatusBadge tone={deliveryReviewScoreTone(item.acceptance_score)}>{item.acceptance_score} 分</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">{item.name}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {item.customer_name} / 满意度 {deliveryReviewSatisfactionLabel(item.satisfaction_level)} / 复盘时间 {formatDateTime(item.reviewed_at)}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/delivery-reviews">
              <ArrowLeft className="size-4" />
              返回列表
            </Link>
          </Button>
          {canWrite ? (
            <Button asChild>
              <Link href={`/delivery-reviews/${item.id}/edit`}>
                <Edit className="size-4" />
                编辑复盘
              </Link>
            </Button>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-5">
          <h2 className="text-sm font-semibold">验收结论</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{item.acceptance_summary}</p>
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-semibold">关联方案包</h2>
          <div className="mt-3 grid gap-3 text-sm">
            <ResourceLine
              label="方案包"
              value={
                item.linked_resources.solution_package
                  ? `${item.linked_resources.solution_package.name} / ${item.linked_resources.solution_package.package_score} 分`
                  : '未绑定'
              }
            />
            <ResourceLine
              label="方案状态"
              value={
                item.linked_resources.solution_package
                  ? `${item.linked_resources.solution_package.package_stage} / ${item.linked_resources.solution_package.status}`
                  : '未绑定'
              }
            />
            <ResourceLine label="负责人" value={item.owner?.name ?? '未分配'} />
            <ResourceLine label="更新时间" value={formatDateTime(item.updated_at)} />
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <DetailCard title="已交付范围" value={item.delivered_scope} />
        <DetailCard title="问题复盘" value={item.issue_summary} />
        <DetailCard title="改进行动" value={item.improvement_actions} />
        <DetailCard title="扩展计划" value={item.expansion_plan} />
        <DetailCard title="可复用资产" value={item.reusable_assets} />
        <DetailCard title="下一步动作" value={item.next_action} />
      </section>

      <Card className="p-5">
        <h2 className="text-sm font-semibold">标签与备注</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {item.tags.length > 0 ? item.tags.map((tag) => (
            <span className="rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground" key={tag}>{tag}</span>
          )) : <span className="text-sm text-muted-foreground">暂无标签</span>}
        </div>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{item.notes || '暂无备注'}</p>
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
