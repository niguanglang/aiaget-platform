import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const overviewRoutePath = join(root, 'src/app/(console)/security/page.tsx');
const eventDetailRoutePath = join(root, 'src/app/(console)/security/events/[eventId]/page.tsx');
const eventDetailComponentPath = join(root, 'src/components/security/security-event-detail-content.tsx');
const childRoutes = ['policies', 'events', 'alerts', 'recovery', 'archives'] as const;
const childComponents = {
  policies: join(root, 'src/components/security/security-policies-content.tsx'),
  events: join(root, 'src/components/security/security-events-content.tsx'),
  alerts: join(root, 'src/components/security/security-alerts-content.tsx'),
  recovery: join(root, 'src/components/security/security-recovery-content.tsx'),
  archives: join(root, 'src/components/security/security-archives-content.tsx'),
} satisfies Record<(typeof childRoutes)[number], string>;

function readSource(path: string) {
  return readFileSync(path, 'utf8');
}

test('security overview route renders the lightweight SecurityOverviewContent entry', () => {
  assert.ok(existsSync(overviewRoutePath));
  const overviewRouteSource = readSource(overviewRoutePath);

  assert.match(overviewRouteSource, /SecurityOverviewContent/);
  assert.doesNotMatch(overviewRouteSource, /SecurityPolicyContent/);
  assert.doesNotMatch(overviewRouteSource, /view=['"](?:policies|events|alerts|recovery)['"]/);
});

test('security overview component stays a governance entry instead of a list workspace', () => {
  const overviewComponentPath = join(root, 'src/components/security/security-overview-content.tsx');
  const legacyAggregatePath = join(root, 'src/components/security/security-policy-content.tsx');

  assert.ok(existsSync(overviewComponentPath));
  assert.ok(!existsSync(legacyAggregatePath), 'legacy security-policy-content.tsx should be removed after route split');
  const source = readSource(overviewComponentPath);

  assert.match(source, /安全治理总览/);
  assert.match(source, /策略治理/);
  assert.match(source, /安全事件/);
  assert.match(source, /告警运营/);
  assert.match(source, /自愈恢复/);
  assert.match(source, /归档治理/);
  assert.match(source, /getSecurityCenterOverview/);
  assert.match(source, /getSecurityPolicyOverview/);
  assert.match(source, /getSecurityApprovalWorkbenchOverview/);
  assert.match(source, /getSecurityOperationAlertNotificationTaskOverview/);
  assert.match(source, /<main\b/);
  assert.doesNotMatch(source, /SecurityPolicyContent/);
  assert.doesNotMatch(source, /listSecurityPolicies/);
  assert.doesNotMatch(source, /listSecurityCenterEvents/);
  assert.doesNotMatch(source, /listSecurityApprovalWorkbenchItems/);
});

test('security child route pages and component files exist', () => {
  for (const route of childRoutes) {
    assert.ok(existsSync(join(root, `src/app/(console)/security/${route}/page.tsx`)));
    assert.ok(existsSync(childComponents[route]));
  }

  assert.ok(existsSync(eventDetailRoutePath));
  assert.ok(existsSync(eventDetailComponentPath));
});

test('security child components are real pages, not SecurityPolicyContent view wrappers', () => {
  for (const route of childRoutes) {
    const source = readSource(childComponents[route]);

    assert.doesNotMatch(source, /SecurityPolicyContent/);
    assert.doesNotMatch(source, /view=['"](?:policies|events|alerts|recovery|archives)['"]/);
    assert.match(source, /useQuery/);
    assert.match(source, /<main\b/);
  }
});

test('archives page owns archive governance data flow and Chinese page responsibility', () => {
  const source = readSource(childComponents.archives);

  assert.match(source, /归档治理/);
  assert.match(source, /告警通知归档/);
  assert.match(source, /自愈审计归档/);
  assert.match(source, /SLA 死信归档/);
  assert.match(source, /删除审批/);
  assert.match(source, /listSecurityOperationAlertNotificationArchives/);
  assert.match(source, /listSecurityOperationAlertNotificationArchiveApprovals/);
  assert.match(source, /listSecurityOperationAlertNotificationTaskRecoveryAuditArchives/);
  assert.match(source, /listSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovals/);
  assert.match(source, /listSecurityOperationAlertSlaDeadLetterAuditArchives/);
  assert.match(source, /listSecurityOperationAlertSlaDeadLetterAuditArchiveApprovals/);
  assert.match(source, /deleteSecurityOperationAlertNotificationArchive/);
  assert.match(source, /deleteSecurityOperationAlertNotificationTaskRecoveryAuditArchive/);
  assert.match(source, /deleteSecurityOperationAlertSlaDeadLetterAuditArchive/);
  assert.doesNotMatch(source, /listSecurityPolicies/);
  assert.doesNotMatch(source, /listSecurityCenterEvents/);
});

test('policies page owns policy governance data flow and Chinese page responsibility', () => {
  const source = readSource(childComponents.policies);

  assert.match(source, /策略治理/);
  assert.match(source, /策略清单/);
  assert.match(source, /评估日志/);
  assert.match(source, /getSecurityPolicyOverview/);
  assert.match(source, /listSecurityPolicies/);
  assert.match(source, /listSecurityPolicyEvaluations/);
  assert.match(source, /enableSecurityPolicy/);
  assert.match(source, /disableSecurityPolicy/);
  assert.doesNotMatch(source, /listSecurityCenterEvents/);
  assert.doesNotMatch(source, /listSecurityApprovalWorkbenchItems/);
});

test('security high-impact governance actions require confirmation before mutation', () => {
  const sharedSource = readSource(join(root, 'src/components/security/security-page-shared.tsx'));
  const policiesSource = readSource(childComponents.policies);
  const archivesSource = readSource(childComponents.archives);

  assert.match(sharedSource, /function SecurityConfirmDialog/);

  assert.match(policiesSource, /policyStatusTarget/);
  assert.match(policiesSource, /function confirmPolicyStatusChange/);
  assert.match(policiesSource, /确认更新策略状态/);
  assert.match(policiesSource, /onConfirm=\{confirmPolicyStatusChange\}/);
  assert.doesNotMatch(policiesSource, /onClick=\{\(\) => statusMutation\.mutate\(\{ policyId: policy\.id, nextStatus \}\)\}/);

  assert.match(archivesSource, /archiveDeleteTarget/);
  assert.match(archivesSource, /function confirmArchiveDelete/);
  assert.match(archivesSource, /确认申请删除归档/);
  assert.match(archivesSource, /onConfirm=\{confirmArchiveDelete\}/);
  assert.doesNotMatch(archivesSource, /window\.confirm/);
});

test('events page owns security event tracing data flow and Chinese page responsibility', () => {
  const source = readSource(childComponents.events);

  assert.match(source, /安全事件/);
  assert.match(source, /事件列表/);
  assert.match(source, /Trace/);
  assert.match(source, /listSecurityCenterEvents/);
  assert.match(source, /\/security\/events\/\$\{encodeURIComponent\(event\.id\)\}/);
  assert.doesNotMatch(source, /\bselectedEventId\b/);
  assert.doesNotMatch(source, /\bsetSelectedEventId\b/);
  assert.doesNotMatch(source, /\bdetailQuery\b/);
  assert.doesNotMatch(source, /getSecurityCenterEvent/);
  assert.doesNotMatch(source, /事件详情/);
  assert.doesNotMatch(source, /listSecurityPolicies/);
  assert.doesNotMatch(source, /listSecurityApprovalWorkbenchItems/);
});

test('security event detail page owns detail lookup without list filters', () => {
  const routeSource = readSource(eventDetailRoutePath);
  const source = readSource(eventDetailComponentPath);

  assert.match(routeSource, /SecurityEventDetailContent/);
  assert.match(source, /安全事件详情/);
  assert.match(source, /getSecurityCenterEvent/);
  assert.match(source, /请求摘要/);
  assert.match(source, /主体 \/ 资源 \/ 上下文/);
  assert.doesNotMatch(source, /listSecurityCenterEvents/);
  assert.doesNotMatch(source, /\bsetKeyword\b/);
  assert.doesNotMatch(source, /\bsetPage\b/);
});

test('alerts page owns approval and alert operation data flow and Chinese page responsibility', () => {
  const source = readSource(childComponents.alerts);

  assert.match(source, /告警运营/);
  assert.match(source, /审批工作台/);
  assert.match(source, /通知审计/);
  assert.match(source, /SLA/);
  assert.match(source, /getSecurityCenterOverview/);
  assert.match(source, /getSecurityApprovalWorkbenchOverview/);
  assert.match(source, /listSecurityApprovalWorkbenchItems/);
  assert.match(source, /listSecurityOperationAlertNotifications/);
  assert.match(source, /exportSecurityOperationAlertNotifications/);
  assert.match(source, /createSecurityOperationAlertNotificationArchive/);
  assert.match(source, /notificationCategory/);
  assert.match(source, /notificationCategories/);
  assert.match(source, /客户成功复盘归档删除通知/);
  assert.match(source, /getSecurityOperationAlertSlaOverview/);
  assert.match(source, /客户成功复盘归档删除/);
  assert.match(source, /CUSTOMER_SUCCESS_CLOSE_WON_REPORT_ARCHIVE_DELETE/);
  assert.match(source, /customer_success_close_won_report_archive_delete_pending/);
  assert.match(source, /客户成功复盘删除待审/);
  assert.doesNotMatch(source, /listSecurityPolicies/);
  assert.doesNotMatch(source, /listSecurityCenterEvents/);
});

test('alerts page completes unified approval detail and review workflow', () => {
  const source = readSource(childComponents.alerts);

  assert.match(source, /getSecurityApprovalWorkbenchItem/);
  assert.match(source, /reviewSecurityApprovalWorkbenchItem/);
  assert.match(source, /SecurityConfirmDialog/);
  assert.match(source, /approvalReviewTarget/);
  assert.match(source, /decisionNote/);
  assert.match(source, /approvalRiskDomain/);
  assert.match(source, /来源扩展信息/);
  assert.match(source, /审批时间线/);
  assert.match(source, /通过审批/);
  assert.match(source, /拒绝审批/);
  assert.match(source, /确认通过审批/);
  assert.match(source, /确认拒绝审批/);
  assert.match(source, /reviewMutation/);
  assert.match(source, /canHandleApprovals/);
  assert.doesNotMatch(source, /详情处理保留在现有审批链路/);
  assert.doesNotMatch(source, /<Link href="\/security">\s*[\s\S]*处理入口/);
});

test('alerts page refreshes original approval source pages after unified review', () => {
  const source = readSource(childComponents.alerts);

  assert.match(source, /invalidateApprovalWorkbenchSourceQueries/);
  assert.match(source, /\['tool-approvals'\]/);
  assert.match(source, /\['notification-policy-approval-overview'\]/);
  assert.match(source, /\['notification-policy-approvals'\]/);
  assert.match(source, /\['notification-policy-snapshots'\]/);
  assert.match(source, /\['approval-audit-archive-approval-overview'\]/);
  assert.match(source, /\['approval-audit-archive-approvals'\]/);
  assert.match(source, /\['approval-audit-archives'\]/);
  assert.match(source, /\['approval-audit-overview'\]/);
  assert.match(source, /\['agent-team-run-report-archive-approvals'\]/);
  assert.match(source, /\['agent-team-run-report-archives'\]/);
  assert.match(source, /\['customer-success-close-won-report-archive-approvals'\]/);
  assert.match(source, /\['customer-success-opportunity-close-won-report-archives'\]/);
  assert.match(source, /\['security-operation-alert-notification-archive-approvals'\]/);
  assert.match(source, /\['security-operation-alert-notification-task-recovery-audit-archive-approvals'\]/);
  assert.match(source, /\['security-operation-alert-sla-dead-letter-audit-archive-approvals'\]/);
  assert.match(source, /\['security-archive-governance-notification-approval-overview'\]/);
  assert.match(source, /\['security-archive-governance-recovery-approval-overview'\]/);
  assert.match(source, /\['security-archive-governance-sla-approval-overview'\]/);
  assert.match(source, /\['security-recovery-page-archive-approval-overview'\]/);
  assert.match(source, /\['security-recovery-page-archive-approvals'\]/);
});

test('alerts page exports current unified approval filters with guarded Chinese feedback', () => {
  const source = readSource(childComponents.alerts);

  assert.match(source, /exportSecurityApprovalWorkbenchItems/);
  assert.match(source, /exportMutation/);
  assert.match(source, /导出当前筛选/);
  assert.match(source, /正在导出/);
  assert.match(source, /当前筛选命中/);
  assert.match(source, /当前筛选无结果，无法导出/);
  assert.match(source, /审批工作台导出完成/);
  assert.match(source, /审批工作台导出失败/);
  assert.match(source, /downloadBlob/);
  assert.match(source, /approvalItemsQuery\.data\?\.total/);
  assert.match(source, /keyword: approvalKeyword/);
  assert.match(source, /type: approvalType/);
  assert.match(source, /status: approvalStatus/);
  assert.match(source, /risk_domain: approvalRiskDomain/);
  assert.match(source, /disabled=\{!canViewApprovals \|\| approvalTotal === 0 \|\| exportMutation\.isPending/);
});

test('alerts page exposes approval workbench export operations metrics and alert lifecycle actions', () => {
  const source = readSource(childComponents.alerts);

  assert.match(source, /审批工作台导出治理/);
  assert.match(source, /approval_workbench_exports_24h/);
  assert.match(source, /approval_workbench_exported_records_24h/);
  assert.match(source, /approval_workbench_high_risk_exports_24h/);
  assert.match(source, /approval_workbench_repeated_exports_24h/);
  assert.match(source, /导出次数/);
  assert.match(source, /导出记录/);
  assert.match(source, /高风险筛选/);
  assert.match(source, /重复导出/);
  assert.match(source, /导出治理风险/);
  assert.match(source, /查看导出事件/);

  assert.match(source, /notifySecurityOperationAlert/);
  assert.match(source, /updateSecurityOperationAlert/);
  assert.match(source, /operationAlertActionTarget/);
  assert.match(source, /confirmOperationAlertAction/);
  assert.match(source, /确认通知运营告警/);
  assert.match(source, /确认更新运营告警状态/);
  assert.match(source, /发送通知/);
  assert.match(source, /确认告警/);
  assert.match(source, /升级告警/);
  assert.match(source, /关闭告警/);
  assert.match(source, /onConfirm=\{confirmOperationAlertAction\}/);
});

test('recovery page owns notification task recovery data flow and Chinese page responsibility', () => {
  const source = readSource(childComponents.recovery);

  assert.match(source, /自愈恢复/);
  assert.match(source, /任务运行/);
  assert.match(source, /恢复审计/);
  assert.match(source, /归档审批/);
  assert.match(source, /getSecurityOperationAlertNotificationTaskOverview/);
  assert.match(source, /listSecurityOperationAlertNotificationTaskRuns/);
  assert.match(source, /listSecurityOperationAlertNotificationTaskRecoveryAudits/);
  assert.match(source, /listSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovals/);
  assert.match(source, /客户成功复盘归档删除/);
  assert.match(source, /CUSTOMER_SUCCESS_CLOSE_WON_REPORT_ARCHIVE_DELETE/);
  assert.match(source, /customer_success_close_won_report_archive_delete_failed_count/);
  assert.doesNotMatch(source, /listSecurityPolicies/);
  assert.doesNotMatch(source, /listSecurityCenterEvents/);
});

test('recovery page status filter only exposes backend-supported recovery audit states', () => {
  const source = readSource(childComponents.recovery);
  const recoveryStatusesMatch = source.match(/const recoveryStatuses[\s\S]*?];/);

  assert.ok(recoveryStatusesMatch);
  const recoveryStatusesSource = recoveryStatusesMatch[0];
  assert.match(source, /ACKNOWLEDGED/);
  assert.match(source, /IGNORED/);
  assert.match(source, /RESOLVED/);
  assert.doesNotMatch(recoveryStatusesSource, /value: 'OPEN'/);
});
