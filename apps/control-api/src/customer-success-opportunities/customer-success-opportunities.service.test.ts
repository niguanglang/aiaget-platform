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

function followUpActionRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'follow-up-action-1',
    tenantId: 'tenant-1',
    ownerId: 'user-1',
    customerSuccessPlanId: 'plan-1',
    deliveryReviewId: 'review-1',
    deliveryAssetId: 'asset-1',
    solutionPackageId: 'package-1',
    name: '华中设计院二期续约推进跟进行动',
    code: 'huazhong_design_renewal_expansion_follow_up_test',
    customerName: '华中设计院',
    actionType: 'RENEWAL',
    status: 'TODO',
    priority: 'HIGH',
    riskLevel: 'MEDIUM',
    actionScore: 84,
    actionSummary: '围绕续约机会推进下一次商务评审，明确客户价值、预算窗口和签约路径。',
    expectedOutcome: '形成客户确认的续约推进计划和下一轮商务动作。',
    executionNotes: '由续约机会自动生成，等待负责人补充执行记录。',
    blockerSummary: '预算窗口和知识库密级审批可能影响签约节奏。',
    completionEvidence: '待补充会议纪要、报价材料、客户确认记录或续约文件。',
    nextAction: '准备二期扩展报价单并约定商务评审会。',
    dueAt: new Date('2026-07-13T10:00:00.000Z'),
    completedAt: null,
    tags: ['续约', '扩展', '客户成功', '机会跟进'],
    notes: '由续约机会 huazhong_design_renewal_expansion 自动生成。',
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

function billingAdjustmentRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'billing-adjustment-1',
    tenantId: 'tenant-1',
    invoiceId: null,
    adjustmentNo: 'ADJ-20260718-0001',
    type: 'DEBIT',
    status: 'APPLIED',
    currency: 'USD',
    amount: '680000.00',
    reason: '续约机会成交入账：华中设计院二期续约扩展机会',
    description: '客户已确认二期续约扩展合同，进入商务入账。',
    effectiveAt: new Date('2026-07-18T10:00:00.000Z'),
    approvedAt: new Date('2026-07-18T10:00:00.000Z'),
    approvedBy: 'user-1',
    sourceType: 'CUSTOMER_SUCCESS_OPPORTUNITY',
    sourceId: 'opportunity-1',
    metadata: {
      opportunity_id: 'opportunity-1',
      opportunity_code: 'huazhong_design_renewal_expansion',
    },
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
    createdBy: 'user-1',
    updatedBy: 'user-1',
    invoice: null,
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
    billingAdjustment: {
      findMany: async () => [],
    },
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

test('customer success opportunity can create and bind a follow-up customer success action', async () => {
  const writes: Array<{ type: string; data: Record<string, unknown> }> = [];
  const action = followUpActionRecord();
  const updatedOpportunity = opportunityRecord({
    customerSuccessActionId: 'follow-up-action-1',
    customerSuccessAction: {
      id: 'follow-up-action-1',
      name: '华中设计院二期续约推进跟进行动',
      code: 'huazhong_design_renewal_expansion_follow_up_test',
      customerName: '华中设计院',
      actionType: 'RENEWAL',
      status: 'TODO',
      priority: 'HIGH',
      riskLevel: 'MEDIUM',
      actionScore: 84,
    },
  });
  const prisma = {
    customerSuccessOpportunity: {
      findFirst: async () =>
        opportunityRecord({
          customerSuccessActionId: null,
          customerSuccessAction: null,
        }),
      update: async (args: { data: Record<string, unknown> }) => {
        writes.push({ type: 'customerSuccessOpportunity.update', data: args.data });
        return updatedOpportunity;
      },
    },
    customerSuccessAction: {
      create: async (args: { data: Record<string, unknown> }) => {
        writes.push({ type: 'customerSuccessAction.create', data: args.data });
        return action;
      },
    },
    user: { findFirst: async () => ({ id: 'user-1' }) },
  };
  const service = new CustomerSuccessOpportunitiesService(prisma as never);

  const result = await service.createFollowUpAction(currentUser, 'opportunity-1', {
    due_at: '2026-07-13T10:00:00.000Z',
  });

  const createData = getWrite(writes, 'customerSuccessAction.create');
  assert.equal(createData.tenantId, 'tenant-1');
  assert.equal(createData.customerSuccessPlanId, 'plan-1');
  assert.equal(createData.deliveryReviewId, 'review-1');
  assert.equal(createData.deliveryAssetId, 'asset-1');
  assert.equal(createData.solutionPackageId, 'package-1');
  assert.equal(createData.ownerId, 'user-1');
  assert.equal(createData.customerName, '华中设计院');
  assert.equal(createData.actionType, 'RENEWAL');
  assert.equal(createData.priority, 'HIGH');
  assert.equal(createData.riskLevel, 'MEDIUM');
  assert.match(String(createData.code), /^huazhong_design_renewal_expansion_follow_up_/);
  assert.match(String(createData.actionSummary), /华中设计院二期续约扩展机会/);
  assert.match(String(createData.blockerSummary), /预算窗口/);
  assert.deepEqual(createData.tags, ['续约', '扩展', '客户成功', '机会跟进']);
  const updateData = getWrite(writes, 'customerSuccessOpportunity.update');
  const actionBinding = updateData.customerSuccessAction as { connect?: { id?: string } } | undefined;
  assert.equal(actionBinding?.connect?.id, 'follow-up-action-1');
  assert.equal(result.action.id, 'follow-up-action-1');
  assert.equal(result.action.action_type, 'RENEWAL');
  assert.equal(result.opportunity.linked_resources.customer_success_action?.id, 'follow-up-action-1');
});

test('customer success opportunity rejects duplicate follow-up action creation when an action is already bound', async () => {
  const writes: Array<{ type: string; data: Record<string, unknown> }> = [];
  const prisma = {
    customerSuccessOpportunity: {
      findFirst: async () => opportunityRecord(),
      update: async (args: { data: Record<string, unknown> }) => {
        writes.push({ type: 'customerSuccessOpportunity.update', data: args.data });
        return opportunityRecord();
      },
    },
    customerSuccessAction: {
      create: async (args: { data: Record<string, unknown> }) => {
        writes.push({ type: 'customerSuccessAction.create', data: args.data });
        return followUpActionRecord();
      },
    },
    user: { findFirst: async () => ({ id: 'user-1' }) },
  };
  const service = new CustomerSuccessOpportunitiesService(prisma as never);

  await assert.rejects(
    () => service.createFollowUpAction(currentUser, 'opportunity-1', {}),
    BadRequestException,
  );
  assert.deepEqual(writes, []);
});

test('customer success opportunity can close won and create a billing adjustment source record', async () => {
  const writes: Array<{ type: string; data: Record<string, unknown> }> = [];
  const billingAdjustment = billingAdjustmentRecord();
  const updatedOpportunity = opportunityRecord({
    stage: 'WON',
    status: 'WON',
    probability: 100,
    closedAt: new Date('2026-07-18T10:00:00.000Z'),
  });
  const prisma = {
    customerSuccessOpportunity: {
      findFirst: async () => opportunityRecord({
        customerSuccessActionId: 'follow-up-action-1',
        stage: 'NEGOTIATION',
        status: 'OPEN',
      }),
      update: async (args: { data: Record<string, unknown> }) => {
        writes.push({ type: 'customerSuccessOpportunity.update', data: args.data });
        return updatedOpportunity;
      },
    },
    billingAdjustment: {
      count: async () => 0,
      findFirst: async () => null,
      create: async (args: { data: Record<string, unknown> }) => {
        writes.push({ type: 'billingAdjustment.create', data: args.data });
        return billingAdjustment;
      },
    },
  };
  const service = new CustomerSuccessOpportunitiesService(prisma as never);

  const result = await service.closeWonAdjustment(currentUser, 'opportunity-1', {
    amount: 680000,
    reason: '客户已确认二期续约扩展合同，进入商务入账。',
    closed_at: '2026-07-18T10:00:00.000Z',
  });

  const adjustmentData = getWrite(writes, 'billingAdjustment.create');
  assert.equal(adjustmentData.tenantId, 'tenant-1');
  assert.equal(adjustmentData.type, 'DEBIT');
  assert.equal(adjustmentData.status, 'APPLIED');
  assert.equal(Number(adjustmentData.amount), 680000);
  assert.equal(adjustmentData.sourceType, 'CUSTOMER_SUCCESS_OPPORTUNITY');
  assert.equal(adjustmentData.sourceId, 'opportunity-1');
  assert.match(String(adjustmentData.reason), /华中设计院二期续约扩展机会/);
  const opportunityData = getWrite(writes, 'customerSuccessOpportunity.update');
  assert.equal(opportunityData.stage, 'WON');
  assert.equal(opportunityData.status, 'WON');
  assert.equal(opportunityData.probability, 100);
  assert.equal(result.opportunity.stage, 'WON');
  assert.equal(result.adjustment.id, 'billing-adjustment-1');
  assert.equal(result.adjustment.source_type, 'CUSTOMER_SUCCESS_OPPORTUNITY');
});

test('customer success opportunity detail includes source billing adjustments for reverse trace', async () => {
  const billingAdjustment = billingAdjustmentRecord({
    adjustmentNo: 'ADJ-20260718-0002',
    reason: '续约机会成交入账：华中设计院二期续约扩展机会',
  });
  const prisma = {
    customerSuccessOpportunity: {
      findFirst: async () => opportunityRecord({
        stage: 'WON',
        status: 'WON',
        closedAt: new Date('2026-07-18T10:00:00.000Z'),
      }),
    },
    billingAdjustment: {
      findMany: async (args: { where: Record<string, unknown>; include: Record<string, boolean>; orderBy: Record<string, string> }) => {
        assert.equal(args.where.tenantId, 'tenant-1');
        assert.equal(args.where.sourceType, 'CUSTOMER_SUCCESS_OPPORTUNITY');
        assert.equal(args.where.sourceId, 'opportunity-1');
        assert.equal(args.where.deletedAt, null);
        assert.equal(args.include.invoice, true);
        assert.deepEqual(args.orderBy, { createdAt: 'desc' });
        return [billingAdjustment];
      },
    },
  };
  const service = new CustomerSuccessOpportunitiesService(prisma as never);

  const detail = await service.get(currentUser, 'opportunity-1');

  assert.equal(detail.billing_adjustments.length, 1);
  assert.equal(detail.billing_adjustments[0]?.adjustment_no, 'ADJ-20260718-0002');
  assert.equal(detail.billing_adjustments[0]?.source_type, 'CUSTOMER_SUCCESS_OPPORTUNITY');
  assert.equal(detail.billing_adjustments[0]?.source_id, 'opportunity-1');
});

test('customer success opportunity rejects duplicate close won billing adjustment creation', async () => {
  const prisma = {
    customerSuccessOpportunity: {
      findFirst: async () => opportunityRecord({
        stage: 'WON',
        status: 'WON',
        closedAt: new Date('2026-07-18T10:00:00.000Z'),
      }),
    },
    billingAdjustment: {
      findFirst: async () => billingAdjustmentRecord(),
    },
  };
  const service = new CustomerSuccessOpportunitiesService(prisma as never);

  await assert.rejects(
    () => service.closeWonAdjustment(currentUser, 'opportunity-1', { amount: 680000 }),
    BadRequestException,
  );
});

test('customer success opportunity analytics aggregate funnel, risk and upcoming close opportunities', async () => {
  const records = [
    opportunityRecord({
      id: 'opportunity-proposal',
      name: 'A 客户二期扩展机会',
      code: 'a_expansion',
      customerName: 'A 客户',
      opportunityType: 'EXPANSION',
      stage: 'PROPOSAL',
      status: 'OPEN',
      riskLevel: 'LOW',
      opportunityScore: 90,
      estimatedAmount: '600000.00',
      probability: 70,
      expectedCloseAt: new Date('2026-06-10T10:00:00.000Z'),
    }),
    opportunityRecord({
      id: 'opportunity-risk',
      name: 'B 客户风险挽留机会',
      code: 'b_risk_save',
      customerName: 'B 客户',
      opportunityType: 'RISK_SAVE',
      stage: 'NEGOTIATION',
      status: 'AT_RISK',
      riskLevel: 'HIGH',
      opportunityScore: 58,
      estimatedAmount: '400000.00',
      probability: 50,
      expectedCloseAt: new Date('2026-05-20T10:00:00.000Z'),
    }),
    opportunityRecord({
      id: 'opportunity-won',
      name: 'C 客户续约赢单机会',
      code: 'c_renewal_won',
      customerName: 'C 客户',
      opportunityType: 'RENEWAL',
      stage: 'WON',
      status: 'WON',
      riskLevel: 'LOW',
      opportunityScore: 96,
      estimatedAmount: '800000.00',
      probability: 100,
      expectedCloseAt: new Date('2026-04-01T10:00:00.000Z'),
      closedAt: new Date('2026-04-03T10:00:00.000Z'),
    }),
    opportunityRecord({
      id: 'opportunity-lost',
      name: 'D 客户交叉销售输单机会',
      code: 'd_cross_sell_lost',
      customerName: 'D 客户',
      opportunityType: 'CROSS_SELL',
      stage: 'LOST',
      status: 'LOST',
      riskLevel: 'MEDIUM',
      opportunityScore: 40,
      estimatedAmount: '200000.00',
      probability: 20,
      expectedCloseAt: new Date('2026-03-01T10:00:00.000Z'),
      closedAt: new Date('2026-03-15T10:00:00.000Z'),
    }),
  ];
  const prisma = {
    customerSuccessOpportunity: {
      findMany: async () => records,
    },
  };
  const dataScopeQuery = {
    buildWhere: async () => ({
      applied: true,
      reason: '测试数据范围',
      where: { ownerId: 'user-1' },
    }),
  };
  const service = new CustomerSuccessOpportunitiesService(prisma as never, dataScopeQuery as never);

  const analytics = await service.analytics(currentUser);

  assert.equal(analytics.summary.total_count, 4);
  assert.equal(analytics.summary.open_count, 1);
  assert.equal(analytics.summary.at_risk_count, 1);
  assert.equal(analytics.summary.won_count, 1);
  assert.equal(analytics.summary.lost_count, 1);
  assert.equal(analytics.summary.total_estimated_amount, 2000000);
  assert.equal(analytics.summary.weighted_amount, 1460000);
  assert.equal(analytics.summary.average_probability, 60);
  assert.equal(analytics.summary.average_score, 71);
  assert.equal(analytics.summary.conversion_rate, 50);
  assert.equal(analytics.summary.risk_rate, 25);
  assert.equal(analytics.stage_funnel.find((item) => item.stage === 'PROPOSAL')?.count, 1);
  assert.equal(analytics.stage_funnel.find((item) => item.stage === 'WON')?.amount, 800000);
  assert.equal(analytics.type_breakdown.find((item) => item.key === 'RISK_SAVE')?.count, 1);
  assert.equal(analytics.risk_breakdown.find((item) => item.key === 'HIGH')?.weighted_amount, 200000);
  assert.equal(analytics.top_opportunities[0]?.id, 'opportunity-won');
  assert.deepEqual(
    analytics.upcoming_closes.map((item) => item.id),
    ['opportunity-risk', 'opportunity-proposal'],
  );
});

function getWrite(writes: Array<{ type: string; data: Record<string, unknown> }>, type: string) {
  const found = writes.find((write) => write.type === type);
  assert.ok(found, `missing write ${type}`);
  return found.data;
}
