import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const scenariosRoot = join(root, 'src/components/role-scenarios');

function source(fileName: string) {
  return readFileSync(join(scenariosRoot, fileName), 'utf8');
}

test('role scenario center has separate list, create, detail, and edit routes', () => {
  assert.ok(existsSync(join(root, 'src/app/(console)/role-scenarios/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/role-scenarios/create/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/role-scenarios/[id]/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/role-scenarios/[id]/edit/page.tsx')));
});

test('role scenario list stays compact and does not embed full delivery details', () => {
  const listSource = source('role-scenarios-content.tsx');

  assert.match(listSource, /岗位场景编排/);
  assert.match(listSource, /listRoleScenarios/);
  assert.match(listSource, /新建场景包/);
  assert.match(listSource, /impact_score/);
  assert.doesNotMatch(listSource, /acceptance_criteria[\s\S]*<td/);
  assert.doesNotMatch(listSource, /sample_deliverable[\s\S]*<td/);
  assert.doesNotMatch(listSource, /RoleScenarioFormPanel[\s\S]*mode="edit"/);
});

test('role scenario detail owns workflow, deliverables, acceptance and linked assets', () => {
  const detailSource = source('role-scenario-detail-content.tsx');

  assert.match(detailSource, /getRoleScenario/);
  assert.match(detailSource, /业务痛点/);
  assert.match(detailSource, /流程编排/);
  assert.match(detailSource, /交付成果/);
  assert.match(detailSource, /验收标准/);
  assert.match(detailSource, /ROI 指标/);
  assert.match(detailSource, /关联资产/);
  assert.match(detailSource, /Agent/);
  assert.match(detailSource, /Skill/);
  assert.match(detailSource, /知识库/);
  assert.match(detailSource, /工具/);
  assert.match(detailSource, /提示词/);
});

test('role scenario create and edit pages use the shared form panel', () => {
  const createSource = source('role-scenario-create-content.tsx');
  const editSource = source('role-scenario-edit-content.tsx');
  const formSource = source('role-scenario-form-panel.tsx');

  assert.match(createSource, /RoleScenarioFormPanel/);
  assert.match(createSource, /mode="create"/);
  assert.match(editSource, /RoleScenarioFormPanel/);
  assert.match(editSource, /mode="edit"/);
  assert.match(formSource, /workflow_summary/);
  assert.match(formSource, /acceptance_criteria/);
  assert.match(formSource, /agent_id/);
  assert.match(formSource, /skill_id/);
}
);
