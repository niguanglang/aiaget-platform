import assert from 'node:assert/strict';
import test, { before } from 'node:test';

import type { RuntimeExecutionService as RuntimeExecutionServiceClass } from './runtime-execution.service';

process.env.RUNTIME_BASE_URL ??= 'http://runtime.example.test';
process.env.CONTROL_API_INTERNAL_BASE_URL ??= 'http://control-api.example.test';
process.env.RUNTIME_INTERNAL_TOKEN ??= 'test-runtime-internal-token';

let RuntimeExecutionServiceCtor: typeof RuntimeExecutionServiceClass;

before(async () => {
  RuntimeExecutionServiceCtor = (await import('./runtime-execution.service')).RuntimeExecutionService;
});

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
    permissions: ['knowledge:base:manage'],
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

test('retryWorkflowTask requires workflow-specific recovery permissions', async () => {
  const { RuntimeExecutionService } = await import('./runtime-execution.service');
  const service = new RuntimeExecutionService(
    {
      knowledgeEmbeddingTask: {
        findFirst: async () => ({
          id: 'task-1',
          tenantId: 'tenant-1',
          taskType: 'PROCESS',
          knowledgeId: 'knowledge-1',
          documentId: 'document-1',
          knowledge: { id: 'knowledge-1' },
        }),
      },
    } as never,
    null as never,
    { enqueue: () => undefined } as never,
    null as never,
    null as never,
    null as never,
    null as never,
    null as never,
    { recordEvent: async () => undefined } as never,
  );

  await assert.rejects(
    () => service.retryWorkflowTask(buildUser({ permissions: ['channel:publish:deploy'] }), 'task-1', 'knowledge_task'),
    /Runtime permission denied/,
  );

  const channelService = createRuntimeExecutionService({
    prisma: {
      agentPublishChannel: {
        findFirst: async (args: { where: { id: string; tenantId: string } }) => ({
          id: args.where.id,
          tenantId: args.where.tenantId,
          name: '生产灰度渠道',
          channel: 'CUSTOM_WEBHOOK',
        }),
      },
    },
    releaseAutomationWorkflow: {
      dispatch: async () => ({ workflow_backend: 'TEMPORAL' }),
    },
  });

  await assert.rejects(
    () => channelService.retryWorkflowTask(buildUser({ permissions: ['knowledge:base:manage'] }), 'channel-1', 'channel_release_automation'),
    /Runtime permission denied/,
  );
});

test('getWorkflowStatus links failed knowledge tasks to failure monitor records', async () => {
  const occurredAt = new Date('2026-05-04T01:02:03.000Z');
  const taskUpdatedAt = new Date('2026-05-04T01:03:04.000Z');
  const prisma = {
    $transaction: async (queries: unknown[]) => Promise.all(queries),
    platformEvent: {
      findFirst: async () => ({
        id: 'event-latest',
        eventType: 'workflow.knowledge_task.failed',
        taskId: 'task-1',
        resourceId: 'task-1',
        summary: '知识库后台任务失败。',
        payloadJson: {
          task_id: 'task-1',
          error_message: 'parse failed',
          workflow_backend: 'TEMPORAL',
        },
        occurredAt,
      }),
      findMany: async (args: { where: { eventType?: { in?: string[] } } }) => {
        const eventTypes = args.where.eventType?.in ?? [];
        if (eventTypes.includes('workflow.knowledge_task.failed')) {
          return [
            {
              id: 'event-knowledge-1',
              eventType: 'workflow.knowledge_task.failed',
              resourceId: 'task-1',
              taskId: 'task-1',
              traceId: 'trace-knowledge-1',
              requestId: 'request-knowledge-1',
              summary: '知识库后台任务失败：parse failed',
              payloadJson: {
                task_id: 'task-1',
                workflow_id: 'knowledge-workflow-1',
                workflow_run_id: 'knowledge-run-1',
                error_message: 'parse failed',
              },
              occurredAt,
            },
          ];
        }
        return [];
      },
    },
    knowledgeEmbeddingTask: {
      findMany: async () => [
        {
          id: 'task-1',
          tenantId: 'tenant-1',
          taskType: 'PROCESS',
          status: 'FAILED',
          knowledgeId: 'knowledge-1',
          documentId: 'document-1',
          errorMessage: 'parse failed',
          updatedAt: taskUpdatedAt,
          knowledge: {
            id: 'knowledge-1',
            name: '运维知识库',
          },
          document: {
            id: 'document-1',
            title: '巡检手册.pdf',
          },
        },
      ],
    },
    agentPublishChannel: {
      findMany: async () => [],
    },
    agentTeamRun: {
      findMany: async () => [],
    },
    plugin: {
      findMany: async () => [],
    },
  };

  const service = createRuntimeExecutionService({ prisma });
  const status = await service.getWorkflowStatus(buildUser());

  assert.deepEqual(status.recoverable_tasks.map((task) => task.task_type), ['knowledge_task']);
  assert.equal(status.recoverable_tasks[0]?.task_id, 'task-1');
  assert.equal(status.recoverable_tasks[0]?.workflow_id, 'knowledge-workflow-1');
  assert.equal(status.recoverable_tasks[0]?.workflow_run_id, 'knowledge-run-1');
  assert.equal(status.recoverable_tasks[0]?.failure_event_id, 'event-knowledge-1');
  assert.equal(status.recoverable_tasks[0]?.failure_trace_id, 'trace-knowledge-1');
  assert.equal(status.recoverable_tasks[0]?.failure_request_id, 'request-knowledge-1');
});

test('getWorkflowStatus links latest failure to monitor records', async () => {
  const occurredAt = new Date('2026-05-04T01:02:03.000Z');
  const prisma = {
    $transaction: async (queries: unknown[]) => Promise.all(queries),
    platformEvent: {
      findFirst: async () => ({
        id: 'event-latest',
        eventType: 'workflow.plugin_rollback.dispatch_failed',
        taskId: 'workflow-1',
        resourceId: 'plugin-1',
        traceId: 'trace-latest-1',
        requestId: 'request-latest-1',
        summary: '插件回滚派发失败：queue unavailable',
        payloadJson: {
          plugin_id: 'plugin-1',
          error_message: 'queue unavailable',
          workflow_backend: 'TEMPORAL',
        },
        occurredAt,
      }),
      findMany: async () => [],
    },
    knowledgeEmbeddingTask: {
      findMany: async () => [],
    },
    agentPublishChannel: {
      findMany: async () => [],
    },
    agentTeamRun: {
      findMany: async () => [],
    },
    plugin: {
      findMany: async () => [],
    },
  };

  const service = createRuntimeExecutionService({ prisma });
  const status = await service.getWorkflowStatus(buildUser());

  assert.equal(status.latest_failure?.failure_event_id, 'event-latest');
  assert.equal(status.latest_failure?.failure_trace_id, 'trace-latest-1');
  assert.equal(status.latest_failure?.failure_request_id, 'request-latest-1');
});

test('getWorkflowStatus lists failed channel release workflows as recoverable tasks', async () => {
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
          workflow_run_id: 'workflow-run-1',
          error_message: 'gate rejected',
          workflow_backend: 'TEMPORAL',
        },
        occurredAt,
      }),
      findMany: async () => [
        {
          id: 'event-channel-1',
          eventType: 'workflow.channel_release_automation.failed',
          channelId: 'channel-1',
          resourceId: 'channel-1',
          taskId: 'workflow-1',
          traceId: 'trace-channel-1',
          requestId: 'request-channel-1',
          summary: '渠道自动推进失败：gate rejected',
          payloadJson: {
            channel_id: 'channel-1',
            workflow_id: 'workflow-1',
            workflow_run_id: 'workflow-run-1',
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
            workflow_run_id: 'workflow-run-2',
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
  assert.equal(status.recoverable_tasks[0]?.workflow_id, 'workflow-1');
  assert.equal(status.recoverable_tasks[0]?.workflow_run_id, 'workflow-run-1');
  assert.equal(status.recoverable_tasks[0]?.failure_event_id, 'event-channel-1');
  assert.equal(status.recoverable_tasks[0]?.failure_trace_id, 'trace-channel-1');
  assert.equal(status.recoverable_tasks[0]?.failure_request_id, 'request-channel-1');
  assert.equal(status.recoverable_tasks[0]?.title, '生产灰度渠道');
  assert.equal(status.recoverable_tasks[0]?.error_message, 'gate rejected');
  assert.equal(status.recoverable_tasks[1]?.task_id, 'channel-2');
  assert.equal(status.recoverable_tasks[1]?.workflow_id, 'workflow-2');
  assert.equal(status.recoverable_tasks[1]?.workflow_run_id, 'workflow-run-2');
  assert.equal(status.recoverable_tasks[1]?.title, 'WECHAT');
});

test('getWorkflowStatus reports workflow mode from the latest workflow domain', async () => {
  const previousKnowledgeMode = process.env.KNOWLEDGE_WORKFLOW_MODE;
  const previousChannelMode = process.env.CHANNEL_RELEASE_WORKFLOW_MODE;
  process.env.KNOWLEDGE_WORKFLOW_MODE = 'local';
  process.env.CHANNEL_RELEASE_WORKFLOW_MODE = 'temporal';
  const occurredAt = new Date('2026-05-05T01:02:03.000Z');
  const prisma = {
    $transaction: async (queries: unknown[]) => Promise.all(queries),
    platformEvent: {
      findFirst: async () => ({
        id: 'event-latest',
        eventType: 'workflow.channel_release_automation.dispatched',
        taskId: 'workflow-1',
        resourceId: 'channel-1',
        summary: '渠道自动推进已派发。',
        payloadJson: {
          channel_id: 'channel-1',
          workflow_id: 'workflow-1',
          workflow_backend: 'TEMPORAL',
        },
        occurredAt,
      }),
      findMany: async () => [],
    },
    knowledgeEmbeddingTask: {
      findMany: async () => [],
    },
    agentPublishChannel: {
      findMany: async () => [],
    },
  };

  try {
    const service = createRuntimeExecutionService({ prisma });
    const status = await service.getWorkflowStatus(buildUser());

    assert.equal(status.workflow_mode, 'temporal');
    assert.equal(status.workflow_backend, 'TEMPORAL');
    assert.equal(status.backend_status, 'READY');
  } finally {
    if (previousKnowledgeMode === undefined) {
      delete process.env.KNOWLEDGE_WORKFLOW_MODE;
    } else {
      process.env.KNOWLEDGE_WORKFLOW_MODE = previousKnowledgeMode;
    }
    if (previousChannelMode === undefined) {
      delete process.env.CHANNEL_RELEASE_WORKFLOW_MODE;
    } else {
      process.env.CHANNEL_RELEASE_WORKFLOW_MODE = previousChannelMode;
    }
  }
});

test('getWorkflowStatus lists failed agent team workflow runs as recoverable tasks', async () => {
  const occurredAt = new Date('2026-05-06T01:02:03.000Z');
  const prisma = {
    $transaction: async (queries: unknown[]) => Promise.all(queries),
    platformEvent: {
      findFirst: async () => ({
        id: 'event-latest',
        eventType: 'workflow.agent_team_run.failed',
        taskId: 'run-1',
        resourceId: 'team-1',
        teamId: 'team-1',
        runId: 'run-1',
        summary: '团队运行失败：supervisor timeout',
        payloadJson: {
          run_id: 'run-1',
          team_id: 'team-1',
          status: 'FAILED',
          error_message: 'supervisor timeout',
          workflow_backend: 'TEMPORAL',
        },
        occurredAt,
      }),
      findMany: async (args: { where: { eventType?: { in?: string[] } } }) => {
        const eventTypes = args.where.eventType?.in ?? [];
        if (eventTypes.includes('workflow.agent_team_run.failed')) {
          return [
            {
              eventType: 'workflow.agent_team_run.failed',
              teamId: 'team-1',
              runId: 'run-1',
              resourceId: 'team-1',
              taskId: 'run-1',
              summary: '团队运行失败：supervisor timeout',
              payloadJson: {
                run_id: 'run-1',
                team_id: 'team-1',
                error_message: 'supervisor timeout',
                workflow_id: 'agent-team-run-run-1',
                workflow_run_id: 'temporal-run-1',
              },
              occurredAt,
            },
          ];
        }
        return [];
      },
    },
    knowledgeEmbeddingTask: {
      findMany: async () => [],
    },
    agentPublishChannel: {
      findMany: async () => [],
    },
    agentTeamRun: {
      findMany: async () => [
        {
          id: 'run-1',
          teamId: 'team-1',
          objective: '生成生产巡检报告',
          status: 'FAILED',
          errorMessage: 'supervisor timeout',
          updatedAt: occurredAt,
          team: {
            id: 'team-1',
            name: '生产巡检团队',
            code: 'ops_team',
          },
        },
      ],
    },
  };

  const service = createRuntimeExecutionService({ prisma });
  const status = await service.getWorkflowStatus(buildUser());

  assert.deepEqual(status.recoverable_tasks.map((task) => task.task_type), ['agent_team_run']);
  assert.equal(status.recoverable_tasks[0]?.task_id, 'run-1');
  assert.equal(status.recoverable_tasks[0]?.workflow_task_type, 'AGENT_TEAM_RUN');
  assert.equal(status.recoverable_tasks[0]?.workflow_id, 'agent-team-run-run-1');
  assert.equal(status.recoverable_tasks[0]?.workflow_run_id, 'temporal-run-1');
  assert.equal(status.recoverable_tasks[0]?.title, '生产巡检团队 · 生成生产巡检报告');
  assert.equal(status.recoverable_tasks[0]?.error_message, 'supervisor timeout');
});

test('runAgentTeamRun records Temporal workflow identifiers on failed agent team events', async () => {
  const recordedEvents: Array<{ eventType: string; payloadJson: Record<string, unknown> }> = [];
  const service = createRuntimeExecutionService({
    prisma: {
      agentTeamRun: {
        findFirst: async () => ({
          tenantId: 'tenant-1',
          teamId: 'team-1',
          requestId: 'request-run-1',
          traceId: 'trace-run-1',
        }),
      },
    },
    agentTeamsService: {
      runWorkflowRun: async () => ({
        run_id: 'run-1',
        status: 'FAILED',
        error_message: 'supervisor timeout',
      }),
    },
    platformEvents: {
      recordEvent: async (event: { eventType: string; payloadJson: Record<string, unknown> }) => {
        recordedEvents.push(event);
        return { id: 'event-agent-team-1' };
      },
    },
  });

  await service.runAgentTeamRun({
    run_id: 'run-1',
    workflow_backend: 'TEMPORAL',
    workflow_id: 'agent-team-run-run-1',
    workflow_run_id: 'temporal-run-1',
  });

  assert.equal(recordedEvents[0]?.eventType, 'workflow.agent_team_run.failed');
  assert.equal(recordedEvents[0]?.payloadJson.workflow_backend, 'TEMPORAL');
  assert.equal(recordedEvents[0]?.payloadJson.workflow_id, 'agent-team-run-run-1');
  assert.equal(recordedEvents[0]?.payloadJson.workflow_run_id, 'temporal-run-1');
});

test('getWorkflowStatus lists failed plugin rollback workflows as recoverable tasks', async () => {
  const occurredAt = new Date('2026-05-07T01:02:03.000Z');
  const prisma = {
    $transaction: async (queries: unknown[]) => Promise.all(queries),
    platformEvent: {
      findFirst: async () => ({
        id: 'event-latest',
        eventType: 'workflow.plugin_rollback.failed',
        taskId: 'plugin-1:version-1',
        resourceId: 'plugin-1',
        pluginId: 'plugin-1',
        summary: '插件回滚失败：runtime timeout',
        payloadJson: {
          plugin_id: 'plugin-1',
          version_id: 'version-1',
          version: '1.1.0',
          error_message: 'runtime timeout',
          workflow_backend: 'TEMPORAL',
        },
        occurredAt,
      }),
      findMany: async (args: { where: { eventType?: { in?: string[] } } }) => {
        const eventTypes = args.where.eventType?.in ?? [];
        if (eventTypes.includes('workflow.plugin_rollback.failed')) {
          return [
            {
              eventType: 'workflow.plugin_rollback.failed',
              pluginId: 'plugin-1',
              resourceId: 'plugin-1',
              taskId: 'plugin-1:version-1',
              summary: '插件回滚失败：runtime timeout',
              payloadJson: {
                plugin_id: 'plugin-1',
                version_id: 'version-1',
                version: '1.1.0',
                error_message: 'runtime timeout',
              },
              occurredAt,
            },
          ];
        }
        return [];
      },
    },
    knowledgeEmbeddingTask: {
      findMany: async () => [],
    },
    agentPublishChannel: {
      findMany: async () => [],
    },
    agentTeamRun: {
      findMany: async () => [],
    },
    plugin: {
      findMany: async () => [
        {
          id: 'plugin-1',
          name: '工单套件',
          code: 'ticket-suite',
        },
      ],
    },
  };

  const service = createRuntimeExecutionService({ prisma });
  const status = await service.getWorkflowStatus(buildUser());

  assert.deepEqual(status.recoverable_tasks.map((task) => task.task_type), ['plugin_rollback']);
  assert.equal(status.recoverable_tasks[0]?.task_id, 'plugin-1:version-1');
  assert.equal(status.recoverable_tasks[0]?.workflow_task_type, 'PLUGIN_ROLLBACK');
  assert.equal(status.recoverable_tasks[0]?.title, '工单套件 · 1.1.0');
  assert.equal(status.recoverable_tasks[0]?.plugin_id, 'plugin-1');
  assert.equal(status.recoverable_tasks[0]?.version_id, 'version-1');
  assert.equal(status.recoverable_tasks[0]?.error_message, 'runtime timeout');
});

test('getWorkflowStatus lists failed plugin hook execution workflows as recoverable tasks', async () => {
  const occurredAt = new Date('2026-05-07T02:03:04.000Z');
  const prisma = {
    $transaction: async (queries: unknown[]) => Promise.all(queries),
    platformEvent: {
      findFirst: async () => ({
        id: 'event-latest',
        eventType: 'workflow.plugin_hook_execution.failed',
        taskId: 'hook-event-1',
        resourceId: 'hook-1',
        pluginId: 'plugin-1',
        summary: '插件 Hook 执行失败：tool timeout',
        payloadJson: {
          event_id: 'hook-event-1',
          plugin_id: 'plugin-1',
          hook_id: 'hook-1',
          hook_code: 'ticket.created',
          error_message: 'tool timeout',
          workflow_backend: 'TEMPORAL',
        },
        occurredAt,
      }),
      findMany: async (args: { where: { eventType?: { in?: string[] } } }) => {
        const eventTypes = args.where.eventType?.in ?? [];
        if (eventTypes.includes('workflow.plugin_hook_execution.failed')) {
          return [
            {
              eventType: 'workflow.plugin_hook_execution.failed',
              pluginId: 'plugin-1',
              resourceId: 'hook-1',
              taskId: 'hook-event-1',
              summary: '插件 Hook 执行失败：tool timeout',
              payloadJson: {
                event_id: 'hook-event-1',
                plugin_id: 'plugin-1',
                hook_id: 'hook-1',
                hook_code: 'ticket.created',
                error_message: 'tool timeout',
              },
              occurredAt,
            },
          ];
        }
        return [];
      },
    },
    knowledgeEmbeddingTask: {
      findMany: async () => [],
    },
    agentPublishChannel: {
      findMany: async () => [],
    },
    agentTeamRun: {
      findMany: async () => [],
    },
    plugin: {
      findMany: async () => [
        {
          id: 'plugin-1',
          name: '工单套件',
          code: 'ticket-suite',
        },
      ],
    },
  };

  const service = createRuntimeExecutionService({ prisma });
  const status = await service.getWorkflowStatus(buildUser());

  assert.deepEqual(status.recoverable_tasks.map((task) => task.task_type), ['plugin_hook_execution']);
  assert.equal(status.recoverable_tasks[0]?.task_id, 'hook-event-1');
  assert.equal(status.recoverable_tasks[0]?.workflow_task_type, 'PLUGIN_HOOK_EXECUTION');
  assert.equal(status.recoverable_tasks[0]?.title, '工单套件 · ticket.created');
  assert.equal(status.recoverable_tasks[0]?.plugin_id, 'plugin-1');
  assert.equal(status.recoverable_tasks[0]?.hook_id, 'hook-1');
  assert.equal(status.recoverable_tasks[0]?.hook_code, 'ticket.created');
  assert.equal(status.recoverable_tasks[0]?.error_message, 'tool timeout');
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
        workflow_id: 'channel-automation-workflow-1',
        workflow_run_id: 'channel-automation-run-1',
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
        workflow_id: 'channel-self-healing-workflow-1',
        workflow_run_id: 'channel-self-healing-run-1',
        last_run: {
          decision: 'ROLLBACK_EXECUTED',
          error_message: null,
        },
      };
    },
  };
  const platformEvents = {
    recordEvent: async (event: { eventType: string; traceId?: string | null; requestId?: string | null }) => {
      events.push(event.eventType);
      return {
        id: `retry-event-${events.length}`,
        traceId: event.traceId ?? null,
        requestId: event.requestId ?? null,
      };
    },
  };

  const service = createRuntimeExecutionService({
    prisma,
    platformEvents,
    releaseAutomationWorkflow,
    releaseSelfHealingWorkflow,
  });
  const user = buildUser({ permissions: ['channel:publish:deploy'] });

  const automationResult = await service.retryWorkflowTask(user, 'channel-1', 'channel_release_automation');
  const selfHealingResult = await service.retryWorkflowTask(user, 'channel-2', 'channel_release_self_healing');

  assert.equal(automationResult.status, 'QUEUED');
  assert.equal(automationResult.task_type, 'channel_release_automation');
  assert.equal(automationResult.workflow_backend, 'TEMPORAL');
  assert.equal(automationResult.workflow_id, 'channel-automation-workflow-1');
  assert.equal(automationResult.workflow_run_id, 'channel-automation-run-1');
  assert.equal(automationResult.retry_event_id, 'retry-event-1');
  assert.equal(automationResult.retry_trace_id, 'trace-1');
  assert.equal(automationResult.retry_request_id, 'request-1');
  assert.equal(selfHealingResult.status, 'QUEUED');
  assert.equal(selfHealingResult.task_type, 'channel_release_self_healing');
  assert.equal(selfHealingResult.workflow_backend, 'TEMPORAL');
  assert.equal(selfHealingResult.workflow_id, 'channel-self-healing-workflow-1');
  assert.equal(selfHealingResult.workflow_run_id, 'channel-self-healing-run-1');
  assert.equal(selfHealingResult.retry_event_id, 'retry-event-2');
  assert.equal(selfHealingResult.retry_trace_id, 'trace-1');
  assert.equal(selfHealingResult.retry_request_id, 'request-1');
  assert.deepEqual(automationDispatches, [{ userId: 'user-1', channelId: 'channel-1' }]);
  assert.deepEqual(selfHealingDispatches, [{ userId: 'user-1', channelId: 'channel-2' }]);
  assert.deepEqual(events, [
    'workflow.channel_release_automation.retry_requested',
    'workflow.channel_release_self_healing.retry_requested',
  ]);
});

test('retryWorkflowTask redispatches failed agent team workflow runs through agent team service', async () => {
  const workflowRuns: string[] = [];
  const events: string[] = [];
  const runUpdates: Array<Record<string, unknown>> = [];
  const prisma = {
    agentTeamRun: {
      findFirst: async (args: { where: { id: string; tenantId: string } }) => ({
        id: args.where.id,
        tenantId: args.where.tenantId,
        teamId: 'team-1',
        objective: '生成生产巡检报告',
        status: 'FAILED',
        team: {
          id: 'team-1',
          name: '生产巡检团队',
        },
      }),
      update: async (args: { data: Record<string, unknown> }) => {
        runUpdates.push(args.data);
        return { id: 'run-1' };
      },
    },
  };
  const service = createRuntimeExecutionService({
    prisma,
    agentTeamsService: {
      runWorkflowRun: async (runId: string) => {
        workflowRuns.push(runId);
        return {
          success: true,
          run_id: runId,
          status: 'SUCCESS',
          workflow_backend: 'TEMPORAL',
          workflow_id: 'agent-team-workflow-1',
          workflow_run_id: 'agent-team-run-1',
        };
      },
    },
    platformEvents: {
      recordEvent: async (event: { eventType: string; traceId?: string | null; requestId?: string | null }) => {
        events.push(event.eventType);
        return {
          id: `retry-event-${events.length}`,
          traceId: event.traceId ?? null,
          requestId: event.requestId ?? null,
        };
      },
    },
  });

  const result = await service.retryWorkflowTask(buildUser({ permissions: ['agent:team:run'] }), 'run-1', 'agent_team_run');

  assert.equal(result.status, 'QUEUED');
  assert.equal(result.task_type, 'agent_team_run');
  assert.equal(result.task_id, 'run-1');
  assert.equal(result.workflow_backend, 'TEMPORAL');
  assert.equal(result.workflow_id, 'agent-team-workflow-1');
  assert.equal(result.workflow_run_id, 'agent-team-run-1');
  assert.equal(result.retry_event_id, 'retry-event-1');
  assert.equal(result.retry_trace_id, 'trace-1');
  assert.equal(result.retry_request_id, 'request-1');
  assert.deepEqual(workflowRuns, ['run-1']);
  assert.deepEqual(events, ['workflow.agent_team_run.retry_requested']);
  assert.deepEqual(runUpdates, [
    {
      status: 'QUEUED',
      errorMessage: null,
      endedAt: null,
      updatedBy: 'user-1',
    },
  ]);
});

test('retryWorkflowTask redispatches failed plugin rollback workflow through plugin workflow service', async () => {
  const rollbacks: Array<{ userId: string; pluginId: string; versionId: string; version: string }> = [];
  const events: string[] = [];
  const prisma = {
    pluginVersion: {
      findFirst: async (args: { where: { pluginId: string; tenantId: string; id: string } }) => ({
        id: args.where.id,
        tenantId: args.where.tenantId,
        pluginId: args.where.pluginId,
        version: '1.1.0',
        status: 'PUBLISHED',
        deletedAt: null,
        plugin: {
          id: args.where.pluginId,
          name: '工单套件',
          code: 'ticket-suite',
        },
      }),
    },
  };
  const service = createRuntimeExecutionService({
    prisma,
    pluginRollbackWorkflow: {
      dispatchRollback: async (user: { id: string }, pluginId: string, input: { versionId: string; version: string }) => {
        rollbacks.push({ userId: user.id, pluginId, versionId: input.versionId, version: input.version });
        return {
          workflow_backend: 'TEMPORAL',
          workflow_id: 'plugin-rollback-plugin-1-version-1',
          workflow_run_id: 'run-1',
        };
      },
    },
    platformEvents: {
      recordEvent: async (event: { eventType: string; traceId?: string | null; requestId?: string | null }) => {
        events.push(event.eventType);
        return {
          id: `retry-event-${events.length}`,
          traceId: event.traceId ?? null,
          requestId: event.requestId ?? null,
        };
      },
    },
  });

  const result = await service.retryWorkflowTask(
    buildUser({ permissions: ['plugin:center:manage'] }),
    'plugin-1:version-1',
    'plugin_rollback',
  );

  assert.equal(result.status, 'QUEUED');
  assert.equal(result.task_type, 'plugin_rollback');
  assert.equal(result.task_id, 'plugin-1:version-1');
  assert.equal(result.workflow_backend, 'TEMPORAL');
  assert.equal(result.workflow_id, 'plugin-rollback-plugin-1-version-1');
  assert.equal(result.workflow_run_id, 'run-1');
  assert.equal(result.retry_event_id, 'retry-event-1');
  assert.equal(result.retry_trace_id, 'trace-1');
  assert.equal(result.retry_request_id, 'request-1');
  assert.deepEqual(rollbacks, [{ userId: 'user-1', pluginId: 'plugin-1', versionId: 'version-1', version: '1.1.0' }]);
  assert.deepEqual(events, ['workflow.plugin_rollback.retry_requested']);
});

test('retryWorkflowTask redispatches failed plugin hook execution workflow through plugin hook workflow service', async () => {
  const hookExecutions: Array<{ userId: string; eventId: string; pluginId: string; hookId: string }> = [];
  const events: string[] = [];
  const prisma = {
    platformEvent: {
      findFirst: async (args: { where: { id: string; tenantId: string; eventType: string } }) => ({
        id: args.where.id,
        tenantId: args.where.tenantId,
        eventType: args.where.eventType,
        pluginId: 'plugin-1',
        resourceId: 'hook-1',
        payloadJson: {
          plugin_id: 'plugin-1',
          hook_id: 'hook-1',
          hook_code: 'ticket.created',
        },
      }),
    },
  };
  const service = createRuntimeExecutionService({
    prisma,
    pluginHookWorkflow: {
      dispatchHookExecution: async (user: { id: string }, input: { eventId: string; pluginId: string; hookId: string }) => {
        hookExecutions.push({ userId: user.id, eventId: input.eventId, pluginId: input.pluginId, hookId: input.hookId });
        return {
          workflow_backend: 'TEMPORAL',
          workflow_id: 'plugin-hook-hook-event-1',
          workflow_run_id: 'run-1',
        };
      },
    },
    platformEvents: {
      recordEvent: async (event: { eventType: string; traceId?: string | null; requestId?: string | null }) => {
        events.push(event.eventType);
        return {
          id: `retry-event-${events.length}`,
          traceId: event.traceId ?? null,
          requestId: event.requestId ?? null,
        };
      },
    },
  });

  const result = await service.retryWorkflowTask(
    buildUser({ permissions: ['plugin:center:manage'] }),
    'hook-event-1',
    'plugin_hook_execution',
  );

  assert.equal(result.status, 'QUEUED');
  assert.equal(result.task_type, 'plugin_hook_execution');
  assert.equal(result.task_id, 'hook-event-1');
  assert.equal(result.workflow_backend, 'TEMPORAL');
  assert.equal(result.workflow_id, 'plugin-hook-hook-event-1');
  assert.equal(result.workflow_run_id, 'run-1');
  assert.equal(result.retry_event_id, 'retry-event-1');
  assert.equal(result.retry_trace_id, 'trace-1');
  assert.equal(result.retry_request_id, 'request-1');
  assert.deepEqual(hookExecutions, [{ userId: 'user-1', eventId: 'hook-event-1', pluginId: 'plugin-1', hookId: 'hook-1' }]);
  assert.deepEqual(events, ['workflow.plugin_hook_execution.retry_requested']);
});

test('runPluginHookExecution executes generated plugin hook tool through Tool Gateway boundary', async () => {
  const toolExecutions: Array<{ toolId: string; input: Record<string, unknown>; triggerSource: string; requireApproval: boolean | null | undefined }> = [];
  const events: Array<{ eventType: string; status: string; payloadJson?: Record<string, unknown> }> = [];
  const prisma = {
    platformEvent: {
      findFirst: async () => ({
        id: 'event-1',
        tenantId: 'tenant-1',
        pluginId: 'plugin-1',
        resourceId: 'hook-1',
        traceId: 'trace-1',
        requestId: 'request-1',
        payloadJson: {
          plugin_id: 'plugin-1',
          hook_id: 'hook-1',
          hook_code: 'ticket.created',
          payload: { ticket_id: 'T-001' },
        },
      }),
    },
    user: {
      findFirst: async () => ({
        id: 'user-1',
        tenantId: 'tenant-1',
        departmentId: null,
        email: 'operator@example.test',
        userRoles: [],
      }),
    },
    pluginHook: {
      findFirst: async () => ({
        id: 'hook-1',
        tenantId: 'tenant-1',
        pluginId: 'plugin-1',
        code: 'ticket.created',
        status: 'ACTIVE',
        configJson: {
          require_approval: true,
          generated_tool_code: 'plugin_tool_ticket_suite_ticket_created',
        },
      }),
    },
    tool: {
      findFirst: async () => ({
        id: 'tool-1',
        tenantId: 'tenant-1',
        code: 'plugin_tool_ticket_suite_ticket_created',
        status: 'ACTIVE',
      }),
    },
  };
  const service = createRuntimeExecutionService({
    prisma,
    toolsService: {
      execute: async (_user: unknown, toolId: string, input: Record<string, unknown>, context: { triggerSource: string; requireApproval?: boolean | null }) => {
        toolExecutions.push({ toolId, input, triggerSource: context.triggerSource, requireApproval: context.requireApproval });
        return {
          status: 'APPROVAL_REQUIRED',
          approval_request_id: 'approval-1',
          latency_ms: 0,
          response_status: null,
          error_message: null,
          response_body: null,
        };
      },
    },
    platformEvents: {
      recordEvent: async (event: { eventType: string; status: string; payloadJson?: Record<string, unknown> }) => {
        events.push(event);
      },
      recordUsage: async () => undefined,
    },
  });

  const result = await service.runPluginHookExecution({
    event_id: 'event-1',
    plugin_id: 'plugin-1',
    hook_id: 'hook-1',
    workflow_id: 'plugin-hook-event-1',
    run_id: 'run-1',
  });

  assert.equal(result.status, 'APPROVAL_REQUIRED');
  assert.equal(result.approval_request_id, 'approval-1');
  assert.deepEqual(toolExecutions, [
    {
      toolId: 'tool-1',
      input: { ticket_id: 'T-001' },
      triggerSource: 'RUNTIME',
      requireApproval: true,
    },
  ]);
  assert.deepEqual(events.map((event) => event.eventType), ['workflow.plugin_hook_execution.approval_required']);
});

test('runtime internal permission denial is projected as a security access event', async () => {
  const events: Array<{ eventType: string; resourceType: string; traceId?: string | null; requestId?: string | null; summary?: string | null }> = [];
  const service = createRuntimeExecutionService({
    prisma: {
      user: {
        findFirst: async () => ({
          id: 'user-1',
          tenantId: 'tenant-1',
          departmentId: 'dept-1',
          email: 'operator@example.test',
          userRoles: [
            {
              role: {
                id: 'role-1',
                code: 'operator',
                rolePermissions: [],
              },
            },
          ],
        }),
      },
      agent: {
        findFirst: async () => ({ id: 'agent-1' }),
        count: async () => 1,
      },
      resourceAcl: {
        findMany: async () => [],
      },
    },
    knowledgeService: {
      retrieveAgentReferences: async () => ({
        references: [],
        mode: 'HYBRID',
        latency_ms: 1,
        cost_total: 0,
      }),
    },
    dataScopeQuery: {
      buildWhere: async () => ({ where: null }),
    },
    resourceAccess: {
      buildResourceAclSubjectKeys: async () => new Set<string>(),
    },
    platformEvents: {
      recordEvent: async (event: { eventType: string; resourceType: string; traceId?: string | null; requestId?: string | null; summary?: string | null }) => {
        events.push(event);
      },
      recordUsage: async () => undefined,
    },
  });

  await assert.rejects(
    () => service.retrieve({
      tenant_id: 'tenant-1',
      user_id: 'user-1',
      agent_id: 'agent-1',
      query: 'refund policy',
      request_id: 'request-1',
      trace_id: '1'.repeat(32),
    }),
    /Runtime permission denied/,
  );

  assert.equal(events.length, 1);
  assert.equal(events[0]?.eventType, 'security.access.denied');
  assert.equal(events[0]?.resourceType, 'AGENT');
  assert.equal(events[0]?.traceId, '1'.repeat(32));
  assert.equal(events[0]?.requestId, 'request-1');
  assert.match(events[0]?.summary ?? '', /Runtime permission denied/);
});

async function waitForImmediate() {
  await new Promise<void>((resolve) => {
    setImmediate(resolve);
  });
}

function createRuntimeExecutionService(input: {
  prisma: Record<string, unknown>;
  knowledgeService?: Record<string, unknown>;
  taskDispatcher?: Record<string, unknown>;
  toolsService?: Record<string, unknown>;
  dataScopeQuery?: Record<string, unknown>;
  resourceAccess?: Record<string, unknown>;
  agentTeamsService?: Record<string, unknown>;
  channelsService?: Record<string, unknown>;
  platformEvents?: Record<string, unknown>;
  releaseAutomationWorkflow?: Record<string, unknown>;
  releaseSelfHealingWorkflow?: Record<string, unknown>;
  pluginRollbackWorkflow?: Record<string, unknown>;
  pluginHookWorkflow?: Record<string, unknown>;
}) {
  return new RuntimeExecutionServiceCtor(
    input.prisma as never,
    input.knowledgeService as never ?? null as never,
    input.taskDispatcher as never ?? { enqueue: () => undefined } as never,
    input.toolsService as never ?? null as never,
    input.dataScopeQuery as never ?? null as never,
    input.resourceAccess as never ?? null as never,
    input.agentTeamsService as never ?? null as never,
    input.channelsService as never ?? null as never,
    input.platformEvents as never ?? { recordEvent: async () => undefined } as never,
    input.releaseAutomationWorkflow as never ?? null as never,
    input.releaseSelfHealingWorkflow as never ?? null as never,
    input.pluginRollbackWorkflow as never ?? null as never,
    input.pluginHookWorkflow as never ?? null as never,
  );
}

function buildUser(overrides: Partial<{ permissions: string[] }> = {}) {
  return {
    id: 'user-1',
    tenantId: 'tenant-1',
    email: 'operator@example.test',
    roles: [],
    permissions: overrides.permissions ?? [],
    requestId: 'request-1',
    traceId: 'trace-1',
  };
}
