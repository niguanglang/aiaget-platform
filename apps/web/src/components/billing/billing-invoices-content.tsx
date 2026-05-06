'use client';

import { hasPermission, type BillingAdjustmentItem, type BillingInvoiceItem, type BillingWindow } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, FileText, ReceiptText, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import {
  ActionMessage,
  BillingConfirmDialog,
  BillingWorkspaceHeader,
  type InvoiceAction,
  type InvoiceLineItem,
  type InvoiceStatusFilter,
  type InvoiceSummary,
  PageError,
  RefreshButton,
  buildInvoiceSummary,
  countInvoicesByStatus,
  formatDateShort,
  formatMoney,
  formatSignedMoney,
  getInvoiceActions,
  getOutstandingAmount,
  invoiceStatusFilters,
  invoiceStatusLabels,
  invoiceTone,
  parseInvoiceLineItems,
  adjustmentStatusLabels,
  adjustmentStatusTone,
} from '@/components/billing/billing-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  getBillingOverview,
  lockBillingInvoice,
  markBillingInvoiceOverdue,
  markBillingInvoicePaid,
  recalculateCurrentBillingInvoice,
  voidBillingInvoice,
} from '@/lib/api-client';

export function BillingInvoicesContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [windowValue, setWindowValue] = useState<BillingWindow>('24h');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const canManage = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'billing:adjustment:manage'),
  );
  const billingQuery = useQuery({
    queryKey: ['billing-invoices-page-overview', windowValue],
    queryFn: () => getBillingOverview({ window: windowValue }),
  });

  const invalidateBilling = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['billing-invoices-page-overview'] }),
    queryClient.invalidateQueries({ queryKey: ['billing-overview'] }),
  ]);

  const recalculateInvoiceMutation = useMutation({
    mutationFn: () => recalculateCurrentBillingInvoice(),
    onSuccess: async (invoice) => {
      setActionMessage(`当前账期账单 ${invoice.invoice_no} 已重算。`);
      await invalidateBilling();
    },
    onError: () => setActionMessage('当前账期账单重算失败，请稍后重试。'),
  });

  const invoiceActionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: InvoiceAction }) => runInvoiceAction(id, action),
    onSuccess: async (invoice) => {
      setActionMessage(`账单 ${invoice.invoice_no} 已更新为${invoiceStatusLabels[invoice.status]}。`);
      await invalidateBilling();
    },
    onError: () => setActionMessage('账单状态更新失败，请检查当前状态或权限。'),
  });

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <BillingWorkspaceHeader
        actions={
          <>
            <Button disabled={!canManage || recalculateInvoiceMutation.isPending} onClick={() => recalculateInvoiceMutation.mutate()} type="button" variant="outline">
              <RotateCcw className="size-4" />
              {recalculateInvoiceMutation.isPending ? '重算中...' : '重算当前账期'}
            </Button>
            <RefreshButton loading={billingQuery.isFetching} onClick={() => void billingQuery.refetch()} />
          </>
        }
        backHref="/billing"
        badge="Invoices"
        description="查看发票、账单记录和账单项；状态操作集中在此页面，避免总览页承担账务编辑职责。"
        onWindowChange={setWindowValue}
        title="发票与账单记录"
        windowValue={windowValue}
      />

      {billingQuery.isError ? <PageError>发票和账单记录加载失败。</PageError> : null}
      {!canManage ? <PageError>当前账号缺少 billing:adjustment:manage 权限，账单重算和状态操作已禁用。</PageError> : null}
      {actionMessage ? <ActionMessage>{actionMessage}</ActionMessage> : null}

      <InvoiceCard
        adjustments={billingQuery.data?.adjustments ?? []}
        canManage={canManage}
        invoices={billingQuery.data?.invoices ?? []}
        loading={billingQuery.isLoading}
        onAction={(id, action) => invoiceActionMutation.mutate({ id, action })}
        pendingActionId={invoiceActionMutation.variables?.id ?? null}
      />
    </main>
  );
}

function InvoiceCard({
  adjustments,
  canManage,
  invoices,
  loading,
  onAction,
  pendingActionId,
}: {
  adjustments: BillingAdjustmentItem[];
  canManage: boolean;
  invoices: BillingInvoiceItem[];
  loading: boolean;
  onAction: (id: string, action: InvoiceAction) => void;
  pendingActionId: string | null;
}) {
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>('ALL');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const filteredInvoices = useMemo(
    () => (statusFilter === 'ALL' ? invoices : invoices.filter((invoice) => invoice.status === statusFilter)),
    [invoices, statusFilter],
  );
  const selectedInvoice = invoices.find((invoice) => invoice.id === selectedInvoiceId) ?? filteredInvoices[0] ?? invoices[0] ?? null;
  const selectedAdjustments = selectedInvoice ? adjustments.filter((adjustment) => adjustment.invoice_id === selectedInvoice.id) : [];
  const invoiceSummary = selectedInvoice ? buildInvoiceSummary(selectedInvoice) : null;
  const selected_invoice_line_items = selectedInvoice ? parseInvoiceLineItems(selectedInvoice) : [];
  const statusCounts = useMemo(() => countInvoicesByStatus(invoices), [invoices]);

  return (
    <Card className="grid gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="size-4 text-primary" />
            账单记录
          </div>
          <p className="mt-1 text-xs text-muted-foreground">选择发票后查看账期金额、账单项和关联调账记录。</p>
        </div>
        <StatusBadge tone={invoices.length > 0 ? 'ready' : 'planned'}>{invoices.length} 张发票</StatusBadge>
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载账单...</div>
      ) : invoices.length === 0 ? (
        <EmptyState description="当前租户暂无账单记录。" title="暂无账单" />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="grid content-start gap-3">
            <div className="flex flex-wrap gap-2">
              {invoiceStatusFilters.map((status) => (
                <button
                  className={`h-8 rounded-md border px-3 text-xs transition-colors ${
                    statusFilter === status ? 'border-primary/50 bg-primary/10 text-primary' : 'bg-background text-muted-foreground hover:bg-muted'
                  }`}
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  type="button"
                >
                  {status === 'ALL' ? '全部' : invoiceStatusLabels[status]}
                  <span className="ml-1 text-[11px]">{status === 'ALL' ? invoices.length : statusCounts[status]}</span>
                </button>
              ))}
            </div>

            {filteredInvoices.length === 0 ? (
              <EmptyState description="当前筛选状态下没有发票。" title="暂无匹配账单" />
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      {['发票', '状态', '账期', '总额', '未结清'].map((column) => (
                        <th className="px-3 py-2 font-medium text-muted-foreground" key={column}>{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((invoice) => {
                      const outstanding = getOutstandingAmount(invoice);
                      const selected = selectedInvoice?.id === invoice.id;
                      return (
                        <tr className={`cursor-pointer border-b transition-colors last:border-0 ${selected ? 'bg-primary/5' : 'hover:bg-muted/30'}`} key={invoice.id} onClick={() => setSelectedInvoiceId(invoice.id)}>
                          <td className="px-3 py-2">
                            <div className="font-medium">{invoice.invoice_no}</div>
                            <div className="text-xs text-muted-foreground">创建 {formatDateShort(invoice.created_at)}</div>
                          </td>
                          <td className="px-3 py-2"><StatusBadge tone={invoiceTone(invoice.status)}>{invoiceStatusLabels[invoice.status]}</StatusBadge></td>
                          <td className="px-3 py-2 text-muted-foreground">{formatDateShort(invoice.period_start)} 至 {formatDateShort(invoice.period_end)}</td>
                          <td className="px-3 py-2 font-medium">{formatMoney(invoice.total_amount)}</td>
                          <td className="px-3 py-2 text-muted-foreground">{formatMoney(outstanding)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {selectedInvoice && invoiceSummary ? (
            <InvoiceDetailPanel adjustments={selectedAdjustments} canManage={canManage} invoice={selectedInvoice} lineItems={selected_invoice_line_items} onAction={onAction} pendingActionId={pendingActionId} summary={invoiceSummary} />
          ) : null}
        </div>
      )}
    </Card>
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
    <div className="grid content-start gap-4 rounded-md border bg-muted/15 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <ReceiptText className="size-4 text-primary" />
            <h3 className="text-sm font-semibold">{invoice.invoice_no}</h3>
            <StatusBadge tone={invoiceTone(invoice.status)}>{invoiceStatusLabels[invoice.status]}</StatusBadge>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">账期 {formatDateShort(invoice.period_start)} 至 {formatDateShort(invoice.period_end)}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">应付总额</div>
          <div className="mt-1 text-xl font-semibold">{formatMoney(invoice.total_amount)}</div>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
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

      <div className="rounded-md border bg-background/70">
        <button className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm font-medium" onClick={() => setExpanded((value) => !value)} type="button">
          <span className="flex items-center gap-2">{expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}账单项明细</span>
          <span className="text-xs text-muted-foreground">{formatMoney(summary.line_item_total)}</span>
        </button>
        {expanded ? (
          lineItems.length === 0 ? (
            <div className="border-t px-3 py-4"><EmptyState description="当前发票没有可解析的账单项。" title="暂无账单项" /></div>
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
                      <td className="max-w-[180px] truncate px-3 py-2 text-muted-foreground">{item.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : null}
      </div>

      <div className="grid gap-3 rounded-md border bg-background/70 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium">关联调账</div>
          <StatusBadge tone={adjustments.length > 0 ? 'ready' : 'planned'}>{adjustments.length} 条</StatusBadge>
        </div>
        {adjustments.length === 0 ? (
          <div className="text-xs text-muted-foreground">此账单暂无退款、折扣、减免、补收或纠错记录。</div>
        ) : (
          <div className="grid gap-2">
            {adjustments.map((adjustment) => (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/15 px-3 py-2" key={adjustment.id}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{adjustment.adjustment_no}</span>
                    <StatusBadge tone={adjustmentStatusTone(adjustment.status)}>{adjustmentStatusLabels[adjustment.status]}</StatusBadge>
                  </div>
                  <div className="mt-1 max-w-[260px] truncate text-xs text-muted-foreground">{adjustment.reason}</div>
                </div>
                <div className="text-right text-sm font-semibold">{formatSignedMoney(adjustment.signed_amount)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

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
