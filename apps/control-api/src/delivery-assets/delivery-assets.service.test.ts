import assert from 'node:assert/strict';
import test from 'node:test';

import { BadRequestException } from '@nestjs/common';

import { DeliveryAssetsService } from './delivery-assets.service';

const currentUser = {
  id: 'user-1',
  tenantId: 'tenant-1',
  departmentId: 'dept-1',
  email: 'operator@example.test',
  roles: [],
  roleIds: [],
  permissions: [],
};

const createdAt = new Date('2026-05-09T18:00:00.000Z');

function assetRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'asset-1',
    tenantId: 'tenant-1',
    ownerId: 'user-1',
    deliveryReviewId: 'review-1',
    solutionPackageId: 'package-1',
    skillId: 'skill-1',
    agentId: 'agent-1',
    knowledgeId: 'knowledge-1',
    name: '售前方案验收资产包',
    code: 'sales_solution_acceptance_asset',
    customerName: '华中设计院',
    assetType: 'SOLUTION_TEMPLATE',
    status: 'PUBLISHED',
    visibility: 'TENANT',
    reuseScore: 92,
    summary: '沉淀售前方案样板、引用来源检查、风险提示和验收清单，供同类试点复用。',
    businessValue: '降低方案准备时间，减少验收返工，并统一引用来源与风险说明。',
    reuseGuidance: '适用于任务型客户的售前方案试点，可复制到投标资料问答和项目复盘场景。',
    sourceContext: '来源于华中设计院试点验收复盘，客户确认样板成果可进入扩展阶段。',
    riskNotes: '复用前需要确认客户资料权限、行业术语和知识库密级。',
    nextAction: '把资产同步到 Skill Hub，并标记为售前方案交付推荐资产。',
    tags: ['成果资产', '售前', '验收'],
    notes: '优先沉淀为可复制交付资产。',
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
    deliveryReview: {
      id: 'review-1',
      name: '华中设计院试点验收复盘',
      code: 'huazhong_design_pilot_review',
      customerName: '华中设计院',
      result: 'PASSED',
      status: 'COMPLETED',
      acceptanceScore: 95,
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
    skill: {
      id: 'skill-1',
      name: '售前方案生成 Skill',
      code: 'sales_solution_generation',
      category: 'DELIVERY',
      status: 'PUBLISHED',
    },
    agent: {
      id: 'agent-1',
      name: '售前方案助手',
      code: 'sales_solution_agent',
      status: 'PUBLISHED',
    },
    knowledgeBase: {
      id: 'knowledge-1',
      name: '售前资料知识库',
      code: 'sales_materials_kb',
      status: 'ACTIVE',
      visibility: 'PRIVATE',
    },
    ...overrides,
  };
}

test('delivery assets derive reuse score and keep list summaries compact', async () => {
  const writes: Array<{ type: string; data: Record<string, unknown> }> = [];
  const record = assetRecord();
  const prisma = {
    deliveryAsset: {
      create: async (args: { data: Record<string, unknown> }) => {
        writes.push({ type: 'deliveryAsset.create', data: args.data });
        return record;
      },
      findMany: async () => [record],
      count: async () => 1,
      findFirst: async () => record,
    },
    user: { findFirst: async () => ({ id: 'user-1' }) },
    deliveryReview: { findFirst: async () => ({ id: 'review-1', solutionPackageId: 'package-1' }) },
    solutionPackage: { findFirst: async () => ({ id: 'package-1' }) },
    skill: { findFirst: async () => ({ id: 'skill-1' }) },
    agent: { findFirst: async () => ({ id: 'agent-1' }) },
    knowledgeBase: { findFirst: async () => ({ id: 'knowledge-1' }) },
    $transaction: async (operations: Array<Promise<unknown>>) => Promise.all(operations),
  };
  const service = new DeliveryAssetsService(prisma as never);

  const created = await service.create(currentUser, {
    name: '售前方案验收资产包',
    code: 'sales_solution_acceptance_asset',
    customer_name: '华中设计院',
    asset_type: 'SOLUTION_TEMPLATE',
    status: 'PUBLISHED',
    visibility: 'TENANT',
    summary: '沉淀售前方案样板、引用来源检查、风险提示和验收清单，供同类试点复用。',
    business_value: '降低方案准备时间，减少验收返工，并统一引用来源与风险说明。',
    reuse_guidance: '适用于任务型客户的售前方案试点，可复制到投标资料问答和项目复盘场景。',
    source_context: '来源于华中设计院试点验收复盘，客户确认样板成果可进入扩展阶段。',
    risk_notes: '复用前需要确认客户资料权限、行业术语和知识库密级。',
    next_action: '把资产同步到 Skill Hub，并标记为售前方案交付推荐资产。',
    delivery_review_id: 'review-1',
    solution_package_id: 'package-1',
    skill_id: 'skill-1',
    agent_id: 'agent-1',
    knowledge_id: 'knowledge-1',
    tags: ['成果资产', '售前', '验收'],
  });
  const list = await service.list(currentUser, { page: 1, page_size: 20, keyword: '售前' });
  const detail = await service.get(currentUser, 'asset-1');

  assert.equal(getWrite(writes, 'deliveryAsset.create').tenantId, 'tenant-1');
  assert.equal(getWrite(writes, 'deliveryAsset.create').ownerId, 'user-1');
  assert.equal(getWrite(writes, 'deliveryAsset.create').reuseScore, 92);
  assert.equal(created.reuse_score, 92);
  assert.equal(list.total, 1);
  assert.equal(list.items[0]?.name, '售前方案验收资产包');
  assert.equal(list.items[0]?.summary_preview, '沉淀售前方案样板、引用来源检查、风险提示和验收清单，供同类试点复用。');
  assert.equal(list.items[0]?.reuse_guidance_preview, '适用于任务型客户的售前方案试点，可复制到投标资料问答和项目复盘场景。');
  assert.equal(detail.linked_resources.delivery_review?.name, '华中设计院试点验收复盘');
  assert.equal(detail.linked_resources.solution_package?.name, '华中设计院 AI 落地试点方案包');
  assert.equal(detail.linked_resources.skill?.name, '售前方案生成 Skill');
  assert.match(detail.business_value, /减少验收返工/);
});

test('delivery assets reject cross-tenant or missing source bindings', async () => {
  const prisma = {
    deliveryAsset: {
      findFirst: async () => null,
    },
    user: { findFirst: async () => ({ id: 'user-1' }) },
    deliveryReview: { findFirst: async () => null },
    solutionPackage: { findFirst: async () => ({ id: 'package-1' }) },
    skill: { findFirst: async () => null },
    agent: { findFirst: async () => null },
    knowledgeBase: { findFirst: async () => null },
  };
  const service = new DeliveryAssetsService(prisma as never);

  await assert.rejects(
    () =>
      service.create(currentUser, {
        name: '异常成果资产',
        code: 'invalid_delivery_asset',
        customer_name: '异常客户',
        asset_type: 'SOLUTION_TEMPLATE',
        status: 'DRAFT',
        visibility: 'PRIVATE',
        summary: '缺少有效验收复盘。',
        business_value: '验证资源校验。',
        reuse_guidance: '测试复用说明。',
        source_context: '测试来源。',
        risk_notes: '测试风险。',
        next_action: '测试动作。',
        delivery_review_id: 'missing-review',
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
