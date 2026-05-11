import assert from 'node:assert/strict';
import test from 'node:test';

import { BadRequestException, NotFoundException } from '@nestjs/common';

import { PluginHookExecutionService } from './plugin-hook-execution.service';

const currentUser = {
  id: '00000000-0000-0000-0000-000000000001',
  tenantId: '00000000-0000-0000-0000-000000000002',
  email: 'operator@example.com',
  roles: ['tenant_admin'],
  roleIds: [],
  permissions: [],
  departmentId: null,
};

test('queues active plugin hook execution as a platform event without executing third-party code', async () => {
  const recordedEvents: Array<Record<string, unknown>> = [];
  const service = new PluginHookExecutionService(
    {
      platformEvent: {
        findFirst: async () => null,
      },
      pluginInstallation: {
        findFirst: async () => ({
          id: 'installation-1',
          pluginId: 'plugin-1',
          tenantId: currentUser.tenantId,
          status: 'ACTIVE',
          runtimeStatus: 'RUNNING',
          manifestJson: null,
        }),
      },
      pluginHook: {
        findFirst: async () => ({
          id: 'hook-1',
          tenantId: currentUser.tenantId,
          pluginId: 'plugin-1',
          code: 'ticket.created',
          name: '工单创建事件',
          hookType: 'EVENT',
          target: 'ticket.created',
          method: 'ASYNC_EVENT',
          status: 'ACTIVE',
          configJson: { timeout_ms: 1000 },
          deletedAt: null,
        }),
      },
    } as never,
    {
      recordEvent: async (event: Record<string, unknown>) => {
        recordedEvents.push(event);
        return { id: 'event-1', ...event };
      },
    } as never,
  );

  const result = await service.queueHookExecution(currentUser, 'plugin-1', 'hook-1', {
    payload: { ticket_id: 'T-001' },
    source_event_id: 'ticket.created:T-001',
    trace_id: 'trace-1',
  });

  assert.equal(result.status, 'QUEUED');
  assert.equal(result.event_id, 'event-1');
  assert.equal(recordedEvents.length, 1);
  assert.equal(recordedEvents[0]?.eventType, 'plugin.hook.execution.queued');
  assert.equal(recordedEvents[0]?.status, 'PENDING');
  assert.equal(recordedEvents[0]?.pluginId, 'plugin-1');
  assert.equal(recordedEvents[0]?.resourceType, 'PLUGIN_HOOK');
  assert.deepEqual((recordedEvents[0]?.payloadJson as { payload?: unknown }).payload, { ticket_id: 'T-001' });
  assert.equal((recordedEvents[0]?.payloadJson as { execution_boundary?: string }).execution_boundary, 'CONTROL_PLANE_EVENT_ONLY');
});

test('queues custom code plugin hook only after sandbox policy audit passes', async () => {
  const recordedEvents: Array<Record<string, unknown>> = [];
  const service = new PluginHookExecutionService(
    {
      platformEvent: {
        findFirst: async () => null,
      },
      pluginInstallation: {
        findFirst: async () => ({
          id: 'installation-1',
          pluginId: 'plugin-1',
          tenantId: currentUser.tenantId,
          status: 'ACTIVE',
          runtimeStatus: 'RUNNING',
          manifestJson: {
            runtime: {
              type: 'code',
              entry: 'dist/index.js',
            },
            sandbox: {
              isolation: 'PROCESS',
              network: 'DENY',
              filesystem: 'READONLY',
              timeout_ms: 5000,
              memory_mb: 128,
            },
          },
        }),
      },
      pluginHook: {
        findFirst: async () => ({
          id: 'hook-1',
          tenantId: currentUser.tenantId,
          pluginId: 'plugin-1',
          code: 'ticket.created',
          name: '工单创建事件',
          hookType: 'EVENT',
          target: 'ticket.created',
          method: 'ASYNC_EVENT',
          status: 'ACTIVE',
          configJson: { timeout_ms: 1000 },
          deletedAt: null,
        }),
      },
    } as never,
    {
      recordEvent: async (event: Record<string, unknown>) => {
        recordedEvents.push(event);
        return { id: 'event-1', ...event };
      },
    } as never,
  );

  const result = await service.queueHookExecution(currentUser, 'plugin-1', 'hook-1', {
    payload: { ticket_id: 'T-001' },
  });

  assert.equal(result.status, 'QUEUED');
  assert.equal(recordedEvents.length, 1);
  const payload = recordedEvents[0]?.payloadJson as {
    execution_boundary?: string;
    sandbox_policy?: { status?: string; isolation?: string; network?: string; filesystem?: string; timeout_ms?: number; memory_mb?: number };
    sandbox_risk_level?: string;
    sandbox_violations?: string[];
  };
  assert.equal(payload.execution_boundary, 'PLUGIN_SANDBOX_POLICY_GATED');
  assert.equal(payload.sandbox_policy?.status, 'DECLARED');
  assert.equal(payload.sandbox_policy?.isolation, 'PROCESS');
  assert.equal(payload.sandbox_policy?.network, 'DENY');
  assert.equal(payload.sandbox_policy?.filesystem, 'READONLY');
  assert.equal(payload.sandbox_policy?.timeout_ms, 5000);
  assert.equal(payload.sandbox_policy?.memory_mb, 128);
  assert.equal(payload.sandbox_risk_level, 'LOW');
  assert.deepEqual(payload.sandbox_violations, []);
});

test('blocks custom code plugin hook when sandbox policy audit fails', async () => {
  const recordedEvents: Array<Record<string, unknown>> = [];
  const dispatches: Array<unknown> = [];
  const service = new PluginHookExecutionService(
    {
      platformEvent: {
        findFirst: async () => null,
      },
      pluginInstallation: {
        findFirst: async () => ({
          id: 'installation-1',
          pluginId: 'plugin-1',
          tenantId: currentUser.tenantId,
          status: 'ACTIVE',
          runtimeStatus: 'RUNNING',
          manifestJson: {
            runtime: {
              type: 'code',
              entry: 'dist/index.js',
            },
            sandbox: {
              isolation: 'PROCESS',
              network: 'ALLOW',
              filesystem: 'READONLY',
              timeout_ms: 5000,
              memory_mb: 128,
            },
          },
        }),
      },
      pluginHook: {
        findFirst: async () => ({
          id: 'hook-1',
          tenantId: currentUser.tenantId,
          pluginId: 'plugin-1',
          code: 'ticket.created',
          name: '工单创建事件',
          hookType: 'EVENT',
          target: 'ticket.created',
          method: 'ASYNC_EVENT',
          status: 'ACTIVE',
          configJson: { timeout_ms: 1000 },
          deletedAt: null,
        }),
      },
    } as never,
    {
      recordEvent: async (event: Record<string, unknown>) => {
        recordedEvents.push(event);
        return { id: 'event-blocked-1', ...event };
      },
    } as never,
    {
      dispatchHookExecution: async (user: typeof currentUser, input: unknown) => {
        dispatches.push({ user, input });
        return {
          workflow_backend: null,
          workflow_id: null,
          workflow_run_id: null,
        };
      },
    } as never,
  );

  await assert.rejects(
    () => service.queueHookExecution(currentUser, 'plugin-1', 'hook-1', {
      payload: { ticket_id: 'T-001' },
    }),
    BadRequestException,
  );

  assert.equal(dispatches.length, 0);
  assert.equal(recordedEvents.length, 1);
  assert.equal(recordedEvents[0]?.eventType, 'plugin.hook.execution.sandbox_blocked');
  assert.equal(recordedEvents[0]?.status, 'FAILED');
  const payload = recordedEvents[0]?.payloadJson as {
    sandbox_policy?: { status?: string; network?: string };
    sandbox_risk_level?: string;
    sandbox_violations?: string[];
  };
  assert.equal(payload.sandbox_policy?.status, 'DECLARED');
  assert.equal(payload.sandbox_policy?.network, 'ALLOW');
  assert.equal(payload.sandbox_risk_level, 'CRITICAL');
  assert.ok(payload.sandbox_violations?.includes('sandbox.network 不允许使用 ALLOW。'));
});

test('dispatches active plugin hook execution through workflow boundary after queue event is recorded', async () => {
  const dispatches: Array<{ eventId: string; pluginId: string; hookId: string }> = [];
  const service = new PluginHookExecutionService(
    {
      platformEvent: {
        findFirst: async () => null,
      },
      pluginInstallation: {
        findFirst: async () => ({
          id: 'installation-1',
          pluginId: 'plugin-1',
          tenantId: currentUser.tenantId,
          status: 'ACTIVE',
          runtimeStatus: 'RUNNING',
        }),
      },
      pluginHook: {
        findFirst: async () => ({
          id: 'hook-1',
          tenantId: currentUser.tenantId,
          pluginId: 'plugin-1',
          code: 'ticket.created',
          name: '工单创建事件',
          hookType: 'EVENT',
          target: 'ticket.created',
          method: 'ASYNC_EVENT',
          status: 'ACTIVE',
          configJson: { timeout_ms: 1000 },
          deletedAt: null,
        }),
      },
    } as never,
    {
      recordEvent: async (event: Record<string, unknown>) => ({ id: 'event-1', ...event }),
    } as never,
    {
      dispatchHookExecution: async (user: typeof currentUser, input: { eventId: string; pluginId: string; hookId: string }) => {
        assert.equal(user.id, currentUser.id);
        dispatches.push(input);
        return {
          workflow_backend: 'TEMPORAL',
          workflow_id: 'plugin-hook-event-1',
          workflow_run_id: 'run-1',
        };
      },
    } as never,
  );

  const result = await service.queueHookExecution(currentUser, 'plugin-1', 'hook-1', {
    payload: { ticket_id: 'T-001' },
    source_event_id: 'ticket.created:T-001',
    trace_id: 'trace-1',
  });

  assert.equal(result.status, 'QUEUED');
  assert.equal(result.workflow_backend, 'TEMPORAL');
  assert.equal(result.workflow_id, 'plugin-hook-event-1');
  assert.equal(result.workflow_run_id, 'run-1');
  assert.deepEqual(dispatches, [{ eventId: 'event-1', pluginId: 'plugin-1', hookId: 'hook-1' }]);
});

test('does not queue disabled plugin hooks', async () => {
  const service = new PluginHookExecutionService(
    {
      platformEvent: {
        findFirst: async () => null,
      },
      pluginInstallation: {
        findFirst: async () => ({
          id: 'installation-1',
          pluginId: 'plugin-1',
          tenantId: currentUser.tenantId,
          status: 'ACTIVE',
          runtimeStatus: 'RUNNING',
        }),
      },
      pluginHook: {
        findFirst: async () => ({
          id: 'hook-1',
          tenantId: currentUser.tenantId,
          pluginId: 'plugin-1',
          code: 'ticket.created',
          name: '工单创建事件',
          hookType: 'EVENT',
          target: 'ticket.created',
          method: 'ASYNC_EVENT',
          status: 'DISABLED',
          configJson: null,
          deletedAt: null,
        }),
      },
    } as never,
    { recordEvent: async () => ({ id: 'event-1' }) } as never,
  );

  await assert.rejects(
    () => service.queueHookExecution(currentUser, 'plugin-1', 'hook-1', { payload: {} }),
    BadRequestException,
  );
});

test('does not queue hook execution when plugin installation is inactive', async () => {
  const service = new PluginHookExecutionService(
    {
      platformEvent: {
        findFirst: async () => null,
      },
      pluginInstallation: {
        findFirst: async () => null,
      },
      pluginHook: {
        findFirst: async () => {
          throw new Error('hook lookup should not run without installation');
        },
      },
    } as never,
    { recordEvent: async () => ({ id: 'event-1' }) } as never,
  );

  await assert.rejects(
    () => service.queueHookExecution(currentUser, 'plugin-1', 'hook-1', { payload: {} }),
    NotFoundException,
  );
});

test('links queued hook execution to an existing source platform event when source_event_id matches', async () => {
  const createdRelations: Array<Record<string, unknown>> = [];
  const service = new PluginHookExecutionService(
    {
      platformEvent: {
        findFirst: async (args: { where: { id?: string } }) => {
          if (args.where.id === 'source-event-1') {
            return {
              id: 'source-event-1',
              tenantId: currentUser.tenantId,
            };
          }
          return null;
        },
      },
      platformEventRelation: {
        findFirst: async () => null,
        create: async (args: { data: Record<string, unknown> }) => {
          createdRelations.push(args.data);
          return { id: 'relation-1', ...args.data };
        },
      },
      pluginInstallation: {
        findFirst: async () => ({
          id: 'installation-1',
          pluginId: 'plugin-1',
          tenantId: currentUser.tenantId,
          status: 'ACTIVE',
          runtimeStatus: 'RUNNING',
        }),
      },
      pluginHook: {
        findFirst: async () => ({
          id: 'hook-1',
          tenantId: currentUser.tenantId,
          pluginId: 'plugin-1',
          code: 'ticket.created',
          name: '工单创建事件',
          hookType: 'EVENT',
          target: 'ticket.created',
          method: 'ASYNC_EVENT',
          status: 'ACTIVE',
          configJson: { timeout_ms: 1000 },
          deletedAt: null,
        }),
      },
    } as never,
    {
      recordEvent: async () => ({ id: 'event-queued-1' }),
    } as never,
  );

  const result = await service.queueHookExecution(currentUser, 'plugin-1', 'hook-1', {
    payload: { ticket_id: 'T-002' },
    source_event_id: 'source-event-1',
    trace_id: 'trace-2',
  });

  assert.equal(result.event_id, 'event-queued-1');
  assert.equal(createdRelations.length, 1);
  assert.equal(createdRelations[0]?.relationType, 'HOOK_EXECUTION_TRIGGER');
  assert.equal(createdRelations[0]?.parentEventId, 'source-event-1');
  assert.equal(createdRelations[0]?.childEventId, 'event-queued-1');
  assert.equal(createdRelations[0]?.sourceEventId, 'source-event-1');
  assert.equal(createdRelations[0]?.targetEventId, 'event-queued-1');
});

test('does not create duplicate source event relation when hook execution queue is retried', async () => {
  const createdRelations: Array<Record<string, unknown>> = [];
  const service = new PluginHookExecutionService(
    {
      platformEvent: {
        findFirst: async (args: { where: { id?: string } }) => {
          if (args.where.id === 'source-event-1') {
            return {
              id: 'source-event-1',
              tenantId: currentUser.tenantId,
            };
          }
          return null;
        },
      },
      platformEventRelation: {
        findFirst: async (args: { where: Record<string, unknown> }) =>
          createdRelations.find(
            (relation) =>
              relation.tenantId === args.where.tenantId &&
              relation.relationType === args.where.relationType &&
              relation.parentEventId === args.where.parentEventId &&
              relation.childEventId === args.where.childEventId &&
              relation.sourceEventId === args.where.sourceEventId &&
              relation.targetEventId === args.where.targetEventId &&
              relation.relationKey === args.where.relationKey,
          ) ?? null,
        create: async (args: { data: Record<string, unknown> }) => {
          createdRelations.push(args.data);
          return { id: `relation-${createdRelations.length}`, ...args.data };
        },
      },
      pluginInstallation: {
        findFirst: async () => ({
          id: 'installation-1',
          pluginId: 'plugin-1',
          tenantId: currentUser.tenantId,
          status: 'ACTIVE',
          runtimeStatus: 'RUNNING',
        }),
      },
      pluginHook: {
        findFirst: async () => ({
          id: 'hook-1',
          tenantId: currentUser.tenantId,
          pluginId: 'plugin-1',
          code: 'ticket.created',
          name: '工单创建事件',
          hookType: 'EVENT',
          target: 'ticket.created',
          method: 'ASYNC_EVENT',
          status: 'ACTIVE',
          configJson: { timeout_ms: 1000 },
          deletedAt: null,
        }),
      },
    } as never,
    {
      recordEvent: async () => ({ id: 'event-queued-1' }),
    } as never,
  );

  await service.queueHookExecution(currentUser, 'plugin-1', 'hook-1', {
    payload: { ticket_id: 'T-002' },
    source_event_id: 'source-event-1',
    trace_id: 'trace-2',
  });
  await service.queueHookExecution(currentUser, 'plugin-1', 'hook-1', {
    payload: { ticket_id: 'T-002' },
    source_event_id: 'source-event-1',
    trace_id: 'trace-2',
  });

  assert.equal(createdRelations.length, 1);
  assert.equal(createdRelations[0]?.relationType, 'HOOK_EXECUTION_TRIGGER');
  assert.equal(createdRelations[0]?.parentEventId, 'source-event-1');
  assert.equal(createdRelations[0]?.childEventId, 'event-queued-1');
});
