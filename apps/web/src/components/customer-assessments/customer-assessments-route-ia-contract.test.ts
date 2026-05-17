import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const assessmentsRoot = join(root, 'src/components/customer-assessments');

function source(fileName: string) {
  return readFileSync(join(assessmentsRoot, fileName), 'utf8');
}

function productionSources() {
  return readdirSync(assessmentsRoot)
    .filter((fileName) => fileName.endsWith('.tsx') && !fileName.endsWith('.test.tsx'))
    .map((fileName) => [fileName, source(fileName)] as const);
}

test('customer assessment center has separate list, create, detail, and edit routes', () => {
  assert.ok(existsSync(join(root, 'src/app/(console)/customer-assessments/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/customer-assessments/create/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/customer-assessments/[id]/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/customer-assessments/[id]/edit/page.tsx')));
});

test('customer assessment list stays compact and keeps full six-question details out of table', () => {
  const listSource = source('customer-assessments-content.tsx');

  assert.match(listSource, /客户分层评估/);
  assert.match(listSource, /listCustomerAssessments/);
  assert.match(listSource, /新建评估/);
  assert.match(listSource, /readiness_score/);
  assert.doesNotMatch(listSource, /six_question_scores[\s\S]*<td/);
  assert.doesNotMatch(listSource, /management_support[\s\S]*<td/);
  assert.doesNotMatch(listSource, /CustomerAssessmentFormPanel[\s\S]*mode="edit"/);
});

test('customer assessment production components use the unified wide white operations shell', () => {
  assert.equal(existsSync(join(assessmentsRoot, 'customer-assessment-background.tsx')), false);

  for (const [fileName, fileSource] of productionSources()) {
    assert.doesNotMatch(fileSource, /motion\/react/, `${fileName} must not import motion/react`);
    assert.doesNotMatch(fileSource, /motion\./, `${fileName} must not render motion components`);
    assert.doesNotMatch(fileSource, /MetricCard/, `${fileName} must not use the legacy MetricCard shell`);
    assert.doesNotMatch(fileSource, /max-w-7xl/, `${fileName} must not constrain the operations shell to max-w-7xl`);
    assert.doesNotMatch(fileSource, /CustomerAssessmentBackground/, `${fileName} must not use the legacy background shell`);
  }
});

test('customer assessment detail owns six-question answers, strategy, risks, and next action', () => {
  const detailSource = source('customer-assessment-detail-content.tsx');

  assert.match(detailSource, /getCustomerAssessment/);
  assert.match(detailSource, /客户分层/);
  assert.match(detailSource, /六问判断/);
  assert.match(detailSource, /经营目标/);
  assert.match(detailSource, /流程成熟度/);
  assert.match(detailSource, /知识资产/);
  assert.match(detailSource, /管理层推动/);
  assert.match(detailSource, /建议打法/);
  assert.match(detailSource, /风险提示/);
  assert.match(detailSource, /下一步动作/);
});

test('customer assessment create and edit pages use the shared form panel', () => {
  const createSource = source('customer-assessment-create-content.tsx');
  const editSource = source('customer-assessment-edit-content.tsx');

  assert.match(createSource, /CustomerAssessmentFormPanel/);
  assert.match(createSource, /mode="create"/);
  assert.match(editSource, /CustomerAssessmentFormPanel/);
  assert.match(editSource, /mode="edit"/);
  assert.match(source('customer-assessment-form-panel.tsx'), /customer_type_clarity/);
  assert.match(source('customer-assessment-form-panel.tsx'), /management_budget/);
  assert.match(source('customer-assessment-form-panel.tsx'), /business_goal/);
});
