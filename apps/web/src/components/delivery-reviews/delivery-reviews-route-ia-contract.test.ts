import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const reviewsRoot = join(root, 'src/components/delivery-reviews');

function source(fileName: string) {
  return readFileSync(join(reviewsRoot, fileName), 'utf8');
}

function productionSources() {
  return readdirSync(reviewsRoot)
    .filter((fileName) => fileName.endsWith('.tsx') && !fileName.endsWith('.test.tsx'))
    .map((fileName) => [fileName, source(fileName)] as const);
}

test('delivery review center has separate list, create, detail, and edit routes', () => {
  assert.ok(existsSync(join(root, 'src/app/(console)/delivery-reviews/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/delivery-reviews/create/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/delivery-reviews/[id]/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/delivery-reviews/[id]/edit/page.tsx')));
});

test('delivery review list stays compact and does not embed full review details', () => {
  const listSource = source('delivery-reviews-content.tsx');

  assert.match(listSource, /验收复盘/);
  assert.match(listSource, /listDeliveryReviews/);
  assert.match(listSource, /新建复盘/);
  assert.match(listSource, /acceptance_score/);
  assert.doesNotMatch(listSource, /delivered_scope[\s\S]*<td/);
  assert.doesNotMatch(listSource, /improvement_actions[\s\S]*<td/);
  assert.doesNotMatch(listSource, /expansion_plan[\s\S]*<td/);
  assert.doesNotMatch(listSource, /DeliveryReviewFormPanel[\s\S]*mode="edit"/);
});

test('delivery review production components use the unified wide white operations shell', () => {
  assert.equal(existsSync(join(reviewsRoot, 'delivery-review-background.tsx')), false);

  for (const [fileName, fileSource] of productionSources()) {
    assert.doesNotMatch(fileSource, /motion\/react/, `${fileName} must not import motion/react`);
    assert.doesNotMatch(fileSource, /motion\./, `${fileName} must not render motion components`);
    assert.doesNotMatch(fileSource, /MetricCard/, `${fileName} must not use the legacy MetricCard shell`);
    assert.doesNotMatch(fileSource, /max-w-7xl/, `${fileName} must not constrain the operations shell to max-w-7xl`);
    assert.doesNotMatch(fileSource, /DeliveryReviewBackground/, `${fileName} must not use the legacy background shell`);
  }
});

test('delivery review detail owns full acceptance, issues, improvements and expansion plan', () => {
  const detailSource = source('delivery-review-detail-content.tsx');

  assert.match(detailSource, /getDeliveryReview/);
  assert.match(detailSource, /已交付范围/);
  assert.match(detailSource, /验收结论/);
  assert.match(detailSource, /问题复盘/);
  assert.match(detailSource, /改进行动/);
  assert.match(detailSource, /扩展计划/);
  assert.match(detailSource, /可复用资产/);
  assert.match(detailSource, /关联方案包/);
});

test('delivery review create and edit pages use the shared form panel', () => {
  const createSource = source('delivery-review-create-content.tsx');
  const editSource = source('delivery-review-edit-content.tsx');
  const formSource = source('delivery-review-form-panel.tsx');

  assert.match(createSource, /DeliveryReviewFormPanel/);
  assert.match(createSource, /mode="create"/);
  assert.match(editSource, /DeliveryReviewFormPanel/);
  assert.match(editSource, /mode="edit"/);
  assert.match(formSource, /solution_package_id/);
  assert.match(formSource, /delivered_scope/);
  assert.match(formSource, /improvement_actions/);
  assert.match(formSource, /reusable_assets/);
});
