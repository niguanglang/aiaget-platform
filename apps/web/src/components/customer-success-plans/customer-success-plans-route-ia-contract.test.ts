import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const plansRoot = join(root, 'src/components/customer-success-plans');

function source(fileName: string) {
  return readFileSync(join(plansRoot, fileName), 'utf8');
}

test('customer success plan center has separate list, create, detail, and edit routes', () => {
  assert.ok(existsSync(join(root, 'src/app/(console)/customer-success-plans/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/customer-success-plans/create/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/customer-success-plans/[id]/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/customer-success-plans/[id]/edit/page.tsx')));
});

test('customer success plan list stays compact and does not embed full plan details', () => {
  const listSource = source('customer-success-plans-content.tsx');

  assert.match(listSource, /客户成功/);
  assert.match(listSource, /listCustomerSuccessPlans/);
  assert.match(listSource, /新建计划/);
  assert.match(listSource, /success_score/);
  assert.doesNotMatch(listSource, /success_objectives[\s\S]*<td/);
  assert.doesNotMatch(listSource, /stakeholder_plan[\s\S]*<td/);
  assert.doesNotMatch(listSource, /asset_reuse_plan[\s\S]*<td/);
  assert.doesNotMatch(listSource, /risk_summary[\s\S]*<td/);
  assert.doesNotMatch(listSource, /CustomerSuccessPlanFormPanel[\s\S]*mode="edit"/);
});

test('customer success plan detail owns objectives, stakeholder plan, reuse, renewal, risks and resources', () => {
  const detailSource = source('customer-success-plan-detail-content.tsx');

  assert.match(detailSource, /getCustomerSuccessPlan/);
  assert.match(detailSource, /成功目标/);
  assert.match(detailSource, /干系人计划/);
  assert.match(detailSource, /资产复用计划/);
  assert.match(detailSource, /续约计划/);
  assert.match(detailSource, /风险摘要/);
  assert.match(detailSource, /下一步动作/);
  assert.match(detailSource, /来源复盘/);
  assert.match(detailSource, /成果资产/);
});

test('customer success plan create and edit pages use the shared form panel', () => {
  const createSource = source('customer-success-plan-create-content.tsx');
  const editSource = source('customer-success-plan-edit-content.tsx');
  const formSource = source('customer-success-plan-form-panel.tsx');

  assert.match(createSource, /CustomerSuccessPlanFormPanel/);
  assert.match(createSource, /mode="create"/);
  assert.match(editSource, /CustomerSuccessPlanFormPanel/);
  assert.match(editSource, /mode="edit"/);
  assert.match(formSource, /delivery_review_id/);
  assert.match(formSource, /delivery_asset_id/);
  assert.match(formSource, /success_objectives/);
  assert.match(formSource, /asset_reuse_plan/);
});
