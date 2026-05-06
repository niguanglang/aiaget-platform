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

test('monitor and runtime route-level pages exist', () => {
  assert.ok(existsSync(join(root, 'src/app/(console)/monitor/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/monitor/events/[eventId]/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/monitor/traces/[traceId]/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/monitor/observability/page.tsx')));
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

test('runtime workflows page owns runtime workflow API calls', () => {
  assert.ok(existsSync(workflowsSourcePath));

  const workflowsSource = readFileSync(workflowsSourcePath, 'utf8');
  const sharedPanelsSource = readFileSync(join(root, 'src/components/monitor/monitor-shared-panels.tsx'), 'utf8');

  assert.match(workflowsSource, /\/runtime\/workflows\/status/);
  assert.match(workflowsSource, /\/runtime\/workflows\/retry/);
  assert.match(workflowsSource, /\bRuntimeWorkflowStatusOverview\b/);
  assert.match(workflowsSource, /hasPermission\(permissions, 'knowledge:base:manage'\)/);
  assert.match(workflowsSource, /canRetry=\{canRetryWorkflows\}/);
  assert.match(sharedPanelsSource, /canRetry: boolean/);
  assert.match(sharedPanelsSource, /disabled=\{!canRetry \|\| pending\}/);
});
