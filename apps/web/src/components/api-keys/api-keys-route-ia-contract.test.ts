import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const listSourcePath = join(root, 'src/components/api-keys/api-key-content.tsx');
const createSourcePath = join(root, 'src/components/api-keys/api-key-create-content.tsx');
const observabilitySourcePath = join(root, 'src/components/api-keys/api-key-observability-content.tsx');
const webhookListSourcePath = join(root, 'src/components/api-keys/webhook-deliveries-content.tsx');
const webhookDetailSourcePath = join(root, 'src/components/api-keys/webhook-delivery-detail-content.tsx');

test('api key route-level pages exist for list, create, observability, webhook list, and webhook detail', () => {
  assert.ok(existsSync(join(root, 'src/app/(console)/api-keys/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/api-keys/create/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/api-keys/observability/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/api-keys/webhook-deliveries/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/api-keys/webhook-deliveries/[deliveryId]/page.tsx')));
});

test('api key list page stays focused on inventory and row actions', () => {
  const listSource = readFileSync(listSourcePath, 'utf8');

  assert.match(listSource, /listTenantApiKeys/);
  assert.match(listSource, /deleteTenantApiKey/);
  assert.doesNotMatch(listSource, /createTenantApiKey/);
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

test('api key observability page owns external api observability data flow', () => {
  assert.ok(existsSync(observabilitySourcePath));
  const observabilitySource = readFileSync(observabilitySourcePath, 'utf8');

  assert.match(observabilitySource, /getExternalApiObservability/);
  assert.doesNotMatch(observabilitySource, /createTenantApiKey/);
  assert.doesNotMatch(observabilitySource, /getWebhookDelivery/);
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
