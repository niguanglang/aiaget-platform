import assert from 'node:assert/strict';
import test from 'node:test';

import { BadRequestException } from '@nestjs/common';

import { CustomerSuccessActionsService } from './customer-success-actions.service';

const currentUser = {
  id: 'user-1',
  tenantId: 'tenant-1',
  departmentId: 'dept-1',
  email: 'operator@example.test',
  roles: [],
  roleIds: [],
  permissions: [],
};

const createdAt = new Date('2026-05-09T20:00:00.000Z');

function actionRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'action-1',
    tenantId: 'tenant-1',
    ownerId: 'user-1',
    customerSuccessPlanId: 'plan-1',
    deliveryReviewId: 'review-1',
    deliveryAssetId: 'asset-1',
    solutionPackageId: 'package-1',
    name: '第二批岗位场景扩展评审会',
    code: 'huazhong_design_expansion_review',
    customerName: '华中设计院',
    actionType: 'MEETING',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    riskLevel: 'MEDIUM',
    actionScore: 86,
    actionSummary: '组织客户 CIO、运营经理和平台客户成功经理确认第二批岗位场景。',
    expectedOutcome: '明确扩展场景、资料边界、验收节奏和复用资产清单。',
    executionNotes: '已完成会议议程和资料清单准备。',
    blockerSummary: '知识库密级边界仍需安全管理员确认。',
    completionEvidence: '会议纪要和二批场景清单将归档到成果资产。',
    nextAction: '发送评审会议邀请并确认参会人。',
    dueAt: new Date('2026-06-18T10:00:00.000Z'),
    completedAt: null,
    tags: ['客户成功', '行动', '扩展'],
    notes: 'M125 默认样板。',
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

test('customer success actions derive score and keep list summaries compact', async () => {
  const writes: Array<{ type: string; data: Record<string, unknown> }> = [];
  const record = actionRecord();
  const prisma = {
    customerSuccessAction: {
      create: async (args: { data: Record<string, unknown> }) => {
        writes.push({ type: 'customerSuccessAction.create', data: args.data });
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
    deliveryReview: { findFirst: async () => ({ id: 'review-1', solutionPackageId: 'package-1' }) },
    deliveryAsset: { findFirst: async () => ({ id: 'asset-1', solutionPackageId: 'package-1', deliveryReviewId: 'review-1' }) },
    solutionPackage: { findFirst: async () => ({ id: 'package-1' }) },
    $transaction: async (operations: Array<Promise<unknown>>) => Promise.all(operations),
  };
  const service = new CustomerSuccessActionsService(prisma as never);

  const created = await service.create(currentUser, {
    name: '第二批岗位场景扩展评审会',
    code: 'huazhong_design_expansion_review',
    customer_name: '华中设计院',
    customer_success_plan_id: 'plan-1',
    delivery_review_id: 'review-1',
    delivery_asset_id: 'asset-1',
    solution_package_id: 'package-1',
    action_type: 'MEETING',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    risk_level: 'MEDIUM',
    action_summary: '组织客户 CIO、运营经理和平台客户成功经理确认第二批岗位场景。',
    expected_outcome: '明确扩展场景、资料边界、验收节奏和复用资产清单。',
    execution_notes: '已完成会议议程和资料清单准备。',
    blocker_summary: '知识库密级边界仍需安全管理员确认。',
    completion_evidence: '会议纪要和二批场景清单将归档到成果资产。',
    next_action: '发送评审会议邀请并确认参会人。',
    due_at: '2026-06-18T10:00:00.000Z',
    tags: ['客户成功', '行动', '扩展'],
  });
  const list = await service.list(currentUser, { page: 1, page_size: 20, keyword: '扩展' });
  const detail = await service.get(currentUser, 'action-1');

  assert.equal(getWrite(writes, 'customerSuccessAction.create').tenantId, 'tenant-1');
  assert.equal(getWrite(writes, 'customerSuccessAction.create').ownerId, 'user-1');
  assert.equal(getWrite(writes, 'customerSuccessAction.create').actionScore, 86);
  assert.equal(created.action_score, 86);
  assert.equal(list.total, 1);
  assert.equal(list.items[0]?.name, '第二批岗位场景扩展评审会');
  assert.equal(list.items[0]?.action_summary_preview, '组织客户 CIO、运营经理和平台客户成功经理确认第二批岗位场景。');
  assert.equal(list.items[0]?.next_action_preview, '发送评审会议邀请并确认参会人。');
  assert.equal(detail.linked_resources.customer_success_plan?.name, '华中设计院客户成功扩展计划');
  assert.equal(detail.linked_resources.delivery_review?.name, '华中设计院试点验收复盘');
  assert.equal(detail.linked_resources.delivery_asset?.name, '售前方案验收资产包');
  assert.equal(detail.linked_resources.solution_package?.name, '华中设计院 AI 落地试点方案包');
  assert.match(detail.expected_outcome, /验收节奏/);
});

test('customer success actions reject source bindings outside the selected plan chain', async () => {
  const prisma = {
    customerSuccessAction: {
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
    deliveryReview: { findFirst: async () => ({ id: 'other-review', solutionPackageId: 'package-1' }) },
    deliveryAsset: { findFirst: async () => ({ id: 'asset-1', solutionPackageId: 'package-1', deliveryReviewId: 'review-1' }) },
    solutionPackage: { findFirst: async () => ({ id: 'package-1' }) },
  };
  const service = new CustomerSuccessActionsService(prisma as never);

  await assert.rejects(
    () =>
      service.create(currentUser, {
        name: '异常客户成功行动',
        code: 'invalid_success_action',
        customer_name: '华中设计院',
        customer_success_plan_id: 'plan-1',
        delivery_review_id: 'other-review',
        delivery_asset_id: 'asset-1',
        solution_package_id: 'package-1',
        action_type: 'FOLLOW_UP',
        status: 'TODO',
        priority: 'MEDIUM',
        risk_level: 'LOW',
        action_summary: '测试行动。',
        expected_outcome: '测试结果。',
        execution_notes: '测试记录。',
        blocker_summary: '测试阻塞。',
        completion_evidence: '测试证据。',
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
