import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const skillsRoot = join(root, 'src/components/skills');

function source(fileName: string) {
  return readFileSync(join(skillsRoot, fileName), 'utf8');
}

test('skill hub has separate list, create, detail, and edit routes', () => {
  assert.ok(existsSync(join(root, 'src/app/(console)/skills/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/skills/create/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/skills/[id]/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/skills/[id]/edit/page.tsx')));
});

test('skill list remains an asset index and keeps full SOP details out of table', () => {
  const listSource = source('skills-content.tsx');

  assert.match(listSource, /技能资产中心/);
  assert.match(listSource, /listSkills/);
  assert.match(listSource, /新建 Skill/);
  assert.match(listSource, /agent_reference_count/);
  assert.doesNotMatch(listSource, /execution_steps[\s\S]*<td/);
  assert.doesNotMatch(listSource, /quality_criteria[\s\S]*<td/);
  assert.doesNotMatch(listSource, /boundary_rules[\s\S]*<td/);
  assert.doesNotMatch(listSource, /SkillFormPanel[\s\S]*mode="edit"/);
});

test('skill detail owns SOP fields, version publishing, and agent references', () => {
  const detailSource = source('skill-detail-content.tsx');

  assert.match(detailSource, /getSkill/);
  assert.match(detailSource, /publishSkill/);
  assert.match(detailSource, /触发场景/);
  assert.match(detailSource, /输入要求/);
  assert.match(detailSource, /执行步骤/);
  assert.match(detailSource, /输出结构/);
  assert.match(detailSource, /质量标准/);
  assert.match(detailSource, /边界规则/);
  assert.match(detailSource, /Agent 引用/);
  assert.match(detailSource, /版本记录/);
});

test('skill create and edit pages use the shared form panel', () => {
  const createSource = source('skill-create-content.tsx');
  const editSource = source('skill-edit-content.tsx');

  assert.match(createSource, /SkillFormPanel/);
  assert.match(createSource, /mode="create"/);
  assert.match(editSource, /SkillFormPanel/);
  assert.match(editSource, /mode="edit"/);
  assert.match(source('skill-form-panel.tsx'), /trigger_scenario/);
  assert.match(source('skill-form-panel.tsx'), /quality_criteria/);
  assert.match(source('skill-form-panel.tsx'), /boundary_rules/);
});
