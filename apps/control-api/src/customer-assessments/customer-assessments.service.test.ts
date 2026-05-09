import assert from 'node:assert/strict';
import test from 'node:test';

import { CustomerAssessmentsService } from './customer-assessments.service';

const currentUser = {
  id: 'user-1',
  tenantId: 'tenant-1',
  departmentId: 'dept-1',
  email: 'operator@example.test',
  roles: [],
  roleIds: [],
  permissions: [],
};

test('customer assessments classify readiness from six questions and keep list summaries compact', async () => {
  const writes: Array<{ type: string; data: Record<string, unknown> }> = [];
  const createdAt = new Date('2026-05-09T10:00:00.000Z');
  const assessmentRecord = {
    id: 'assessment-1',
    tenantId: 'tenant-1',
    ownerId: 'user-1',
    customerName: '华中设计院',
    customerType: 'TASK_DRIVEN',
    decisionStage: 'PROCUREMENT',
    status: 'QUALIFIED',
    industry: '设计院',
    contactName: '李总',
    contactInfo: 'li@example.test',
    businessGoal: '降低方案返工并确保资料引用可信。',
    processMaturity: '已有投标与方案评审流程。',
    dataAssetStatus: '历史方案、规范和项目资料较完整。',
    managementSupport: '院领导推动，预算已预留。',
    budgetSignal: '预算明确，等待验收方案。',
    sixQuestionScores: {
      customer_type_clarity: 5,
      decision_intent: 5,
      business_goal: 4,
      process_maturity: 4,
      data_assets: 5,
      management_budget: 5,
    },
    readinessScore: 93,
    recommendedStrategy: '任务型客户：优先准备安全、合规、交付和验收材料，快速进入样板成果。',
    riskSummary: '需要提前确认数据不出域、权限边界和验收口径。',
    nextAction: '补齐合规方案并安排样板知识库检索演示。',
    notes: '从讲义六问判断看，客户已进入采购决策。',
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
  };
  const prisma = {
    customerAssessment: {
      create: async (args: { data: Record<string, unknown> }) => {
        writes.push({ type: 'customerAssessment.create', data: args.data });
        return assessmentRecord;
      },
      findMany: async () => [assessmentRecord],
      count: async () => 1,
      findFirst: async () => assessmentRecord,
    },
    user: {
      findFirst: async () => ({ id: 'user-1' }),
    },
    $transaction: async (operations: Array<Promise<unknown>>) => Promise.all(operations),
  };
  const service = new CustomerAssessmentsService(prisma as never);

  const created = await service.create(currentUser, {
    customer_name: '华中设计院',
    customer_type: 'TASK_DRIVEN',
    decision_stage: 'PROCUREMENT',
    industry: '设计院',
    contact_name: '李总',
    contact_info: 'li@example.test',
    business_goal: '降低方案返工并确保资料引用可信。',
    process_maturity: '已有投标与方案评审流程。',
    data_asset_status: '历史方案、规范和项目资料较完整。',
    management_support: '院领导推动，预算已预留。',
    budget_signal: '预算明确，等待验收方案。',
    six_question_scores: {
      customer_type_clarity: 5,
      decision_intent: 5,
      business_goal: 4,
      process_maturity: 4,
      data_assets: 5,
      management_budget: 5,
    },
    risk_summary: '需要提前确认数据不出域、权限边界和验收口径。',
    next_action: '补齐合规方案并安排样板知识库检索演示。',
    notes: '从讲义六问判断看，客户已进入采购决策。',
  });
  const list = await service.list(currentUser, { page: 1, page_size: 20, keyword: '设计院' });
  const detail = await service.get(currentUser, 'assessment-1');

  assert.equal(getWrite(writes, 'customerAssessment.create').tenantId, 'tenant-1');
  assert.equal(getWrite(writes, 'customerAssessment.create').ownerId, 'user-1');
  assert.equal(getWrite(writes, 'customerAssessment.create').readinessScore, 93);
  assert.match(String(getWrite(writes, 'customerAssessment.create').recommendedStrategy), /任务型客户/);
  assert.equal(created.customer_name, '华中设计院');
  assert.equal(created.readiness_score, 93);
  assert.equal(list.total, 1);
  assert.equal(list.items[0]?.customer_name, '华中设计院');
  assert.equal(list.items[0]?.business_goal_preview, '降低方案返工并确保资料引用可信。');
  assert.equal(detail.six_question_scores.data_assets, 5);
  assert.match(detail.recommended_strategy, /合规/);
});

test('customer assessments update recalculates readiness score and strategy', async () => {
  const createdAt = new Date('2026-05-09T10:30:00.000Z');
  let assessmentRecord = {
    id: 'assessment-1',
    tenantId: 'tenant-1',
    ownerId: 'user-1',
    customerName: '制造企业 A',
    customerType: 'ANXIOUS',
    decisionStage: 'LEARNING',
    status: 'DISCOVERY',
    industry: '制造业',
    contactName: null,
    contactInfo: null,
    businessGoal: '想全面拥抱 AI。',
    processMaturity: '流程还未拆清。',
    dataAssetStatus: '资料分散。',
    managementSupport: '老板关注。',
    budgetSignal: '暂无明确预算。',
    sixQuestionScores: {
      customer_type_clarity: 3,
      decision_intent: 2,
      business_goal: 2,
      process_maturity: 2,
      data_assets: 2,
      management_budget: 2,
    },
    readinessScore: 43,
    recommendedStrategy: '焦虑型客户：先培训、轻咨询和样板成果，不要过早投入大项目资源。',
    riskSummary: '需求不清。',
    nextAction: '先做管理层培训。',
    notes: null,
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
    createdBy: 'user-1',
    updatedBy: 'user-1',
    owner: null,
  };
  const writes: Array<{ type: string; data: Record<string, unknown> }> = [];
  const prisma = {
    customerAssessment: {
      findFirst: async () => assessmentRecord,
      update: async (args: { data: Record<string, unknown> }) => {
        writes.push({ type: 'customerAssessment.update', data: args.data });
        assessmentRecord = { ...assessmentRecord, ...args.data };
        return assessmentRecord;
      },
    },
    user: {
      findFirst: async () => ({ id: 'user-1' }),
    },
  };
  const service = new CustomerAssessmentsService(prisma as never);

  const result = await service.update(currentUser, 'assessment-1', {
    customer_type: 'CLEAR',
    decision_stage: 'PILOT',
    six_question_scores: {
      customer_type_clarity: 5,
      decision_intent: 4,
      business_goal: 5,
      process_maturity: 4,
      data_assets: 4,
      management_budget: 4,
    },
  });

  assert.equal(getWrite(writes, 'customerAssessment.update').readinessScore, 87);
  assert.match(String(getWrite(writes, 'customerAssessment.update').recommendedStrategy), /清醒型客户/);
  assert.equal(result.customer_type, 'CLEAR');
  assert.equal(result.readiness_score, 87);
});

function getWrite(writes: Array<{ type: string; data: Record<string, unknown> }>, type: string) {
  const found = writes.find((write) => write.type === type);
  assert.ok(found, `missing write ${type}`);
  return found.data;
}
