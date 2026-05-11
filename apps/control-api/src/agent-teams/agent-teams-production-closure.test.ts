import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

process.env.RUNTIME_BASE_URL ??= 'http://runtime.example.test';
process.env.CONTROL_API_INTERNAL_BASE_URL ??= 'http://control-api.example.test';
process.env.RUNTIME_INTERNAL_TOKEN ??= 'test-runtime-internal-token';

test('failed agent team recoverable workflow retry resets run before redispatching', async () => {
  const { AgentTeamsService } = await import('./agent-teams.service');
  const { RuntimeExecutionService } = await import('../runtime-execution/runtime-execution.service');
  const calls: string[] = [];
  const events: string[] = [];
  const run = {
    id: 'run-1',
    tenantId: 'tenant-1',
    teamId: 'team-1',
    objective: '生成生产巡检报告',
    status: 'FAILED',
    requestId: 'request-1',
    traceId: '1'.repeat(32),
    totalSteps: 1,
    completedSteps: 0,
    failedSteps: 1,
    totalTokens: 10,
    totalCost: 0.01,
    latencyMs: 1000,
    errorMessage: 'Runtime 团队编排失败。',
    startedAt: new Date('2026-05-07T01:00:00.000Z'),
    endedAt: new Date('2026-05-07T01:00:03.000Z'),
    createdAt: new Date('2026-05-07T01:00:00.000Z'),
    updatedAt: new Date('2026-05-07T01:00:03.000Z'),
    deletedAt: null,
    createdBy: 'user-1',
    updatedBy: 'user-1',
    operator: buildUser(),
  };
  const prisma = {
    agentTeamRun: {
      findFirst: async (args: { where?: { id?: string; tenantId?: string; status?: { in?: string[] } }; include?: unknown }) => {
        calls.push(`run:findFirst:${JSON.stringify(args.where)}`);
        if (args.where?.id !== run.id) {
          return null;
        }
        if (args.where?.tenantId && args.where.tenantId !== run.tenantId) {
          return null;
        }
        if (args.where?.status?.in && !args.where.status.in.includes(run.status)) {
          return null;
        }
        return args.include ? { ...run, team: { id: 'team-1', name: '生产巡检团队' } } : run;
      },
      findUnique: async () => ({ status: run.status }),
      update: async (args: { data: { status?: string; errorMessage?: string | null; endedAt?: Date | null } }) => {
        calls.push(`run:update:${JSON.stringify(args.data)}`);
        Object.assign(run, args.data);
        return run;
      },
    },
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
              rolePermissions: [
                {
                  permission: {
                    code: 'agent:team:run',
                  },
                },
              ],
            },
          },
        ],
      }),
    },
  };
  const agentTeamsService = new AgentTeamsService(
    prisma as never,
    null as never,
    { recordEvent: async () => undefined } as never,
    null as never,
  );
  const agentTeamsRecord = agentTeamsService as unknown as Record<string, unknown>;
  agentTeamsRecord.dispatchTeamRun = async (_user: unknown, runId: string) => {
    calls.push(`dispatch:${runId}:${run.status}:${run.errorMessage ?? 'null'}:${run.endedAt ? 'ended' : 'open'}`);
    return {
      workflow_backend: 'TEMPORAL',
      workflow_id: 'agent-team-workflow-1',
      workflow_run_id: 'agent-team-run-1',
    };
  };
  const runtimeService = new RuntimeExecutionService(
    prisma as never,
    null as never,
    { enqueue: () => undefined } as never,
    null as never,
    null as never,
    null as never,
    agentTeamsService as never,
    null as never,
    {
      recordEvent: async (event: { eventType: string; traceId?: string | null; requestId?: string | null }) => {
        events.push(event.eventType);
        return {
          id: `event-${events.length}`,
          traceId: event.traceId ?? null,
          requestId: event.requestId ?? null,
        };
      },
    } as never,
  );

  const result = await runtimeService.retryWorkflowTask(buildUser(), 'run-1', 'agent_team_run');

  assert.equal(result.status, 'QUEUED');
  assert.equal(run.status, 'QUEUED');
  assert.equal(run.errorMessage, null);
  assert.equal(run.endedAt, null);
  assert.ok(calls.includes('dispatch:run-1:QUEUED:null:open'));
  assert.deepEqual(events, ['workflow.agent_team_run.retry_requested']);
});

test('startRun records a started platform event before dispatching team workflow', async () => {
  const { AgentTeamsService } = await import('./agent-teams.service');
  const events: Array<Record<string, unknown>> = [];
  const calls: string[] = [];
  const run = {
    id: 'run-1',
    tenantId: 'tenant-1',
    teamId: 'team-1',
    objective: '生成生产巡检报告',
    status: 'RUNNING',
    requestId: 'request-1',
    traceId: '1'.repeat(32),
    totalSteps: 0,
    completedSteps: 0,
    failedSteps: 0,
    totalTokens: 0,
    totalCost: 0,
    latencyMs: 0,
    errorMessage: null,
    startedAt: new Date('2026-05-07T01:00:00.000Z'),
    endedAt: null,
    createdAt: new Date('2026-05-07T01:00:00.000Z'),
    updatedAt: new Date('2026-05-07T01:00:00.000Z'),
    deletedAt: null,
    createdBy: 'user-1',
    updatedBy: 'user-1',
  };
  const service = new AgentTeamsService(
    {
      agentTeamRun: {
        create: async (args: { data: Record<string, unknown> }) => {
          calls.push('run:create');
          assert.equal(args.data.status, 'RUNNING');
          assert.equal(args.data.requestId, 'request-1');
          assert.equal(args.data.traceId, '1'.repeat(32));
          return run;
        },
      },
    } as never,
    null as never,
    {
      recordEvent: async (event: Record<string, unknown>) => {
        calls.push(`event:${event.eventType}`);
        events.push(event);
        return { id: 'event-1' };
      },
    } as never,
    null as never,
  );
  const team = {
    id: 'team-1',
    tenantId: 'tenant-1',
    name: '生产巡检团队',
    code: 'ops_team',
    status: 'ACTIVE',
    members: [
      {
        id: 'member-1',
        status: 'ACTIVE',
      },
    ],
  };
  const record = service as unknown as Record<string, unknown>;
  record.findTeam = async () => team;
  record.dispatchTeamRun = async (_user: unknown, runId: string) => {
    calls.push(`dispatch:${runId}`);
  };
  record.touchTeam = async () => undefined;
  record.get = async () => ({ id: 'team-1' });

  await service.startRun(buildUser(), 'team-1', { objective: ' 生成生产巡检报告 ' });

  assert.deepEqual(calls, ['run:create', 'event:agent.team.run.started', 'dispatch:run-1']);
  assert.equal(events.length, 1);
  assert.equal(events[0]?.eventSource, 'AGENT_TEAM');
  assert.equal(events[0]?.resourceType, 'AGENT_TEAM');
  assert.equal(events[0]?.resourceId, 'team-1');
  assert.equal(events[0]?.teamId, 'team-1');
  assert.equal(events[0]?.runId, 'run-1');
  assert.equal(events[0]?.requestId, 'request-1');
  assert.equal(events[0]?.traceId, '1'.repeat(32));
  assert.equal(events[0]?.status, 'RUNNING');
  assert.equal(events[0]?.severity, 'INFO');
  assert.equal(events[0]?.sourceSystem, 'agent_team_run');
});

test('duplicate resumed runtime team callbacks do not append steps and cost twice', async () => {
  const { AgentTeamsService } = await import('./agent-teams.service');
  const createdStepTraceIds = new Set<string>();
  const calls: string[] = [];
  const service = new AgentTeamsService(
    {
      agentTeamRun: {
        findFirst: async () => ({
          totalSteps: 1,
          completedSteps: 1,
          failedSteps: 0,
          totalTokens: 100,
          totalCost: 0.01,
          startedAt: new Date('2026-05-07T01:00:00.000Z'),
          requestId: 'request-1',
          traceId: '0'.repeat(32),
          createdAt: new Date('2026-05-07T01:00:00.000Z'),
          endedAt: new Date('2026-05-07T01:00:03.000Z'),
        }),
        update: async (args: { data: { totalSteps?: number; totalTokens?: number; totalCost?: unknown } }) => {
          calls.push(`run:update:${args.data.totalSteps}:${args.data.totalTokens}:${String(args.data.totalCost)}`);
          return { id: 'run-1' };
        },
      },
      agentTeamStep: {
        count: async (args: { where: { traceId?: string | null } }) => {
          return args.where.traceId && createdStepTraceIds.has(args.where.traceId) ? 1 : 0;
        },
        createMany: async (args: { data: Array<{ traceId?: string | null }> }) => {
          calls.push(`steps:create:${args.data.length}`);
          args.data.forEach((step) => {
            if (step.traceId) {
              createdStepTraceIds.add(step.traceId);
            }
          });
          return { count: args.data.length };
        },
        deleteMany: async () => ({ count: 0 }),
      },
      agentTeamHandoff: {
        createMany: async (args: { data: unknown[] }) => {
          calls.push(`handoffs:create:${args.data.length}`);
          return { count: args.data.length };
        },
        deleteMany: async () => ({ count: 0 }),
      },
    } as never,
    null as never,
    {
      recordEvent: async (event: Record<string, unknown>) => {
        calls.push(`event:${event.eventType}`);
        return { id: `event-${calls.length}` };
      },
      recordUsage: async (usage: Record<string, unknown>) => {
        calls.push(`usage:${usage.metricType}:${usage.quantity}:${usage.amount}`);
        return { id: `usage-${calls.length}` };
      },
    } as never,
    null as never,
  );
  const runtimeResponse = {
    status: 'SUCCESS',
    trace_id: '2'.repeat(32),
    latency_ms: 120,
    total_tokens: 200,
    total_cost: 0.02,
    summary: '团队恢复执行完成。',
    error_message: null,
    steps: [
      {
        member_id: 'member-1',
        agent_id: 'agent-1',
        step_type: 'AGENT_RUN',
        title: '成员恢复执行',
        status: 'SUCCESS',
        input_summary: '继续处理',
        output_summary: '处理完成',
        trace_id: '2'.repeat(32),
        span_id: 'span-1',
        parent_span_id: 'parent-1',
        duration_ms: 120,
        prompt_tokens: 120,
        completion_tokens: 80,
        total_tokens: 200,
        cost_total: 0.02,
        child_steps: [],
        references: [],
        tool_calls: [],
        model_call: null,
        error_message: null,
        started_at: '2026-05-07T01:00:01.000Z',
        ended_at: '2026-05-07T01:00:02.000Z',
      },
    ],
    member_results: [],
    handoffs: [
      {
        from_member_id: 'member-1',
        to_member_id: 'member-2',
        from_agent_id: 'agent-1',
        to_agent_id: 'agent-2',
        reason: '恢复后自动接力',
        status: 'AUTO',
        decision_note: null,
        decided_at: '2026-05-07T01:00:02.000Z',
      },
    ],
  };

  await callPrivate(service, 'persistRuntimeTeamRun', [
    buildUser(),
    'team-1',
    'run-1',
    runtimeResponse,
    { appendExisting: true },
  ]);
  await callPrivate(service, 'persistRuntimeTeamRun', [
    buildUser(),
    'team-1',
    'run-1',
    runtimeResponse,
    { appendExisting: true },
  ]);

  assert.equal(calls.filter((call) => call.startsWith('steps:create')).length, 1);
  assert.equal(calls.filter((call) => call.startsWith('handoffs:create')).length, 1);
  assert.equal(calls.filter((call) => call.startsWith('run:update')).length, 1);
  assert.equal(calls.filter((call) => call === 'usage:agent_team_runs:1:0').length, 1);
  assert.equal(calls.filter((call) => call === 'usage:agent_team_cost:0.02:0.02').length, 1);
});

test('agent team report archive delete approval is reusable and applies deletion only after approval', async () => {
  const { AgentTeamsService } = await import('./agent-teams.service');
  const approvalEvents: Array<Record<string, unknown>> = [];
  const deletedKeys: string[] = [];
  const archiveKey = 'agent-team-run-reports/team-1/2026-05-07T01-00-00-000Z-11111111-1111-1111-1111-111111111111.csv';
  const archiveId = Buffer.from(archiveKey, 'utf8').toString('base64url');
  const service = new AgentTeamsService(
    {
      agentTeamRun: {
        findFirst: async () => ({
          id: '11111111-1111-1111-1111-111111111111',
          teamId: 'team-1',
          objective: '生成生产巡检报告',
          traceId: '3'.repeat(32),
          team: {
            id: 'team-1',
            name: '生产巡检团队',
          },
        }),
      },
      approvalAuditEvent: {
        findMany: async () => [...approvalEvents]
          .sort((left, right) => Date.parse(String(right.occurredAt)) - Date.parse(String(left.occurredAt))),
        create: async (args: { data: Record<string, unknown> }) => {
          const event = {
            id: `approval-${approvalEvents.length + 1}`,
            actor: {
              id: String(args.data.actorId),
              name: '审批员',
              email: 'operator@example.test',
            },
            occurredAt: new Date(`2026-05-07T01:00:0${approvalEvents.length}.000Z`),
            ...args.data,
          };
          approvalEvents.push(event);
          return event;
        },
      },
    } as never,
    null as never,
    null as never,
    {
      deleteTenantObject: async (_tenantId: string, key: string) => {
        deletedKeys.push(key);
      },
    } as never,
  );

  const first = await service.requestDeleteRunReportArchive(buildUser(), archiveId);
  const second = await service.requestDeleteRunReportArchive(buildUser(), archiveId);

  assert.equal(first.approval_id, 'approval-1');
  assert.equal(second.approval_id, 'approval-1');
  assert.equal(approvalEvents.filter((event) => event.eventType === 'DELETE_REQUESTED').length, 1);

  const approved = await service.approveRunReportArchiveDeleteApproval(
    buildUser(),
    first.approval_id,
    { decision_note: '确认删除' },
  );

  assert.equal(approved.status, 'APPLIED');
  assert.deepEqual(deletedKeys, [archiveKey]);
  assert.equal(approvalEvents.filter((event) => event.eventType === 'APPROVED').length, 1);
  assert.equal(approvalEvents.filter((event) => event.eventType === 'DELETE_APPLIED').length, 1);
});

test('agent team report archive delete rejection keeps object untouched', async () => {
  const { AgentTeamsService } = await import('./agent-teams.service');
  const approvalEvents: Array<Record<string, unknown>> = [];
  const deletedKeys: string[] = [];
  const archiveKey = 'agent-team-run-reports/team-1/2026-05-07T01-00-00-000Z-22222222-2222-2222-2222-222222222222.csv';
  const archiveId = Buffer.from(archiveKey, 'utf8').toString('base64url');
  const service = new AgentTeamsService(
    {
      agentTeamRun: {
        findFirst: async () => ({
          id: '22222222-2222-2222-2222-222222222222',
          teamId: 'team-1',
          objective: '生成风险复盘报告',
          traceId: '4'.repeat(32),
          team: {
            id: 'team-1',
            name: '生产巡检团队',
          },
        }),
      },
      approvalAuditEvent: {
        findMany: async () => [...approvalEvents]
          .sort((left, right) => Date.parse(String(right.occurredAt)) - Date.parse(String(left.occurredAt))),
        create: async (args: { data: Record<string, unknown> }) => {
          const event = {
            id: `approval-${approvalEvents.length + 1}`,
            actor: {
              id: String(args.data.actorId),
              name: '审批员',
              email: 'operator@example.test',
            },
            occurredAt: new Date(`2026-05-07T01:01:0${approvalEvents.length}.000Z`),
            ...args.data,
          };
          approvalEvents.push(event);
          return event;
        },
      },
    } as never,
    null as never,
    null as never,
    {
      deleteTenantObject: async (_tenantId: string, key: string) => {
        deletedKeys.push(key);
      },
    } as never,
  );

  const requested = await service.requestDeleteRunReportArchive(buildUser(), archiveId);
  const rejected = await service.rejectRunReportArchiveDeleteApproval(
    buildUser(),
    requested.approval_id,
    { decision_note: '需要保留审计文件' },
  );

  assert.equal(rejected.status, 'REJECTED');
  assert.deepEqual(deletedKeys, []);
  assert.equal(approvalEvents.filter((event) => event.eventType === 'REJECTED').length, 1);
  assert.equal(approvalEvents.filter((event) => event.eventType === 'DELETE_APPLIED').length, 0);
});

test('agent team fallback ledger copy does not describe Runtime execution as future work', async () => {
  const source = await readFile(`${process.cwd()}/src/agent-teams/agent-teams.service.ts`, 'utf8');

  assert.doesNotMatch(source, /后续 Runtime 编排会在此步骤接入真实子 Agent 执行/);
  assert.match(source, /Runtime 编排已接入真实子 Agent 执行链路/);
});

test('run handoff and feedback mutations enforce team data scope and resource ACL through runId', async () => {
  const source = await readFile(`${process.cwd()}/src/agent-teams/agent-teams.controller.ts`, 'utf8');
  const handoffSection = extractMethodSection(source, 'async createHandoff');
  const feedbackSection = extractMethodSection(source, 'async createFeedback');

  for (const section of [handoffSection, feedbackSection]) {
    assert.match(section, /@Permissions\('agent:team:run'\)/);
    assert.match(section, /@RequireDataScope\(\{\s*resourceType: 'AGENT_TEAM',\s*idParam: 'runId'\s*\}\)/s);
    assert.match(
      section,
      /@RequireResourceAcl\(\{\s*resourceType: 'AGENT_TEAM',\s*idParam: 'runId',\s*permissionCode: 'agent:team:run'\s*\}\)/s,
    );
  }
});

test('run report export and archive creation enforce team data scope and resource ACL through runId', async () => {
  const source = await readFile(`${process.cwd()}/src/agent-teams/agent-teams.controller.ts`, 'utf8');
  const exportSection = extractMethodSection(source, 'async exportRunReport');
  const archiveCreateSection = extractMethodSection(source, 'async createRunReportArchive');

  for (const section of [exportSection, archiveCreateSection]) {
    assert.match(section, /@Permissions\('agent:team:view'\)/);
    assert.match(section, /@RequireDataScope\(\{\s*resourceType: 'AGENT_TEAM',\s*idParam: 'runId'\s*\}\)/s);
    assert.match(
      section,
      /@RequireResourceAcl\(\{\s*resourceType: 'AGENT_TEAM',\s*idParam: 'runId',\s*permissionCode: 'agent:team:view'\s*\}\)/s,
    );
  }
});

test('run report archive download and delete request enforce team data scope and resource ACL through archiveId', async () => {
  const source = await readFile(`${process.cwd()}/src/agent-teams/agent-teams.controller.ts`, 'utf8');
  const downloadSection = extractMethodSection(source, 'async getRunReportArchiveDownloadUrl');
  const deleteRequestSection = extractMethodSection(source, 'async requestDeleteRunReportArchive');

  for (const section of [downloadSection, deleteRequestSection]) {
    assert.match(section, /@Permissions\('agent:team:view'\)/);
    assert.match(section, /@RequireDataScope\(\{\s*resourceType: 'AGENT_TEAM',\s*idParam: 'archiveId'\s*\}\)/s);
    assert.match(
      section,
      /@RequireResourceAcl\(\{\s*resourceType: 'AGENT_TEAM',\s*idParam: 'archiveId',\s*permissionCode: 'agent:team:view'\s*\}\)/s,
    );
  }
});

test('agent team run resource id resolves to owning team id before guard checks', async () => {
  const { ResourceAccessService } = await import('../common/services/resource-access.service');
  const calls: string[] = [];
  const service = new ResourceAccessService({
    agentTeam: {
      findFirst: async (args: { where: { id: string } }) => {
        calls.push(`team:${args.where.id}`);
        return args.where.id === 'team-1' ? { id: 'team-1' } : null;
      },
    },
    agentTeamRun: {
      findFirst: async (args: { where: { id: string } }) => {
        calls.push(`run:${args.where.id}`);
        return args.where.id === 'run-1' ? { teamId: 'team-1' } : null;
      },
    },
  } as never);

  assert.equal(await service.resolveCanonicalResourceId('tenant-1', 'AGENT_TEAM', 'run-1'), 'team-1');
  assert.equal(await service.resolveCanonicalResourceId('tenant-1', 'AGENT_TEAM', 'team-1'), 'team-1');
  assert.deepEqual(calls, ['team:run-1', 'run:run-1', 'team:team-1']);
});

test('agent team report archive id resolves to owning team id before guard checks', async () => {
  const { ResourceAccessService } = await import('../common/services/resource-access.service');
  const archiveKey = 'agent-team-run-reports/team-1/2026-05-07T01-00-00-000Z-run-1.csv';
  const archiveId = Buffer.from(archiveKey, 'utf8').toString('base64url');
  const service = new ResourceAccessService({
    agentTeam: {
      findFirst: async (args: { where: { id: string } }) => (
        args.where.id === 'team-1' ? { id: 'team-1' } : null
      ),
    },
    agentTeamRun: {
      findFirst: async () => null,
    },
  } as never);

  assert.equal(await service.resolveCanonicalResourceId('tenant-1', 'AGENT_TEAM', archiveId), 'team-1');
});

async function callPrivate(target: unknown, methodName: string, args: unknown[]) {
  const record = target as Record<string, unknown>;
  const method = record[methodName];
  assert.equal(typeof method, 'function');
  await (method as (...input: unknown[]) => Promise<unknown>).apply(target, args);
}

function buildUser() {
  return {
    id: 'user-1',
    tenantId: 'tenant-1',
    departmentId: 'dept-1',
    email: 'operator@example.test',
    roles: [],
    permissions: ['agent:team:run'],
    requestId: 'request-1',
    traceId: '1'.repeat(32),
  };
}

function extractMethodSection(source: string, methodSignature: string) {
  const lines = source.split('\n');
  const methodLineIndex = lines.findIndex((line) => line.includes(methodSignature));
  assert.notEqual(methodLineIndex, -1, `Missing method ${methodSignature}`);

  let startLineIndex = methodLineIndex;
  while (startLineIndex > 0 && lines[startLineIndex - 1]?.trimStart().startsWith('@')) {
    startLineIndex -= 1;
  }

  const nextDecoratorLineIndex = lines.findIndex(
    (line, index) => index > methodLineIndex && line.startsWith('  @'),
  );
  const endLineIndex = nextDecoratorLineIndex === -1 ? lines.length : nextDecoratorLineIndex;
  return lines.slice(startLineIndex, endLineIndex).join('\n');
}
