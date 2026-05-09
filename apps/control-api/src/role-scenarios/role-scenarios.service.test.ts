import assert from 'node:assert/strict';
import test from 'node:test';

import { BadRequestException } from '@nestjs/common';

import { RoleScenariosService } from './role-scenarios.service';

const currentUser = {
  id: 'user-1',
  tenantId: 'tenant-1',
  departmentId: 'dept-1',
  email: 'operator@example.test',
  roles: [],
  roleIds: [],
  permissions: [],
};

const createdAt = new Date('2026-05-09T12:00:00.000Z');

function scenarioRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'scenario-1',
    tenantId: 'tenant-1',
    ownerId: 'user-1',
    agentId: 'agent-1',
    skillId: 'skill-1',
    knowledgeId: 'knowledge-1',
    toolId: 'tool-1',
    promptId: 'prompt-1',
    name: '售前方案交付场景包',
    code: 'sales_solution_delivery',
    roleName: '售前顾问',
    departmentName: '解决方案部',
    scenarioType: 'SALES',
    status: 'READY',
    priority: 'HIGH',
    painPoint: '客户资料分散，售前方案反复返工。',
    businessGoal: '将客户六问、资料检索、方案生成和验收材料串成标准场景包。',
    workflowSummary: '客户分层 -> 资料检索 -> 方案生成 -> 风险校验 -> 样板交付。',
    expectedOutcome: '输出可复用的售前方案、风险清单和验收口径。',
    sampleDeliverable: 'Markdown 方案包，包含客户画像、方案架构、引用来源、风险提示。',
    acceptanceCriteria: '引用来源完整，关键风险有处理建议，输出格式符合交付模板。',
    roiMetric: '方案返工次数下降 30%，单次方案准备时间下降 40%。',
    impactScore: 93,
    tags: ['售前', '方案', '样板'],
    notes: '优先用于任务型客户试点。',
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
    createdBy: 'user-1',
    updatedBy: 'user-1',
    owner: {
      id: 'user-1',
      name: '运营管理员',
      email: 'operator@example.test',
    },
    agent: {
      id: 'agent-1',
      name: '售前方案助手',
      code: 'sales_agent',
      status: 'PUBLISHED',
    },
    skill: {
      id: 'skill-1',
      name: '方案生成 Skill',
      code: 'proposal_skill',
      status: 'PUBLISHED',
    },
    knowledge: {
      id: 'knowledge-1',
      name: '售前知识库',
      code: 'sales_kb',
      status: 'ACTIVE',
    },
    tool: {
      id: 'tool-1',
      name: '客户画像查询',
      code: 'customer_profile_query',
      status: 'ACTIVE',
      riskLevel: 'LOW',
    },
    prompt: {
      id: 'prompt-1',
      name: '售前方案提示词',
      code: 'sales_prompt',
      status: 'PUBLISHED',
    },
    ...overrides,
  };
}

test('role scenarios derive impact score and keep list summaries compact', async () => {
  const writes: Array<{ type: string; data: Record<string, unknown> }> = [];
  const record = scenarioRecord();
  const prisma = {
    roleScenario: {
      create: async (args: { data: Record<string, unknown> }) => {
        writes.push({ type: 'roleScenario.create', data: args.data });
        return record;
      },
      findMany: async () => [record],
      count: async () => 1,
      findFirst: async () => record,
    },
    user: { findFirst: async () => ({ id: 'user-1' }) },
    agent: { findFirst: async () => ({ id: 'agent-1' }) },
    skill: { findFirst: async () => ({ id: 'skill-1' }) },
    knowledgeBase: { findFirst: async () => ({ id: 'knowledge-1' }) },
    tool: { findFirst: async () => ({ id: 'tool-1' }) },
    promptTemplate: { findFirst: async () => ({ id: 'prompt-1' }) },
    $transaction: async (operations: Array<Promise<unknown>>) => Promise.all(operations),
  };
  const service = new RoleScenariosService(prisma as never);

  const created = await service.create(currentUser, {
    name: '售前方案交付场景包',
    code: 'sales_solution_delivery',
    role_name: '售前顾问',
    department_name: '解决方案部',
    scenario_type: 'SALES',
    status: 'READY',
    priority: 'HIGH',
    pain_point: '客户资料分散，售前方案反复返工。',
    business_goal: '将客户六问、资料检索、方案生成和验收材料串成标准场景包。',
    workflow_summary: '客户分层 -> 资料检索 -> 方案生成 -> 风险校验 -> 样板交付。',
    expected_outcome: '输出可复用的售前方案、风险清单和验收口径。',
    sample_deliverable: 'Markdown 方案包，包含客户画像、方案架构、引用来源、风险提示。',
    acceptance_criteria: '引用来源完整，关键风险有处理建议，输出格式符合交付模板。',
    roi_metric: '方案返工次数下降 30%，单次方案准备时间下降 40%。',
    tags: ['售前', '方案', '样板'],
    notes: '优先用于任务型客户试点。',
    agent_id: 'agent-1',
    skill_id: 'skill-1',
    knowledge_id: 'knowledge-1',
    tool_id: 'tool-1',
    prompt_id: 'prompt-1',
  });
  const list = await service.list(currentUser, { page: 1, page_size: 20, keyword: '售前' });
  const detail = await service.get(currentUser, 'scenario-1');

  assert.equal(getWrite(writes, 'roleScenario.create').tenantId, 'tenant-1');
  assert.equal(getWrite(writes, 'roleScenario.create').ownerId, 'user-1');
  assert.equal(getWrite(writes, 'roleScenario.create').impactScore, 93);
  assert.equal(created.name, '售前方案交付场景包');
  assert.equal(created.impact_score, 93);
  assert.equal(list.total, 1);
  assert.equal(list.items[0]?.name, '售前方案交付场景包');
  assert.equal(list.items[0]?.pain_point_preview, '客户资料分散，售前方案反复返工。');
  assert.equal(list.items[0]?.workflow_preview, '客户分层 -> 资料检索 -> 方案生成 -> 风险校验 -> 样板交付。');
  assert.equal(detail.linked_resources.agent?.name, '售前方案助手');
  assert.match(detail.acceptance_criteria, /引用来源完整/);
});

test('role scenarios reject bindings from another tenant or missing resources', async () => {
  const prisma = {
    roleScenario: {
      findFirst: async () => null,
    },
    user: { findFirst: async () => ({ id: 'user-1' }) },
    agent: { findFirst: async () => null },
    skill: { findFirst: async () => ({ id: 'skill-1' }) },
    knowledgeBase: { findFirst: async () => ({ id: 'knowledge-1' }) },
    tool: { findFirst: async () => ({ id: 'tool-1' }) },
    promptTemplate: { findFirst: async () => ({ id: 'prompt-1' }) },
  };
  const service = new RoleScenariosService(prisma as never);

  await assert.rejects(
    () =>
      service.create(currentUser, {
        name: '异常资源场景包',
        code: 'invalid_resource_scenario',
        role_name: '运营人员',
        department_name: '运营部',
        scenario_type: 'OPERATIONS',
        pain_point: '流程资料无法闭环。',
        business_goal: '打通资料整理与审核。',
        workflow_summary: '收集 -> 整理 -> 审核。',
        expected_outcome: '输出审核清单。',
        sample_deliverable: '审核表。',
        acceptance_criteria: '字段完整。',
        roi_metric: '审核耗时下降。',
        agent_id: 'missing-agent',
      }),
    BadRequestException,
  );
});

function getWrite(writes: Array<{ type: string; data: Record<string, unknown> }>, type: string) {
  const found = writes.find((write) => write.type === type);
  assert.ok(found, `missing write ${type}`);
  return found.data;
}
