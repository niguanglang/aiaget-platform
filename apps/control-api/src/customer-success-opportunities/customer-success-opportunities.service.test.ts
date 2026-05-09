import assert from 'node:assert/strict';
import test from 'node:test';

import { BadRequestException } from '@nestjs/common';

import { CustomerSuccessOpportunitiesService } from './customer-success-opportunities.service';

const currentUser = {
  id: 'user-1',
  tenantId: 'tenant-1',
  departmentId: 'dept-1',
  email: 'operator@example.test',
  roles: [],
  roleIds: [],
  permissions: [],
};

const createdAt = new Date('2026-05-09T21:00:00.000Z');

function opportunityRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'opportunity-1',
    tenantId: 'tenant-1',
    ownerId: 'user-1',
    customerSuccessPlanId: 'plan-1',
    customerSuccessActionId: 'action-1',
    deliveryReviewId: 'review-1',
    deliveryAssetId: 'asset-1',
    solutionPackageId: 'package-1',
    name: '华中设计院二期续约扩展机会',
    code: 'huazhong_design_renewal_expansion',
    customerName: '华中设计院',
    opportunityType: 'EXPANSION',
    stage: 'PROPOSAL',
    status: 'OPEN',
    priority: 'HIGH',
    confidenceLevel: 'HIGH',
    riskLevel: 'MEDIUM',
    opportunityScore: 92,
    estimatedAmount: '680000.00',
    probability: 75,
    expectedCloseAt: new Date('2026-07-20T10:00:00.000Z'),
    closedAt: null,
    opportunitySummary: '基于试点验收和成功行动，推进第二批岗位场景扩展与年度续约。',
    customerValue: '复用已验收资产，覆盖更多业务岗位，降低二期交付风险。',
    commercialStrategy: '以续约为主线，绑定二期扩展场景和年度服务包。',
    decisionPath: 'CIO 确认技术价值，运营负责人确认推广节奏，采购负责人确认商务条款。',
    riskSummary: '预算窗口和知识库密级审批可能影响签约节奏。',
    nextAction: '准备二期扩展报价单并约定商务评审会。',
    lossReason: null,
    tags: ['续约', '扩展', '客户成功'],
    notes: 'M126 默认样板。',
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
    createdBy: 'user-1',
    updatedBy: 'user-1',
    owner: {
      id: 'user-1',
      name: '客户成功经理',
      email: 'operator@example.test',
    },
    customerSuccessPlan: {
      id: 'plan-1',
      name: '华中设计院客户成功扩展计划',
      code: 'huazhong_design_success_expansion',
      customerName: '华中设计院',
      planStage: 'EXPANSION_DESIGN',
      status: 'ACTIVE',
      priority: 'HIGH',
      healthLevel: 'HIGH',
      successScore: 88,
    },
    customerSuccessAction: {
      id: 'action-1',
      name: '第二批岗位场景扩展评审会',
      code: 'huazhong_design_expansion_review',
      customerName: '华中设计院',
      actionType: 'MEETING',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      riskLevel: 'MEDIUM',
      actionScore: 86,
    },
    deliveryReview: {
      id: 'review-1',
      name: '华中设计院试点验收复盘',
      code: 'huazhong_design_pilot_review',
      customerName: '华中设计院',
      result: 'PASSED',
      status: 'COMPLETED',
      acceptanceScore: 95,
    },
    deliveryAsset: {
      id: 'asset-1',
      name: '售前方案验收资产包',
      code: 'sales_solution_acceptance_asset',
      customerName: '华中设计院',
      assetType: 'SOLUTION_TEMPLATE',
      status: 'PUBLISHED',
      reuseScore: 92,
    },
    solutionPackage: {
      id: 'package-1',
      name: '华中设计院 AI 落地试点方案包',
      code: 'huazhong_design_ai_pilot',
      customerName: '华中设计院',
      packageStage: 'PILOT_DESIGN',
      status: 'APPROVED',
      packageScore: 94,
    },
    ...overrides,
  };
}

test('customer success opportunities derive score and keep list summaries compact', async () => {
  const writes: Array<{ type: string; data: Record<string, unknown> }> = [];
  const record = opportunityRecord();
  const prisma = {
    customerSuccessOpportunity: {
      create: async (args: { data: Record<string, unknown> }) => {
        writes.push({ type: 'customerSuccessOpportunity.create', data: args.data });
        return record;
      },
      findMany: async () => [record],
      count: async () => 1,
      findFirst: async () => record,
    },
    user: { findFirst: async () => ({ id: 'user-1' }) },
    customerSuccessPlan: {
      findFirst: async () => ({
        id: 'plan-1',
        customerName: '华中设计院',
        deliveryReviewId: 'review-1',
        deliveryAssetId: 'asset-1',
        solutionPackageId: 'package-1',
      }),
    },
    customerSuccessAction: {
      findFirst: async () => ({
        id: 'action-1',
        customerSuccessPlanId: 'plan-1',
        deliveryReviewId: 'review-1',
        deliveryAssetId: 'asset-1',
        solutionPackageId: 'package-1',
      }),
    },
    deliveryReview: { findFirst: async () => ({ id: 'review-1', solutionPackageId: 'package-1' }) },
    deliveryAsset: { findFirst: async () => ({ id: 'asset-1', solutionPackageId: 'package-1', deliveryReviewId: 'review-1' }) },
    solutionPackage: { findFirst: async () => ({ id: 'package-1' }) },
    $transaction: async (operations: Array<Promise<unknown>>) => Promise.all(operations),
  };
  const service = new CustomerSuccessOpportunitiesService(prisma as never);

  const created = await service.create(currentUser, {
    name: '华中设计院二期续约扩展机会',
    code: 'huazhong_design_renewal_expansion',
    customer_name: '华中设计院',
    customer_success_plan_id: 'plan-1',
    customer_success_action_id: 'action-1',
    delivery_review_id: 'review-1',
    delivery_asset_id: 'asset-1',
    solution_package_id: 'package-1',
    opportunity_type: 'EXPANSION',
    stage: 'PROPOSAL',
    status: 'OPEN',
    priority: 'HIGH',
    confidence_level: 'HIGH',
    risk_level: 'MEDIUM',
    estimated_amount: 680000,
    probability: 75,
    expected_close_at: '2026-07-20T10:00:00.000Z',
    opportunity_summary: '基于试点验收和成功行动，推进第二批岗位场景扩展与年度续约。',
    customer_value: '复用已验收资产，覆盖更多业务岗位，降低二期交付风险。',
    commercial_strategy: '以续约为主线，绑定二期扩展场景和年度服务包。',
    decision_path: 'CIO 确认技术价值，运营负责人确认推广节奏，采购负责人确认商务条款。',
    risk_summary: '预算窗口和知识库密级审批可能影响签约节奏。',
    next_action: '准备二期扩展报价单并约定商务评审会。',
    tags: ['续约', '扩展', '客户成功'],
  });
  const list = await service.list(currentUser, { page: 1, page_size: 20, keyword: '续约' });
  const detail = await service.get(currentUser, 'opportunity-1');

  assert.equal(getWrite(writes, 'customerSuccessOpportunity.create').tenantId, 'tenant-1');
  assert.equal(getWrite(writes, 'customerSuccessOpportunity.create').ownerId, 'user-1');
  assert.equal(getWrite(writes, 'customerSuccessOpportunity.create').opportunityScore, 92);
  assert.equal(created.opportunity_score, 92);
  assert.equal(list.total, 1);
  assert.equal(list.items[0]?.name, '华中设计院二期续约扩展机会');
  assert.equal(list.items[0]?.opportunity_summary_preview, '基于试点验收和成功行动，推进第二批岗位场景扩展与年度续约。');
  assert.equal(list.items[0]?.next_action_preview, '准备二期扩展报价单并约定商务评审会。');
  assert.equal(detail.linked_resources.customer_success_plan?.name, '华中设计院客户成功扩展计划');
  assert.equal(detail.linked_resources.customer_success_action?.name, '第二批岗位场景扩展评审会');
  assert.equal(detail.linked_resources.delivery_review?.name, '华中设计院试点验收复盘');
  assert.equal(detail.linked_resources.delivery_asset?.name, '售前方案验收资产包');
  assert.equal(detail.linked_resources.solution_package?.name, '华中设计院 AI 落地试点方案包');
  assert.match(detail.commercial_strategy, /年度服务包/);
});

test('customer success opportunities reject action bindings outside the selected plan chain', async () => {
  const prisma = {
    customerSuccessOpportunity: {
      findFirst: async () => null,
    },
    user: { findFirst: async () => ({ id: 'user-1' }) },
    customerSuccessPlan: {
      findFirst: async () => ({
        id: 'plan-1',
        customerName: '华中设计院',
        deliveryReviewId: 'review-1',
        deliveryAssetId: 'asset-1',
        solutionPackageId: 'package-1',
      }),
    },
    customerSuccessAction: {
      findFirst: async () => ({
        id: 'other-action',
        customerSuccessPlanId: 'other-plan',
        deliveryReviewId: 'review-1',
        deliveryAssetId: 'asset-1',
        solutionPackageId: 'package-1',
      }),
    },
    deliveryReview: { findFirst: async () => ({ id: 'review-1', solutionPackageId: 'package-1' }) },
    deliveryAsset: { findFirst: async () => ({ id: 'asset-1', solutionPackageId: 'package-1', deliveryReviewId: 'review-1' }) },
    solutionPackage: { findFirst: async () => ({ id: 'package-1' }) },
  };
  const service = new CustomerSuccessOpportunitiesService(prisma as never);

  await assert.rejects(
    () =>
      service.create(currentUser, {
        name: '异常续约机会',
        code: 'invalid_success_opportunity',
        customer_name: '华中设计院',
        customer_success_plan_id: 'plan-1',
        customer_success_action_id: 'other-action',
        delivery_review_id: 'review-1',
        delivery_asset_id: 'asset-1',
        solution_package_id: 'package-1',
        opportunity_type: 'RENEWAL',
        stage: 'DISCOVERY',
        status: 'OPEN',
        priority: 'MEDIUM',
        confidence_level: 'MEDIUM',
        risk_level: 'LOW',
        estimated_amount: 300000,
        probability: 50,
        opportunity_summary: '测试机会。',
        customer_value: '测试价值。',
        commercial_strategy: '测试策略。',
        decision_path: '测试决策链。',
        risk_summary: '测试风险。',
        next_action: '测试下一步。',
      }),
    BadRequestException,
  );
});

function getWrite(writes: Array<{ type: string; data: Record<string, unknown> }>, type: string) {
  const found = writes.find((write) => write.type === type);
  assert.ok(found, `missing write ${type}`);
  return found.data;
}
