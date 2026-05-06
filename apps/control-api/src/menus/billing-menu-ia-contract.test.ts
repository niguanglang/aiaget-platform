import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const seedText = readFileSync(join(process.cwd(), 'prisma/seed.ts'), 'utf8');

const expectedBillingRoutes = [
  { code: 'billing', path: '/billing', component: 'billing/page' },
  { code: 'billing_usage', path: '/billing/usage', component: 'billing/usage/page' },
  { code: 'billing_quota_policy', path: '/billing/quota-policy', component: 'billing/quota-policy/page' },
  { code: 'billing_invoices', path: '/billing/invoices', component: 'billing/invoices/page' },
  { code: 'billing_adjustments', path: '/billing/adjustments', component: 'billing/adjustments/page' },
  { code: 'billing_subscription', path: '/billing/subscription', component: 'billing/subscription/page' },
] as const;

test('billing IA static child pages are present in menu seed', () => {
  for (const route of expectedBillingRoutes) {
    assert.match(seedText, new RegExp(`code: '${route.code}'[\\s\\S]*path: '${route.path}'[\\s\\S]*component: '${route.component}'`));
  }
});

test('billing menu seed does not include dynamic or form-detail routes', () => {
  assert.doesNotMatch(seedText, /path: '\/billing\/[^']*\[id\]/);
  assert.doesNotMatch(seedText, /path: '\/billing\/[^']*\/(?:create|edit|new)'/);
  assert.doesNotMatch(seedText, /component: 'billing\/[^']*\[id\]/);
});

test('billing adjustment child menu uses center view permission because it reads billing overview', () => {
  assert.match(
    seedText,
    /code: 'billing_adjustments'[\s\S]*permissionCode: PERMISSION_CODES\.billingCenterView/,
  );
  assert.doesNotMatch(
    seedText,
    /code: 'billing_adjustments'[\s\S]*permissionCode: PERMISSION_CODES\.billingAdjustmentView/,
  );
});
