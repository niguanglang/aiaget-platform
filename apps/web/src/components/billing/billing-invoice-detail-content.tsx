'use client';

import { hasPermission, type BillingAdjustmentItem, type BillingInvoiceItem } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, ReceiptText } from 'lucide-react';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import {
  ActionMessage,
  BillingConfirmDialog,
  BillingWorkspaceHeader,
  type InvoiceAction,
  type InvoiceLineItem,
  type InvoiceSummary,
  PageError,
  RefreshButton,
  adjustmentStatusLabels,
  adjustmentStatusTone,
  buildInvoiceSummary,
  formatDateShort,
  formatMoney,
  formatSignedMoney,
  getInvoiceActions,
  invoiceStatusLabels,
  invoiceTone,
  parseInvoiceLineItems,
} from '@/components/billing/billing-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  getBillingInvoiceDetail,
  lockBillingInvoice,
  markBillingInvoiceOverdue,
  markBillingInvoicePaid,
  voidBillingInvoice,
} from '@/lib/api-client';

export function BillingInvoiceDetailContent({ invoiceId }: { invoiceId: string }) {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const canManage = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'billing:adjustment:manage'),
  );

  const detailQuery = useQuery({
    enabled: Boolean(invoiceId),
    queryKey: ['billing-invoice-detail', invoiceId],
    queryFn: () => getBillingInvoiceDetail(invoiceId),
  });

  const invalidateBilling = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['billing-invoice-detail', invoiceId] }),
    queryClient.invalidateQueries({ queryKey: ['billing-invoices-page-overview'] }),
    queryClient.invalidateQueries({ queryKey: ['billing-overview'] }),
  ]);

  const invoiceActionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: InvoiceAction }) => runInvoiceAction(id, action),
    onSuccess: async (invoice) => {
      setActionMessage(`账单 ${invoice.invoice_no} 已更新为${invoiceStatusLabels[invoice.status]}。`);
      await invalidateBilling();
    },
    onError: () => setActionMessage('账单状态更新失败，请检查当前状态或权限。'),
  });

  const invoice = detailQuery.data?.invoice ?? null;
  const adjustments = detailQuery.data?.adjustments ?? [];
  const lineItems = invoice ? parseInvoiceLineItems(invoice) : [];
  const summary = invoice ? buildInvoiceSummary(invoice) : null;

  return (
    <main className="mx-auto grid max-w-[1680px] gap-6 rounded-xl border border-slate-200/80 bg-white/[0.9] px-4 py-6 lg:px-6">
      <BillingWorkspaceHeader
        actions={<RefreshButton loading={detailQuery.isFetching} onClick={() => void detailQuery.refetch()} />}
        backHref="/billing/invoices"
        backLabel="发票列表"
        badge="Invoice Detail"
        title="发票详情"
      />

      {detailQuery.isError ? <PageError>发票详情加载失败。</PageError> : null}
      {!canManage ? <PageError>当前账号缺少 billing:adjustment:manage 权限，账单状态操作已禁用。</PageError> : null}
      {actionMessage ? <ActionMessage>{actionMessage}</ActionMessage> : null}

      {detailQuery.isLoading ? (
        <Card className="p-5 text-sm text-muted-foreground">正在加载发票详情...</Card>
      ) : !invoice || !summary ? (
        <Card className="p-5">
          <EmptyState description="发票不存在或无权限访问。" title="未找到发票" />
        </Card>
      ) : (
        <InvoiceDetailPanel
          adjustments={adjustments}
          canManage={canManage}
          invoice={invoice}
          lineItems={lineItems}
          onAction={(id, action) => invoiceActionMutation.mutate({ id, action })}
          pendingActionId={invoiceActionMutation.variables?.id ?? null}
          summary={summary}
        />
      )}
    </main>
  );
}

function InvoiceDetailPanel({
  adjustments,
  canManage,
  invoice,
  lineItems,
  onAction,
  pendingActionId,
  summary,
}: {
  adjustments: BillingAdjustmentItem[];
  canManage: boolean;
  invoice: BillingInvoiceItem;
  lineItems: InvoiceLineItem[];
  onAction: (id: string, action: InvoiceAction) => void;
  pendingActionId: string | null;
  summary: InvoiceSummary;
}) {
  const [expanded, setExpanded] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{ action: InvoiceAction; id: string; label: string } | null>(null);
  const invoiceActions = getInvoiceActions(invoice.status);

  function confirmInvoiceAction() {
    if (!confirmAction) return;
    onAction(confirmAction.id, confirmAction.action);
    setConfirmAction(null);
  }

  return (
    <div className="grid gap-4">
      <Card className="grid content-start gap-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <ReceiptText className="size-4 text-primary" />
              <h2 className="text-xl font-semibold">{invoice.invoice_no}</h2>
              <StatusBadge tone={invoiceTone(invoice.status)}>{invoiceStatusLabels[invoice.status]}</StatusBadge>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">账期 {formatDateShort(invoice.period_start)} 至 {formatDateShort(invoice.period_end)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">应付总额</div>
            <div className="mt-1 text-2xl font-semibold">{formatMoney(invoice.total_amount)}</div>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <InvoiceAmountTile label="小计" value={formatMoney(invoice.subtotal_amount)} />
          <InvoiceAmountTile label="折扣" value={formatSignedMoney(-Math.abs(invoice.discount_amount))} />
          <InvoiceAmountTile label="税费" value={formatMoney(invoice.tax_amount)} />
          <InvoiceAmountTile label="未结清" value={formatMoney(summary.outstanding_amount)} />
        </div>

        <div className="grid gap-3 rounded-md border bg-background/70 p-3 text-sm sm:grid-cols-3">
          <div><div className="text-xs text-muted-foreground">到期日</div><div className="mt-1 font-medium">{invoice.due_at ? formatDateShort(invoice.due_at) : '-'}</div></div>
          <div><div className="text-xs text-muted-foreground">支付时间</div><div className="mt-1 font-medium">{invoice.paid_at ? formatDateShort(invoice.paid_at) : '未支付'}</div></div>
          <div><div className="text-xs text-muted-foreground">账单项</div><div className="mt-1 font-medium">{lineItems.length} 项</div></div>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-background/70 p-3">
          <span className="mr-1 text-xs text-muted-foreground">状态操作</span>
          {invoiceActions.length === 0 ? (
            <span className="text-xs text-muted-foreground">当前状态无可用操作</span>
          ) : invoiceActions.map((action) => (
            <Button disabled={!canManage || pendingActionId === invoice.id} key={action.action} onClick={() => setConfirmAction({ action: action.action, id: invoice.id, label: action.label })} size="sm" type="button" variant="outline">
              {pendingActionId === invoice.id ? '处理中...' : action.label}
            </Button>
          ))}
        </div>
      </Card>

      <Card className="rounded-md border bg-background/70">
        <button className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left text-sm font-medium" onClick={() => setExpanded((value) => !value)} type="button">
          <span className="flex items-center gap-2">{expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}账单项明细</span>
          <span className="text-xs text-muted-foreground">{formatMoney(summary.line_item_total)}</span>
        </button>
        {expanded ? (
          lineItems.length === 0 ? (
            <div className="border-t px-5 py-4"><EmptyState description="当前发票没有可解析的账单项。" title="暂无账单项" /></div>
          ) : (
            <div className="overflow-x-auto border-t">
              <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    {['项目', '数量', '单价', '金额', '说明'].map((column) => <th className="px-3 py-2 font-medium text-muted-foreground" key={column}>{column}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item) => (
                    <tr className="border-b last:border-0" key={item.id}>
                      <td className="px-3 py-2 font-medium">{item.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{item.quantity}</td>
                      <td className="px-3 py-2 text-muted-foreground">{item.unit_price === null ? '-' : formatMoney(item.unit_price)}</td>
                      <td className="px-3 py-2 font-medium">{formatMoney(item.amount)}</td>
                      <td className="max-w-[220px] truncate px-3 py-2 text-muted-foreground">{item.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : null}
      </Card>

      <Card className="grid gap-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">关联调账</h2>
          <StatusBadge tone={adjustments.length > 0 ? 'ready' : 'planned'}>{adjustments.length} 条</StatusBadge>
        </div>
        {adjustments.length === 0 ? (
          <EmptyState description="此账单暂无退款、折扣、减免、补收或纠错记录。" title="暂无关联调账" />
        ) : (
          <div className="grid gap-2">
            {adjustments.map((adjustment) => (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/15 px-3 py-2" key={adjustment.id}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{adjustment.adjustment_no}</span>
                    <StatusBadge tone={adjustmentStatusTone(adjustment.status)}>{adjustmentStatusLabels[adjustment.status]}</StatusBadge>
                  </div>
                  <div className="mt-1 max-w-[520px] truncate text-xs text-muted-foreground">{adjustment.reason}</div>
                </div>
                <div className="text-right text-sm font-semibold">{formatSignedMoney(adjustment.signed_amount)}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {confirmAction ? (
        <BillingConfirmDialog
          body={
            <>
              确认对账单「{invoice.invoice_no}」执行「{confirmAction.label}」？该操作会改变账单状态，并影响后续支付、逾期或作废流程。
            </>
          }
          confirmLabel={confirmAction.label}
          onCancel={() => setConfirmAction(null)}
          onConfirm={confirmInvoiceAction}
          pending={pendingActionId === invoice.id}
          title="确认账单操作"
        />
      ) : null}
    </div>
  );
}

function InvoiceAmountTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background/70 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

function runInvoiceAction(id: string, action: InvoiceAction) {
  if (action === 'lock') return lockBillingInvoice(id);
  if (action === 'mark-paid') return markBillingInvoicePaid(id);
  if (action === 'mark-overdue') return markBillingInvoiceOverdue(id);
  return voidBillingInvoice(id);
}
