import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const routeFiles = [
  'src/app/(console)/departments/page.tsx',
  'src/app/(console)/departments/create/page.tsx',
  'src/app/(console)/departments/[id]/page.tsx',
  'src/app/(console)/departments/[id]/edit/page.tsx',
].map((file) => join(root, file));

const listPageText = readFileSync(join(root, 'src/app/(console)/departments/page.tsx'), 'utf8');
const componentText = readFileSync(join(root, 'src/components/departments/department-content.tsx'), 'utf8');
const formPanelText = readFileSync(join(root, 'src/components/departments/department-form-panel.tsx'), 'utf8');
const createText = readFileSync(join(root, 'src/components/departments/department-create-content.tsx'), 'utf8');
const detailText = readFileSync(join(root, 'src/components/departments/department-detail-content.tsx'), 'utf8');
const editText = readFileSync(join(root, 'src/components/departments/department-edit-content.tsx'), 'utf8');
const productionTexts = [componentText, formPanelText, createText, detailText, editText];

test('department routes are split into list, create, detail, and edit pages', () => {
  for (const file of routeFiles) {
    assert.ok(existsSync(file), `Expected route file to exist: ${file}`);
  }
});

test('department list page stays focused on browse and row actions only', () => {
  assert.match(listPageText, /DepartmentContent/);
  assert.doesNotMatch(componentText, /selectedDepartmentId/);
  assert.doesNotMatch(componentText, /editingDepartment/);
  assert.doesNotMatch(componentText, /formMode/);
  assert.doesNotMatch(componentText, /createDepartment/);
  assert.doesNotMatch(componentText, /updateDepartment/);
  assert.doesNotMatch(componentText, /getDepartment\(/);
  assert.doesNotMatch(componentText, /DepartmentFormPanel/);
});

test('department detail create and edit content use dedicated data flows', () => {
  assert.doesNotMatch(componentText, /createDepartment/);
  assert.doesNotMatch(componentText, /updateDepartment/);
  assert.match(createText, /createDepartment/);
  assert.doesNotMatch(createText, /updateDepartment/);
  assert.doesNotMatch(createText, /getDepartment\(/);
  assert.match(detailText, /getDepartment/);
  assert.doesNotMatch(detailText, /createDepartment/);
  assert.doesNotMatch(detailText, /updateDepartment/);
  assert.match(editText, /getDepartment/);
  assert.match(editText, /updateDepartment/);
  assert.doesNotMatch(editText, /createDepartment/);
  assert.doesNotMatch(formPanelText, /createDepartment/);
  assert.doesNotMatch(formPanelText, /updateDepartment/);
  assert.doesNotMatch(formPanelText, /selectedDepartment/);
});

test('department status changes require confirmation before mutation', () => {
  assert.match(componentText, /departmentStatusTarget/);
  assert.match(componentText, /function confirmDepartmentStatusChange/);
  assert.match(componentText, /确认更新部门状态/);
  assert.match(componentText, /onConfirm=\{confirmDepartmentStatusChange\}/);
  assert.match(detailText, /departmentStatusTarget/);
  assert.match(detailText, /function confirmDepartmentStatusChange/);
  assert.match(detailText, /确认更新部门状态/);
  assert.match(detailText, /onConfirm=\{confirmDepartmentStatusChange\}/);
  assert.doesNotMatch(componentText, /onToggle=\{\(department\) =>\s*statusMutation\.mutate/);
  assert.doesNotMatch(detailText, /onClick=\{\(\) =>\s*statusMutation\.mutate/);
});

test('department route production components use the operations shell without legacy visual wrappers', () => {
  for (const source of productionTexts) {
    assert.doesNotMatch(source, /motion\/react/);
    assert.doesNotMatch(source, /motion\./);
    assert.doesNotMatch(source, /MetricCard/);
    assert.doesNotMatch(source, /max-w-7xl/);
    assert.doesNotMatch(source, /DepartmentCenterBackground/);
    assert.doesNotMatch(source, /department-center-background/);
  }
});
