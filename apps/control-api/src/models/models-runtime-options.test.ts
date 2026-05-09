import assert from 'node:assert/strict';
import test from 'node:test';

process.env.RUNTIME_BASE_URL ??= 'http://runtime.example.test';
process.env.CONTROL_API_INTERNAL_BASE_URL ??= 'http://control-api.example.test';
process.env.RUNTIME_INTERNAL_TOKEN ??= 'test-runtime-internal-token';

test('model config create, update, and mapping preserve runtime adapter options', async () => {
  const { ModelsService } = await import('./models.service');
  const writes: Array<{ type: string; data: Record<string, unknown> }> = [];
  const storedModel = buildModelRecord({
    maxOutputTokens: 4096,
    apiVersion: '2025-01-01-preview',
  });
  const provider = {
    id: 'provider-1',
    tenantId: 'tenant-1',
    name: 'Azure 模型供应商',
    code: 'azure',
    providerType: 'AZURE_OPENAI',
    baseUrl: 'https://azure.example.test/openai/deployments/prod-gpt',
    status: 'ACTIVE',
    isDefault: false,
    description: null,
    createdAt: new Date('2026-05-08T01:00:00.000Z'),
    updatedAt: new Date('2026-05-08T01:00:00.000Z'),
    models: [storedModel],
    apiKeys: [],
    costRules: [],
    callLogs: [],
  };
  const prisma = {
    modelProvider: {
      findFirst: async () => provider,
    },
    modelConfig: {
      create: async (args: { data: Record<string, unknown> }) => {
        writes.push({ type: 'create', data: args.data });
        return { id: 'model-1' };
      },
      findFirst: async () => storedModel,
      update: async (args: { data: Record<string, unknown> }) => {
        writes.push({ type: 'update', data: args.data });
        return storedModel;
      },
    },
    modelCostRule: {
      findFirst: async () => null,
      create: async (args: { data: Record<string, unknown> }) => {
        writes.push({ type: 'cost_rule', data: args.data });
        return { id: 'cost-rule-1' };
      },
    },
  };
  const service = new ModelsService(
    prisma as never,
    { buildWhere: async () => ({ where: {}, source: 'TEST' }) } as never,
  );

  const created = await service.createModel(buildUser(), {
    provider_id: 'provider-1',
    name: '生产 GPT',
    model: 'prod-gpt',
    capabilities: ['chat'],
    context_length: 128000,
    max_output_tokens: 4096,
    api_version: ' 2025-01-01-preview ',
    input_price: 0.001,
    output_price: 0.002,
    rate_limit_rpm: null,
    status: 'ACTIVE',
    is_default: false,
  });
  const updated = await service.updateModel(buildUser(), 'model-1', {
    max_output_tokens: null,
    api_version: '',
  });

  assert.equal(getWrite(writes, 'create').maxOutputTokens, 4096);
  assert.equal(getWrite(writes, 'create').apiVersion, '2025-01-01-preview');
  assert.equal(getWrite(writes, 'update').maxOutputTokens, null);
  assert.equal(getWrite(writes, 'update').apiVersion, null);
  assert.equal(created.models[0]?.max_output_tokens, 4096);
  assert.equal(created.models[0]?.api_version, '2025-01-01-preview');
  assert.equal(updated.models[0]?.max_output_tokens, 4096);
  assert.equal(updated.models[0]?.api_version, '2025-01-01-preview');
});

function getWrite(writes: Array<{ type: string; data: Record<string, unknown> }>, type: string) {
  const found = writes.find((write) => write.type === type);
  assert.ok(found);
  return found.data;
}

function buildUser() {
  return {
    id: 'user-1',
    tenantId: 'tenant-1',
    departmentId: 'dept-1',
    email: 'operator@example.test',
    roles: [],
    roleIds: [],
    permissions: [],
  };
}

function buildModelRecord(input: { maxOutputTokens: number | null; apiVersion: string | null }) {
  return {
    id: 'model-1',
    tenantId: 'tenant-1',
    providerId: 'provider-1',
    name: '生产 GPT',
    model: 'prod-gpt',
    capabilities: ['chat'],
    contextLength: 128000,
    maxOutputTokens: input.maxOutputTokens,
    apiVersion: input.apiVersion,
    inputPrice: 0.001,
    outputPrice: 0.002,
    rateLimitRpm: null,
    status: 'ACTIVE',
    isDefault: false,
    createdAt: new Date('2026-05-08T01:00:00.000Z'),
    updatedAt: new Date('2026-05-08T01:00:00.000Z'),
  };
}
