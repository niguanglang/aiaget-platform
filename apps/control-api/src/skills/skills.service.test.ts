import assert from 'node:assert/strict';
import test from 'node:test';

import { SkillsService } from './skills.service';

const currentUser = {
  id: 'user-1',
  tenantId: 'tenant-1',
  departmentId: 'dept-1',
  email: 'operator@example.test',
  roles: [],
  roleIds: [],
  permissions: [],
};

test('skill hub creates a reusable business skill and maps it to list/detail contracts', async () => {
  const writes: Array<{ type: string; data: Record<string, unknown> }> = [];
  const createdAt = new Date('2026-05-09T08:00:00.000Z');
  const skillRecord = {
    id: 'skill-1',
    tenantId: 'tenant-1',
    ownerId: 'user-1',
    name: '售前方案生成 Skill',
    code: 'sales_proposal',
    category: 'SALES',
    status: 'DRAFT',
    version: 0,
    description: '把售前调研材料生成标准方案初稿。',
    triggerScenario: '客户需求调研完成后',
    inputRequirements: '客户背景、需求清单、行业资料',
    executionSteps: '1. 读取客户背景\n2. 提炼痛点\n3. 输出方案结构',
    outputFormat: 'Markdown 方案初稿',
    qualityCriteria: '包含背景、痛点、方案、风险和下一步',
    boundaryRules: '不得编造客户事实，不输出未确认报价',
    tags: ['售前', '方案'],
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
    versions: [],
    agentBindings: [],
  };
  const prisma = {
    skill: {
      create: async (args: { data: Record<string, unknown> }) => {
        writes.push({ type: 'skill.create', data: args.data });
        return skillRecord;
      },
      findMany: async () => [skillRecord],
      count: async () => 1,
      findFirst: async () => skillRecord,
    },
    user: {
      findFirst: async () => ({ id: 'user-1' }),
    },
    agentSkillBinding: {
      groupBy: async () => [{ skillId: 'skill-1', _count: { _all: 2 } }],
      findMany: async () => [
        {
          id: 'binding-1',
          agentId: 'agent-1',
          skillId: 'skill-1',
          bindingType: 'PRIMARY',
          sortOrder: 10,
          createdAt,
          agent: {
            id: 'agent-1',
            name: '售前助手',
            code: 'sales-agent',
            status: 'PUBLISHED',
          },
        },
      ],
    },
    $transaction: async (operations: Array<Promise<unknown>>) => Promise.all(operations),
  };
  const service = new SkillsService(prisma as never);

  const created = await service.create(currentUser, {
    name: '售前方案生成 Skill',
    code: 'sales_proposal',
    category: 'SALES',
    description: '把售前调研材料生成标准方案初稿。',
    trigger_scenario: '客户需求调研完成后',
    input_requirements: '客户背景、需求清单、行业资料',
    execution_steps: '1. 读取客户背景\n2. 提炼痛点\n3. 输出方案结构',
    output_format: 'Markdown 方案初稿',
    quality_criteria: '包含背景、痛点、方案、风险和下一步',
    boundary_rules: '不得编造客户事实，不输出未确认报价',
    tags: ['售前', '方案'],
  });
  const list = await service.list(currentUser, { page: 1, page_size: 20, keyword: '方案' });
  const detail = await service.get(currentUser, 'skill-1');

  assert.equal(getWrite(writes, 'skill.create').tenantId, 'tenant-1');
  assert.equal(getWrite(writes, 'skill.create').ownerId, 'user-1');
  assert.deepEqual(getWrite(writes, 'skill.create').tags, ['售前', '方案']);
  assert.equal(created.name, '售前方案生成 Skill');
  assert.equal(created.agent_reference_count, 0);
  assert.equal(list.total, 1);
  assert.equal(list.items[0]?.agent_reference_count, 2);
  assert.equal(detail.agent_references[0]?.agent_name, '售前助手');
  assert.equal(detail.trigger_scenario, '客户需求调研完成后');
  assert.equal(detail.quality_criteria, '包含背景、痛点、方案、风险和下一步');
});

test('skill hub publish snapshots immutable versions and increments skill version', async () => {
  const createdAt = new Date('2026-05-09T08:30:00.000Z');
  let skillRecord = {
    id: 'skill-1',
    tenantId: 'tenant-1',
    ownerId: 'user-1',
    name: '会议纪要归档 Skill',
    code: 'meeting_archive',
    category: 'OPERATIONS',
    status: 'DRAFT',
    version: 0,
    description: null,
    triggerScenario: '会议结束后',
    inputRequirements: '会议录音或纪要草稿',
    executionSteps: '整理议题、结论、责任人和截止时间',
    outputFormat: 'Markdown 纪要',
    qualityCriteria: '责任人和截止时间清晰',
    boundaryRules: '敏感客户信息需脱敏',
    tags: [],
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
    createdBy: 'user-1',
    updatedBy: 'user-1',
    owner: null,
    versions: [],
    agentBindings: [],
  };
  const writes: Array<{ type: string; data: Record<string, unknown> }> = [];
  const prisma = {
    skill: {
      findFirst: async () => skillRecord,
      update: async (args: { data: Record<string, unknown> }) => {
        writes.push({ type: 'skill.update', data: args.data });
        skillRecord = { ...skillRecord, ...args.data, versions: [] };
        return skillRecord;
      },
    },
    skillVersion: {
      findFirst: async () => null,
      create: async (args: { data: Record<string, unknown> }) => {
        writes.push({ type: 'skillVersion.create', data: args.data });
        return { id: 'version-1' };
      },
    },
    agentSkillBinding: {
      findMany: async () => [],
    },
    $transaction: async (operations: Array<Promise<unknown>>) => Promise.all(operations),
  };
  const service = new SkillsService(prisma as never);

  const result = await service.publish(currentUser, 'skill-1', { change_note: '沉淀会议纪要标准流程' });

  assert.equal(getWrite(writes, 'skillVersion.create').tenantId, 'tenant-1');
  assert.equal(getWrite(writes, 'skillVersion.create').version, 1);
  assert.equal(getWrite(writes, 'skillVersion.create').changeNote, '沉淀会议纪要标准流程');
  assert.deepEqual((getWrite(writes, 'skillVersion.create').snapshot as { tags?: string[] }).tags, []);
  assert.equal(getWrite(writes, 'skill.update').version, 1);
  assert.equal(getWrite(writes, 'skill.update').status, 'PUBLISHED');
  assert.equal(result.version, 1);
  assert.equal(result.status, 'PUBLISHED');
});

function getWrite(writes: Array<{ type: string; data: Record<string, unknown> }>, type: string) {
  const found = writes.find((write) => write.type === type);
  assert.ok(found, `missing write ${type}`);
  return found.data;
}
