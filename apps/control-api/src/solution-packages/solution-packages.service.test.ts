import assert from 'node:assert/strict';
import test from 'node:test';

import { BadRequestException } from '@nestjs/common';

import { SolutionPackagesService } from './solution-packages.service';

const currentUser = {
  id: 'user-1',
  tenantId: 'tenant-1',
  departmentId: 'dept-1',
  email: 'operator@example.test',
  roles: [],
  roleIds: [],
  permissions: [],
};

const createdAt = new Date('2026-05-09T14:00:00.000Z');

function packageRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'package-1',
    tenantId: 'tenant-1',
    ownerId: 'user-1',
    customerAssessmentId: 'assessment-1',
    roleScenarioId: 'scenario-1',
    name: '制造业 AI 落地试点方案包',
    code: 'manufacturing_ai_pilot',
    customerName: '华中智造集团',
    industry: '制造业',
    customerType: 'TASK',
    packageStage: 'PILOT_DESIGN',
    status: 'DRAFT',
    priority: 'HIGH',
    executiveSummary: '以任务型客户交付为目标，围绕售前资料、知识检索和方案标准化做首个可验收样板。',
    businessObjectives: '让历史资料稳定检索，方案产出标准化，并进入审核复盘闭环。',
    scopeSummary: '覆盖售前顾问、解决方案部和知识库检索场景。',
    scenarioBlueprint: '客户分层 -> 资料检索 -> 方案生成 -> 风险校验 -> 样板交付。',
    deliveryRoadmap: '第 1 周完成资料盘点；第 2 周完成场景包；第 3 周试点验收。',
    acceptancePlan: '样板成果包含引用来源、风险提示、验收清单和复盘记录。',
    roiSummary: '方案准备时间下降 40%，返工次数下降 30%。',
    riskMitigation: '先做只读检索和人工审核，避免高危工具直接进入生产。',
    commercialStrategy: '以小范围试点切入，验收通过后扩展到更多岗位。',
    nextMilestone: '完成试点资料清单和样板成果模板。',
    packageScore: 90,
    tags: ['制造业', '试点', '售前'],
    notes: '适合任务型客户。',
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
    customerAssessment: {
      id: 'assessment-1',
      customerName: '华中智造集团',
      customerType: 'TASK',
      decisionStage: 'EVALUATING',
      readinessScore: 84,
    },
    roleScenario: {
      id: 'scenario-1',
      name: '售前方案交付场景包',
      code: 'sales_solution_delivery',
      roleName: '售前顾问',
      departmentName: '解决方案部',
      impactScore: 93,
    },
    ...overrides,
  };
}

test('solution packages derive package score and keep list summaries compact', async () => {
  const writes: Array<{ type: string; data: Record<string, unknown> }> = [];
  const record = packageRecord();
  const prisma = {
    solutionPackage: {
      create: async (args: { data: Record<string, unknown> }) => {
        writes.push({ type: 'solutionPackage.create', data: args.data });
        return record;
      },
      findMany: async () => [record],
      count: async () => 1,
      findFirst: async () => record,
    },
    user: { findFirst: async () => ({ id: 'user-1' }) },
    customerAssessment: { findFirst: async () => ({ id: 'assessment-1' }) },
    roleScenario: { findFirst: async () => ({ id: 'scenario-1' }) },
    $transaction: async (operations: Array<Promise<unknown>>) => Promise.all(operations),
  };
  const service = new SolutionPackagesService(prisma as never);

  const created = await service.create(currentUser, {
    name: '制造业 AI 落地试点方案包',
    code: 'manufacturing_ai_pilot',
    customer_name: '华中智造集团',
    industry: '制造业',
    customer_type: 'TASK',
    package_stage: 'PILOT_DESIGN',
    status: 'DRAFT',
    priority: 'HIGH',
    executive_summary: '以任务型客户交付为目标，围绕售前资料、知识检索和方案标准化做首个可验收样板。',
    business_objectives: '让历史资料稳定检索，方案产出标准化，并进入审核复盘闭环。',
    scope_summary: '覆盖售前顾问、解决方案部和知识库检索场景。',
    scenario_blueprint: '客户分层 -> 资料检索 -> 方案生成 -> 风险校验 -> 样板交付。',
    delivery_roadmap: '第 1 周完成资料盘点；第 2 周完成场景包；第 3 周试点验收。',
    acceptance_plan: '样板成果包含引用来源、风险提示、验收清单和复盘记录。',
    roi_summary: '方案准备时间下降 40%，返工次数下降 30%。',
    risk_mitigation: '先做只读检索和人工审核，避免高危工具直接进入生产。',
    commercial_strategy: '以小范围试点切入，验收通过后扩展到更多岗位。',
    next_milestone: '完成试点资料清单和样板成果模板。',
    tags: ['制造业', '试点', '售前'],
    customer_assessment_id: 'assessment-1',
    role_scenario_id: 'scenario-1',
  });
  const list = await service.list(currentUser, { page: 1, page_size: 20, keyword: '制造业' });
  const detail = await service.get(currentUser, 'package-1');

  assert.equal(getWrite(writes, 'solutionPackage.create').tenantId, 'tenant-1');
  assert.equal(getWrite(writes, 'solutionPackage.create').ownerId, 'user-1');
  assert.equal(getWrite(writes, 'solutionPackage.create').packageScore, 90);
  assert.equal(created.package_score, 90);
  assert.equal(list.total, 1);
  assert.equal(list.items[0]?.name, '制造业 AI 落地试点方案包');
  assert.equal(list.items[0]?.executive_summary_preview, '以任务型客户交付为目标，围绕售前资料、知识检索和方案标准化做首个可验收样板。');
  assert.equal(list.items[0]?.roadmap_preview, '第 1 周完成资料盘点；第 2 周完成场景包；第 3 周试点验收。');
  assert.equal(detail.linked_resources.customer_assessment?.customer_name, '华中智造集团');
  assert.match(detail.acceptance_plan, /引用来源/);
});

test('solution packages reject bindings from another tenant or missing resources', async () => {
  const prisma = {
    solutionPackage: {
      findFirst: async () => null,
    },
    user: { findFirst: async () => ({ id: 'user-1' }) },
    customerAssessment: { findFirst: async () => null },
    roleScenario: { findFirst: async () => ({ id: 'scenario-1' }) },
  };
  const service = new SolutionPackagesService(prisma as never);

  await assert.rejects(
    () =>
      service.create(currentUser, {
        name: '异常方案包',
        code: 'invalid_solution_package',
        customer_name: '异常客户',
        customer_type: 'UNKNOWN',
        package_stage: 'DISCOVERY',
        executive_summary: '缺少有效客户评估。',
        business_objectives: '验证资源校验。',
        scope_summary: '测试范围。',
        scenario_blueprint: '测试流程。',
        delivery_roadmap: '测试路线。',
        acceptance_plan: '测试验收。',
        roi_summary: '测试 ROI。',
        risk_mitigation: '测试风险。',
        commercial_strategy: '测试策略。',
        next_milestone: '测试里程碑。',
        customer_assessment_id: 'missing-assessment',
      }),
    BadRequestException,
  );
});

function getWrite(writes: Array<{ type: string; data: Record<string, unknown> }>, type: string) {
  const found = writes.find((write) => write.type === type);
  assert.ok(found, `missing write ${type}`);
  return found.data;
}
