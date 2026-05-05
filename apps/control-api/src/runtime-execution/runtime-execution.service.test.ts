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

async function waitForImmediate() {
  await new Promise<void>((resolve) => {
    setImmediate(resolve);
  });
}
