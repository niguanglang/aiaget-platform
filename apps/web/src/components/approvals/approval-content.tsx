'use client';

import { useQuery } from '@tanstack/react-query';
import { Archive, ClipboardCheck, FileArchive, RefreshCw, ScrollText, Settings2, Wrench } from 'lucide-react';
import Link from 'next/link';

import { ApprovalPageShell, ErrorBanner } from '@/components/approvals/approval-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  getApprovalAuditArchiveApprovalOverview,
  getNotificationPolicyApprovalOverview,
  getSecurityApprovalWorkbenchOverview,
  getToolApprovalOverview,
} from '@/lib/api-client';

export function ApprovalContent() {
  const toolOverviewQuery = useQuery({
    queryKey: ['tool-approval-overview'],
    queryFn: getToolApprovalOverview,
  });
  const notificationOverviewQuery = useQuery({
    queryKey: ['notification-policy-approval-overview'],
    queryFn: getNotificationPolicyApprovalOverview,
  });
  const archiveOverviewQuery = useQuery({
    queryKey: ['approval-audit-archive-approval-overview'],
    queryFn: getApprovalAuditArchiveApprovalOverview,
  });
  const workbenchOverviewQuery = useQuery({
    queryKey: ['security-approval-workbench-overview'],
    queryFn: getSecurityApprovalWorkbenchOverview,
  });

  const totalPending =
    workbenchOverviewQuery.data?.summary.pending_count ??
    (toolOverviewQuery.data?.pending_count ?? 0) +
      (notificationOverviewQuery.data?.pending_count ?? 0) +
      (archiveOverviewQuery.data?.pending_count ?? 0);
  const archivePending =
    workbenchOverviewQuery.data?.summary.archive_delete_pending_count ?? archiveOverviewQuery.data?.pending_count ?? 0;
  const hasError =
    toolOverviewQuery.isError ||
    notificationOverviewQuery.isError ||
    archiveOverviewQuery.isError ||
    workbenchOverviewQuery.isError;

  return (
    <ApprovalPageShell>
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">审批工作台</StatusBadge>
            <StatusBadge tone="planned">待办摘要</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">审批中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            查看高危工具、通知策略和归档删除审批的待办摘要，并进入对应队列处理明细。
          </p>
        </div>
        <Button
          onClick={() => {
            void toolOverviewQuery.refetch();
            void notificationOverviewQuery.refetch();
            void archiveOverviewQuery.refetch();
            void workbenchOverviewQuery.refetch();
          }}
          type="button"
          variant="outline"
        >
          <RefreshCw className="size-4" />
          刷新数据
        </Button>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard helper="全部审批来源" label="待办总数" value={`${totalPending}`} />
        <MetricCard helper="测试与运行时工具调用" label="工具待审" value={`${toolOverviewQuery.data?.pending_count ?? 0}`} />
        <MetricCard helper="高影响系统参数变更" label="策略待审" value={`${notificationOverviewQuery.data?.pending_count ?? 0}`} />
        <MetricCard helper="审计、告警、自愈与报告归档" label="归档删除待审" value={`${archivePending}`} />
      </section>

      <ErrorBanner message={hasError ? '部分审批摘要加载失败，可进入子页面查看具体队列或刷新重试。' : null} />

      <section className="grid gap-4 lg:grid-cols-3">
        <ApprovalEntryCard
          description="测试调用和运行时工具调用。"
          href="/approvals/tools"
          icon={<Wrench className="size-5" />}
          pending={toolOverviewQuery.data?.pending_count ?? 0}
          secondary={`运行时 ${toolOverviewQuery.data?.runtime_pending_count ?? 0} / 测试 ${toolOverviewQuery.data?.test_pending_count ?? 0}`}
          title="高危工具审批"
        />
        <ApprovalEntryCard
          description="通知策略、SLA 和重试策略变更。"
          href="/approvals/notification-policy"
          icon={<Settings2 className="size-5" />}
          pending={notificationOverviewQuery.data?.pending_count ?? 0}
          secondary={`高影响 ${notificationOverviewQuery.data?.high_impact_pending_count ?? 0}`}
          title="通知策略审批"
        />
        <ApprovalEntryCard
          description="审计、告警、自愈和报告归档删除。"
          href="/approvals/archive-deletions"
          icon={<Archive className="size-5" />}
          pending={archivePending}
          secondary={`已生效 ${archiveOverviewQuery.data?.applied_count ?? 0}`}
          title="归档删除审批"
        />
      </section>

      <Card className="grid gap-4 p-5">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="text-sm font-semibold">审计与追踪入口</h2>
            <p className="mt-1 text-sm text-muted-foreground">审批事件、导出和归档记录。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/approval-audits">
                <ScrollText className="size-4" />
                审批审计
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/security">
                <ClipboardCheck className="size-4" />
                安全总览
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/agent-teams/report-archives">
                <FileArchive className="size-4" />
                报告归档
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </ApprovalPageShell>
  );
}

function ApprovalEntryCard({
  description,
  href,
  icon,
  pending,
  secondary,
  title,
}: {
  description: string;
  href: string;
  icon: React.ReactNode;
  pending: number;
  secondary: string;
  title: string;
}) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="inline-flex size-9 items-center justify-center rounded-md border bg-muted/30">{icon}</span>
          {title}
        </div>
        <StatusBadge tone={pending > 0 ? 'degraded' : 'healthy'}>待审 {pending}</StatusBadge>
      </div>
      <p className="min-h-16 text-sm leading-6 text-muted-foreground">{description}</p>
      <div className="flex items-center justify-between gap-3 border-t pt-4">
        <span className="text-xs text-muted-foreground">{secondary}</span>
        <Button asChild size="sm">
          <Link href={href}>进入队列</Link>
        </Button>
      </div>
    </Card>
  );
}
