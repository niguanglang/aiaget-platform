import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const listSourcePath = join(root, 'src/components/api-keys/api-key-content.tsx');
const createSourcePath = join(root, 'src/components/api-keys/api-key-create-content.tsx');
const editSourcePath = join(root, 'src/components/api-keys/api-key-edit-content.tsx');
const apiReferenceSourcePath = join(root, 'src/app/(console)/api-reference/page.tsx');
const observabilitySourcePath = join(root, 'src/components/api-keys/api-key-observability-content.tsx');
const webhookListSourcePath = join(root, 'src/components/api-keys/webhook-deliveries-content.tsx');
const webhookDetailSourcePath = join(root, 'src/components/api-keys/webhook-delivery-detail-content.tsx');
const apiKeyRouteShellSourcePaths = [
  listSourcePath,
  createSourcePath,
  editSourcePath,
  apiReferenceSourcePath,
  observabilitySourcePath,
  webhookListSourcePath,
  webhookDetailSourcePath,
];

test('api key route-level pages exist for list, create, edit, observability, webhook list, and webhook detail', () => {
  assert.ok(existsSync(join(root, 'src/app/(console)/api-keys/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/api-keys/create/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/api-keys/[id]/edit/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/api-keys/observability/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/api-keys/webhook-deliveries/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/api-keys/webhook-deliveries/[deliveryId]/page.tsx')));
});

test('api key list page stays focused on inventory and row actions', () => {
  const listSource = readFileSync(listSourcePath, 'utf8');
  const sharedSource = readFileSync(join(root, 'src/components/api-keys/api-key-shared.tsx'), 'utf8');

  assert.match(listSource, /listTenantApiKeys/);
  assert.match(listSource, /deleteTenantApiKey/);
  assert.match(listSource, /disableTenantApiKey/);
  assert.match(listSource, /enableTenantApiKey/);
  assert.match(listSource, /rotateTenantApiKey/);
  assert.match(sharedSource, /\/api-keys\/\$\{apiKey\.id\}\/edit/);
  assert.doesNotMatch(listSource, /createTenantApiKey/);
  assert.doesNotMatch(listSource, /updateTenantApiKey/);
  assert.doesNotMatch(listSource, /getWebhookDelivery/);
  assert.doesNotMatch(listSource, /activeDeliveryId/);
  assert.doesNotMatch(listSource, /selectedDeliveryId/);
  assert.doesNotMatch(listSource, /createdSecret/);
  assert.doesNotMatch(listSource, /createdApiKey/);
});

test('api key create page owns creation and one-time secret display', () => {
  assert.ok(existsSync(createSourcePath));
  const createSource = readFileSync(createSourcePath, 'utf8');

  assert.match(createSource, /createTenantApiKey/);
  assert.match(createSource, /createdSecret/);
  assert.match(createSource, /请立即保存新密钥/);
  assert.doesNotMatch(createSource, /router\.push\(['"]\/api-keys['"]\)/);
});

test('api key edit page owns configuration updates and webhook config changes', () => {
  assert.ok(existsSync(editSourcePath));
  const editSource = readFileSync(editSourcePath, 'utf8');

  assert.match(editSource, /updateTenantApiKey/);
  assert.match(editSource, /Webhook 完成通知/);
  assert.match(editSource, /保存配置/);
  assert.doesNotMatch(editSource, /createTenantApiKey/);
  assert.doesNotMatch(editSource, /deleteTenantApiKey/);
  assert.doesNotMatch(editSource, /rotateTenantApiKey/);
});

test('api key observability page owns external api observability data flow', () => {
  assert.ok(existsSync(observabilitySourcePath));
  const observabilitySource = readFileSync(observabilitySourcePath, 'utf8');

  assert.match(observabilitySource, /getExternalApiObservability/);
  assert.doesNotMatch(observabilitySource, /createTenantApiKey/);
  assert.doesNotMatch(observabilitySource, /getWebhookDelivery/);
});

test('api reference page exposes SDK package and documentation entry points', () => {
  assert.ok(existsSync(apiReferenceSourcePath));
  const apiReferenceSource = readFileSync(apiReferenceSourcePath, 'utf8');

  assert.match(apiReferenceSource, /@aiaget\/external-api-sdk/);
  assert.match(apiReferenceSource, /docs\/api\/external-api-sdk\.md/);
  assert.match(apiReferenceSource, /packages\/external-api-sdk\/README\.md/);
  assert.match(apiReferenceSource, /SDK 包文档/);
  assert.match(apiReferenceSource, /发布前校验/);
});

test('api key webhook routes own list, detail, and retry data flows', () => {
  assert.ok(existsSync(webhookListSourcePath));
  assert.ok(existsSync(webhookDetailSourcePath));
  const webhookListSource = readFileSync(webhookListSourcePath, 'utf8');
  const webhookDetailSource = readFileSync(webhookDetailSourcePath, 'utf8');

  assert.match(webhookListSource, /listWebhookDeliveries/);
  assert.doesNotMatch(webhookListSource, /getWebhookDelivery/);
  assert.doesNotMatch(webhookListSource, /activeDeliveryId/);
  assert.match(webhookDetailSource, /getWebhookDelivery/);
  assert.match(webhookDetailSource, /retryWebhookDelivery/);
  assert.doesNotMatch(webhookDetailSource, /listWebhookDeliveries/);
});

test('webhook retry actions require confirmation before mutation', () => {
  const sharedSource = readFileSync(join(root, 'src/components/api-keys/api-key-shared.tsx'), 'utf8');
  const listSource = readFileSync(listSourcePath, 'utf8');
  const webhookListSource = readFileSync(webhookListSourcePath, 'utf8');
  const webhookDetailSource = readFileSync(webhookDetailSourcePath, 'utf8');

  assert.match(sharedSource, /function ConfirmDialog/);

  assert.match(listSource, /apiKeyActionTarget/);
  assert.match(listSource, /confirmApiKeyAction/);
  assert.match(listSource, /确认轮换 API Key/);
  assert.match(listSource, /确认停用 API Key/);
  assert.match(listSource, /确认启用 API Key/);
  assert.doesNotMatch(listSource, /onClick=\{\(\) => rotateMutation\.mutate\(apiKey\.id\)\}/);
  assert.doesNotMatch(listSource, /onClick=\{\(\) => disableMutation\.mutate\(apiKey\.id\)\}/);
  assert.doesNotMatch(listSource, /onClick=\{\(\) => enableMutation\.mutate\(apiKey\.id\)\}/);

  assert.match(webhookListSource, /webhookRetryTarget/);
  assert.match(webhookListSource, /function confirmWebhookRetry/);
  assert.match(webhookListSource, /确认重试 Webhook 投递/);
  assert.match(webhookListSource, /onConfirm=\{confirmWebhookRetry\}/);
  assert.doesNotMatch(webhookListSource, /onRetry=\{\(\) => retryMutation\.mutate\(item\.delivery_id\)\}/);

  assert.match(webhookDetailSource, /webhookRetryTarget/);
  assert.match(webhookDetailSource, /function confirmWebhookRetry/);
  assert.match(webhookDetailSource, /确认重试 Webhook 投递/);
  assert.match(webhookDetailSource, /onConfirm=\{confirmWebhookRetry\}/);
  assert.doesNotMatch(webhookDetailSource, /onClick=\{\(\) => retryMutation\.mutate\(item\.delivery_id\)\}/);
});

test('api key and api reference routes do not depend on legacy marketing shells', () => {
  for (const sourcePath of apiKeyRouteShellSourcePaths) {
    const source = readFileSync(sourcePath, 'utf8');

    assert.doesNotMatch(source, /MetricCard/);
    assert.doesNotMatch(source, /motion\/react/);
    assert.doesNotMatch(source, /max-w-7xl/);
    assert.match(source, /max-w-\[1680px\]/);
  }

  for (const sourcePath of [listSourcePath, apiReferenceSourcePath, observabilitySourcePath, webhookListSourcePath]) {
    const source = readFileSync(sourcePath, 'utf8');

    assert.match(source, /rounded-xl border border-slate-200\/80 bg-white\/\[0\.9\]/);
  }
});
