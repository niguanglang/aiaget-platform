import assert from 'node:assert/strict';
import test from 'node:test';

import { BadRequestException } from '@nestjs/common';

import { CustomerSuccessPlansService } from './customer-success-plans.service';

const currentUser = {
  id: 'user-1',
  tenantId: 'tenant-1',
  departmentId: 'dept-1',
  email: 'operator@example.test',
  roles: [],
  roleIds: [],
  permissions: [],
};

const createdAt = new Date('2026-05-09T19:00:00.000Z');

function planRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'plan-1',
    tenantId: 'tenant-1',
    ownerId: 'user-1',
    deliveryReviewId: 'review-1',
    deliveryAssetId: 'asset-1',
    solutionPackageId: 'package-1',
    name: '华中设计院客户成功扩展计划',
    code: 'huazhong_design_success_expansion',
    customerName: '华中设计院',
    planStage: 'EXPANSION_DESIGN',
    status: 'ACTIVE',
    priority: 'HIGH',
    healthLevel: 'HIGH',
    successScore: 88,
    expansionScope: '扩展到投标资料问答、项目复盘助手和客户成功运营看板。',
    successObjectives: '30 天完成第二批岗位场景试点，复用成果资产并形成续约材料。',
    stakeholderPlan: '客户 CIO 负责业务牵引，设计院运营经理负责资料准备，平台客户成功经理每周复盘。',
    assetReusePlan: '复用售前方案验收资产包，复制验收清单、风险提示和引用来源检查表。',
    renewalPlan: '在试点验收后 45 天形成续约方案和新增部门推广清单。',
    riskSummary: '资料权限边界、跨部门目标不一致和知识库密级需要提前确认。',
    nextAction: '组织扩展方案评审会，确认第二批岗位场景和资料范围。',
    dueAt: new Date('2026-06-15T10:00:00.000Z'),
    tags: ['客户成功', '扩展', '续约'],
    notes: 'M124 默认样板。',
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

test('customer success plans derive success score and keep list summaries compact', async () => {
  const writes: Array<{ type: string; data: Record<string, unknown> }> = [];
  const record = planRecord();
  const prisma = {
    customerSuccessPlan: {
      create: async (args: { data: Record<string, unknown> }) => {
        writes.push({ type: 'customerSuccessPlan.create', data: args.data });
        return record;
      },
      findMany: async () => [record],
      count: async () => 1,
      findFirst: async () => record,
    },
    user: { findFirst: async () => ({ id: 'user-1' }) },
    deliveryReview: { findFirst: async () => ({ id: 'review-1', solutionPackageId: 'package-1' }) },
    deliveryAsset: { findFirst: async () => ({ id: 'asset-1', solutionPackageId: 'package-1', deliveryReviewId: 'review-1' }) },
    solutionPackage: { findFirst: async () => ({ id: 'package-1' }) },
    $transaction: async (operations: Array<Promise<unknown>>) => Promise.all(operations),
  };
  const service = new CustomerSuccessPlansService(prisma as never);

  const created = await service.create(currentUser, {
    name: '华中设计院客户成功扩展计划',
    code: 'huazhong_design_success_expansion',
    customer_name: '华中设计院',
    plan_stage: 'EXPANSION_DESIGN',
    status: 'ACTIVE',
    priority: 'HIGH',
    health_level: 'HIGH',
    expansion_scope: '扩展到投标资料问答、项目复盘助手和客户成功运营看板。',
    success_objectives: '30 天完成第二批岗位场景试点，复用成果资产并形成续约材料。',
    stakeholder_plan: '客户 CIO 负责业务牵引，设计院运营经理负责资料准备，平台客户成功经理每周复盘。',
    asset_reuse_plan: '复用售前方案验收资产包，复制验收清单、风险提示和引用来源检查表。',
    renewal_plan: '在试点验收后 45 天形成续约方案和新增部门推广清单。',
    risk_summary: '资料权限边界、跨部门目标不一致和知识库密级需要提前确认。',
    next_action: '组织扩展方案评审会，确认第二批岗位场景和资料范围。',
    delivery_review_id: 'review-1',
    delivery_asset_id: 'asset-1',
    solution_package_id: 'package-1',
    due_at: '2026-06-15T10:00:00.000Z',
    tags: ['客户成功', '扩展', '续约'],
  });
  const list = await service.list(currentUser, { page: 1, page_size: 20, keyword: '扩展' });
  const detail = await service.get(currentUser, 'plan-1');

  assert.equal(getWrite(writes, 'customerSuccessPlan.create').tenantId, 'tenant-1');
  assert.equal(getWrite(writes, 'customerSuccessPlan.create').ownerId, 'user-1');
  assert.equal(getWrite(writes, 'customerSuccessPlan.create').successScore, 88);
  assert.equal(created.success_score, 88);
  assert.equal(list.total, 1);
  assert.equal(list.items[0]?.name, '华中设计院客户成功扩展计划');
  assert.equal(list.items[0]?.expansion_scope_preview, '扩展到投标资料问答、项目复盘助手和客户成功运营看板。');
  assert.equal(list.items[0]?.next_action_preview, '组织扩展方案评审会，确认第二批岗位场景和资料范围。');
  assert.equal(detail.linked_resources.delivery_review?.name, '华中设计院试点验收复盘');
  assert.equal(detail.linked_resources.delivery_asset?.name, '售前方案验收资产包');
  assert.equal(detail.linked_resources.solution_package?.name, '华中设计院 AI 落地试点方案包');
  assert.match(detail.asset_reuse_plan, /验收清单/);
});

test('customer success plans reject cross-tenant or missing source bindings', async () => {
  const prisma = {
    customerSuccessPlan: {
      findFirst: async () => null,
    },
    user: { findFirst: async () => ({ id: 'user-1' }) },
    deliveryReview: { findFirst: async () => null },
    deliveryAsset: { findFirst: async () => ({ id: 'asset-1', solutionPackageId: 'package-1', deliveryReviewId: 'missing-review' }) },
    solutionPackage: { findFirst: async () => ({ id: 'package-1' }) },
  };
  const service = new CustomerSuccessPlansService(prisma as never);

  await assert.rejects(
    () =>
      service.create(currentUser, {
        name: '异常客户成功计划',
        code: 'invalid_success_plan',
        customer_name: '异常客户',
        plan_stage: 'DISCOVERY',
        status: 'DRAFT',
        priority: 'MEDIUM',
        health_level: 'MEDIUM',
        expansion_scope: '测试扩展范围。',
        success_objectives: '测试成功目标。',
        stakeholder_plan: '测试干系人计划。',
        asset_reuse_plan: '测试资产复用。',
        renewal_plan: '测试续约计划。',
        risk_summary: '测试风险。',
        next_action: '测试动作。',
        delivery_review_id: 'missing-review',
        delivery_asset_id: 'asset-1',
        solution_package_id: 'package-1',
      }),
    BadRequestException,
  );
});

function getWrite(writes: Array<{ type: string; data: Record<string, unknown> }>, type: string) {
  const found = writes.find((write) => write.type === type);
  assert.ok(found, `missing write ${type}`);
  return found.data;
}
