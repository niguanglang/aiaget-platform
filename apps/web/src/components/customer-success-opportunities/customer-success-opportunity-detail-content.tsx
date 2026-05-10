'use client';

import { hasPermission, type BillingAdjustmentItem } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, ListChecks, ReceiptText } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import {
  adjustmentStatusLabels,
  adjustmentStatusTone,
  adjustmentTypeLabels,
  formatMoney as formatBillingMoney,
} from '@/components/billing/billing-shared';
import {
  customerSuccessActionRiskLabel,
  customerSuccessActionStatusLabel,
} from '@/components/customer-success-actions/customer-success-action-status';
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
import {
  closeWonCustomerSuccessOpportunity,
  createCustomerSuccessOpportunityFollowUpAction,
  getCustomerSuccessOpportunity,
  type ApiClientError,
} from '@/lib/api-client';

export function CustomerSuccessOpportunityDetailContent({ opportunityId }: { opportunityId: string }) {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [followUpName, setFollowUpName] = useState('');
  const [followUpDueAt, setFollowUpDueAt] = useState('');
  const [followUpError, setFollowUpError] = useState<string | null>(null);
  const [followUpNotice, setFollowUpNotice] = useState<string | null>(null);
  const [confirmFollowUp, setConfirmFollowUp] = useState(false);
  const [closeWonAmount, setCloseWonAmount] = useState('');
  const [closeWonReason, setCloseWonReason] = useState('');
  const [closeWonError, setCloseWonError] = useState<string | null>(null);
  const [closeWonNotice, setCloseWonNotice] = useState<string | null>(null);
  const [confirmCloseWon, setConfirmCloseWon] = useState(false);
  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'customer:success_opportunity:manage'),
  );
  const canCreateAction = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'customer:success_action:manage'),
  );
  const canManageBillingAdjustment = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'billing:adjustment:manage'),
  );
  const opportunityQuery = useQuery({
    queryKey: ['customer-success-opportunity', opportunityId],
    queryFn: () => getCustomerSuccessOpportunity(opportunityId),
  });
  const followUpMutation = useMutation({
    mutationFn: () =>
      createCustomerSuccessOpportunityFollowUpAction(opportunityId, {
        name: followUpName.trim() || undefined,
        due_at: followUpDueAt ? new Date(followUpDueAt).toISOString() : undefined,
      }),
    onSuccess: async (result) => {
      setFollowUpNotice(`已生成跟进行动：${result.action.name}`);
      setFollowUpError(null);
      setConfirmFollowUp(false);
      setFollowUpName('');
      setFollowUpDueAt('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['customer-success-opportunity', opportunityId] }),
        queryClient.invalidateQueries({ queryKey: ['customer-success-opportunities'] }),
        queryClient.invalidateQueries({ queryKey: ['customer-success-actions'] }),
      ]);
    },
    onError: (error: ApiClientError) => {
      setFollowUpNotice(null);
      setFollowUpError(error.message);
    },
  });
  const closeWonMutation = useMutation({
    mutationFn: () =>
      closeWonCustomerSuccessOpportunity(opportunityId, {
        amount: closeWonAmount ? Number(closeWonAmount) : undefined,
        reason: closeWonReason.trim() || undefined,
      }),
    onSuccess: async (result) => {
      setCloseWonNotice(`已生成成交入账记录：${result.adjustment.adjustment_no}`);
      setCloseWonError(null);
      setConfirmCloseWon(false);
      setCloseWonAmount('');
      setCloseWonReason('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['customer-success-opportunity', opportunityId] }),
        queryClient.invalidateQueries({ queryKey: ['customer-success-opportunities'] }),
        queryClient.invalidateQueries({ queryKey: ['customer-success-opportunity-analytics'] }),
        queryClient.invalidateQueries({ queryKey: ['billing-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['billing-adjustments-page-overview'] }),
      ]);
    },
    onError: (error: ApiClientError) => {
      setCloseWonNotice(null);
      setCloseWonError(error.message);
    },
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

      <FollowUpActionCard
        canCreateAction={canWrite && canCreateAction}
        dueAt={followUpDueAt}
        error={followUpError}
        isPending={followUpMutation.isPending}
        name={followUpName}
        notice={followUpNotice}
        onCreate={() => setConfirmFollowUp(true)}
        onDueAtChange={setFollowUpDueAt}
        onNameChange={setFollowUpName}
        opportunityAction={item.linked_resources.customer_success_action}
      />

      <CloseWonAdjustmentCard
        amount={closeWonAmount}
        canClose={canWrite && canManageBillingAdjustment}
        error={closeWonError}
        isClosed={item.stage === 'WON' || item.status === 'WON'}
        isPending={closeWonMutation.isPending}
        notice={closeWonNotice}
        onAmountChange={setCloseWonAmount}
        onCreate={() => setConfirmCloseWon(true)}
        onReasonChange={setCloseWonReason}
        opportunityAdjustments={item.billing_adjustments}
        opportunityAmount={item.estimated_amount}
        opportunityId={item.id}
        reason={closeWonReason}
        weightedAmount={item.weighted_amount}
      />

      {confirmFollowUp ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/20 px-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-5">
            <h2 className="text-lg font-semibold">生成跟进行动</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              确认基于「{item.name}」生成客户成功跟进行动？生成后会自动绑定到当前续约机会，并在成功行动中心继续跟踪。
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button disabled={followUpMutation.isPending} onClick={() => setConfirmFollowUp(false)} variant="outline">取消</Button>
              <Button disabled={followUpMutation.isPending} onClick={() => followUpMutation.mutate()}>
                {followUpMutation.isPending ? '生成中...' : '确认生成'}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      {confirmCloseWon ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/20 px-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-5">
            <h2 className="text-lg font-semibold">确认成交入账</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              确认将「{item.name}」标记为赢单，并生成计费调账来源记录？该操作会把当前机会阶段和状态更新为赢单。
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button disabled={closeWonMutation.isPending} onClick={() => setConfirmCloseWon(false)} variant="outline">取消</Button>
              <Button disabled={closeWonMutation.isPending} onClick={() => closeWonMutation.mutate()}>
                {closeWonMutation.isPending ? '入账中...' : '确认入账'}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

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

function FollowUpActionCard({
  canCreateAction,
  dueAt,
  error,
  isPending,
  name,
  notice,
  onCreate,
  onDueAtChange,
  onNameChange,
  opportunityAction,
}: {
  canCreateAction: boolean;
  dueAt: string;
  error: string | null;
  isPending: boolean;
  name: string;
  notice: string | null;
  onCreate: () => void;
  onDueAtChange: (value: string) => void;
  onNameChange: (value: string) => void;
  opportunityAction: {
    id: string;
    name: string;
    status: string;
    priority: string;
    risk_level: string;
    action_score: number;
  } | null;
}) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ListChecks className="size-4 text-primary" />
            跟进行动闭环
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            将当前续约机会生成客户成功行动，后续在成功行动中心跟踪负责人、截止时间、执行记录和完成证据。
          </p>
        </div>
        {opportunityAction ? (
          <Button asChild variant="outline">
            <Link href={`/customer-success-actions/${opportunityAction.id}`}>查看行动</Link>
          </Button>
        ) : null}
      </div>

      {opportunityAction ? (
        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-medium">{opportunityAction.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">已绑定客户成功行动，避免重复生成。</div>
            </div>
            <div className="flex flex-wrap gap-1">
              <StatusBadge tone={opportunityAction.status === 'DONE' ? 'healthy' : opportunityAction.status === 'BLOCKED' ? 'degraded' : 'ready'}>
                {customerSuccessActionStatusLabel(opportunityAction.status)}
              </StatusBadge>
              <StatusBadge tone={opportunityAction.risk_level === 'HIGH' ? 'degraded' : opportunityAction.risk_level === 'MEDIUM' ? 'ready' : 'healthy'}>
                {customerSuccessActionRiskLabel(opportunityAction.risk_level)}
              </StatusBadge>
              <StatusBadge tone={opportunityAction.action_score >= 80 ? 'healthy' : 'ready'}>{opportunityAction.action_score} 分</StatusBadge>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <label className="grid gap-1 text-sm">
            <span className="text-xs text-muted-foreground">行动名称，可选</span>
            <input
              className="h-10 rounded-md border bg-background/80 px-3 outline-none transition-colors focus:border-primary"
              disabled={!canCreateAction || isPending}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="不填写则按机会名称自动生成"
              value={name}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-xs text-muted-foreground">截止时间，可选</span>
            <input
              className="h-10 rounded-md border bg-background/80 px-3 outline-none transition-colors focus:border-primary"
              disabled={!canCreateAction || isPending}
              onChange={(event) => onDueAtChange(event.target.value)}
              type="datetime-local"
              value={dueAt}
            />
          </label>
          <div className="flex items-end">
            <Button disabled={!canCreateAction || isPending} onClick={onCreate}>
              <ListChecks className="size-4" />
              {isPending ? '生成中...' : '生成跟进行动'}
            </Button>
          </div>
        </div>
      )}

      {!canCreateAction && !opportunityAction ? (
        <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
          当前账号缺少续约机会管理或成功行动管理权限，不能生成跟进行动。
        </div>
      ) : null}
      {notice ? <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div> : null}
      {error ? <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div> : null}
    </Card>
  );
}

function CloseWonAdjustmentCard({
  amount,
  canClose,
  error,
  isClosed,
  isPending,
  notice,
  onAmountChange,
  onCreate,
  onReasonChange,
  opportunityAdjustments,
  opportunityAmount,
  opportunityId,
  reason,
  weightedAmount,
}: {
  amount: string;
  canClose: boolean;
  error: string | null;
  isClosed: boolean;
  isPending: boolean;
  notice: string | null;
  onAmountChange: (value: string) => void;
  onCreate: () => void;
  onReasonChange: (value: string) => void;
  opportunityAdjustments: BillingAdjustmentItem[];
  opportunityAmount: number;
  opportunityId: string;
  reason: string;
  weightedAmount: number;
}) {
  const canSubmit = canClose && !isClosed && !isPending;
  const hasAdjustments = opportunityAdjustments.length > 0;

  return (
    <Card className="grid gap-4 p-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ReceiptText className="size-4 text-primary" />
            成交入账闭环
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            将当前续约机会标记为赢单，并生成来源为续约机会的计费调账记录，后续在成本与额度中心继续核算。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isClosed ? (
            <Button asChild variant="outline">
              <Link href={`/customer-success-opportunities/${opportunityId}/close-won-report`}>成交复盘报告</Link>
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link href="/billing/adjustments">查看调账记录</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <SmallMetric label="预计金额" value={formatMoney(opportunityAmount)} />
        <SmallMetric label="加权金额" value={formatMoney(weightedAmount)} />
        <SmallMetric label="默认入账" value={amount ? formatBillingMoney(Number(amount)) : formatMoney(opportunityAmount)} />
        <SmallMetric label="入账状态" value={isClosed ? '已赢单' : '待确认'} />
      </div>

      {isClosed ? (
        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-medium">机会已赢单</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {hasAdjustments ? '已关联成交入账调账记录，可从这里进入账单和审计追踪。' : '暂未查询到关联调账记录，请进入调账记录按来源筛选。'}
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              <StatusBadge tone="healthy">赢单</StatusBadge>
              <StatusBadge tone="ready">{adjustmentTypeLabels.DEBIT}</StatusBadge>
              <StatusBadge tone={adjustmentStatusTone('APPLIED')}>{adjustmentStatusLabels.APPLIED}</StatusBadge>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-[180px_1fr_auto]">
          <label className="grid gap-1 text-sm">
            <span className="text-xs text-muted-foreground">成交金额，可选</span>
            <input
              className="h-10 rounded-md border bg-background/80 px-3 outline-none transition-colors focus:border-primary"
              disabled={!canClose || isPending}
              min="0.01"
              onChange={(event) => onAmountChange(event.target.value)}
              placeholder={String(opportunityAmount)}
              type="number"
              value={amount}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-xs text-muted-foreground">入账说明，可选</span>
            <input
              className="h-10 rounded-md border bg-background/80 px-3 outline-none transition-colors focus:border-primary"
              disabled={!canClose || isPending}
              onChange={(event) => onReasonChange(event.target.value)}
              placeholder="不填写则按机会名称自动生成"
              value={reason}
            />
          </label>
          <div className="flex items-end">
            <Button disabled={!canSubmit} onClick={onCreate}>
              <ReceiptText className="size-4" />
              {isPending ? '入账中...' : '确认成交入账'}
            </Button>
          </div>
        </div>
      )}

      {hasAdjustments ? (
        <div className="grid gap-3">
          <div className="text-sm font-medium">已关联调账</div>
          <div className="grid gap-2">
            {opportunityAdjustments.map((adjustment) => (
              <OpportunityAdjustmentTraceRow adjustment={adjustment} key={adjustment.id} />
            ))}
          </div>
        </div>
      ) : null}

      {!canClose && !isClosed ? (
        <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
          当前账号缺少续约机会管理或计费调账管理权限，不能执行成交入账。
        </div>
      ) : null}
      {!isClosed ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          成交入账会把机会阶段和状态更新为赢单，并创建已生效的补收调账记录。
        </div>
      ) : null}
      {notice ? <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div> : null}
      {error ? <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div> : null}
    </Card>
  );
}

function OpportunityAdjustmentTraceRow({ adjustment }: { adjustment: BillingAdjustmentItem }) {
  const auditHref = `/audit?keyword=${encodeURIComponent(adjustment.adjustment_no)}`;
  const billingHref = `/billing/adjustments?keyword=${encodeURIComponent(adjustment.adjustment_no)}`;

  return (
    <div className="rounded-md border bg-background/80 p-3">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold">{adjustment.adjustment_no}</span>
            <StatusBadge tone="ready">{adjustmentTypeLabels[adjustment.type]}</StatusBadge>
            <StatusBadge tone={adjustmentStatusTone(adjustment.status)}>{adjustmentStatusLabels[adjustment.status]}</StatusBadge>
          </div>
          <div className="mt-2 grid gap-1 text-xs text-muted-foreground md:grid-cols-2">
            <span>金额：{formatBillingMoney(adjustment.signed_amount)}</span>
            <span>关联账单：{adjustment.invoice_no ?? '未绑定账单'}</span>
            <span>入账时间：{formatDateTime(adjustment.effective_at)}</span>
            <span className="truncate">原因：{adjustment.reason}</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={billingHref}>调账记录</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={auditHref}>审计追踪</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/15 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
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
