import assert from 'node:assert/strict';
import test from 'node:test';

process.env.RUNTIME_BASE_URL ??= 'http://runtime.example.test';
process.env.CONTROL_API_INTERNAL_BASE_URL ??= 'http://control-api.example.test';
process.env.RUNTIME_INTERNAL_TOKEN ??= 'test-runtime-internal-token';

test('retryWorkflowTask requeues knowledge tasks through the dispatcher boundary', async () => {
  const { RuntimeExecutionService } = await import('./runtime-execution.service');
  const calls: string[] = [];
  const enqueuedTaskIds: string[] = [];
  let runWorkflowTaskCalls = 0;
  const prisma = {
    knowledgeEmbeddingTask: {
      findFirst: async (args: unknown) => {
        calls.push(`find:${JSON.stringify(args)}`);
        return {
          id: 'task-1',
          tenantId: 'tenant-1',
          taskType: 'PROCESS',
          knowledgeId: 'knowledge-1',
          documentId: 'document-1',
          knowledge: { id: 'knowledge-1' },
        };
      },
      update: async (args: unknown) => {
        calls.push(`update:${JSON.stringify(args)}`);
        return { id: 'task-1' };
      },
    },
  };
  const knowledgeService = {
    runWorkflowTask: async () => {
      runWorkflowTaskCalls += 1;
    },
  };
  const taskDispatcher = {
    enqueue: (taskId: string) => {
      calls.push(`enqueue:${taskId}`);
      enqueuedTaskIds.push(taskId);
    },
  };
  const platformEvents = {
    recordEvent: async (event: { eventType: string }) => {
      calls.push(`event:${event.eventType}`);
    },
  };

  const service = new RuntimeExecutionService(
    prisma as never,
    knowledgeService as never,
    taskDispatcher as never,
    null as never,
    null as never,
    null as never,
    null as never,
    null as never,
    platformEvents as never,
  );

  const result = await service.retryWorkflowTask({
    id: 'user-1',
    tenantId: 'tenant-1',
    email: 'operator@example.test',
    roles: [],
    permissions: [],
    requestId: 'request-1',
    traceId: 'trace-1',
  }, 'task-1');
  await waitForImmediate();

  assert.equal(result.status, 'QUEUED');
  assert.deepEqual(enqueuedTaskIds, ['task-1']);
  assert.equal(runWorkflowTaskCalls, 0);
  assert.deepEqual(calls.map((call) => call.split(':')[0]), ['find', 'update', 'event', 'enqueue']);
  assert.match(calls[1] ?? '', /"status":"PENDING"/);
});

test('getWorkflowStatus lists failed channel release workflows as recoverable tasks', async () => {
  const { RuntimeExecutionService } = await import('./runtime-execution.service');
  const occurredAt = new Date('2026-05-05T01:02:03.000Z');
  const prisma = {
    $transaction: async (queries: unknown[]) => Promise.all(queries),
    platformEvent: {
      findFirst: async () => ({
        id: 'event-latest',
        eventType: 'workflow.channel_release_automation.failed',
        taskId: 'workflow-1',
        resourceId: 'channel-1',
        summary: '渠道自动推进失败：gate rejected',
        payloadJson: {
          channel_id: 'channel-1',
          workflow_id: 'workflow-1',
          error_message: 'gate rejected',
          workflow_backend: 'TEMPORAL',
        },
        occurredAt,
      }),
      findMany: async () => [
        {
          eventType: 'workflow.channel_release_automation.failed',
          channelId: 'channel-1',
          resourceId: 'channel-1',
          taskId: 'workflow-1',
          summary: '渠道自动推进失败：gate rejected',
          payloadJson: {
            channel_id: 'channel-1',
            workflow_id: 'workflow-1',
            error_message: 'gate rejected',
          },
          occurredAt,
        },
        {
          eventType: 'workflow.channel_release_self_healing.failed',
          channelId: 'channel-2',
          resourceId: 'channel-2',
          taskId: 'workflow-2',
          summary: '渠道发布自愈失败：rollback failed',
          payloadJson: {
            channel_id: 'channel-2',
            workflow_id: 'workflow-2',
            error_message: 'rollback failed',
          },
          occurredAt,
        },
      ],
    },
    knowledgeEmbeddingTask: {
      findMany: async () => [],
    },
    agentPublishChannel: {
      findMany: async () => [
        {
          id: 'channel-1',
          name: '生产灰度渠道',
          channel: 'CUSTOM_WEBHOOK',
        },
        {
          id: 'channel-2',
          name: null,
          channel: 'WECHAT',
        },
      ],
    },
  };

  const service = createRuntimeExecutionService({ prisma });
  const status = await service.getWorkflowStatus(buildUser());

  assert.deepEqual(status.recoverable_tasks.map((task) => task.task_type), [
    'channel_release_automation',
    'channel_release_self_healing',
  ]);
  assert.equal(status.recoverable_tasks[0]?.task_id, 'channel-1');
  assert.equal(status.recoverable_tasks[0]?.workflow_task_type, 'CHANNEL_RELEASE_AUTOMATION');
  assert.equal(status.recoverable_tasks[0]?.title, '生产灰度渠道');
  assert.equal(status.recoverable_tasks[0]?.error_message, 'gate rejected');
  assert.equal(status.recoverable_tasks[1]?.task_id, 'channel-2');
  assert.equal(status.recoverable_tasks[1]?.title, 'WECHAT');
});

test('retryWorkflowTask redispatches failed channel release workflows through their workflow services', async () => {
  const automationDispatches: Array<{ userId: string; channelId: string }> = [];
  const selfHealingDispatches: Array<{ userId: string; channelId: string }> = [];
  const events: string[] = [];
  const prisma = {
    agentPublishChannel: {
      findFirst: async (args: { where: { id: string; tenantId: string } }) => ({
        id: args.where.id,
        tenantId: args.where.tenantId,
        name: '生产灰度渠道',
        channel: 'CUSTOM_WEBHOOK',
      }),
    },
  };
  const releaseAutomationWorkflow = {
    dispatch: async (user: { id: string }, channelId: string) => {
      automationDispatches.push({ userId: user.id, channelId });
      return {
        workflow_backend: 'TEMPORAL',
        last_run: {
          decision: 'EXECUTED',
          error_message: null,
        },
      };
    },
  };
  const releaseSelfHealingWorkflow = {
    dispatch: async (user: { id: string }, channelId: string) => {
      selfHealingDispatches.push({ userId: user.id, channelId });
      return {
        workflow_backend: 'TEMPORAL',
        last_run: {
          decision: 'ROLLBACK_EXECUTED',
          error_message: null,
        },
      };
    },
  };
  const platformEvents = {
    recordEvent: async (event: { eventType: string }) => {
      events.push(event.eventType);
    },
  };

  const service = createRuntimeExecutionService({
    prisma,
    platformEvents,
    releaseAutomationWorkflow,
    releaseSelfHealingWorkflow,
  });
  const user = buildUser();

  const automationResult = await service.retryWorkflowTask(user, 'channel-1', 'channel_release_automation');
  const selfHealingResult = await service.retryWorkflowTask(user, 'channel-2', 'channel_release_self_healing');

  assert.equal(automationResult.status, 'QUEUED');
  assert.equal(automationResult.task_type, 'channel_release_automation');
  assert.equal(selfHealingResult.status, 'QUEUED');
  assert.equal(selfHealingResult.task_type, 'channel_release_self_healing');
  assert.deepEqual(automationDispatches, [{ userId: 'user-1', channelId: 'channel-1' }]);
  assert.deepEqual(selfHealingDispatches, [{ userId: 'user-1', channelId: 'channel-2' }]);
  assert.deepEqual(events, [
    'workflow.channel_release_automation.retry_requested',
    'workflow.channel_release_self_healing.retry_requested',
  ]);
});

async function waitForImmediate() {
  await new Promise<void>((resolve) => {
    setImmediate(resolve);
  });
}

function createRuntimeExecutionService(input: {
  prisma: Record<string, unknown>;
  platformEvents?: Record<string, unknown>;
  releaseAutomationWorkflow?: Record<string, unknown>;
  releaseSelfHealingWorkflow?: Record<string, unknown>;
}) {
  const { RuntimeExecutionService } = require('./runtime-execution.service') as typeof import('./runtime-execution.service');

  return new RuntimeExecutionService(
    input.prisma as never,
    null as never,
    { enqueue: () => undefined } as never,
    null as never,
    null as never,
    null as never,
    null as never,
    null as never,
    input.platformEvents as never ?? { recordEvent: async () => undefined } as never,
    input.releaseAutomationWorkflow as never ?? null as never,
    input.releaseSelfHealingWorkflow as never ?? null as never,
  );
}

function buildUser() {
  return {
    id: 'user-1',
    tenantId: 'tenant-1',
    email: 'operator@example.test',
    roles: [],
    permissions: [],
    requestId: 'request-1',
    traceId: 'trace-1',
  };
}
