'use client';

import {
  hasPermission,
  type SecurityApprovalWorkbenchRiskDomain,
  type SecurityApprovalWorkbenchStatus,
  type SecurityApprovalWorkbenchType,
  type SecurityOperationAlertNotificationStatus,
} from '@aiaget/shared-types';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, ClipboardCheck, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { SecurityPolicyBackground } from '@/components/security/security-policy-background';
import {
  LoadingRows,
  PageError,
  RefreshButton,
  SecurityWorkspaceHeader,
  alertStatusLabel,
  alertStatusTone,
  approvalStatusLabel,
  approvalStatusTone,
  formatDateTime,
  formatNumber,
  notificationStatusLabel,
  notificationStatusTone,
  securityRiskLevelLabel,
  securityRiskTone,
  shortId,
  slaStatusLabel,
  slaStatusTone,
} from '@/components/security/security-page-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  getSecurityApprovalWorkbenchOverview,
  getSecurityCenterOverview,
  getSecurityOperationAlertSlaOverview,
  listSecurityApprovalWorkbenchItems,
  listSecurityOperationAlertNotifications,
} from '@/lib/api-client';

const approvalTypes: Array<{ label: string; value: SecurityApprovalWorkbenchType }> = [
  { label: '工具调用审批', value: 'TOOL_CALL' },
  { label: '通知策略审批', value: 'NOTIFICATION_POLICY' },
  { label: '审批审计归档删除', value: 'APPROVAL_AUDIT_ARCHIVE_DELETE' },
  { label: '团队报告归档删除', value: 'AGENT_TEAM_RUN_REPORT_ARCHIVE_DELETE' },
  { label: '告警通知归档删除', value: 'OPERATION_ALERT_NOTIFICATION_ARCHIVE_DELETE' },
  { label: 'SLA 死信归档删除', value: 'SLA_DEAD_LETTER_AUDIT_ARCHIVE_DELETE' },
  { label: '自愈审计归档删除', value: 'NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE' },
];
const approvalStatuses: Array<{ label: string; value: SecurityApprovalWorkbenchStatus }> = [
  { label: '待审批', value: 'PENDING' },
  { label: '已批准', value: 'APPROVED' },
  { label: '已拒绝', value: 'REJECTED' },
  { label: '已生效', value: 'APPLIED' },
];
const notificationStatuses: Array<{ label: string; value: SecurityOperationAlertNotificationStatus }> = [
  { label: '已发送', value: 'SENT' },
  { label: '部分成功', value: 'PARTIAL' },
  { label: '已跳过', value: 'SKIPPED' },
  { label: '失败', value: 'FAILED' },
];

export function SecurityAlertsContent() {
  const { currentUser } = useAuth();
  const [approvalKeyword, setApprovalKeyword] = useState('');
  const [approvalType, setApprovalType] = useState<SecurityApprovalWorkbenchType | ''>('');
  const [approvalStatus, setApprovalStatus] = useState<SecurityApprovalWorkbenchStatus | ''>('PENDING');
  const [notificationStatus, setNotificationStatus] = useState<SecurityOperationAlertNotificationStatus | ''>('');
  const [notificationKeyword, setNotificationKeyword] = useState('');

  const canViewApprovals = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'security:approval:view'),
  );
  const canHandleApprovals = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'security:approval:handle'),
  );

  const securityOverviewQuery = useQuery({
    queryKey: ['security-alerts-page-overview'],
    queryFn: getSecurityCenterOverview,
  });
  const approvalOverviewQuery = useQuery({
    enabled: canViewApprovals,
    queryKey: ['security-alerts-page-approval-overview'],
    queryFn: getSecurityApprovalWorkbenchOverview,
  });
  const approvalItemsQuery = useQuery({
    enabled: canViewApprovals,
    queryKey: ['security-alerts-page-approval-items', approvalKeyword, approvalType, approvalStatus],
    queryFn: () =>
      listSecurityApprovalWorkbenchItems({
        page: 1,
        page_size: 8,
        keyword: approvalKeyword,
        type: approvalType,
        status: approvalStatus,
        risk_domain: '' as SecurityApprovalWorkbenchRiskDomain | '',
      }),
  });
  const notificationQuery = useQuery({
    queryKey: ['security-alerts-page-notifications', notificationStatus, notificationKeyword],
    queryFn: () =>
      listSecurityOperationAlertNotifications({
        status: notificationStatus,
        keyword: notificationKeyword,
      }),
  });
  const slaQuery = useQuery({
    queryKey: ['security-alerts-page-sla-overview'],
    queryFn: getSecurityOperationAlertSlaOverview,
  });

  const securityOverview = securityOverviewQuery.data;
  const approvalOverview = approvalOverviewQuery.data;
  const approvalItems = approvalItemsQuery.data?.items ?? [];
  const notifications = notificationQuery.data?.items ?? [];
  const alerts = securityOverview?.approval_operations.operational_alerts ?? [];
  const slaItems = slaQuery.data?.items ?? [];

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <SecurityPolicyBackground />

      <SecurityWorkspaceHeader
        actions={
          <>
            <RefreshButton loading={securityOverviewQuery.isFetching || approvalOverviewQuery.isFetching || approvalItemsQuery.isFetching || notificationQuery.isFetching || slaQuery.isFetching} onClick={() => {
              void securityOverviewQuery.refetch();
              void approvalOverviewQuery.refetch();
              void approvalItemsQuery.refetch();
              void notificationQuery.refetch();
              void slaQuery.refetch();
            }} />
            <Button asChild variant="outline">
              <Link href="/security/recovery">
                <ArrowRight className="size-4" />
                自愈恢复
              </Link>
            </Button>
          </>
        }
        badge="闭环"
        description="集中查看审批工作台、运营告警、通知审计和 SLA 超时风险；处理类动作继续通过既有总览能力和后端接口闭环。"
        title="告警运营"
      />

      {!canViewApprovals ? (
        <PageError>当前账号无安全审批查看权限，审批工作台仅显示权限提示。</PageError>
      ) : null}
      {!canHandleApprovals && canViewApprovals ? (
        <PageError>当前账号可查看审批，但无处理权限；批准、拒绝等动作入口会保持只读。</PageError>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard helper="安全中心运营告警" label="运营告警" value={formatNumber(alerts.length)} />
        <MetricCard helper="等待处理" label="待审批" value={formatNumber(approvalOverview?.summary.pending_count)} />
        <MetricCard helper="最近通知审计" label="通知失败" value={formatNumber(notificationQuery.data?.summary.failed_count)} />
        <MetricCard helper="SLA 扫描" label="超时告警" value={formatNumber(slaQuery.data?.summary.overdue_count)} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="min-w-0 overflow-hidden">
          <div className="border-b p-4">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">审批工作台</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">按审批类型和状态查看安全高风险待办，详情处理保留在现有审批链路。</p>
            <div className="mt-4 grid gap-2 md:grid-cols-3">
              <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm md:col-span-1">
                <Search className="size-4 shrink-0 text-muted-foreground" />
                <input
                  className="min-w-0 flex-1 bg-transparent outline-none"
                  onChange={(event) => setApprovalKeyword(event.target.value)}
                  placeholder="搜索审批、目标、request_id"
                  value={approvalKeyword}
                />
              </label>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setApprovalType(event.target.value as SecurityApprovalWorkbenchType | '')} value={approvalType}>
                <option value="">全部类型</option>
                {approvalTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setApprovalStatus(event.target.value as SecurityApprovalWorkbenchStatus | '')} value={approvalStatus}>
                <option value="">全部状态</option>
                {approvalStatuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
          </div>

          {!canViewApprovals ? (
            <EmptyState description="需要 security:approval:view 或租户管理员角色。" title="无权查看审批工作台" />
          ) : approvalItemsQuery.isError ? (
            <div className="p-4"><PageError>审批工作台加载失败。</PageError></div>
          ) : approvalItemsQuery.isLoading ? (
            <LoadingRows count={5} />
          ) : approvalItems.length === 0 ? (
            <EmptyState description="当前筛选下暂无审批记录。" title="暂无审批" />
          ) : (
            <div className="divide-y">
              {approvalItems.map((item) => (
                <div className="grid gap-3 p-4 xl:grid-cols-[1fr_150px_150px] xl:items-center" key={item.id}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={approvalStatusTone(item.status)}>{approvalStatusLabel(item.status)}</StatusBadge>
                      <StatusBadge tone={securityRiskTone(item.risk_level)}>{securityRiskLevelLabel(item.risk_level)}</StatusBadge>
                      <span className="font-medium">{item.title}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.target_label} · {shortId(item.request_id)} · {formatDateTime(item.requested_at)}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">申请人：{item.requester?.name ?? '系统'}</div>
                  <div className="flex justify-start xl:justify-end">
                    <Button asChild size="sm" variant="outline">
                      <Link href="/security">
                        <ArrowRight className="size-4" />
                        处理入口
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="h-fit p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">运营告警</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">来自安全中心态势聚合接口的操作告警，支持确认、升级、关闭和通知的后端动作。</p>
          {securityOverviewQuery.isError ? (
            <PageError>运营告警加载失败。</PageError>
          ) : securityOverviewQuery.isLoading ? (
            <LoadingRows count={4} />
          ) : alerts.length === 0 ? (
            <EmptyState className="px-0" description="当前暂无需要处理的运营告警。" title="暂无告警" />
          ) : (
            <div className="mt-4 grid gap-3">
              {alerts.map((alert) => (
                <div className="rounded-md border bg-muted/15 p-3" key={alert.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={alertStatusTone(alert.status)}>{alertStatusLabel(alert.status)}</StatusBadge>
                    <StatusBadge tone={securityRiskTone(alert.severity)}>{securityRiskLevelLabel(alert.severity)}</StatusBadge>
                    <span className="font-medium">{alert.title}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{alert.description}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{alert.metric} · 触发 {formatDateTime(alert.triggered_at)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="border-b p-4">
            <h2 className="text-sm font-semibold">通知审计</h2>
            <p className="mt-1 text-sm text-muted-foreground">按状态检索运营告警通知审计，导出和归档删除审批由后端既有接口负责。</p>
            <div className="mt-4 grid gap-2 md:grid-cols-[180px_1fr]">
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setNotificationStatus(event.target.value as SecurityOperationAlertNotificationStatus | '')} value={notificationStatus}>
                <option value="">全部状态</option>
                {notificationStatuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
                <Search className="size-4 shrink-0 text-muted-foreground" />
                <input className="min-w-0 flex-1 bg-transparent outline-none" onChange={(event) => setNotificationKeyword(event.target.value)} placeholder="搜索告警、消息、trace_id" value={notificationKeyword} />
              </label>
            </div>
          </div>
          {notificationQuery.isError ? (
            <div className="p-4"><PageError>通知审计加载失败。</PageError></div>
          ) : notificationQuery.isLoading ? (
            <LoadingRows count={4} />
          ) : notifications.length === 0 ? (
            <EmptyState description="当前筛选下暂无通知审计。" title="暂无通知" />
          ) : (
            <div className="divide-y">
              {notifications.slice(0, 8).map((item) => (
                <div className="grid gap-2 p-4 md:grid-cols-[1fr_150px] md:items-center" key={item.notification_event_id}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={notificationStatusTone(item.status)}>{notificationStatusLabel(item.status)}</StatusBadge>
                      {item.alert_category ? <StatusBadge tone="planned">{item.alert_category}</StatusBadge> : null}
                      <span className="font-medium">{shortId(item.alert_id)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.message}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">重试 {item.retry_count} 次 · {formatDateTime(item.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b p-4">
            <h2 className="text-sm font-semibold">SLA 告警</h2>
            <p className="mt-1 text-sm text-muted-foreground">展示超时扫描、自动升级和待通知状态，具体升级动作复用现有后端接口。</p>
          </div>
          {slaQuery.isError ? (
            <div className="p-4"><PageError>SLA 告警加载失败。</PageError></div>
          ) : slaQuery.isLoading ? (
            <LoadingRows count={4} />
          ) : slaItems.length === 0 ? (
            <EmptyState description="当前暂无 SLA 告警。" title="暂无 SLA 告警" />
          ) : (
            <div className="divide-y">
              {slaItems.slice(0, 8).map((item) => (
                <div className="grid gap-2 p-4 md:grid-cols-[1fr_150px] md:items-center" key={item.alert_id}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={slaStatusTone(item.sla_status)}>{slaStatusLabel(item.sla_status)}</StatusBadge>
                      <StatusBadge tone={alertStatusTone(item.status)}>{alertStatusLabel(item.status)}</StatusBadge>
                      <span className="font-medium">{item.title}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">到期 {formatDateTime(item.due_at)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
    </main>
  );
}
