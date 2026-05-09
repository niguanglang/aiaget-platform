'use client';

import { hasPermission } from '@aiaget/shared-types';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/components/auth/auth-provider';
import { CustomerSuccessPlanBackground } from '@/components/customer-success-plans/customer-success-plan-background';
import {
  customerSuccessPlanHealthLabel,
  customerSuccessPlanHealthTone,
  customerSuccessPlanPriorityLabel,
  customerSuccessPlanPriorityTone,
  customerSuccessPlanScoreTone,
  customerSuccessPlanStageLabel,
  customerSuccessPlanStatusLabel,
  customerSuccessPlanStatusTone,
  formatDateTime,
} from '@/components/customer-success-plans/customer-success-plan-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { getCustomerSuccessPlan } from '@/lib/api-client';

export function CustomerSuccessPlanDetailContent({ planId }: { planId: string }) {
  const { currentUser } = useAuth();
  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'customer:success:manage'),
  );
  const planQuery = useQuery({
    queryKey: ['customer-success-plan', planId],
    queryFn: () => getCustomerSuccessPlan(planId),
  });

  if (planQuery.isLoading) {
    return (
      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <CustomerSuccessPlanBackground />
        <Card className="p-6 text-sm text-muted-foreground">正在加载客户成功计划...</Card>
      </main>
    );
  }

  if (planQuery.isError || !planQuery.data) {
    return (
      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <CustomerSuccessPlanBackground />
        <Card className="p-6 text-sm text-destructive">客户成功计划加载失败。</Card>
      </main>
    );
  }

  const item = planQuery.data;

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <CustomerSuccessPlanBackground />

      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="planned">{customerSuccessPlanStageLabel(item.plan_stage)}</StatusBadge>
            <StatusBadge tone={customerSuccessPlanStatusTone(item.status)}>{customerSuccessPlanStatusLabel(item.status)}</StatusBadge>
            <StatusBadge tone={customerSuccessPlanPriorityTone(item.priority)}>{customerSuccessPlanPriorityLabel(item.priority)}</StatusBadge>
            <StatusBadge tone={customerSuccessPlanHealthTone(item.health_level)}>{customerSuccessPlanHealthLabel(item.health_level)}</StatusBadge>
            <StatusBadge tone={customerSuccessPlanScoreTone(item.success_score)}>{item.success_score} 分</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">{item.name}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {item.customer_name} / 负责人 {item.owner?.name ?? '未分配'} / 关键时间 {formatDateTime(item.due_at)}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/customer-success-plans">
              <ArrowLeft className="size-4" />
              返回列表
            </Link>
          </Button>
          {canWrite ? (
            <Button asChild>
              <Link href={`/customer-success-plans/${item.id}/edit`}>
                <Edit className="size-4" />
                编辑计划
              </Link>
            </Button>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-5">
          <h2 className="text-sm font-semibold">扩展范围</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{item.expansion_scope}</p>
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-semibold">关联资源</h2>
          <div className="mt-3 grid gap-3 text-sm">
            <ResourceLine label="来源复盘" value={item.linked_resources.delivery_review?.name ?? '未绑定'} />
            <ResourceLine label="成果资产" value={item.linked_resources.delivery_asset?.name ?? '未绑定'} />
            <ResourceLine label="落地方案" value={item.linked_resources.solution_package?.name ?? '未绑定'} />
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <DetailCard title="成功目标" value={item.success_objectives} />
        <DetailCard title="干系人计划" value={item.stakeholder_plan} />
        <DetailCard title="资产复用计划" value={item.asset_reuse_plan} />
        <DetailCard title="续约计划" value={item.renewal_plan} />
        <DetailCard title="风险摘要" value={item.risk_summary} />
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
