import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const approvalsOverviewPath = join(root, 'src/components/approvals/approval-content.tsx');
const toolApprovalsRoutePath = join(root, 'src/app/(console)/approvals/tools/page.tsx');
const notificationPolicyApprovalsRoutePath = join(root, 'src/app/(console)/approvals/notification-policy/page.tsx');
const toolApprovalsPath = join(root, 'src/components/approvals/tool-approvals-content.tsx');
const notificationPolicyApprovalsPath = join(
  root,
  'src/components/approvals/notification-policy-approvals-content.tsx',
);
const archiveDeletionApprovalsPath = join(root, 'src/components/approvals/archive-deletion-approvals-content.tsx');
const sharedPath = join(root, 'src/components/approvals/approval-shared.tsx');

const approvalsOverviewSource = readFileSync(approvalsOverviewPath, 'utf8');

test('approval center route-level pages and split components exist', () => {
  assert.ok(existsSync(join(root, 'src/app/(console)/approvals/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/approvals/tools/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/approvals/notification-policy/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/approvals/archive-deletions/page.tsx')));

  assert.ok(existsSync(sharedPath));
  assert.ok(existsSync(toolApprovalsPath));
  assert.ok(existsSync(notificationPolicyApprovalsPath));
  assert.ok(existsSync(archiveDeletionApprovalsPath));
});

test('approval overview stays a workbench summary without complete queues or review forms', () => {
  assert.match(approvalsOverviewSource, /审批工作台|审批中心/);
  assert.match(approvalsOverviewSource, /getToolApprovalOverview/);
  assert.match(approvalsOverviewSource, /getNotificationPolicyApprovalOverview/);
  assert.match(approvalsOverviewSource, /getApprovalAuditArchiveApprovalOverview/);
  assert.match(approvalsOverviewSource, /href="\/approvals\/tools"/);
  assert.match(approvalsOverviewSource, /href="\/approvals\/notification-policy"/);
  assert.match(approvalsOverviewSource, /href="\/approvals\/archive-deletions"/);

  assert.doesNotMatch(approvalsOverviewSource, /listToolApprovals/);
  assert.doesNotMatch(approvalsOverviewSource, /listNotificationPolicyApprovals/);
  assert.doesNotMatch(approvalsOverviewSource, /listApprovalAuditArchiveApprovals/);
  assert.doesNotMatch(approvalsOverviewSource, /approveToolApproval/);
  assert.doesNotMatch(approvalsOverviewSource, /rejectToolApproval/);
  assert.doesNotMatch(approvalsOverviewSource, /approveNotificationPolicyApproval/);
  assert.doesNotMatch(approvalsOverviewSource, /rejectNotificationPolicyApproval/);
  assert.doesNotMatch(approvalsOverviewSource, /approveApprovalAuditArchiveApproval/);
  assert.doesNotMatch(approvalsOverviewSource, /rejectApprovalAuditArchiveApproval/);
  assert.doesNotMatch(approvalsOverviewSource, /ApprovalDetailPanel/);
  assert.doesNotMatch(approvalsOverviewSource, /NotificationPolicyApprovalDetailPanel/);
  assert.doesNotMatch(approvalsOverviewSource, /ArchiveDeleteApprovalDetailPanel/);
  assert.doesNotMatch(approvalsOverviewSource, /<textarea/);
});

test('tool approvals child page owns high-risk tool queue APIs and Chinese title', () => {
  const source = readFileSync(toolApprovalsPath, 'utf8');

  assert.match(source, /高危工具审批/);
  assert.match(source, /listToolApprovals/);
  assert.match(source, /getToolApproval/);
  assert.match(source, /approveToolApproval/);
  assert.match(source, /rejectToolApproval/);
  assert.doesNotMatch(source, /listNotificationPolicyApprovals/);
  assert.doesNotMatch(source, /listApprovalAuditArchiveApprovals/);
});

test('notification policy approvals child page owns policy approval APIs and Chinese title', () => {
  const source = readFileSync(notificationPolicyApprovalsPath, 'utf8');

  assert.match(source, /通知策略审批/);
  assert.match(source, /listNotificationPolicyApprovals/);
  assert.match(source, /getNotificationPolicyApproval/);
  assert.match(source, /approveNotificationPolicyApproval/);
  assert.match(source, /rejectNotificationPolicyApproval/);
  assert.doesNotMatch(source, /listToolApprovals/);
  assert.doesNotMatch(source, /listApprovalAuditArchiveApprovals/);
});

test('archive deletion approvals child page owns archive deletion approval APIs and Chinese title', () => {
  const source = readFileSync(archiveDeletionApprovalsPath, 'utf8');

  assert.match(source, /归档删除审批/);
  assert.match(source, /listApprovalAuditArchiveApprovals/);
  assert.match(source, /getApprovalAuditArchiveApproval/);
  assert.match(source, /approveApprovalAuditArchiveApproval/);
  assert.match(source, /rejectApprovalAuditArchiveApproval/);
  assert.match(source, /listSecurityOperationAlertNotificationArchiveApprovals/);
  assert.match(source, /listSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovals/);
  assert.match(source, /listSecurityOperationAlertSlaDeadLetterAuditArchiveApprovals/);
  assert.match(source, /listAgentTeamRunReportArchiveApprovals/);
  assert.doesNotMatch(source, /listNotificationPolicyApprovals/);
  assert.doesNotMatch(source, /listToolApprovals/);
});

test('approval decision actions require explicit confirmation before approve or reject mutation', () => {
  const sharedSource = readFileSync(sharedPath, 'utf8');

  assert.match(sharedSource, /function ApprovalDecisionConfirmDialog/);
  assert.match(sharedSource, /decisionActionTarget/);
  assert.match(sharedSource, /function confirmDecisionAction/);
  assert.match(sharedSource, /确认审批通过/);
  assert.match(sharedSource, /确认审批拒绝/);
  assert.match(sharedSource, /onConfirm=\{confirmDecisionAction\}/);
  assert.doesNotMatch(sharedSource, /<Button disabled=\{isDisabled\} onClick=\{onApprove\}/);
  assert.doesNotMatch(sharedSource, /<Button disabled=\{isDisabled\} onClick=\{onReject\}/);
}
);

test('approval child routes using search params are wrapped in suspense boundaries', () => {
  const toolRouteSource = readFileSync(toolApprovalsRoutePath, 'utf8');
  const notificationRouteSource = readFileSync(notificationPolicyApprovalsRoutePath, 'utf8');

  for (const source of [toolRouteSource, notificationRouteSource]) {
    assert.match(source, /import \{ Suspense \} from 'react'/);
    assert.match(source, /<Suspense fallback=/);
  }
});
