import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const overviewRoutePath = join(root, 'src/app/(console)/security/page.tsx');
const childRoutes = ['policies', 'events', 'alerts', 'recovery'] as const;
const childComponents = {
  policies: join(root, 'src/components/security/security-policies-content.tsx'),
  events: join(root, 'src/components/security/security-events-content.tsx'),
  alerts: join(root, 'src/components/security/security-alerts-content.tsx'),
  recovery: join(root, 'src/components/security/security-recovery-content.tsx'),
} satisfies Record<(typeof childRoutes)[number], string>;

function readSource(path: string) {
  return readFileSync(path, 'utf8');
}

test('security overview route still owns the aggregate SecurityPolicyContent entry', () => {
  assert.ok(existsSync(overviewRoutePath));
  const overviewRouteSource = readSource(overviewRoutePath);

  assert.match(overviewRouteSource, /SecurityPolicyContent/);
  assert.doesNotMatch(overviewRouteSource, /view=['"](?:policies|events|alerts|recovery)['"]/);
});

test('security child route pages and component files exist', () => {
  for (const route of childRoutes) {
    assert.ok(existsSync(join(root, `src/app/(console)/security/${route}/page.tsx`)));
    assert.ok(existsSync(childComponents[route]));
  }
});

test('security child components are real pages, not SecurityPolicyContent view wrappers', () => {
  for (const route of childRoutes) {
    const source = readSource(childComponents[route]);

    assert.doesNotMatch(source, /SecurityPolicyContent/);
    assert.doesNotMatch(source, /view=['"](?:policies|events|alerts|recovery)['"]/);
    assert.match(source, /useQuery/);
    assert.match(source, /<main\b/);
  }
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

test('events page owns security event tracing data flow and Chinese page responsibility', () => {
  const source = readSource(childComponents.events);

  assert.match(source, /安全事件/);
  assert.match(source, /事件列表/);
  assert.match(source, /事件详情/);
  assert.match(source, /Trace/);
  assert.match(source, /listSecurityCenterEvents/);
  assert.match(source, /getSecurityCenterEvent/);
  assert.doesNotMatch(source, /listSecurityPolicies/);
  assert.doesNotMatch(source, /listSecurityApprovalWorkbenchItems/);
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
  assert.match(source, /getSecurityOperationAlertSlaOverview/);
  assert.doesNotMatch(source, /listSecurityPolicies/);
  assert.doesNotMatch(source, /listSecurityCenterEvents/);
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
