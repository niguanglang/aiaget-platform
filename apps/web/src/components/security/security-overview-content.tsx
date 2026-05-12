'use client';

import { useQuery } from '@tanstack/react-query';
import { Archive, ArrowRight, BellRing, ClipboardCheck, FileWarning, RefreshCw, ShieldCheck, Wrench } from 'lucide-react';
import Link from 'next/link';

import { SecurityPolicyBackground } from '@/components/security/security-policy-background';
import {
  LoadingRows,
  PageError,
  formatDateTime,
  formatNumber,
  formatPercent,
  securityRiskLevelLabel,
  securityRiskTone,
} from '@/components/security/security-page-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  getSecurityApprovalWorkbenchOverview,
  getSecurityCenterOverview,
  getSecurityOperationAlertNotificationTaskOverview,
  getSecurityPolicyOverview,
} from '@/lib/api-client';

const entryCards = [
  {
    title: '策略治理',
    description: '安全策略、访问边界和评估记录。',
    href: '/security/policies',
    icon: ShieldCheck,
    badge: 'ABAC',
  },
  {
    title: '安全事件',
    description: '拒绝、失败、异常和 Trace 事件。',
    href: '/security/events',
    icon: FileWarning,
    badge: 'Trace',
  },
  {
    title: '告警运营',
    description: '审批待办、运营告警和 SLA 风险。',
    href: '/security/alerts',
    icon: BellRing,
    badge: '告警',
  },
  {
    title: '自愈恢复',
    description: '通知任务、自动重试和恢复审计。',
    href: '/security/recovery',
    icon: Wrench,
    badge: '任务',
  },
  {
    title: '归档治理',
    description: '告警、自愈和死信归档删除。',
    href: '/security/archives',
    icon: Archive,
    badge: '归档',
  },
];

export function SecurityOverviewContent() {
  const securityOverviewQuery = useQuery({
    queryKey: ['security-overview-entry-center'],
    queryFn: getSecurityCenterOverview,
  });
  const policyOverviewQuery = useQuery({
    queryKey: ['security-overview-entry-policies'],
    queryFn: getSecurityPolicyOverview,
  });
  const approvalOverviewQuery = useQuery({
    queryKey: ['security-overview-entry-approvals'],
    queryFn: getSecurityApprovalWorkbenchOverview,
  });
  const notificationTaskOverviewQuery = useQuery({
    queryKey: ['security-overview-entry-notification-tasks'],
    queryFn: getSecurityOperationAlertNotificationTaskOverview,
  });

  const securityOverview = securityOverviewQuery.data;
  const policyOverview = policyOverviewQuery.data;
  const approvalOverview = approvalOverviewQuery.data;
  const notificationTaskOverview = notificationTaskOverviewQuery.data;
  const isFetching =
    securityOverviewQuery.isFetching ||
    policyOverviewQuery.isFetching ||
    approvalOverviewQuery.isFetching ||
    notificationTaskOverviewQuery.isFetching;
  const hasError =
    securityOverviewQuery.isError ||
    policyOverviewQuery.isError ||
    approvalOverviewQuery.isError ||
    notificationTaskOverviewQuery.isError;
  const risks = securityOverview?.risks ?? [];
  const suggestions = securityOverview?.approval_operations.notification_task_recovery_suggestions ?? [];
  const alerts = securityOverview?.approval_operations.operational_alerts ?? [];
  const postureTone = securityOverview ? securityRiskTone(securityOverview.posture.level) : 'loading';

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <SecurityPolicyBackground />

      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone={postureTone}>
              {securityOverview ? securityRiskLevelLabel(securityOverview.posture.level) : '加载中'}
            </StatusBadge>
            <StatusBadge tone="healthy">治理入口</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">安全治理总览</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">安全态势、待办、风险和归档。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={isFetching}
            onClick={() => {
              void securityOverviewQuery.refetch();
              void policyOverviewQuery.refetch();
              void approvalOverviewQuery.refetch();
              void notificationTaskOverviewQuery.refetch();
            }}
            type="button"
            variant="outline"
          >
            <RefreshCw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button asChild>
            <Link href="/security/policies">
              <ShieldCheck className="size-4" />
              策略治理
            </Link>
          </Button>
        </div>
      </section>

      {hasError ? <PageError>安全治理总览部分数据加载失败，可刷新重试或进入对应子页面查看。</PageError> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard helper="综合评分" label="治理评分" value={securityOverview ? formatNumber(securityOverview.posture.score) : '--'} />
        <MetricCard helper="当前参与匹配" label="生效策略" value={formatNumber(policyOverview?.active)} />
        <MetricCard helper="审批工作台待处理" label="待审批" value={formatNumber(approvalOverview?.summary.pending_count)} />
        <MetricCard
          helper="通知任务失败与重试"
          label="自愈待办"
          value={formatNumber(notificationTaskOverview?.summary.pending_auto_retry_count)}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ClipboardCheck className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">待办与运营摘要</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">审批、告警、通知任务和调度状态。</p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/security/alerts">
                <ArrowRight className="size-4" />
                告警运营
              </Link>
            </Button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <SummaryItem label="高风险待审批" value={approvalOverview?.summary.high_risk_pending_count} />
            <SummaryItem label="归档删除待审批" value={approvalOverview?.summary.archive_delete_pending_count} />
            <SummaryItem label="运营告警" value={alerts.length} />
            <SummaryItem label="24h 通知任务失败率" value={formatPercent(securityOverview?.approval_operations.notification_task_failure_rate_24h)} />
          </div>

          <div className="mt-4 rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
            最早待审批：{formatDateTime(approvalOverview?.summary.oldest_pending_at)} · 调度：
            {notificationTaskOverview?.scheduler_enabled ? '已启用' : '未启用'} · 最近扫描：
            {formatDateTime(notificationTaskOverview?.last_tick_at)}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <FileWarning className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">风险摘要</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">风险信号和恢复建议。</p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/security/events">
                <ArrowRight className="size-4" />
                安全事件
              </Link>
            </Button>
          </div>

          {securityOverviewQuery.isLoading ? (
            <LoadingRows count={3} />
          ) : risks.length === 0 && suggestions.length === 0 ? (
            <EmptyState className="px-0 py-8" description="当前没有风险信号。" title="暂无风险" />
          ) : (
            <div className="mt-4 grid gap-3">
              {risks.slice(0, 3).map((risk) => (
                <div className="rounded-md border bg-background/80 p-3" key={risk.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={securityRiskTone(risk.severity)}>{securityRiskLevelLabel(risk.severity)}</StatusBadge>
                    <span className="font-medium">{risk.title}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{risk.description}</p>
                </div>
              ))}
              {suggestions.slice(0, 2).map((suggestion) => (
                <div className="rounded-md border bg-background/80 p-3" key={suggestion.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone="degraded">自愈建议</StatusBadge>
                    <span className="font-medium">{suggestion.title}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{suggestion.description}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {entryCards.map((entry) => {
          const Icon = entry.icon;

          return (
            <Card className="flex min-h-52 flex-col justify-between p-5" key={entry.href}>
              <div>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex size-10 items-center justify-center rounded-md border bg-muted/30">
                    <Icon className="size-5 text-foreground" />
                  </div>
                  <StatusBadge tone="planned">{entry.badge}</StatusBadge>
                </div>
                <h2 className="text-sm font-semibold">{entry.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{entry.description}</p>
              </div>
              <Button asChild className="mt-5 w-full" variant="outline">
                <Link href={entry.href}>
                  进入
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </Card>
          );
        })}
      </section>
    </main>
  );
}

function SummaryItem({ label, value }: { label: string; value: number | string | null | undefined }) {
  return (
    <div className="rounded-md border bg-background/80 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold">{typeof value === 'number' ? formatNumber(value) : value ?? '--'}</div>
    </div>
  );
}
