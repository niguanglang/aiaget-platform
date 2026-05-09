'use client';

import { hasPermission } from '@aiaget/shared-types';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/components/auth/auth-provider';
import { CustomerSuccessOpportunityBackground } from '@/components/customer-success-opportunities/customer-success-opportunity-background';
import {
  customerSuccessOpportunityConfidenceLabel,
  customerSuccessOpportunityConfidenceTone,
  customerSuccessOpportunityPriorityLabel,
  customerSuccessOpportunityPriorityTone,
  customerSuccessOpportunityRiskLabel,
  customerSuccessOpportunityRiskTone,
  customerSuccessOpportunityScoreTone,
  customerSuccessOpportunityStageLabel,
  customerSuccessOpportunityStageTone,
  customerSuccessOpportunityStatusLabel,
  customerSuccessOpportunityStatusTone,
  customerSuccessOpportunityTypeLabel,
  formatDateTime,
  formatMoney,
} from '@/components/customer-success-opportunities/customer-success-opportunity-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { getCustomerSuccessOpportunity } from '@/lib/api-client';

export function CustomerSuccessOpportunityDetailContent({ opportunityId }: { opportunityId: string }) {
  const { currentUser } = useAuth();
  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'customer:success_opportunity:manage'),
  );
  const opportunityQuery = useQuery({
    queryKey: ['customer-success-opportunity', opportunityId],
    queryFn: () => getCustomerSuccessOpportunity(opportunityId),
  });

  if (opportunityQuery.isLoading) {
    return (
      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <CustomerSuccessOpportunityBackground />
        <Card className="p-6 text-sm text-muted-foreground">正在加载续约机会...</Card>
      </main>
    );
  }

  if (opportunityQuery.isError || !opportunityQuery.data) {
    return (
      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <CustomerSuccessOpportunityBackground />
        <Card className="p-6 text-sm text-destructive">续约机会加载失败。</Card>
      </main>
    );
  }

  const item = opportunityQuery.data;

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <CustomerSuccessOpportunityBackground />

      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="planned">{customerSuccessOpportunityTypeLabel(item.opportunity_type)}</StatusBadge>
            <StatusBadge tone={customerSuccessOpportunityStageTone(item.stage)}>{customerSuccessOpportunityStageLabel(item.stage)}</StatusBadge>
            <StatusBadge tone={customerSuccessOpportunityStatusTone(item.status)}>{customerSuccessOpportunityStatusLabel(item.status)}</StatusBadge>
            <StatusBadge tone={customerSuccessOpportunityPriorityTone(item.priority)}>{customerSuccessOpportunityPriorityLabel(item.priority)}</StatusBadge>
            <StatusBadge tone={customerSuccessOpportunityConfidenceTone(item.confidence_level)}>{customerSuccessOpportunityConfidenceLabel(item.confidence_level)}</StatusBadge>
            <StatusBadge tone={customerSuccessOpportunityRiskTone(item.risk_level)}>{customerSuccessOpportunityRiskLabel(item.risk_level)}</StatusBadge>
            <StatusBadge tone={customerSuccessOpportunityScoreTone(item.opportunity_score)}>{item.opportunity_score} 分</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">{item.name}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {item.customer_name} / 负责人 {item.owner?.name ?? '未分配'} / 预计金额 {formatMoney(item.estimated_amount)} / 成交概率 {item.probability}%
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/customer-success-opportunities">
              <ArrowLeft className="size-4" />
              返回列表
            </Link>
          </Button>
          {canWrite ? (
            <Button asChild>
              <Link href={`/customer-success-opportunities/${item.id}/edit`}>
                <Edit className="size-4" />
                编辑机会
              </Link>
            </Button>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Card className="p-5">
          <h2 className="text-sm font-semibold">预计金额</h2>
          <p className="mt-3 text-2xl font-semibold">{formatMoney(item.estimated_amount)}</p>
          <p className="mt-1 text-xs text-muted-foreground">加权 {formatMoney(item.weighted_amount)}</p>
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-semibold">成交概率</h2>
          <p className="mt-3 text-2xl font-semibold">{item.probability}%</p>
          <p className="mt-1 text-xs text-muted-foreground">信心 {customerSuccessOpportunityConfidenceLabel(item.confidence_level)}</p>
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-semibold">预计关闭</h2>
          <p className="mt-3 text-sm font-medium">{formatDateTime(item.expected_close_at)}</p>
          <p className="mt-1 text-xs text-muted-foreground">实际 {formatDateTime(item.closed_at)}</p>
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-semibold">来源链路</h2>
          <p className="mt-3 text-sm font-medium">{item.linked_resources.customer_success_plan?.name ?? '未绑定计划'}</p>
          <p className="mt-1 text-xs text-muted-foreground">{item.linked_resources.customer_success_action?.name ?? '未绑定行动'}</p>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card className="p-5">
          <h2 className="text-sm font-semibold">机会摘要</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{item.opportunity_summary}</p>
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-semibold">关联资源</h2>
          <div className="mt-3 grid gap-3 text-sm">
            <ResourceLine label="客户成功计划" value={item.linked_resources.customer_success_plan?.name ?? '未绑定'} />
            <ResourceLine label="成功行动" value={item.linked_resources.customer_success_action?.name ?? '未绑定'} />
            <ResourceLine label="来源复盘" value={item.linked_resources.delivery_review?.name ?? '未绑定'} />
            <ResourceLine label="成果资产" value={item.linked_resources.delivery_asset?.name ?? '未绑定'} />
            <ResourceLine label="落地方案" value={item.linked_resources.solution_package?.name ?? '未绑定'} />
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <DetailCard title="客户价值" value={item.customer_value} />
        <DetailCard title="商务策略" value={item.commercial_strategy} />
        <DetailCard title="决策路径" value={item.decision_path} />
        <DetailCard title="风险摘要" value={item.risk_summary} />
        <DetailCard title="下一步动作" value={item.next_action} />
        <DetailCard title="输单原因" value={item.loss_reason || '暂无输单原因'} />
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
