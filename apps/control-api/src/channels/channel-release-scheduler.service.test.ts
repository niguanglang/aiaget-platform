import assert from 'node:assert/strict';
import test from 'node:test';

import type { ChannelReleaseSchedulerService } from './channel-release-scheduler.service';

process.env.RUNTIME_BASE_URL ??= 'http://runtime.example.test';
process.env.RUNTIME_INTERNAL_TOKEN ??= 'test-runtime-internal-token';

const tenantId = '00000000-0000-0000-0000-000000000001';

test('scheduled release scheduler skips the second instance in the same tenant window', async () => {
  const state = createReleaseSchedulerState();
  const first = await createService(state);
  const second = await createService(state);

  await runScheduledTick(first);
  await runScheduledTick(second);

  assert.equal(state.channelFinds.length, 1);
  assert.equal(state.automationDispatches.length, 1);
  assert.equal(state.selfHealingDispatches.length, 1);

  const lockedEvents = state.recordedEvents.filter((event) => event.eventType === 'channel.release_scheduler.scheduled_run_locked');
  assert.equal(lockedEvents.length, 1);
  assert.equal(lockedEvents[0]?.status, 'LOCKED');
});

test('scheduled release scheduler lock expires and allows the next window to run', async () => {
  const state = createReleaseSchedulerState({
    platformEvents: [buildLockEvent(new Date(Date.now() - 60 * 60 * 1000))],
  });
  const service = await createService(state);

  await runScheduledTick(service);

  assert.equal(state.channelFinds.length, 1);
  assert.equal(state.automationDispatches.length, 1);
  assert.equal(state.selfHealingDispatches.length, 1);
  assert.equal(state.recordedEvents.filter((event) => event.eventType === 'channel.release_scheduler.scheduled_run_locked').length, 0);
});

test('scheduled release scheduler preserves workflow identifiers from dispatch results', async () => {
  const state = createReleaseSchedulerState();
  const service = await createService(state);

  const result = await service.runOnce(tenantId);

  const automation = result.results.find((item) => item.task === 'AUTOMATION');
  const selfHealing = result.results.find((item) => item.task === 'SELF_HEALING');
  assert.equal(automation?.workflow_backend, 'TEMPORAL');
  assert.equal(automation?.workflow_id, 'release-automation-workflow-1');
  assert.equal(automation?.workflow_run_id, 'release-automation-run-1');
  assert.equal(selfHealing?.workflow_backend, 'TEMPORAL');
  assert.equal(selfHealing?.workflow_id, 'release-self-healing-workflow-1');
  assert.equal(selfHealing?.workflow_run_id, 'release-self-healing-run-1');

  const finishEvent = state.recordedEvents.find((event) =>
    event.eventType === 'channel.release_scheduler.scheduled_run_finished'
    || event.eventType === 'channel.release_scheduler.manual_run_finished'
  );
  const payload = finishEvent?.payloadJson as { results?: Array<{ workflow_id?: string; workflow_run_id?: string }> } | undefined;
  assert.equal(payload?.results?.[0]?.workflow_id, 'release-automation-workflow-1');
  assert.equal(payload?.results?.[1]?.workflow_run_id, 'release-self-healing-run-1');
});

async function runScheduledTick(service: ChannelReleaseSchedulerService) {
  await (service as unknown as { runScheduledTick(): Promise<void> }).runScheduledTick();
}

async function createService(state: ReleaseSchedulerState) {
  const { ChannelReleaseSchedulerService } = await import('./channel-release-scheduler.service');

  return new ChannelReleaseSchedulerService(
    state.prisma as never,
    state.platformEvents as never,
    state.releaseAutomationWorkflow as never,
    state.releaseSelfHealingWorkflow as never,
  );
}

interface ReleaseSchedulerState {
  prisma: Record<string, unknown>;
  platformEvents: Record<string, unknown>;
  releaseAutomationWorkflow: Record<string, unknown>;
  releaseSelfHealingWorkflow: Record<string, unknown>;
  platformEventRows: Array<Record<string, unknown>>;
  recordedEvents: Array<Record<string, unknown>>;
  channelFinds: Array<Record<string, unknown>>;
  automationDispatches: Array<Record<string, unknown>>;
  selfHealingDispatches: Array<Record<string, unknown>>;
}

function createReleaseSchedulerState(input: { platformEvents?: Array<Record<string, unknown>> } = {}): ReleaseSchedulerState {
  const platformEventRows = [...(input.platformEvents ?? [])];
  const recordedEvents: Array<Record<string, unknown>> = [];
  const channelFinds: Array<Record<string, unknown>> = [];
  const automationDispatches: Array<Record<string, unknown>> = [];
  const selfHealingDispatches: Array<Record<string, unknown>> = [];
  const channels = [buildChannel('automation-channel', { automation: true }), buildChannel('self-healing-channel', { selfHealing: true })];
  const prisma: Record<string, unknown> = {
    $queryRaw: async () => [{ locked: true }],
    $transaction: async (callback: (tx: Record<string, unknown>) => Promise<unknown>) => callback(prisma),
    tenant: {
      findMany: async () => [{ id: tenantId }],
    },
    agentPublishChannel: {
      findMany: async (args: Record<string, unknown>) => {
        channelFinds.push(args);

        return channels;
      },
    },
    platformEvent: buildPlatformEventDelegate(platformEventRows),
  };
  const platformEvents = {
    recordEvent: async (input: Record<string, unknown>) => {
      recordedEvents.push(input);
      platformEventRows.push({
        id: `recorded-${platformEventRows.length + 1}`,
        occurredAt: input.occurredAt ?? new Date(),
        ...input,
      });

      return platformEventRows.at(-1);
    },
  };
  const releaseAutomationWorkflow = {
    getWorkflowMode: () => 'local',
    dispatch: async (user: Record<string, unknown>, channelId: string) => {
      automationDispatches.push({ user, channelId });

      return {
        workflow_backend: 'TEMPORAL',
        workflow_id: 'release-automation-workflow-1',
        workflow_run_id: 'release-automation-run-1',
        last_run: {
          decision: 'EXECUTED',
          workflow_backend: 'TEMPORAL',
          workflow_id: 'release-automation-workflow-1',
          workflow_run_id: 'release-automation-run-1',
          error_message: null,
        },
      };
    },
  };
  const releaseSelfHealingWorkflow = {
    getWorkflowMode: () => 'local',
    dispatch: async (user: Record<string, unknown>, channelId: string) => {
      selfHealingDispatches.push({ user, channelId });

      return {
        workflow_backend: 'TEMPORAL',
        workflow_id: 'release-self-healing-workflow-1',
        workflow_run_id: 'release-self-healing-run-1',
        last_run: {
          decision: 'NOOP',
          workflow_backend: 'TEMPORAL',
          workflow_id: 'release-self-healing-workflow-1',
          workflow_run_id: 'release-self-healing-run-1',
          error_message: null,
        },
      };
    },
  };

  return {
    prisma,
    platformEvents,
    releaseAutomationWorkflow,
    releaseSelfHealingWorkflow,
    platformEventRows,
    recordedEvents,
    channelFinds,
    automationDispatches,
    selfHealingDispatches,
  };
}

function buildPlatformEventDelegate(rows: Array<Record<string, unknown>>) {
  return {
    findFirst: async (args: { where?: Record<string, unknown> }) => findPlatformEvent(rows, args.where ?? {}),
    create: async (args: { data: Record<string, unknown> }) => {
      const event = {
        id: `lock-${rows.length + 1}`,
        occurredAt: args.data.occurredAt ?? new Date(),
        ...args.data,
      };
      rows.push(event);

      return event;
    },
  };
}

function findPlatformEvent(rows: Array<Record<string, unknown>>, where: Record<string, unknown>) {
  const occurredAt = where.occurredAt as { gte?: Date } | undefined;
  const matches = rows
    .filter((row) => Object.entries(where).every(([key, value]) => {
      if (key === 'occurredAt') {
        return !occurredAt?.gte || (row.occurredAt as Date).getTime() >= occurredAt.gte.getTime();
      }

      return row[key] === value;
    }))
    .sort((left, right) => (right.occurredAt as Date).getTime() - (left.occurredAt as Date).getTime());

  return matches[0] ?? null;
}

function buildLockEvent(occurredAt: Date) {
  return {
    id: 'old-release-lock',
    tenantId,
    actorType: 'SYSTEM',
    resourceType: 'CHANNEL_RELEASE_SCHEDULER_LOCK',
    requestId: 'old-release-lock',
    eventSource: 'CHANNEL_RELEASE_SCHEDULER',
    eventType: 'channel.release_scheduler.scheduled_lock_acquired',
    status: 'SUCCESS',
    severity: 'INFO',
    billable: false,
    summary: 'old lock',
    payloadJson: {},
    sourceSystem: 'channel_release_scheduler_lock',
    sourceId: `channel_release_scheduler:${tenantId}:POLL`,
    dedupeKey: 'old-release-lock',
    occurredAt,
  };
}

function buildChannel(id: string, options: { automation?: boolean; selfHealing?: boolean }) {
  return {
    id,
    tenantId,
    name: id,
    channel: 'CUSTOM_WEBHOOK',
    status: 'ACTIVE',
    config: {
      release_automation_policy: {
        enabled: options.automation === true,
      },
      release_self_healing_policy: {
        enabled: options.selfHealing === true,
      },
    },
    agent: { id: 'agent-1', name: 'Agent' },
  };
}
