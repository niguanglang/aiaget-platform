import assert from 'node:assert/strict';
import test from 'node:test';

import { ChannelSenderTaskService } from './channel-sender-task.service';

const tenantId = '00000000-0000-0000-0000-000000000001';

test('scheduled sender tasks skip the second instance in the same tenant task window', async () => {
  const state = createSenderTaskState();
  const first = createService(state);
  const second = createService(state);

  await runScheduledTick(first);
  await runScheduledTick(second);

  assert.equal(state.retryCalls.length, 1);
  assert.equal(state.deliveryFinds.length, 2);
  assert.equal(state.channelFinds.length, 2);
  assert.equal(state.deletedBatches.length, 1);

  const lockedEvents = state.recordedEvents.filter((event) => String(event.eventType).endsWith('_locked'));
  assert.deepEqual(
    lockedEvents.map((event) => event.eventType).sort(),
    [
      'channel.sender_task.scheduled_auto_retry_locked',
      'channel.sender_task.scheduled_cleanup_locked',
    ],
  );
  assert.ok(lockedEvents.every((event) => event.status === 'LOCKED'));
  assert.ok(lockedEvents.every((event) => (event.payloadJson as { status?: string }).status === 'SKIPPED'));
});

test('scheduled sender task locks expire and allow the next window to run', async () => {
  const state = createSenderTaskState({
    platformEvents: [
      buildLockEvent('AUTO_RETRY', new Date(Date.now() - 60 * 60 * 1000)),
      buildLockEvent('CLEANUP', new Date(Date.now() - 60 * 60 * 1000)),
    ],
  });
  const service = createService(state);

  await runScheduledTick(service);

  assert.equal(state.retryCalls.length, 1);
  assert.equal(state.deletedBatches.length, 1);
  assert.equal(state.channelFinds.length, 2);
  assert.equal(state.recordedEvents.filter((event) => String(event.eventType).endsWith('_locked')).length, 0);
});

async function runScheduledTick(service: ChannelSenderTaskService) {
  await (service as unknown as { runScheduledTick(): Promise<void> }).runScheduledTick();
}

function createService(state: SenderTaskState) {
  return new ChannelSenderTaskService(
    state.prisma as never,
    state.channelSender as never,
    state.platformEvents as never,
  );
}

interface SenderTaskState {
  prisma: Record<string, unknown>;
  channelSender: Record<string, unknown>;
  platformEvents: Record<string, unknown>;
  platformEventRows: Array<Record<string, unknown>>;
  recordedEvents: Array<Record<string, unknown>>;
  channelFinds: Array<Record<string, unknown>>;
  deliveryFinds: Array<Record<string, unknown>>;
  deletedBatches: Array<Record<string, unknown>>;
  retryCalls: Array<Record<string, unknown>>;
}

function createSenderTaskState(input: { platformEvents?: Array<Record<string, unknown>> } = {}): SenderTaskState {
  const platformEventRows = [...(input.platformEvents ?? [])];
  const recordedEvents: Array<Record<string, unknown>> = [];
  const channelFinds: Array<Record<string, unknown>> = [];
  const deliveryFinds: Array<Record<string, unknown>> = [];
  const deletedBatches: Array<Record<string, unknown>> = [];
  const retryCalls: Array<Record<string, unknown>> = [];
  const channel = buildChannel();
  const delivery = {
    id: 'sender-delivery-1',
    channel,
    agent: channel.agent,
  };
  const expired = [{ id: 'expired-delivery-1' }];
  const prisma: Record<string, unknown> = {
    $queryRaw: async () => [{ locked: true }],
    $transaction: async (callback: (tx: Record<string, unknown>) => Promise<unknown>) => callback(prisma),
    tenant: {
      findMany: async () => [{ id: tenantId }],
    },
    agentPublishChannel: {
      findMany: async (args: Record<string, unknown>) => {
        channelFinds.push(args);

        return [channel];
      },
    },
    channelSenderDelivery: {
      findMany: async (args: Record<string, unknown>) => {
        deliveryFinds.push(args);

        return 'include' in args ? [delivery] : expired;
      },
      deleteMany: async (args: Record<string, unknown>) => {
        deletedBatches.push(args);

        return { count: expired.length };
      },
      count: async () => 0,
      findFirst: async () => null,
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
  const channelSender = {
    retryDeliveryForTask: async (inputDelivery: Record<string, unknown>, requestId: string) => {
      retryCalls.push({ delivery: inputDelivery, requestId });

      return {
        task: 'AUTO_RETRY',
        status: 'SUCCESS',
        started_at: new Date().toISOString(),
        finished_at: new Date().toISOString(),
        scanned_count: 1,
        retried_count: 1,
        success_count: 1,
        failed_count: 0,
        skipped_count: 0,
        deleted_count: 0,
        error_message: null,
      };
    },
  };

  return {
    prisma,
    channelSender,
    platformEvents,
    platformEventRows,
    recordedEvents,
    channelFinds,
    deliveryFinds,
    deletedBatches,
    retryCalls,
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

function buildLockEvent(task: 'AUTO_RETRY' | 'CLEANUP', occurredAt: Date) {
  return {
    id: `old-${task.toLowerCase()}`,
    tenantId,
    actorType: 'SYSTEM',
    resourceType: 'CHANNEL_SENDER_TASK_LOCK',
    requestId: `old-${task.toLowerCase()}`,
    eventSource: 'CHANNEL_SENDER_TASK',
    eventType: 'channel.sender_task.scheduled_lock_acquired',
    status: 'SUCCESS',
    severity: 'INFO',
    billable: false,
    summary: 'old lock',
    payloadJson: {},
    sourceSystem: 'channel_sender_task_lock',
    sourceId: `channel_sender_task:${tenantId}:${task}`,
    dedupeKey: `old-${task.toLowerCase()}`,
    occurredAt,
  };
}

function buildChannel() {
  return {
    id: 'channel-1',
    tenantId,
    name: 'Webhook',
    channel: 'CUSTOM_WEBHOOK',
    config: {
      sender_policy: {
        auto_retry_enabled: true,
        max_retry_count: 3,
        retry_backoff_seconds: 1,
        retry_on_statuses: [500],
        retention_days: 1,
      },
    },
    agent: { id: 'agent-1', name: 'Agent' },
    account: { provider: { code: 'CUSTOM_WEBHOOK' } },
  };
}
