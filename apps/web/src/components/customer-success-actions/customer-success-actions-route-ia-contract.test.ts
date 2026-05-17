import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const actionsRoot = join(root, 'src/components/customer-success-actions');

function source(fileName: string) {
  return readFileSync(join(actionsRoot, fileName), 'utf8');
}

function productionSources() {
  return readdirSync(actionsRoot)
    .filter((fileName) => fileName.endsWith('.tsx') && !fileName.endsWith('.test.tsx'))
    .map((fileName) => [fileName, source(fileName)] as const);
}

test('customer success action center has separate list, create, detail, and edit routes', () => {
  assert.ok(existsSync(join(root, 'src/app/(console)/customer-success-actions/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/customer-success-actions/create/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/customer-success-actions/[id]/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/customer-success-actions/[id]/edit/page.tsx')));
});

test('customer success action list stays compact and does not embed full execution details', () => {
  const listSource = source('customer-success-actions-content.tsx');

  assert.match(listSource, /成功行动/);
  assert.match(listSource, /listCustomerSuccessActions/);
  assert.match(listSource, /新建行动/);
  assert.match(listSource, /action_score/);
  assert.doesNotMatch(listSource, /expected_outcome[\s\S]*<td/);
  assert.doesNotMatch(listSource, /execution_notes[\s\S]*<td/);
  assert.doesNotMatch(listSource, /blocker_summary[\s\S]*<td/);
  assert.doesNotMatch(listSource, /completion_evidence[\s\S]*<td/);
  assert.doesNotMatch(listSource, /CustomerSuccessActionFormPanel[\s\S]*mode="edit"/);
});

test('customer success action production components use the unified wide white operations shell', () => {
  assert.equal(existsSync(join(actionsRoot, 'customer-success-action-background.tsx')), false);

  for (const [fileName, fileSource] of productionSources()) {
    assert.doesNotMatch(fileSource, /motion\/react/, `${fileName} must not import motion/react`);
    assert.doesNotMatch(fileSource, /motion\./, `${fileName} must not render motion components`);
    assert.doesNotMatch(fileSource, /MetricCard/, `${fileName} must not use the legacy MetricCard shell`);
    assert.doesNotMatch(fileSource, /max-w-7xl/, `${fileName} must not constrain the operations shell to max-w-7xl`);
    assert.doesNotMatch(fileSource, /CustomerSuccessActionBackground/, `${fileName} must not use the legacy background shell`);
  }
});

test('customer success action detail owns outcome, execution notes, blockers, evidence and resources', () => {
  const detailSource = source('customer-success-action-detail-content.tsx');

  assert.match(detailSource, /getCustomerSuccessAction/);
  assert.match(detailSource, /预期结果/);
  assert.match(detailSource, /执行记录/);
  assert.match(detailSource, /阻塞风险/);
  assert.match(detailSource, /完成证据/);
  assert.match(detailSource, /下一步动作/);
  assert.match(detailSource, /客户成功计划/);
  assert.match(detailSource, /来源复盘/);
  assert.match(detailSource, /成果资产/);
});

test('customer success action create and edit pages use the shared form panel', () => {
  const createSource = source('customer-success-action-create-content.tsx');
  const editSource = source('customer-success-action-edit-content.tsx');
  const formSource = source('customer-success-action-form-panel.tsx');

  assert.match(createSource, /CustomerSuccessActionFormPanel/);
  assert.match(createSource, /mode="create"/);
  assert.match(editSource, /CustomerSuccessActionFormPanel/);
  assert.match(editSource, /mode="edit"/);
  assert.match(formSource, /customer_success_plan_id/);
  assert.match(formSource, /delivery_review_id/);
  assert.match(formSource, /expected_outcome/);
  assert.match(formSource, /completion_evidence/);
});
