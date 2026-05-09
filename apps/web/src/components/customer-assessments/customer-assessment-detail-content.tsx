'use client';

import { hasPermission } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { CustomerAssessmentBackground } from '@/components/customer-assessments/customer-assessment-background';
import {
  assessmentStatusLabel,
  assessmentStatusTone,
  customerTypeLabel,
  decisionStageLabel,
  formatDateTime,
  readinessLabel,
  readinessTone,
} from '@/components/customer-assessments/customer-assessment-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { deleteCustomerAssessment, getCustomerAssessment, type ApiClientError } from '@/lib/api-client';

export function CustomerAssessmentDetailContent({ assessmentId }: { assessmentId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'customer:assessment:manage'),
  );

  const assessmentQuery = useQuery({
    queryKey: ['customer-assessment', assessmentId],
    queryFn: () => getCustomerAssessment(assessmentId),
  });

  const assessment = assessmentQuery.data ?? null;
  const metrics = useMemo(() => {
    if (!assessment) return [];

    return [
      { label: '准备度', value: `${assessment.readiness_score}`, helper: readinessLabel(assessment.readiness_score) },
      { label: '客户分层', value: customerTypeLabel(assessment.customer_type), helper: decisionStageLabel(assessment.decision_stage) },
      { label: '评估状态', value: assessmentStatusLabel(assessment.status), helper: assessment.owner?.name ?? '未指定负责人' },
      { label: '更新时间', value: formatDateTime(assessment.updated_at), helper: '最近维护' },
    ];
  }, [assessment]);

  const archiveMutation = useMutation({
    mutationFn: deleteCustomerAssessment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['customer-assessments'] });
      router.push('/customer-assessments');
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  if (assessmentQuery.isLoading) {
    return (
      <main className="relative mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <CustomerAssessmentBackground />
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">正在加载客户评估详情...</div>
        </Card>
      </main>
    );
  }

  if (assessmentQuery.isError || !assessment) {
    return (
      <main className="relative mx-auto grid max-w-7xl gap-4 px-4 py-6 lg:px-6">
        <CustomerAssessmentBackground />
        <Button asChild className="w-fit" variant="outline">
          <Link href="/customer-assessments">
            <ArrowLeft className="size-4" />
            返回客户评估
          </Link>
        </Button>
        <Card className="p-6">
          <div className="text-sm text-destructive">客户评估详情加载失败。</div>
        </Card>
      </main>
    );
  }

  const scores = assessment.six_question_scores;

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <CustomerAssessmentBackground />

      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href="/customer-assessments">
              <ArrowLeft className="size-4" />
              客户分层评估
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">客户分层</StatusBadge>
            <StatusBadge tone={assessmentStatusTone(assessment.status)}>{assessmentStatusLabel(assessment.status)}</StatusBadge>
            <StatusBadge tone={readinessTone(assessment.readiness_score)}>{readinessLabel(assessment.readiness_score)}</StatusBadge>
          </div>
          <h1 className="break-words text-2xl font-semibold">{assessment.customer_name}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {assessment.industry ?? '未填写行业'} · {customerTypeLabel(assessment.customer_type)} · {decisionStageLabel(assessment.decision_stage)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild disabled={!canWrite} variant="outline">
            <Link href={`/customer-assessments/${assessment.id}/edit`}>
              <Edit className="size-4" />
              编辑
            </Link>
          </Button>
          <Button disabled={!canWrite || archiveMutation.isPending} onClick={() => setConfirmArchive(true)} variant="outline">
            <Trash2 className="size-4" />
            归档
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      {actionError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
        <Card className="p-5">
          <h2 className="text-base font-semibold">基础信息</h2>
          <div className="mt-4 grid gap-3 text-sm">
            <InfoRow label="客户名称" value={assessment.customer_name} />
            <InfoRow label="行业" value={assessment.industry ?? '-'} />
            <InfoRow label="联系人" value={assessment.contact_name ?? '-'} />
            <InfoRow label="联系方式" value={assessment.contact_info ?? '-'} />
            <InfoRow label="负责人" value={assessment.owner?.name ?? '-'} />
            <InfoRow label="创建时间" value={formatDateTime(assessment.created_at)} />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold">六问判断</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <TextBlock title="经营目标" value={assessment.business_goal} />
            <TextBlock title="流程成熟度" value={assessment.process_maturity} />
            <TextBlock title="知识资产" value={assessment.data_asset_status} />
            <TextBlock title="管理层推动" value={assessment.management_support} />
            <TextBlock title="预算信号" value={assessment.budget_signal} />
            <TextBlock title="备注" value={assessment.notes ?? '暂无备注。'} />
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-5">
          <h2 className="text-base font-semibold">六问评分</h2>
          <div className="mt-4 grid gap-3">
            <ScoreRow label="客户类型清晰度" value={scores.customer_type_clarity} />
            <ScoreRow label="采购决策意图" value={scores.decision_intent} />
            <ScoreRow label="经营目标明确度" value={scores.business_goal} />
            <ScoreRow label="流程成熟度" value={scores.process_maturity} />
            <ScoreRow label="数据/知识资产" value={scores.data_assets} />
            <ScoreRow label="管理预算意识" value={scores.management_budget} />
          </div>
        </Card>

        <div className="grid gap-4">
          <Card className="p-5">
            <h2 className="text-base font-semibold">建议打法</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{assessment.recommended_strategy}</p>
          </Card>
          <Card className="p-5">
            <h2 className="text-base font-semibold">风险提示</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{assessment.risk_summary}</p>
          </Card>
          <Card className="p-5">
            <h2 className="text-base font-semibold">下一步动作</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{assessment.next_action}</p>
          </Card>
        </div>
      </section>

      {confirmArchive ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-5 shadow-lg">
            <h2 className="text-base font-semibold">确认归档客户评估</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              归档后该评估不会出现在默认清单中。当前对象：{assessment.customer_name}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button onClick={() => setConfirmArchive(false)} variant="outline">
                取消
              </Button>
              <Button disabled={archiveMutation.isPending} onClick={() => archiveMutation.mutate(assessment.id)}>
                确认归档
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 rounded-md border bg-muted/20 px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function TextBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md border bg-background/70 p-3">
      <div className="text-sm font-medium">{title}</div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{value}</p>
    </div>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="grid gap-2 rounded-md border bg-background/70 p-3">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <StatusBadge tone={value >= 4 ? 'healthy' : value >= 3 ? 'ready' : 'degraded'}>{value} / 5</StatusBadge>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${value * 20}%` }} />
      </div>
    </div>
  );
}
