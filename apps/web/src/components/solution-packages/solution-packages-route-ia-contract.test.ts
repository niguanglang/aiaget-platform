import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const packagesRoot = join(root, 'src/components/solution-packages');

function source(fileName: string) {
  return readFileSync(join(packagesRoot, fileName), 'utf8');
}

test('solution package center has separate list, create, detail, and edit routes', () => {
  assert.ok(existsSync(join(root, 'src/app/(console)/solution-packages/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/solution-packages/create/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/solution-packages/[id]/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/solution-packages/[id]/edit/page.tsx')));
});

test('solution package list stays compact and does not embed full delivery details', () => {
  const listSource = source('solution-packages-content.tsx');

  assert.match(listSource, /落地方案包/);
  assert.match(listSource, /listSolutionPackages/);
  assert.match(listSource, /新建方案包/);
  assert.match(listSource, /package_score/);
  assert.doesNotMatch(listSource, /acceptance_plan[\s\S]*<td/);
  assert.doesNotMatch(listSource, /risk_mitigation[\s\S]*<td/);
  assert.doesNotMatch(listSource, /SolutionPackageFormPanel[\s\S]*mode="edit"/);
});

test('solution package detail owns roadmap, acceptance, ROI, risks and linked resources', () => {
  const detailSource = source('solution-package-detail-content.tsx');

  assert.match(detailSource, /getSolutionPackage/);
  assert.match(detailSource, /方案摘要/);
  assert.match(detailSource, /交付路线图/);
  assert.match(detailSource, /验收计划/);
  assert.match(detailSource, /ROI 摘要/);
  assert.match(detailSource, /风险缓释/);
  assert.match(detailSource, /商务推进/);
  assert.match(detailSource, /关联资源/);
  assert.match(detailSource, /客户评估/);
  assert.match(detailSource, /岗位场景/);
});

test('solution package create and edit pages use the shared form panel', () => {
  const createSource = source('solution-package-create-content.tsx');
  const editSource = source('solution-package-edit-content.tsx');
  const formSource = source('solution-package-form-panel.tsx');

  assert.match(createSource, /SolutionPackageFormPanel/);
  assert.match(createSource, /mode="create"/);
  assert.match(editSource, /SolutionPackageFormPanel/);
  assert.match(editSource, /mode="edit"/);
  assert.match(formSource, /delivery_roadmap/);
  assert.match(formSource, /acceptance_plan/);
  assert.match(formSource, /customer_assessment_id/);
  assert.match(formSource, /role_scenario_id/);
});
