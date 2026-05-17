'use client';

import { hasPermission, type BillingAdjustmentStatus, type BillingAdjustmentType, type BillingInvoiceItem, type BillingWindow } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import {
  ActionMessage,
  BillingConfirmDialog,
  BillingStatTile,
  type AdjustmentAction,
  type AdjustmentDraft,
  BillingWorkspaceHeader,
  Field,
  PageError,
  RefreshButton,
  SegmentedSelect,
  adjustmentStatusLabels,
  adjustmentStatusTone,
  adjustmentTypeLabels,
  adjustmentTypeTone,
  adjustmentTypes,
  defaultAdjustmentDraft,
  formatDateShort,
  formatMoney,
  formatSignedMoney,
  getAdjustmentActions,
  toAdjustmentInput,
} from '@/components/billing/billing-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  applyBillingAdjustment,
  approveBillingAdjustment,
  createBillingAdjustment,
  getBillingOverview,
  voidBillingAdjustment,
} from '@/lib/api-client';

export function BillingAdjustmentsContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [windowValue, setWindowValue] = useState<BillingWindow>('24h');
  const [adjustmentDraft, setAdjustmentDraft] = useState<AdjustmentDraft>(() => defaultAdjustmentDraft());
  const [createConfirmDraft, setCreateConfirmDraft] = useState<NonNullable<ReturnType<typeof toAdjustmentInput>> | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const canManage = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'billing:adjustment:manage'),
  );

  const billingQuery = useQuery({
    queryKey: ['billing-adjustments-page-overview', windowValue],
    queryFn: () => getBillingOverview({ window: windowValue }),
  });
  const adjustments = billingQuery.data?.adjustments ?? [];
  const invoices = billingQuery.data?.invoices ?? [];

  const invalidateBilling = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['billing-adjustments-page-overview'] }),
    queryClient.invalidateQueries({ queryKey: ['billing-overview'] }),
  ]);

  const adjustmentMutation = useMutation({
    mutationFn: (input: NonNullable<ReturnType<typeof toAdjustmentInput>>) => createBillingAdjustment(input),
    onSuccess: async (adjustment) => {
      setActionMessage(`已创建调账申请 ${adjustment.adjustment_no}。`);
      setCreateConfirmDraft(null);
      setAdjustmentDraft(defaultAdjustmentDraft());
      await invalidateBilling();
    },
    onError: () => setActionMessage('调账申请创建失败，请检查金额、原因或权限。'),
  });

  const adjustmentActionMutation = useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: AdjustmentAction; reason?: string }) =>
      runAdjustmentAction(id, action, reason),
    onSuccess: async (adjustment) => {
      setActionMessage(`调账审批记录 ${adjustment.adjustment_no} 已更新为${adjustmentStatusLabels[adjustment.status]}。`);
      await invalidateBilling();
    },
    onError: () => setActionMessage('调账审批操作失败，请检查当前状态或权限。'),
  });

  const requestCreateAdjustment = () => {
    const input = toAdjustmentInput(adjustmentDraft);
    if (!input) {
      setActionMessage('调账金额必须大于 0，原因至少需要 2 个字符。');
      return;
    }
    setCreateConfirmDraft(input);
  };

  function confirmCreateAdjustment() {
    if (!createConfirmDraft) return;
    adjustmentMutation.mutate(createConfirmDraft);
  }

  return (
    <main className="mx-auto grid max-w-[1680px] gap-6 rounded-xl border border-slate-200/80 bg-white/[0.9] px-4 py-6 lg:px-6">
      <BillingWorkspaceHeader
        actions={<RefreshButton loading={billingQuery.isFetching} onClick={() => void billingQuery.refetch()} />}
        backHref="/billing"
        badge="Adjustments"
        onWindowChange={setWindowValue}
        title="调账申请与审批记录"
        windowValue={windowValue}
      />

      {!canManage ? <PageError>当前账号缺少 billing:adjustment:manage 权限，仅可查看调账记录。</PageError> : null}
      {billingQuery.isError ? <PageError>调账记录加载失败。</PageError> : null}
      {actionMessage ? <ActionMessage>{actionMessage}</ActionMessage> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <BillingStatTile detail="等待财务处理" label="待处理" value={String(countByStatus(adjustments, 'PENDING'))} />
        <BillingStatTile detail="可应用到账单" label="已批准" value={String(countByStatus(adjustments, 'APPROVED'))} />
        <BillingStatTile detail="已进入账单估算" label="已生效" value={String(countByStatus(adjustments, 'APPLIED'))} />
        <BillingStatTile detail="所有调账合计" label="调账影响" value={formatMoney(adjustments.reduce((total, item) => total + item.signed_amount, 0))} />
      </section>

      <Card className="grid gap-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Plus className="size-4 text-primary" />
              调账申请
            </div>
          </div>
          <StatusBadge tone={canManage ? 'healthy' : 'planned'}>{canManage ? '可创建调账' : '仅查看'}</StatusBadge>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
          <AdjustmentForm
            canManage={canManage}
            draft={adjustmentDraft}
            invoices={invoices}
            onCreate={requestCreateAdjustment}
            onDraftChange={setAdjustmentDraft}
            saving={adjustmentMutation.isPending}
          />
          <AdjustmentTable
            canManage={canManage}
            items={adjustments}
            loading={billingQuery.isLoading}
            onAction={(id, action) => adjustmentActionMutation.mutate({ id, action })}
            pendingActionId={adjustmentActionMutation.variables?.id ?? null}
          />
        </div>
      </Card>
      {createConfirmDraft ? (
        <BillingConfirmDialog
          body={
            <>
              确认创建调账单？该申请金额为 {formatMoney(createConfirmDraft.amount)}，原因是「{createConfirmDraft.reason}」。提交后会进入调账审批记录，并影响后续账单估算。
            </>
          }
          confirmLabel="确认创建"
          onCancel={() => setCreateConfirmDraft(null)}
          onConfirm={confirmCreateAdjustment}
          pending={adjustmentMutation.isPending}
          title="确认创建调账单"
        />
      ) : null}
    </main>
  );
}

function AdjustmentForm({
  canManage,
  draft,
  invoices,
  onCreate,
  onDraftChange,
  saving,
}: {
  canManage: boolean;
  draft: AdjustmentDraft;
  invoices: BillingInvoiceItem[];
  onCreate: () => void;
  onDraftChange: (draft: AdjustmentDraft) => void;
  saving: boolean;
}) {
  return (
    <div className="grid gap-3 rounded-md border bg-muted/15 p-4">
      <div className="text-sm font-medium">新建调账单</div>
      <SegmentedSelect
        disabled={!canManage || saving}
        label="调整类型"
        onChange={(value) => onDraftChange({ ...draft, type: value as BillingAdjustmentType })}
        options={adjustmentTypes.map((type) => ({ label: adjustmentTypeLabels[type], value: type }))}
        value={draft.type}
      />
      <Field label="关联账单">
        <select
          className="h-10 rounded-md border bg-background/80 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70"
          disabled={!canManage || saving}
          onChange={(event) => onDraftChange({ ...draft, invoice_id: event.target.value })}
          value={draft.invoice_id}
        >
          <option value="">不绑定具体账单</option>
          {invoices.map((invoice) => (
            <option key={invoice.id} value={invoice.id}>
              {invoice.invoice_no} · {formatMoney(invoice.total_amount)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="调整金额">
        <Input disabled={!canManage || saving} min="0.01" onChange={(event) => onDraftChange({ ...draft, amount: event.target.value })} placeholder="例如 128.50" type="number" value={draft.amount} />
      </Field>
      <Field label="调整原因">
        <Input disabled={!canManage || saving} maxLength={220} onChange={(event) => onDraftChange({ ...draft, reason: event.target.value })} placeholder="例如：客户服务补偿" value={draft.reason} />
      </Field>
      <Field label="说明">
        <textarea
          className="min-h-24 resize-y rounded-md border bg-background/80 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70"
          disabled={!canManage || saving}
          maxLength={2000}
          onChange={(event) => onDraftChange({ ...draft, description: event.target.value })}
          placeholder="填写调账依据、工单或财务备注。"
          value={draft.description}
        />
      </Field>
      <Button disabled={!canManage || saving} onClick={onCreate} type="button">
        {saving ? '提交中...' : '创建调账单'}
      </Button>
    </div>
  );
}

function AdjustmentTable({
  canManage,
  items,
  loading,
  onAction,
  pendingActionId,
}: {
  canManage: boolean;
  items: NonNullable<Awaited<ReturnType<typeof getBillingOverview>>>['adjustments'];
  loading: boolean;
  onAction: (id: string, action: AdjustmentAction) => void;
  pendingActionId: string | null;
}) {
  const [confirmAction, setConfirmAction] = useState<{ action: AdjustmentAction; id: string; label: string; no: string } | null>(null);

  function confirmAdjustmentAction() {
    if (!confirmAction) return;
    onAction(confirmAction.id, confirmAction.action);
    setConfirmAction(null);
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium"><ClipboardCheck className="size-4 text-primary" />审批记录</div>
        <span className="text-xs text-muted-foreground">{items.length} 条记录</span>
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载调账记录...</div>
      ) : items.length === 0 ? (
        <EmptyState description="暂无退款、折扣、补收或纠错记录。" title="暂无调账单" />
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {['调账单', '类型', '状态', '金额', '关联账单', '来源', '原因', '创建时间', '操作'].map((column) => (
                  <th className="px-3 py-2 font-medium text-muted-foreground" key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr className="border-b last:border-0" key={item.id}>
                  <td className="px-3 py-2 font-medium">{item.adjustment_no}</td>
                  <td className="px-3 py-2"><StatusBadge tone={adjustmentTypeTone(item.type)}>{adjustmentTypeLabels[item.type]}</StatusBadge></td>
                  <td className="px-3 py-2"><StatusBadge tone={adjustmentStatusTone(item.status)}>{adjustmentStatusLabels[item.status]}</StatusBadge></td>
                  <td className="px-3 py-2 font-medium">{formatSignedMoney(item.signed_amount)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{item.invoice_no ?? '-'}</td>
                  <td className="max-w-[220px] px-3 py-2"><AdjustmentSourceCell item={item} /></td>
                  <td className="max-w-[220px] truncate px-3 py-2 text-muted-foreground">{item.reason}</td>
                  <td className="px-3 py-2 text-muted-foreground">{formatDateShort(item.created_at)}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {getAdjustmentActions(item.status).length === 0 ? (
                        <span className="text-xs text-muted-foreground">无</span>
                      ) : getAdjustmentActions(item.status).map((action) => (
                        <Button disabled={!canManage || pendingActionId === item.id} key={action.action} onClick={() => setConfirmAction({ action: action.action, id: item.id, label: action.label, no: item.adjustment_no })} size="sm" type="button" variant="outline">
                          {pendingActionId === item.id ? '处理中...' : action.label}
                        </Button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {confirmAction ? (
        <BillingConfirmDialog
          body={
            <>
              确认对调账单「{confirmAction.no}」执行「{confirmAction.label}」？该操作会影响账单估算、调账审批状态和后续财务处理。
            </>
          }
          confirmLabel={confirmAction.label}
          onCancel={() => setConfirmAction(null)}
          onConfirm={confirmAdjustmentAction}
          pending={pendingActionId === confirmAction.id}
          title="确认调账操作"
        />
      ) : null}
    </div>
  );
}

function AdjustmentSourceCell({
  item,
}: {
  item: NonNullable<Awaited<ReturnType<typeof getBillingOverview>>>['adjustments'][number];
}) {
  const label = item.source_label || sourceTypeFallback(item.source_type);
  if (item.source_href) {
    return (
      <Link className="block truncate font-medium text-primary transition-colors hover:text-primary/80" href={item.source_href} title={label}>
        {label}
      </Link>
    );
  }

  return <span className="block truncate text-muted-foreground" title={label}>{label}</span>;
}

function countByStatus(items: Array<{ status: BillingAdjustmentStatus }>, status: BillingAdjustmentStatus) {
  return items.filter((item) => item.status === status).length;
}

function runAdjustmentAction(id: string, action: AdjustmentAction, reason?: string) {
  if (action === 'approve') return approveBillingAdjustment(id, { reason });
  if (action === 'apply') return applyBillingAdjustment(id, { reason });
  return voidBillingAdjustment(id, { reason: reason || '运营作废' });
}

function sourceTypeFallback(sourceType: string | null) {
  if (!sourceType || sourceType === 'MANUAL') return '手工调账';
  if (sourceType === 'CUSTOMER_SUCCESS_OPPORTUNITY') return '续约机会';
  return sourceType;
}
