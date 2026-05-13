'use client';

import { hasPermission } from '@aiaget/shared-types';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/components/auth/auth-provider';
import { SolutionPackageBackground } from '@/components/solution-packages/solution-package-background';
import {
  formatDateTime,
  solutionCustomerTypeLabel,
  solutionPriorityLabel,
  solutionScoreTone,
  solutionStageLabel,
  solutionStatusLabel,
  solutionStatusTone,
} from '@/components/solution-packages/solution-package-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { getSolutionPackage } from '@/lib/api-client';

export function SolutionPackageDetailContent({ packageId }: { packageId: string }) {
  const { currentUser } = useAuth();
  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'solution:package:manage'),
  );
  const packageQuery = useQuery({
    queryKey: ['solution-package', packageId],
    queryFn: () => getSolutionPackage(packageId),
  });

  if (packageQuery.isLoading) {
    return (
      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <SolutionPackageBackground />
        <Card className="p-6 text-sm text-muted-foreground">正在加载方案包...</Card>
      </main>
    );
  }

  if (packageQuery.isError || !packageQuery.data) {
    return (
      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <SolutionPackageBackground />
        <Card className="p-6 text-sm text-destructive">方案包加载失败。</Card>
      </main>
    );
  }

  const item = packageQuery.data;

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <SolutionPackageBackground />

      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone={solutionStatusTone(item.status)}>{solutionStatusLabel(item.status)}</StatusBadge>
            <StatusBadge tone="planned">{solutionStageLabel(item.package_stage)}</StatusBadge>
            <StatusBadge tone={solutionScoreTone(item.package_score)}>{item.package_score} 分</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">{item.name}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {item.customer_name} / {item.industry ?? '未填写行业'} / {solutionCustomerTypeLabel(item.customer_type)} / {solutionPriorityLabel(item.priority)}优先级
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/solution-packages">
              <ArrowLeft className="size-4" />
              返回列表
            </Link>
          </Button>
          {canWrite ? (
            <Button asChild>
              <Link href={`/solution-packages/${item.id}/edit`}>
                <Edit className="size-4" />
                编辑方案
              </Link>
            </Button>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-5">
          <h2 className="text-sm font-semibold">方案摘要</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{item.executive_summary}</p>
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-semibold">关联资源</h2>
          <div className="mt-3 grid gap-3 text-sm">
            <ResourceLine
              label="客户评估"
              value={
                item.linked_resources.customer_assessment
                  ? `${item.linked_resources.customer_assessment.customer_name} / ${item.linked_resources.customer_assessment.readiness_score} 分`
                  : '未绑定'
              }
            />
            <ResourceLine
              label="岗位场景"
              value={
                item.linked_resources.role_scenario
                  ? `${item.linked_resources.role_scenario.name} / ${item.linked_resources.role_scenario.impact_score} 分`
                  : '未绑定'
              }
            />
            <ResourceLine label="负责人" value={item.owner?.name ?? '未分配'} />
            <ResourceLine label="更新时间" value={formatDateTime(item.updated_at)} />
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <DetailCard title="业务目标" value={item.business_objectives} />
        <DetailCard title="方案范围" value={item.scope_summary} />
        <DetailCard title="场景蓝图" value={item.scenario_blueprint} />
        <DetailCard title="交付路线图" value={item.delivery_roadmap} />
        <DetailCard title="验收计划" value={item.acceptance_plan} />
        <DetailCard title="ROI 摘要" value={item.roi_summary} />
        <DetailCard title="风险缓释" value={item.risk_mitigation} />
        <DetailCard title="商务推进" value={item.commercial_strategy} />
      </section>

      <Card className="p-5">
        <h2 className="text-sm font-semibold">下一里程碑</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{item.next_milestone}</p>
      </Card>

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
