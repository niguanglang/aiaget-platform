import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const routesRoot = join(root, 'src/app/(console)/billing');
const componentsRoot = join(root, 'src/components/billing');

const overviewComponentPath = join(componentsRoot, 'billing-content.tsx');
const focusedPages = [
  {
    route: 'usage/page.tsx',
    component: 'billing-usage-content.tsx',
    titleKeywords: ['用量明细', 'Token', '成本列表'],
    api: ['getBillingOverview'],
    dataKeywords: ['model_costs', 'provider_costs', 'quota_overview', 'conversation_costs'],
  },
  {
    route: 'quota-policy/page.tsx',
    component: 'billing-quota-policy-content.tsx',
    titleKeywords: ['额度策略', '策略配置', '执行检查'],
    api: ['getBillingOverview', 'updateBillingQuotaPolicy', 'enforceBillingQuota'],
    dataKeywords: ['quota_policies', 'limit_value', 'warn_threshold', 'hard_threshold'],
  },
  {
    route: 'invoices/page.tsx',
    component: 'billing-invoices-content.tsx',
    titleKeywords: ['发票', '账单记录', '账单项'],
    api: [
      'getBillingOverview',
      'recalculateCurrentBillingInvoice',
      'lockBillingInvoice',
      'markBillingInvoicePaid',
      'voidBillingInvoice',
      'markBillingInvoiceOverdue',
    ],
    dataKeywords: ['invoices', 'invoice_no', 'line_items'],
  },
  {
    route: 'adjustments/page.tsx',
    component: 'billing-adjustments-content.tsx',
    titleKeywords: ['调账', '申请', '审批记录'],
    api: [
      'getBillingOverview',
      'createBillingAdjustment',
      'approveBillingAdjustment',
      'applyBillingAdjustment',
      'voidBillingAdjustment',
    ],
    dataKeywords: ['adjustments', 'adjustment_no', 'billing:adjustment:manage'],
  },
  {
    route: 'subscription/page.tsx',
    component: 'billing-subscription-content.tsx',
    titleKeywords: ['订阅', '套餐配置', '当前套餐'],
    api: ['getBillingOverview', 'updateBillingSubscription'],
    dataKeywords: ['subscription', 'plans', 'billing_cycle'],
  },
] as const;

function readSource(path: string) {
  return readFileSync(path, 'utf8');
}

test('billing route-level pages and focused components exist', () => {
  assert.ok(existsSync(join(routesRoot, 'page.tsx')));

  for (const page of focusedPages) {
    assert.ok(existsSync(join(routesRoot, page.route)), `${page.route} should exist`);
    assert.ok(existsSync(join(componentsRoot, page.component)), `${page.component} should exist`);
  }
});

test('/billing overview remains a read-oriented cost overview and entry surface', () => {
  const source = readSource(overviewComponentPath);

  assert.match(source, /成本总览/);
  assert.match(source, /getBillingOverview/);
  assert.match(source, /\/billing\/usage/);
  assert.match(source, /\/billing\/quota-policy/);
  assert.match(source, /\/billing\/invoices/);
  assert.match(source, /\/billing\/adjustments/);
  assert.match(source, /\/billing\/subscription/);

  assert.doesNotMatch(source, /createBillingAdjustment/);
  assert.doesNotMatch(source, /updateBillingQuotaPolicy/);
  assert.doesNotMatch(source, /updateBillingSubscription/);
  assert.doesNotMatch(source, /lockBillingInvoice|markBillingInvoicePaid|markBillingInvoiceOverdue|voidBillingInvoice/);
  assert.doesNotMatch(source, /新建调账单/);
  assert.doesNotMatch(source, /保存策略/);
  assert.doesNotMatch(source, /切换套餐/);
  assert.doesNotMatch(source, /状态流转/);
});

test('focused billing pages own route-specific APIs, Chinese titles, and data fields', () => {
  for (const page of focusedPages) {
    const source = readSource(join(componentsRoot, page.component));

    assert.doesNotMatch(source, /BillingContent\b/, `${page.component} should not render the overview BillingContent wrapper`);
    assert.match(source, /<main\b/, `${page.component} should render a route-level main region`);

    for (const keyword of page.titleKeywords) {
      assert.match(source, new RegExp(keyword), `${page.component} should include ${keyword}`);
    }

    for (const apiName of page.api) {
      assert.match(source, new RegExp(`\\b${apiName}\\b`), `${page.component} should own ${apiName}`);
    }

    for (const dataKeyword of page.dataKeywords) {
      assert.match(source, new RegExp(dataKeyword), `${page.component} should reference ${dataKeyword}`);
    }
  }
});

test('billing overview does not import focused page mutation APIs through shared barrels', () => {
  const source = readSource(overviewComponentPath);
  const forbiddenApis = [
    'updateBillingSubscription',
    'updateBillingQuotaPolicy',
    'createBillingAdjustment',
    'approveBillingAdjustment',
    'applyBillingAdjustment',
    'voidBillingAdjustment',
    'recalculateCurrentBillingInvoice',
    'lockBillingInvoice',
    'markBillingInvoicePaid',
    'voidBillingInvoice',
    'markBillingInvoiceOverdue',
    'enforceBillingQuota',
  ];

  for (const apiName of forbiddenApis) {
    assert.doesNotMatch(source, new RegExp(`\\b${apiName}\\b`));
  }
});

test('high-impact billing actions require explicit confirmation before mutation', () => {
  const sharedSource = readSource(join(componentsRoot, 'billing-shared.tsx'));
  const invoicesSource = readSource(join(componentsRoot, 'billing-invoices-content.tsx'));
  const adjustmentsSource = readSource(join(componentsRoot, 'billing-adjustments-content.tsx'));
  const subscriptionSource = readSource(join(componentsRoot, 'billing-subscription-content.tsx'));

  assert.match(sharedSource, /function BillingConfirmDialog/);

  assert.match(invoicesSource, /confirmAction/);
  assert.match(invoicesSource, /function confirmInvoiceAction/);
  assert.match(invoicesSource, /确认账单操作/);
  assert.match(invoicesSource, /onConfirm=\{confirmInvoiceAction\}/);

  assert.match(adjustmentsSource, /confirmAction/);
  assert.match(adjustmentsSource, /function confirmAdjustmentAction/);
  assert.match(adjustmentsSource, /确认调账操作/);
  assert.match(adjustmentsSource, /onConfirm=\{confirmAdjustmentAction\}/);

  assert.match(subscriptionSource, /confirmPlan/);
  assert.match(subscriptionSource, /function confirmPlanSelection/);
  assert.match(subscriptionSource, /确认切换套餐/);
  assert.match(subscriptionSource, /onConfirm=\{confirmPlanSelection\}/);
});

test('invoice write actions are gated by billing adjustment manage permission on the client', () => {
  const invoicesSource = readSource(join(componentsRoot, 'billing-invoices-content.tsx'));

  assert.match(invoicesSource, /hasPermission/);
  assert.match(invoicesSource, /billing:adjustment:manage/);
  assert.match(invoicesSource, /const canManage/);
  assert.match(invoicesSource, /disabled=\{!canManage \|\| recalculateInvoiceMutation\.isPending\}/);
  assert.match(invoicesSource, /canManage=\{canManage\}/);
  assert.match(invoicesSource, /disabled=\{!canManage \|\| pendingActionId === invoice\.id\}/);
});
