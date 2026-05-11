import assert from 'node:assert/strict';
import test from 'node:test';

process.env.RUNTIME_BASE_URL ??= 'http://runtime.example.test';
process.env.RUNTIME_INTERNAL_TOKEN ??= 'test-runtime-internal-token';
process.env.CHANNEL_RELEASE_WORKFLOW_MODE = 'temporal';
process.env.CHANNEL_RELEASE_SELF_HEALING_WORKFLOW_MODE = 'temporal';

test('channel release automation dispatch returns runtime workflow identifiers immediately', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    backend: 'TEMPORAL',
    workflow_id: 'release-automation-workflow-1',
    run_id: 'release-automation-run-1',
  }), { status: 200 });

  try {
    const { ChannelReleaseAutomationWorkflowService } = await import('./channel-release-automation-workflow.service');
    const service = new ChannelReleaseAutomationWorkflowService({
      getReleaseAutomation: async () => ({
        generated_at: '2026-05-11T00:00:00.000Z',
        channel_id: 'channel-1',
        policy: {},
        gate: {},
        current_batch: null,
        running: false,
        last_run: null,
        today_run_count: 0,
        next_allowed_at: null,
        recent_events: [],
      }),
    } as never);

    const result = await service.dispatch(buildUser(), 'channel-1');

    assert.equal(result.workflow_backend, 'TEMPORAL');
    assert.equal(result.workflow_id, 'release-automation-workflow-1');
    assert.equal(result.workflow_run_id, 'release-automation-run-1');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('channel release self-healing dispatch returns runtime workflow identifiers immediately', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    backend: 'TEMPORAL',
    workflow_id: 'release-self-healing-workflow-1',
    run_id: 'release-self-healing-run-1',
  }), { status: 200 });

  try {
    const { ChannelReleaseSelfHealingWorkflowService } = await import('./channel-release-self-healing-workflow.service');
    const service = new ChannelReleaseSelfHealingWorkflowService({
      getReleaseSelfHealing: async () => ({
        generated_at: '2026-05-11T00:00:00.000Z',
        channel_id: 'channel-1',
        policy: {},
        evaluation: {},
        last_run: null,
        next_allowed_at: null,
        recent_events: [],
      }),
    } as never);

    const result = await service.dispatch(buildUser(), 'channel-1');

    assert.equal(result.workflow_backend, 'TEMPORAL');
    assert.equal(result.workflow_id, 'release-self-healing-workflow-1');
    assert.equal(result.workflow_run_id, 'release-self-healing-run-1');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

function buildUser() {
  return {
    id: 'user-1',
    tenantId: 'tenant-1',
    departmentId: 'dept-1',
    email: 'operator@example.test',
    roles: [],
    permissions: ['channel:publish:deploy'],
    requestId: 'request-1',
    traceId: 'trace-1',
  };
}
