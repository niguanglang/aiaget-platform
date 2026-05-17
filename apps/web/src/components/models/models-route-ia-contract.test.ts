import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const modelsListSource = readFileSync(join(process.cwd(), 'src/components/models/models-content.tsx'), 'utf8');
const modelDetailSource = readFileSync(
  join(process.cwd(), 'src/components/models/model-provider-detail-content.tsx'),
  'utf8',
);
const modelCreateSource = readFileSync(
  join(process.cwd(), 'src/components/models/model-provider-create-content.tsx'),
  'utf8',
);
const modelEditSource = readFileSync(
  join(process.cwd(), 'src/components/models/model-provider-edit-content.tsx'),
  'utf8',
);
const modelDetailHeaderSource = readFileSync(
  join(process.cwd(), 'src/components/models/model-provider-detail-header.tsx'),
  'utf8',
);

test('model center route-level pages exist for list, create, detail, and edit', () => {
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/models/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/models/create/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/models/[id]/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/models/[id]/edit/page.tsx')));
});

test('model list page keeps provider detail and forms out of the list surface', () => {
  assert.doesNotMatch(modelsListSource, /ProviderDetailPanel/);
  assert.doesNotMatch(modelsListSource, /ProviderFormPanel/);
  assert.doesNotMatch(modelsListSource, /ModelFormPanel/);
  assert.doesNotMatch(modelsListSource, /selectedProviderId/);
  assert.doesNotMatch(modelsListSource, /testModelProvider/);
});

test('model provider and model status changes require confirmation before mutation', () => {
  const configCardSource = readFileSync(join(process.cwd(), 'src/components/models/model-config-card.tsx'), 'utf8');

  assert.match(modelsListSource, /statusTarget/);
  assert.match(modelsListSource, /setStatusTarget\(/);
  assert.doesNotMatch(modelsListSource, /onClick=\{\(\) =>\s*providerStatusMutation\.mutate/);
  assert.match(modelDetailSource, /providerStatusTarget/);
  assert.match(modelDetailSource, /modelStatusTarget/);
  assert.match(modelDetailSource, /ModelProviderConfirmDialog/);
  assert.doesNotMatch(
    modelDetailSource,
    /onToggleStatus=\{\(\) => providerStatusMutation\.mutate\(provider\.status === 'ACTIVE' \? 'DISABLED' : 'ACTIVE'\)\}/,
  );
  assert.match(configCardSource, /onToggle\(model\)/);
});

test('model list follows reference skill-model center operations layout', () => {
  assert.match(modelsListSource, /技能模型中心/);
  assert.match(modelsListSource, /技能分类/);
  assert.match(modelsListSource, /技能模型列表/);
  assert.match(modelsListSource, /模型总数/);
  assert.match(modelsListSource, /调用量/);
  assert.match(modelsListSource, /异常告警/);
  assert.match(modelsListSource, /批量发布/);
  assert.match(modelsListSource, /更多操作/);
  assert.match(modelsListSource, /max-w-\[1680px\]/);
  assert.match(modelsListSource, /rounded-xl border border-slate-200\/80 bg-white\/\[0\.9\]/);
  assert.match(modelsListSource, /RefreshCw/);
  assert.match(modelsListSource, /SlidersHorizontal/);
  assert.match(modelsListSource, /ModelProviderAvatar/);
  assert.doesNotMatch(modelsListSource, /ModelCenterBackground/);
  assert.doesNotMatch(modelsListSource, /MetricCard/);
  assert.doesNotMatch(modelsListSource, /供应商列表/);
  assert.doesNotMatch(modelsListSource, /模型供应商加载失败。/);
  assert.doesNotMatch(modelsListSource, /正在加载模型供应商/);
  assert.doesNotMatch(modelsListSource, /暂无模型供应商/);
  assert.doesNotMatch(modelsListSource, /line-clamp-1 break-all[\s\S]*provider\.base_url/);
});

test('model list does not use placeholder metrics or inert bulk actions', () => {
  assert.match(modelsListSource, /getMonitorOverview/);
  assert.match(modelsListSource, /bulkSelectedIds/);
  assert.match(modelsListSource, /bulkActionTarget/);
  assert.match(modelsListSource, /confirmBulkStatusChange/);
  assert.doesNotMatch(modelsListSource, /v1\.0\.0/);
  assert.doesNotMatch(modelsListSource, /enabled_model_count \* 128/);
  assert.doesNotMatch(modelsListSource, /98\.45%/);
  assert.doesNotMatch(modelsListSource, /<Button className="h-10" disabled type="button" variant="outline">\s*批量发布/);
  assert.doesNotMatch(modelsListSource, /<Button className="h-10" disabled type="button" variant="outline">\s*批量下线/);
});

test('model provider operations do not seed demo request values', () => {
  const providerFormSource = readFileSync(join(process.cwd(), 'src/components/models/provider-form-panel.tsx'), 'utf8');
  const testCardSource = readFileSync(join(process.cwd(), 'src/components/models/model-provider-test-card.tsx'), 'utf8');

  assert.match(modelDetailSource, /useState\(''\)/);
  assert.doesNotMatch(modelDetailSource, /主密钥/);
  assert.doesNotMatch(modelDetailSource, /兼容性检查结果/);
  assert.doesNotMatch(providerFormSource, /https:\/\/api\.openai\.com\/v1/);
  assert.match(testCardSource, /testPrompt\.trim\(\)\.length/);
});

test('model create, edit, and detail pages use the operational shell without old visual background', () => {
  const operationSources = [modelCreateSource, modelEditSource, modelDetailSource];

  for (const operationSource of operationSources) {
    assert.match(operationSource, /max-w-\[1680px\]/);
    assert.match(operationSource, /rounded-xl border border-slate-200\/80 bg-white\/\[0\.9\]/);
    assert.doesNotMatch(operationSource, /ModelCenterBackground/);
    assert.doesNotMatch(operationSource, /MetricCard/);
  }
});

test('model provider detail page is split into focused detail cards', () => {
  const components = [
    'model-provider-detail-header.tsx',
    'model-config-card.tsx',
    'model-api-key-card.tsx',
    'model-provider-test-card.tsx',
    'model-cost-log-card.tsx',
    'model-provider-confirm-dialog.tsx',
  ];

  for (const component of components) {
    assert.ok(existsSync(join(process.cwd(), 'src/components/models', component)), component);
  }

  assert.match(modelDetailSource, /ModelProviderDetailHeader/);
  assert.match(modelDetailSource, /ModelConfigCard/);
  assert.match(modelDetailSource, /ModelApiKeyCard/);
  assert.match(modelDetailSource, /ModelProviderTestCard/);
  assert.match(modelDetailSource, /ModelCostLogCard/);
  assert.match(modelDetailSource, /ModelProviderConfirmDialog/);
});

test('model provider detail keeps provider editing and fake delete actions out of the detail surface', () => {
  assert.doesNotMatch(modelDetailSource, /ProviderFormPanel/);
  assert.doesNotMatch(modelDetailSource, /供应商删除暂不在详情页提供/);
  assert.doesNotMatch(modelDetailSource, /deleteModelProvider/);
  assert.doesNotMatch(modelDetailHeaderSource, /暂无描述/);
  assert.match(`${modelDetailSource}\n${modelDetailHeaderSource}`, /href=\{`\/models\/\$\{provider\.id\}\/edit`\}/);
});

test('model provider detail separates api key, compatibility test, and model config responsibilities', () => {
  const apiKeyCardSource = readFileSync(join(process.cwd(), 'src/components/models/model-api-key-card.tsx'), 'utf8');
  const formPanelSource = readFileSync(join(process.cwd(), 'src/components/models/model-form-panel.tsx'), 'utf8');
  const testCardSource = readFileSync(join(process.cwd(), 'src/components/models/model-provider-test-card.tsx'), 'utf8');
  const configCardSource = readFileSync(join(process.cwd(), 'src/components/models/model-config-card.tsx'), 'utf8');

  assert.match(apiKeyCardSource, /type="password"/);
  assert.match(apiKeyCardSource, /masked_key/);
  assert.doesNotMatch(apiKeyCardSource, /api_key\s*:/);

  assert.match(testCardSource, /兼容性测试/);
  assert.match(testCardSource, /testResult/);
  assert.doesNotMatch(testCardSource, /createModelApiKey/);

  assert.match(configCardSource, /模型配置/);
  assert.match(configCardSource, /onToggle/);
  assert.match(configCardSource, /最大输出/);
  assert.match(configCardSource, /API 版本/);
  assert.match(formPanelSource, /max_output_tokens/);
  assert.match(formPanelSource, /api_version/);
  assert.match(modelDetailSource, /max_output_tokens/);
  assert.match(modelDetailSource, /api_version/);
  assert.doesNotMatch(configCardSource, /ProviderFormPanel/);
});

test('model api key deletion requires confirmation before mutation', () => {
  const apiKeyCardSource = readFileSync(join(process.cwd(), 'src/components/models/model-api-key-card.tsx'), 'utf8');

  assert.match(modelDetailSource, /apiKeyDeleteTarget/);
  assert.match(modelDetailSource, /function confirmApiKeyDelete/);
  assert.match(modelDetailSource, /确认删除接口密钥/);
  assert.match(modelDetailSource, /onConfirm=\{confirmApiKeyDelete\}/);
  assert.match(apiKeyCardSource, /onDeleteKey\(key\)/);
  assert.doesNotMatch(apiKeyCardSource, /onDeleteKey\(key\.id\)/);
  assert.doesNotMatch(modelDetailSource, /onDeleteKey=\{\(keyId\) => deleteKeyMutation\.mutate/);
});
