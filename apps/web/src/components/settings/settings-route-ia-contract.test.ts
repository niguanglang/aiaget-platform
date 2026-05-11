import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const settingsListSource = readFileSync(join(process.cwd(), 'src/components/settings/settings-content.tsx'), 'utf8');
const notificationPolicySourcePath = join(process.cwd(), 'src/components/settings/notification-policy-content.tsx');
const notificationPolicySnapshotsSourcePath = join(process.cwd(), 'src/components/settings/notification-policy-snapshots-content.tsx');
const productionReadinessSourcePath = join(process.cwd(), 'src/components/settings/production-readiness-content.tsx');
const systemSettingsPageSource = readFileSync(join(process.cwd(), 'src/app/(console)/system/settings/page.tsx'), 'utf8');

test('settings canonical route-level pages exist', () => {
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/settings/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/settings/notification-policy/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/settings/notification-policy/snapshots/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/settings/production-readiness/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/system/settings/page.tsx')));
});

test('system settings legacy route redirects or wraps canonical settings without owning implementation', () => {
  assert.match(systemSettingsPageSource, /redirect\(['"]\/settings/);
  assert.doesNotMatch(systemSettingsPageSource, /SettingsContent/);
  assert.doesNotMatch(systemSettingsPageSource, /NotificationPolicy/);
});

test('settings list page excludes notification policy snapshot and approval workflow state', () => {
  assert.match(settingsListSource, /getSystemSettingsOverview/);
  assert.match(settingsListSource, /listSystemSettings/);
  assert.doesNotMatch(settingsListSource, /NotificationPolicySnapshotPanel/);
  assert.doesNotMatch(settingsListSource, /rollbackNotificationPolicySnapshot/);
  assert.doesNotMatch(settingsListSource, /listNotificationPolicySnapshots/);
  assert.doesNotMatch(settingsListSource, /notificationPolicyApprovalSubmittedIds/);
  assert.doesNotMatch(settingsListSource, /approvalSubmitted/);
  assert.doesNotMatch(settingsListSource, /rollbackSnapshotTarget/);
});

test('notification policy dedicated pages own audit and snapshot workflows', () => {
  assert.ok(existsSync(notificationPolicySourcePath));
  assert.ok(existsSync(notificationPolicySnapshotsSourcePath));

  const notificationPolicySource = readFileSync(notificationPolicySourcePath, 'utf8');
  const snapshotsSource = readFileSync(notificationPolicySnapshotsSourcePath, 'utf8');

  assert.match(notificationPolicySource, /getNotificationPolicyAudit/);
  assert.match(notificationPolicySource, /previewNotificationPolicySettingChange/);
  assert.doesNotMatch(notificationPolicySource, /rollbackNotificationPolicySnapshot/);
  assert.match(snapshotsSource, /listNotificationPolicySnapshots/);
  assert.match(snapshotsSource, /rollbackNotificationPolicySnapshot/);
});

test('production readiness center owns rollout checklist and manual acceptance evidence', () => {
  assert.ok(existsSync(productionReadinessSourcePath));

  const productionReadinessSource = readFileSync(productionReadinessSourcePath, 'utf8');

  assert.match(settingsListSource, /\/settings\/production-readiness/);
  assert.match(productionReadinessSource, /生产落地中心/);
  assert.match(productionReadinessSource, /环境配置/);
  assert.match(productionReadinessSource, /外部服务/);
  assert.match(productionReadinessSource, /第三方联调/);
  assert.match(productionReadinessSource, /发布验收/);
  assert.match(productionReadinessSource, /风险项/);
  assert.match(productionReadinessSource, /getProductionReadinessOverview/);
  assert.match(productionReadinessSource, /acceptProductionReadinessCheck/);
  assert.match(productionReadinessSource, /提交验收/);
  assert.match(productionReadinessSource, /验收记录/);
  assert.match(productionReadinessSource, /可观测性证据/);
  assert.match(productionReadinessSource, /Trace 覆盖率/);
  assert.match(productionReadinessSource, /孤立事件/);
  assert.match(productionReadinessSource, /错误链路/);
  assert.match(productionReadinessSource, /慢链路/);
  assert.match(productionReadinessSource, /observability_signal/);
  assert.match(productionReadinessSource, /\/monitor\/observability/);
  assert.match(productionReadinessSource, /acceptanceDrafts/);
  assert.doesNotMatch(productionReadinessSource, /只读清单/);
  assert.doesNotMatch(productionReadinessSource, /只读取平台状态/);
  assert.doesNotMatch(productionReadinessSource, /method:\s*['"](PATCH|DELETE)/);
});
