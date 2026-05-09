'use client';

import { hasPermission, type BillingInvoiceItem, type BillingWindow } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, FileText, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import {
  ActionMessage,
  BillingConfirmDialog,
  BillingWorkspaceHeader,
  type InvoiceStatusFilter,
  PageError,
  RefreshButton,
  countInvoicesByStatus,
  formatDateShort,
  formatMoney,
  getOutstandingAmount,
  invoiceStatusFilters,
  invoiceStatusLabels,
  invoiceTone,
} from '@/components/billing/billing-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  getBillingOverview,
  recalculateCurrentBillingInvoice,
} from '@/lib/api-client';

export function BillingInvoicesContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [windowValue, setWindowValue] = useState<BillingWindow>('24h');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [invoiceRecalculateTarget, setInvoiceRecalculateTarget] = useState<'current-period' | null>(null);
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

  function confirmInvoiceRecalculate() {
    if (!invoiceRecalculateTarget) return;
    recalculateInvoiceMutation.mutate();
    setInvoiceRecalculateTarget(null);
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <BillingWorkspaceHeader
        actions={
          <>
            <Button disabled={!canManage || recalculateInvoiceMutation.isPending} onClick={() => setInvoiceRecalculateTarget('current-period')} type="button" variant="outline">
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
        invoices={billingQuery.data?.invoices ?? []}
        loading={billingQuery.isLoading}
      />
      {invoiceRecalculateTarget ? (
        <BillingConfirmDialog
          body={
            <>
              确认重算当前账期账单？系统会按当前套餐、用量、额度和调账记录重新生成账单金额，可能影响发票总额、未结清金额和后续财务处理。
            </>
          }
          confirmLabel="确认重算"
          onCancel={() => setInvoiceRecalculateTarget(null)}
          onConfirm={confirmInvoiceRecalculate}
          pending={recalculateInvoiceMutation.isPending}
          title="确认重算当前账期"
        />
      ) : null}
    </main>
  );
}

function InvoiceCard({
  invoices,
  loading,
}: {
  invoices: BillingInvoiceItem[];
  loading: boolean;
}) {
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>('ALL');
  const filteredInvoices = useMemo(
    () => (statusFilter === 'ALL' ? invoices : invoices.filter((invoice) => invoice.status === statusFilter)),
    [invoices, statusFilter],
  );
  const statusCounts = useMemo(() => countInvoicesByStatus(invoices), [invoices]);

  return (
    <Card className="grid gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="size-4 text-primary" />
            账单记录
          </div>
          <p className="mt-1 text-xs text-muted-foreground">列表只保留发票识别、状态和关键金额，完整账单项与调账记录进入详情页。</p>
        </div>
        <StatusBadge tone={invoices.length > 0 ? 'ready' : 'planned'}>{invoices.length} 张发票</StatusBadge>
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载账单...</div>
      ) : invoices.length === 0 ? (
        <EmptyState description="当前租户暂无账单记录。" title="暂无账单" />
      ) : (
        <div className="grid gap-4">
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
                    {['发票', '状态', '账期', '总额', '未结清', '操作'].map((column) => (
                        <th className="px-3 py-2 font-medium text-muted-foreground" key={column}>{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((invoice) => {
                      const outstanding = getOutstandingAmount(invoice);
                      return (
                        <tr className="border-b transition-colors last:border-0 hover:bg-muted/30" key={invoice.id}>
                          <td className="px-3 py-2">
                            <div className="font-medium">{invoice.invoice_no}</div>
                            <div className="text-xs text-muted-foreground">创建 {formatDateShort(invoice.created_at)}</div>
                          </td>
                          <td className="px-3 py-2"><StatusBadge tone={invoiceTone(invoice.status)}>{invoiceStatusLabels[invoice.status]}</StatusBadge></td>
                          <td className="px-3 py-2 text-muted-foreground">{formatDateShort(invoice.period_start)} 至 {formatDateShort(invoice.period_end)}</td>
                          <td className="px-3 py-2 font-medium">{formatMoney(invoice.total_amount)}</td>
                          <td className="px-3 py-2 text-muted-foreground">{formatMoney(outstanding)}</td>
                          <td className="px-3 py-2">
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/billing/invoices/${encodeURIComponent(invoice.id)}`}>
                                查看详情
                                <ArrowRight className="size-4" />
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
