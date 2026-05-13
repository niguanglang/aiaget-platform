'use client';

import type { BillingAdjustmentItem, CustomerSuccessOpportunityCloseWonReportArchiveItem } from '@aiaget/shared-types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Archive, ArrowLeft, ClipboardList, Download, FileText, Link2, ReceiptText, ShieldCheck, Trash2 } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useState } from 'react';

import {
  adjustmentStatusLabels,
  adjustmentStatusTone,
  adjustmentTypeLabels,
  adjustmentTypeTone,
  formatMoney as formatBillingMoney,
} from '@/components/billing/billing-shared';
import { CustomerSuccessOpportunityBackground } from '@/components/customer-success-opportunities/customer-success-opportunity-background';
import {
  customerSuccessOpportunityConfidenceLabel,
  customerSuccessOpportunityConfidenceTone,
  customerSuccessOpportunityRiskLabel,
  customerSuccessOpportunityRiskTone,
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
  createCustomerSuccessOpportunityCloseWonReportArchive,
  deleteCustomerSuccessOpportunityCloseWonReportArchive,
  exportCustomerSuccessOpportunityCloseWonReport,
  getCustomerSuccessOpportunityCloseWonReportArchiveDownloadUrl,
  getCustomerSuccessOpportunityCloseWonReport,
  listCustomerSuccessOpportunityCloseWonReportArchives,
  type ApiClientError,
} from '@/lib/api-client';

export function CustomerSuccessOpportunityCloseWonReportContent({ opportunityId }: { opportunityId: string }) {
  const [exportError, setExportError] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [archiveSuccess, setArchiveSuccess] = useState<string | null>(null);
  const reportQuery = useQuery({
    queryKey: ['customer-success-opportunity-close-won-report', opportunityId],
    queryFn: () => getCustomerSuccessOpportunityCloseWonReport(opportunityId),
  });
  const archiveQuery = useQuery({
    queryKey: ['customer-success-opportunity-close-won-report-archives', opportunityId],
    queryFn: () => listCustomerSuccessOpportunityCloseWonReportArchives(opportunityId),
  });
  const exportMutation = useMutation({
    mutationFn: () => exportCustomerSuccessOpportunityCloseWonReport(opportunityId),
    onSuccess: (blob) => {
      setExportError(null);
      downloadBlob(blob, closeWonReportFileName(reportQuery.data?.opportunity.code ?? opportunityId));
    },
    onError: (error: ApiClientError) => setExportError(error.message),
  });
  const archiveMutation = useMutation({
    mutationFn: () => createCustomerSuccessOpportunityCloseWonReportArchive(opportunityId),
    onSuccess: async () => {
      setArchiveError(null);
      await archiveQuery.refetch();
    },
    onError: (error: ApiClientError) => setArchiveError(error.message),
  });
  const downloadArchiveMutation = useMutation({
    mutationFn: (archiveId: string) => getCustomerSuccessOpportunityCloseWonReportArchiveDownloadUrl(opportunityId, archiveId),
    onSuccess: (result) => {
      setArchiveError(null);
      window.open(result.url, '_blank', 'noopener,noreferrer');
    },
    onError: (error: ApiClientError) => setArchiveError(error.message),
  });
  const requestDeleteArchiveMutation = useMutation({
    mutationFn: (archiveId: string) => deleteCustomerSuccessOpportunityCloseWonReportArchive(opportunityId, archiveId),
    onSuccess: async (result) => {
      setArchiveError(null);
      setArchiveSuccess(`删除审批已提交：${result.approval_id}`);
      await archiveQuery.refetch();
    },
    onError: (error: ApiClientError) => {
      setArchiveSuccess(null);
      setArchiveError(error.message);
    },
  });

  if (reportQuery.isLoading) {
    return (
      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <CustomerSuccessOpportunityBackground />
        <Card className="p-6 text-sm text-muted-foreground">正在生成成交复盘报告...</Card>
      </main>
    );
  }

  if (reportQuery.isError || !reportQuery.data) {
    return (
      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <CustomerSuccessOpportunityBackground />
        <Card className="p-6 text-sm text-destructive">成交复盘报告加载失败。</Card>
      </main>
    );
  }

  const report = reportQuery.data;
  const opportunity = report.opportunity;
  const firstAdjustmentNo = report.billing_trace[0]?.adjustment_no ?? opportunity.code;
  const auditHref = `/audit?keyword=${encodeURIComponent(firstAdjustmentNo)}`;
  const billingHref = `/billing/adjustments?keyword=${encodeURIComponent(firstAdjustmentNo)}`;

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <CustomerSuccessOpportunityBackground />

      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone={customerSuccessOpportunityStageTone(opportunity.stage)}>
              {customerSuccessOpportunityStageLabel(opportunity.stage)}
            </StatusBadge>
            <StatusBadge tone={customerSuccessOpportunityStatusTone(opportunity.status)}>
              {customerSuccessOpportunityStatusLabel(opportunity.status)}
            </StatusBadge>
            <StatusBadge tone={customerSuccessOpportunityConfidenceTone(opportunity.confidence_level)}>
              {customerSuccessOpportunityConfidenceLabel(opportunity.confidence_level)}
            </StatusBadge>
            <StatusBadge tone={customerSuccessOpportunityRiskTone(opportunity.risk_level)}>
              {customerSuccessOpportunityRiskLabel(opportunity.risk_level)}
            </StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">成交复盘报告</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {report.summary.customer_name} / {report.summary.opportunity_name} / {customerSuccessOpportunityTypeLabel(opportunity.opportunity_type)}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline">
            <Link href={`/customer-success-opportunities/${opportunity.id}`}>
              <ArrowLeft className="size-4" />
              返回详情
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={billingHref}>
              <ReceiptText className="size-4" />
              调账记录
            </Link>
          </Button>
          <Button asChild>
            <Link href={auditHref}>
              <ShieldCheck className="size-4" />
              审计追踪
            </Link>
          </Button>
          <Button disabled={exportMutation.isPending} onClick={() => exportMutation.mutate()} variant="outline">
            <Download className="size-4" />
            {exportMutation.isPending ? '导出中...' : '导出报告'}
          </Button>
          <Button disabled={archiveMutation.isPending} onClick={() => archiveMutation.mutate()} variant="outline">
            <Archive className="size-4" />
            {archiveMutation.isPending ? '归档中...' : '归档留存'}
          </Button>
        </div>
      </section>

      {exportError ? (
        <Card className="border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          导出报告失败：{exportError}
        </Card>
      ) : null}

      {archiveError ? (
        <Card className="border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          归档操作失败：{archiveError}
        </Card>
      ) : null}

      {archiveSuccess ? (
        <Card className="border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-700">
          {archiveSuccess}，审批通过后才会删除对象存储中的归档文件。
        </Card>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard helper="原始金额" label="预计金额" value={formatMoney(report.summary.estimated_amount)} />
        <MetricCard helper="金额 x 概率" label="加权金额" value={formatMoney(report.summary.weighted_amount)} />
        <MetricCard helper="已生效" label="成交金额" value={formatMoney(report.summary.close_amount)} />
        <MetricCard helper="入账记录" label="调账单数" value={`${report.summary.adjustment_count} 条`} />
        <MetricCard helper={`生成 ${formatDateTime(report.generated_at)}`} label="关闭时间" value={formatDateTime(report.summary.closed_at)} />
      </section>

      <ArchiveRetentionCard
        archives={archiveQuery.data?.items ?? []}
        isArchiving={archiveMutation.isPending}
        isDeleting={requestDeleteArchiveMutation.isPending}
        isDownloading={downloadArchiveMutation.isPending}
        isLoading={archiveQuery.isLoading}
        onArchive={() => archiveMutation.mutate()}
        onRequestDelete={(archiveId) => requestDeleteArchiveMutation.mutate(archiveId)}
        onDownload={(archiveId) => downloadArchiveMutation.mutate(archiveId)}
        totalSizeBytes={archiveQuery.data?.summary.total_size_bytes ?? 0}
      />

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="size-4 text-primary" />
            客户价值复盘
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <ReviewBlock title="客户价值" value={report.value_review.customer_value} />
            <ReviewBlock title="商务策略" value={report.value_review.commercial_strategy} />
            <ReviewBlock title="决策路径" value={report.value_review.decision_path} />
            <ReviewBlock title="风险摘要" value={report.value_review.risk_summary} />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Link2 className="size-4 text-primary" />
            来源链路
          </div>
          <div className="mt-4 grid gap-3">
            <SourceChainItem href={resourceHref('customer-success-plans', report.source_chain.customer_success_plan?.id)} label="客户成功计划" value={report.source_chain.customer_success_plan?.name} />
            <SourceChainItem href={resourceHref('customer-success-actions', report.source_chain.customer_success_action?.id)} label="成功行动" value={report.source_chain.customer_success_action?.name} />
            <SourceChainItem href={resourceHref('delivery-reviews', report.source_chain.delivery_review?.id)} label="交付复盘" value={report.source_chain.delivery_review?.name} />
            <SourceChainItem href={resourceHref('delivery-assets', report.source_chain.delivery_asset?.id)} label="成果资产" value={report.source_chain.delivery_asset?.name} />
            <SourceChainItem href={resourceHref('solution-packages', report.source_chain.solution_package?.id)} label="方案包" value={report.source_chain.solution_package?.name} />
          </div>
        </Card>
      </section>

      <Card className="p-5">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ReceiptText className="size-4 text-primary" />
              入账追踪
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href={billingHref}>全部调账</Link>
          </Button>
        </div>
        <div className="mt-4 grid gap-3">
          {report.billing_trace.length > 0 ? (
            report.billing_trace.map((adjustment) => <BillingTraceRow adjustment={adjustment} key={adjustment.id} />)
          ) : (
            <div className="rounded-md border bg-muted/15 px-3 py-4 text-sm text-muted-foreground">
              暂无入账追踪记录，可从调账记录按机会编号继续核查。
            </div>
          )}
        </div>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <InsightList icon={<ClipboardList className="size-4 text-primary" />} items={report.replay_points} title="复盘要点" />
        <InsightList icon={<ShieldCheck className="size-4 text-primary" />} items={report.next_actions} title="下一步动作" />
      </section>
    </main>
  );
}

function ArchiveRetentionCard({
  archives,
  isArchiving,
  isDeleting,
  isDownloading,
  isLoading,
  onArchive,
  onRequestDelete,
  onDownload,
  totalSizeBytes,
}: {
  archives: CustomerSuccessOpportunityCloseWonReportArchiveItem[];
  isArchiving: boolean;
  isDeleting: boolean;
  isDownloading: boolean;
  isLoading: boolean;
  onArchive: () => void;
  onRequestDelete: (archiveId: string) => void;
  onDownload: (archiveId: string) => void;
  totalSizeBytes: number;
}) {
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  return (
    <Card className="p-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Archive className="size-4 text-primary" />
            归档留存
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            将当前 Markdown 报告保存到对象存储，形成可下载、可审计、可复盘的成交资料留存。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone="planned">{archives.length} 份归档</StatusBadge>
          <StatusBadge tone="healthy">{formatBytes(totalSizeBytes)}</StatusBadge>
          <Button disabled={isArchiving} onClick={onArchive} variant="outline">
            <Archive className="size-4" />
            {isArchiving ? '归档中...' : '生成归档'}
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {isLoading ? (
          <div className="rounded-md border bg-muted/15 px-3 py-4 text-sm text-muted-foreground">正在加载归档记录...</div>
        ) : archives.length > 0 ? (
          archives.slice(0, 5).map((archive) => (
            <div className="flex flex-col justify-between gap-3 rounded-lg border bg-background/80 p-4 md:flex-row md:items-center" key={archive.id}>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{archive.file_name}</div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>大小：{formatBytes(archive.size_bytes)}</span>
                  <span>更新时间：{formatDateTime(archive.last_modified)}</span>
                  <span>机会编号：{archive.opportunity_code ?? '-'}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button disabled={isDownloading} onClick={() => onDownload(archive.id)} size="sm" variant="outline">
                  <Download className="size-4" />
                  下载归档
                </Button>
                {deleteTargetId === archive.id ? (
                  <>
                    <Button
                      disabled={isDeleting}
                      onClick={() => {
                        onRequestDelete(archive.id);
                        setDeleteTargetId(null);
                      }}
                      size="sm"
                      variant="destructive"
                    >
                      <Trash2 className="size-4" />
                      确认申请
                    </Button>
                    <Button disabled={isDeleting} onClick={() => setDeleteTargetId(null)} size="sm" variant="outline">
                      取消
                    </Button>
                  </>
                ) : (
                  <Button disabled={isDeleting} onClick={() => setDeleteTargetId(archive.id)} size="sm" variant="outline">
                    <Trash2 className="size-4" />
                    申请删除
                  </Button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col justify-between gap-3 rounded-md border bg-muted/15 px-3 py-4 text-sm text-muted-foreground md:flex-row md:items-center">
            <span>暂无归档文件。</span>
            <Button disabled={isArchiving} onClick={onArchive} size="sm" variant="outline">
              <Archive className="size-4" />
              生成归档
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

function MetricCard({ helper, label, value }: { helper: string; label: string; value: string }) {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold">{label}</h2>
      <p className="mt-3 truncate text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </Card>
  );
}

function ReviewBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background/80 p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{value || '暂无记录'}</p>
    </div>
  );
}

function SourceChainItem({ href, label, value }: { href: string | null; label: string; value?: string | null }) {
  const content = (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-background/80 px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate font-medium">{value ?? '未绑定'}</span>
    </div>
  );

  if (!href || !value) return content;
  return (
    <Link className="block transition-colors hover:text-primary" href={href}>
      {content}
    </Link>
  );
}

function BillingTraceRow({ adjustment }: { adjustment: BillingAdjustmentItem }) {
  const auditHref = `/audit?keyword=${encodeURIComponent(adjustment.adjustment_no)}`;
  const billingHref = `/billing/adjustments?keyword=${encodeURIComponent(adjustment.adjustment_no)}`;

  return (
    <div className="rounded-lg border bg-background/80 p-4">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold">{adjustment.adjustment_no}</span>
            <StatusBadge tone={adjustmentTypeTone(adjustment.type)}>{adjustmentTypeLabels[adjustment.type]}</StatusBadge>
            <StatusBadge tone={adjustmentStatusTone(adjustment.status)}>{adjustmentStatusLabels[adjustment.status]}</StatusBadge>
          </div>
          <div className="mt-3 grid gap-1 text-xs text-muted-foreground md:grid-cols-2">
            <span>影响金额：{formatBillingMoney(adjustment.signed_amount)}</span>
            <span>关联账单：{adjustment.invoice_no ?? '未绑定账单'}</span>
            <span>生效时间：{formatDateTime(adjustment.effective_at)}</span>
            <span className="truncate">入账说明：{adjustment.reason}</span>
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

function InsightList({ icon, items, title }: { icon: ReactNode; items: string[]; title: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </div>
      <div className="mt-4 grid gap-3">
        {items.length > 0 ? (
          items.map((item, index) => (
            <div className="flex gap-3 rounded-md border bg-background/80 px-3 py-2 text-sm leading-6" key={`${title}-${item}`}>
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                {index + 1}
              </span>
              <span className="text-muted-foreground">{item}</span>
            </div>
          ))
        ) : (
          <div className="rounded-md border bg-muted/15 px-3 py-4 text-sm text-muted-foreground">暂无{title}</div>
        )}
      </div>
    </Card>
  );
}

function resourceHref(module: string, id?: string | null) {
  return id ? `/${module}/${id}` : null;
}

function closeWonReportFileName(code: string) {
  const safeCode = code.replace(/[^a-zA-Z0-9_-]/g, '-');
  return `成交复盘报告-${safeCode}-${new Date().toISOString().slice(0, 10)}.md`;
}

function downloadBlob(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
