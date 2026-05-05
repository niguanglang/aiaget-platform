import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeWorkflowMode, resolveWorkflowBackendStatus } from './runtime-workflow-status';

test('reports dispatch failed when the latest workflow event is a dispatch failure', () => {
  const status = resolveWorkflowBackendStatus('temporal', {
    eventType: 'workflow.knowledge_task.dispatch_failed',
    workflowBackend: null,
    errorMessage: 'Temporal workflow dispatch failed: connect ECONNREFUSED',
  });

  assert.equal(status.backend, null);
  assert.equal(status.status, 'DISPATCH_FAILED');
  assert.match(status.latest_failure?.error_message ?? '', /ECONNREFUSED/);
});

test('reports temporal backend from the latest successful dispatch event', () => {
  const status = resolveWorkflowBackendStatus('temporal_first', {
    eventType: 'workflow.knowledge_task.dispatched',
    workflowBackend: 'TEMPORAL',
    errorMessage: null,
  });

  assert.equal(status.backend, 'TEMPORAL');
  assert.equal(status.status, 'READY');
  assert.equal(status.latest_failure, null);
});

test('reports local backend for local workflow mode without events', () => {
  const status = resolveWorkflowBackendStatus('local', null);

  assert.equal(status.backend, 'LOCAL');
  assert.equal(status.status, 'READY');
});

test('normalizes legacy runtime knowledge workflow modes to temporal_first', () => {
  assert.equal(normalizeWorkflowMode('runtime_first'), 'temporal_first');
  assert.equal(normalizeWorkflowMode('runtime_only'), 'temporal_first');
});
