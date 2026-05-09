import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const assetsRoot = join(root, 'src/components/delivery-assets');

function source(fileName: string) {
  return readFileSync(join(assetsRoot, fileName), 'utf8');
}

test('delivery asset center has separate list, create, detail, and edit routes', () => {
  assert.ok(existsSync(join(root, 'src/app/(console)/delivery-assets/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/delivery-assets/create/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/delivery-assets/[id]/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/delivery-assets/[id]/edit/page.tsx')));
});

test('delivery asset list stays compact and does not embed full asset details', () => {
  const listSource = source('delivery-assets-content.tsx');

  assert.match(listSource, /成果资产/);
  assert.match(listSource, /listDeliveryAssets/);
  assert.match(listSource, /新建资产/);
  assert.match(listSource, /reuse_score/);
  assert.doesNotMatch(listSource, /business_value[\s\S]*<td/);
  assert.doesNotMatch(listSource, /source_context[\s\S]*<td/);
  assert.doesNotMatch(listSource, /risk_notes[\s\S]*<td/);
  assert.doesNotMatch(listSource, /DeliveryAssetFormPanel[\s\S]*mode="edit"/);
});

test('delivery asset detail owns value, guidance, source, risks and linked resources', () => {
  const detailSource = source('delivery-asset-detail-content.tsx');

  assert.match(detailSource, /getDeliveryAsset/);
  assert.match(detailSource, /业务价值/);
  assert.match(detailSource, /复用指引/);
  assert.match(detailSource, /来源上下文/);
  assert.match(detailSource, /风险说明/);
  assert.match(detailSource, /下一步动作/);
  assert.match(detailSource, /关联复盘/);
  assert.match(detailSource, /关联方案包/);
});

test('delivery asset create and edit pages use the shared form panel', () => {
  const createSource = source('delivery-asset-create-content.tsx');
  const editSource = source('delivery-asset-edit-content.tsx');
  const formSource = source('delivery-asset-form-panel.tsx');

  assert.match(createSource, /DeliveryAssetFormPanel/);
  assert.match(createSource, /mode="create"/);
  assert.match(editSource, /DeliveryAssetFormPanel/);
  assert.match(editSource, /mode="edit"/);
  assert.match(formSource, /delivery_review_id/);
  assert.match(formSource, /solution_package_id/);
  assert.match(formSource, /business_value/);
  assert.match(formSource, /reuse_guidance/);
});
