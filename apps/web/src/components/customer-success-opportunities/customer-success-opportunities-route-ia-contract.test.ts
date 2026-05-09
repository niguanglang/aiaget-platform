import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const opportunitiesRoot = join(root, 'src/components/customer-success-opportunities');

function source(fileName: string) {
  return readFileSync(join(opportunitiesRoot, fileName), 'utf8');
}

test('customer success opportunity center has separate list, create, detail, and edit routes', () => {
  assert.ok(existsSync(join(root, 'src/app/(console)/customer-success-opportunities/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/customer-success-opportunities/create/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/customer-success-opportunities/[id]/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/customer-success-opportunities/[id]/edit/page.tsx')));
});

test('customer success opportunity list stays compact and does not embed full commercial details', () => {
  const listSource = source('customer-success-opportunities-content.tsx');

  assert.match(listSource, /续约机会/);
  assert.match(listSource, /listCustomerSuccessOpportunities/);
  assert.match(listSource, /新建机会/);
  assert.match(listSource, /opportunity_score/);
  assert.doesNotMatch(listSource, /customer_value[\s\S]*<td/);
  assert.doesNotMatch(listSource, /commercial_strategy[\s\S]*<td/);
  assert.doesNotMatch(listSource, /decision_path[\s\S]*<td/);
  assert.doesNotMatch(listSource, /risk_summary[\s\S]*<td/);
  assert.doesNotMatch(listSource, /CustomerSuccessOpportunityFormPanel[\s\S]*mode="edit"/);
});

test('customer success opportunity detail owns value, strategy, decision path, risks and resources', () => {
  const detailSource = source('customer-success-opportunity-detail-content.tsx');

  assert.match(detailSource, /getCustomerSuccessOpportunity/);
  assert.match(detailSource, /客户价值/);
  assert.match(detailSource, /商务策略/);
  assert.match(detailSource, /决策路径/);
  assert.match(detailSource, /风险摘要/);
  assert.match(detailSource, /下一步动作/);
  assert.match(detailSource, /客户成功计划/);
  assert.match(detailSource, /成功行动/);
  assert.match(detailSource, /来源复盘/);
  assert.match(detailSource, /成果资产/);
});

test('customer success opportunity create and edit pages use the shared form panel', () => {
  const createSource = source('customer-success-opportunity-create-content.tsx');
  const editSource = source('customer-success-opportunity-edit-content.tsx');
  const formSource = source('customer-success-opportunity-form-panel.tsx');

  assert.match(createSource, /CustomerSuccessOpportunityFormPanel/);
  assert.match(createSource, /mode="create"/);
  assert.match(editSource, /CustomerSuccessOpportunityFormPanel/);
  assert.match(editSource, /mode="edit"/);
  assert.match(formSource, /customer_success_plan_id/);
  assert.match(formSource, /customer_success_action_id/);
  assert.match(formSource, /commercial_strategy/);
  assert.match(formSource, /decision_path/);
});
