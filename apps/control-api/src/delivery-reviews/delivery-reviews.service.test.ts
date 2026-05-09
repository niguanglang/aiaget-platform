import assert from 'node:assert/strict';
import test from 'node:test';

import { BadRequestException } from '@nestjs/common';

import { DeliveryReviewsService } from './delivery-reviews.service';

const currentUser = {
  id: 'user-1',
  tenantId: 'tenant-1',
  departmentId: 'dept-1',
  email: 'operator@example.test',
  roles: [],
  roleIds: [],
  permissions: [],
};

const createdAt = new Date('2026-05-09T16:00:00.000Z');

function reviewRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'review-1',
    tenantId: 'tenant-1',
    ownerId: 'user-1',
    solutionPackageId: 'package-1',
    name: '华中设计院试点验收复盘',
    code: 'huazhong_design_pilot_review',
    customerName: '华中设计院',
    reviewStage: 'PILOT_ACCEPTANCE',
    result: 'PASSED',
    status: 'COMPLETED',
    satisfactionLevel: 'HIGH',
    acceptanceScore: 95,
    deliveredScope: '完成售前方案样板、引用来源、风险提示和验收清单。',
    acceptanceSummary: '客户确认样板成果可用于试点验收，引用来源完整。',
    issueSummary: '需要补充更多历史方案样例，并完善权限说明。',
    improvementActions: '补齐 20 份历史方案样例，增加权限边界说明。',
    expansionPlan: '下一阶段扩展到投标资料问答和项目复盘助手。',
    reusableAssets: '方案模板、验收清单、风险提示模板、引用来源检查表。',
    nextAction: '安排扩展方案评审会。',
    reviewedAt: createdAt,
    tags: ['验收', '复盘', '试点'],
    notes: '适合作为任务型客户复盘样板。',
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

test('delivery reviews derive acceptance score and keep list summaries compact', async () => {
  const writes: Array<{ type: string; data: Record<string, unknown> }> = [];
  const record = reviewRecord();
  const prisma = {
    deliveryReview: {
      create: async (args: { data: Record<string, unknown> }) => {
        writes.push({ type: 'deliveryReview.create', data: args.data });
        return record;
      },
      findMany: async () => [record],
      count: async () => 1,
      findFirst: async () => record,
    },
    user: { findFirst: async () => ({ id: 'user-1' }) },
    solutionPackage: { findFirst: async () => ({ id: 'package-1' }) },
    $transaction: async (operations: Array<Promise<unknown>>) => Promise.all(operations),
  };
  const service = new DeliveryReviewsService(prisma as never);

  const created = await service.create(currentUser, {
    name: '华中设计院试点验收复盘',
    code: 'huazhong_design_pilot_review',
    customer_name: '华中设计院',
    review_stage: 'PILOT_ACCEPTANCE',
    result: 'PASSED',
    status: 'COMPLETED',
    satisfaction_level: 'HIGH',
    delivered_scope: '完成售前方案样板、引用来源、风险提示和验收清单。',
    acceptance_summary: '客户确认样板成果可用于试点验收，引用来源完整。',
    issue_summary: '需要补充更多历史方案样例，并完善权限说明。',
    improvement_actions: '补齐 20 份历史方案样例，增加权限边界说明。',
    expansion_plan: '下一阶段扩展到投标资料问答和项目复盘助手。',
    reusable_assets: '方案模板、验收清单、风险提示模板、引用来源检查表。',
    next_action: '安排扩展方案评审会。',
    reviewed_at: createdAt.toISOString(),
    tags: ['验收', '复盘', '试点'],
    solution_package_id: 'package-1',
  });
  const list = await service.list(currentUser, { page: 1, page_size: 20, keyword: '华中' });
  const detail = await service.get(currentUser, 'review-1');

  assert.equal(getWrite(writes, 'deliveryReview.create').tenantId, 'tenant-1');
  assert.equal(getWrite(writes, 'deliveryReview.create').ownerId, 'user-1');
  assert.equal(getWrite(writes, 'deliveryReview.create').acceptanceScore, 95);
  assert.equal(created.acceptance_score, 95);
  assert.equal(list.total, 1);
  assert.equal(list.items[0]?.name, '华中设计院试点验收复盘');
  assert.equal(list.items[0]?.acceptance_summary_preview, '客户确认样板成果可用于试点验收，引用来源完整。');
  assert.equal(list.items[0]?.issue_summary_preview, '需要补充更多历史方案样例，并完善权限说明。');
  assert.equal(detail.linked_resources.solution_package?.name, '华中设计院 AI 落地试点方案包');
  assert.match(detail.expansion_plan, /投标资料问答/);
});

test('delivery reviews reject bindings from another tenant or missing solution packages', async () => {
  const prisma = {
    deliveryReview: {
      findFirst: async () => null,
    },
    user: { findFirst: async () => ({ id: 'user-1' }) },
    solutionPackage: { findFirst: async () => null },
  };
  const service = new DeliveryReviewsService(prisma as never);

  await assert.rejects(
    () =>
      service.create(currentUser, {
        name: '异常验收复盘',
        code: 'invalid_delivery_review',
        customer_name: '异常客户',
        review_stage: 'PILOT_ACCEPTANCE',
        result: 'PARTIAL',
        status: 'DRAFT',
        satisfaction_level: 'MEDIUM',
        delivered_scope: '缺少有效方案包。',
        acceptance_summary: '测试验收。',
        issue_summary: '测试问题。',
        improvement_actions: '测试改进。',
        expansion_plan: '测试扩展。',
        reusable_assets: '测试资产。',
        next_action: '测试动作。',
        solution_package_id: 'missing-package',
      }),
    BadRequestException,
  );
});

function getWrite(writes: Array<{ type: string; data: Record<string, unknown> }>, type: string) {
  const found = writes.find((write) => write.type === type);
  assert.ok(found, `missing write ${type}`);
  return found.data;
}
