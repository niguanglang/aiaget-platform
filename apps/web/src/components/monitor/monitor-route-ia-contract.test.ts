import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const monitorListSource = readFileSync(join(root, 'src/components/monitor/monitor-content.tsx'), 'utf8');
const eventDetailSourcePath = join(root, 'src/components/monitor/monitor-event-detail-content.tsx');
const traceSourcePath = join(root, 'src/components/monitor/monitor-trace-content.tsx');
const observabilitySourcePath = join(root, 'src/components/monitor/monitor-observability-content.tsx');
const workflowsSourcePath = join(root, 'src/components/monitor/runtime-workflows-content.tsx');
const platformUsageOverviewSourcePath = join(root, 'src/components/platform-event-usage/platform-usage-overview-content.tsx');
const platformEventDetailSourcePath = join(root, 'src/components/platform-event-usage/platform-event-detail-content.tsx');
const platformUsageAlertsSourcePath = join(root, 'src/components/platform-event-usage/platform-usage-alerts-content.tsx');
const platformUsageNotificationsSourcePath = join(root, 'src/components/platform-event-usage/platform-usage-notifications-content.tsx');
const platformUsageTasksSourcePath = join(root, 'src/components/platform-event-usage/platform-usage-tasks-content.tsx');

test('monitor and runtime route-level pages exist', () => {
  assert.ok(existsSync(join(root, 'src/app/(console)/monitor/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/monitor/events/[eventId]/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/monitor/traces/[traceId]/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/monitor/observability/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/monitor/platform-usage/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/monitor/platform-usage/events/[eventId]/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/monitor/platform-usage/alerts/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/monitor/platform-usage/notifications/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/monitor/platform-usage/tasks/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/runtime/workflows/page.tsx')));
});

test('monitor list page owns overview and event list without selected detail state', () => {
  assert.match(monitorListSource, /\bgetMonitorOverview\b/);
  assert.match(monitorListSource, /\blistMonitorEvents\b/);
  assert.doesNotMatch(monitorListSource, /\bselectedEvent\b/);
  assert.doesNotMatch(monitorListSource, /\bselectedEventId\b/);
  assert.doesNotMatch(monitorListSource, /\bselectedEventQuery\b/);
  assert.doesNotMatch(monitorListSource, /\bgetMonitorEvent\b/);
  assert.doesNotMatch(monitorListSource, /\bgetMonitorTrace\b/);
  assert.doesNotMatch(monitorListSource, /\bgetMonitorObservabilityOverview\b/);
  assert.doesNotMatch(monitorListSource, /\bPlatformEventUsagePanel\b/);
  assert.doesNotMatch(monitorListSource, /platform-event-usage/);
  assert.doesNotMatch(monitorListSource, /\bgetPlatformUsageOverview\b/);
  assert.doesNotMatch(monitorListSource, /\blistPlatformEvents\b/);
});

test('legacy trace_id query remains compatible on monitor list route', () => {
  assert.match(monitorListSource, /trace_id/);
  assert.match(monitorListSource, /\/monitor\/traces\/\$\{encodeURIComponent\(legacyTraceId\)\}/);
});

test('dedicated monitor pages own detail and observability APIs', () => {
  assert.ok(existsSync(eventDetailSourcePath));
  assert.ok(existsSync(traceSourcePath));
  assert.ok(existsSync(observabilitySourcePath));

  const eventDetailSource = readFileSync(eventDetailSourcePath, 'utf8');
  const traceSource = readFileSync(traceSourcePath, 'utf8');
  const observabilitySource = readFileSync(observabilitySourcePath, 'utf8');

  assert.match(eventDetailSource, /\bgetMonitorEvent\b/);
  assert.doesNotMatch(eventDetailSource, /\bgetMonitorTrace\b/);

  assert.match(traceSource, /\bgetMonitorTrace\b/);
  assert.doesNotMatch(traceSource, /\bgetMonitorEvent\b/);

  assert.match(observabilitySource, /\bgetMonitorObservabilityOverview\b/);
  assert.doesNotMatch(observabilitySource, /\bgetMonitorEvent\b/);
});

test('platform usage has focused route-level pages for overview, event details, alerts, notifications and tasks', () => {
  assert.ok(existsSync(platformUsageOverviewSourcePath));
  assert.ok(existsSync(platformEventDetailSourcePath));
  assert.ok(existsSync(platformUsageAlertsSourcePath));
  assert.ok(existsSync(platformUsageNotificationsSourcePath));
  assert.ok(existsSync(platformUsageTasksSourcePath));

  const overviewSource = readFileSync(platformUsageOverviewSourcePath, 'utf8');
  const eventDetailSource = readFileSync(platformEventDetailSourcePath, 'utf8');
  const alertsSource = readFileSync(platformUsageAlertsSourcePath, 'utf8');
  const notificationsSource = readFileSync(platformUsageNotificationsSourcePath, 'utf8');
  const tasksSource = readFileSync(platformUsageTasksSourcePath, 'utf8');

  assert.match(overviewSource, /\bgetPlatformUsageOverview\b/);
  assert.match(overviewSource, /\blistPlatformEvents\b/);
  assert.match(overviewSource, /\blistPlatformUsageTrends\b/);
  assert.match(overviewSource, /\blistPlatformUsageLedger\b/);
  assert.doesNotMatch(overviewSource, /\bgetPlatformEvent\b/);
  assert.doesNotMatch(overviewSource, /\bdetectPlatformUsageAnomalies\b/);
  assert.doesNotMatch(overviewSource, /\brunPlatformUsageAlertNotificationAutoRetry\b/);

  assert.match(eventDetailSource, /\bgetPlatformEvent\b/);
  assert.doesNotMatch(eventDetailSource, /\blistPlatformEvents\b/);

  assert.match(alertsSource, /\bdetectPlatformUsageAnomalies\b/);
  assert.match(alertsSource, /\blistPlatformUsageAlerts\b/);
  assert.match(alertsSource, /\bupdatePlatformUsageAlert\b/);
  assert.match(alertsSource, /\bnotifyPlatformUsageAlert\b/);
  assert.doesNotMatch(alertsSource, /\bgetPlatformEvent\b/);

  assert.match(notificationsSource, /\blistPlatformUsageAlertNotifications\b/);
  assert.match(notificationsSource, /\bretryPlatformUsageAlertNotification\b/);
  assert.doesNotMatch(notificationsSource, /\bgetPlatformUsageAlertNotificationTaskOverview\b/);

  assert.match(tasksSource, /\bgetPlatformUsageAlertNotificationTaskOverview\b/);
  assert.match(tasksSource, /\brunPlatformUsageAlertNotificationAutoRetry\b/);
  assert.doesNotMatch(tasksSource, /\blistPlatformUsageAlertNotifications\b/);
});

test('platform usage governance actions require confirmation before mutation', () => {
  const sharedSource = readFileSync(join(root, 'src/components/platform-event-usage/platform-usage-shared.tsx'), 'utf8');
  const legacyPanelSource = readFileSync(join(root, 'src/components/platform-event-usage/platform-event-usage-panel.tsx'), 'utf8');
  const alertsSource = readFileSync(platformUsageAlertsSourcePath, 'utf8');
  const notificationsSource = readFileSync(platformUsageNotificationsSourcePath, 'utf8');
  const tasksSource = readFileSync(platformUsageTasksSourcePath, 'utf8');

  assert.match(sharedSource, /function PlatformUsageConfirmDialog/);

  assert.match(alertsSource, /platformUsageActionTarget/);
  assert.match(alertsSource, /function confirmPlatformUsageAction/);
  assert.match(alertsSource, /确认检测用量异常/);
  assert.match(alertsSource, /确认重建 Rollup/);
  assert.match(alertsSource, /确认通知用量告警/);
  assert.match(alertsSource, /确认更新告警状态/);
  assert.match(alertsSource, /onConfirm=\{confirmPlatformUsageAction\}/);
  assert.doesNotMatch(alertsSource, /onClick=\{\(\) => detectAnomaliesMutation\.mutate\(\)\}/);
  assert.doesNotMatch(alertsSource, /onClick=\{\(\) => rebuildRollupsMutation\.mutate\(\)\}/);
  assert.doesNotMatch(alertsSource, /onAction=\{\(alertId, action\) => updateAlertMutation\.mutate\(\{ alertId, action \}\)\}/);
  assert.doesNotMatch(alertsSource, /onNotify=\{\(alertId\) => notifyAlertMutation\.mutate\(\{ alertId \}\)\}/);

  assert.match(legacyPanelSource, /platformUsageActionTarget/);
  assert.match(legacyPanelSource, /function confirmPlatformUsageAction/);
  assert.match(legacyPanelSource, /PlatformUsageConfirmDialog/);
  assert.doesNotMatch(legacyPanelSource, /onClick=\{\(\) => detectAnomaliesMutation\.mutate\(\)\}/);
  assert.doesNotMatch(legacyPanelSource, /onClick=\{\(\) => rebuildRollupsMutation\.mutate\(\)\}/);
  assert.doesNotMatch(legacyPanelSource, /onNotify=\{\(alertId\) => notifyAlertMutation\.mutate\(\{ alertId \}\)\}/);
  assert.doesNotMatch(legacyPanelSource, /onAction=\{\(alertId, action\) => updateAlertMutation\.mutate\(\{ alertId, action \}\)\}/);
  assert.doesNotMatch(legacyPanelSource, /onRetry=\{\(notificationEventId\) => retryAlertNotificationMutation\.mutate\(\{ notificationEventId \}\)\}/);
  assert.doesNotMatch(legacyPanelSource, /onRunAutoRetry=\{\(\) => runAlertNotificationTaskMutation\.mutate\(\)\}/);

  assert.match(notificationsSource, /notificationRetryTarget/);
  assert.match(notificationsSource, /function confirmNotificationRetry/);
  assert.match(notificationsSource, /确认重试告警通知/);
  assert.match(notificationsSource, /onConfirm=\{confirmNotificationRetry\}/);
  assert.doesNotMatch(notificationsSource, /onRetry=\{\(notificationEventId\) => retryNotificationMutation\.mutate\(\{ notificationEventId \}\)\}/);

  assert.match(tasksSource, /taskRunTarget/);
  assert.match(tasksSource, /function confirmTaskRun/);
  assert.match(tasksSource, /确认运行自动重试任务/);
  assert.match(tasksSource, /onConfirm=\{confirmTaskRun\}/);
  assert.doesNotMatch(tasksSource, /onRunAutoRetry=\{\(\) => runTaskMutation\.mutate\(\)\}/);
});

test('runtime workflows page owns runtime workflow API calls', () => {
  assert.ok(existsSync(workflowsSourcePath));

  const workflowsSource = readFileSync(workflowsSourcePath, 'utf8');
  const sharedPanelsSource = readFileSync(join(root, 'src/components/monitor/monitor-shared-panels.tsx'), 'utf8');

  assert.match(workflowsSource, /\/runtime\/workflows\/status/);
  assert.match(workflowsSource, /\/runtime\/workflows\/retry/);
  assert.match(workflowsSource, /\bRuntimeWorkflowStatusOverview\b/);
  assert.match(workflowsSource, /\bRuntimeWorkflowRetryResult\b/);
  assert.match(workflowsSource, /hasPermission\(permissions, 'knowledge:base:manage'\)/);
  assert.match(workflowsSource, /hasPermission\(permissions, 'agent:team:run'\)/);
  assert.match(workflowsSource, /hasPermission\(permissions, 'channel:publish:deploy'\)/);
  assert.match(workflowsSource, /canRetryWorkflowTask/);
  assert.match(workflowsSource, /canRetry=\{canRetryWorkflowTask\}/);
  assert.match(sharedPanelsSource, /canRetry: \(task: RuntimeWorkflowRecoverableTaskItem\) => boolean/);
  assert.match(sharedPanelsSource, /disabled=\{!canRetry\(task\) \|\| pending\}/);
  assert.match(sharedPanelsSource, /团队协作运行/);
  assert.match(sharedPanelsSource, /Workflow ID/);
  assert.match(sharedPanelsSource, /Workflow Run ID/);
  assert.match(sharedPanelsSource, /task\.workflow_id/);
  assert.match(sharedPanelsSource, /task\.workflow_run_id/);
  assert.doesNotMatch(sharedPanelsSource, /完整日志/);
  assert.doesNotMatch(sharedPanelsSource, /Trace 详情/);
});

test('runtime workflow retry requires confirmation before mutation', () => {
  const workflowsSource = readFileSync(workflowsSourcePath, 'utf8');

  assert.match(workflowsSource, /workflowRetryTarget/);
  assert.match(workflowsSource, /function confirmWorkflowRetry/);
  assert.match(workflowsSource, /确认恢复工作流任务/);
  assert.match(workflowsSource, /最近重试结果/);
  assert.match(workflowsSource, /retryWorkflowMutation\.data\?\.workflow_backend/);
  assert.match(workflowsSource, /retryWorkflowMutation\.data\?\.workflow_id/);
  assert.match(workflowsSource, /retryWorkflowMutation\.data\?\.workflow_run_id/);
  assert.match(workflowsSource, /onConfirm=\{confirmWorkflowRetry\}/);
  assert.doesNotMatch(
    workflowsSource,
    /onRetry=\{\(taskType, taskId\) => retryWorkflowMutation\.mutate\(\{ task_type: taskType, task_id: taskId \}\)\}/,
  );
});
