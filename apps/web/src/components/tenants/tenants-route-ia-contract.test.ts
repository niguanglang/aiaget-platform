import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const tenantsListSource = readFileSync(join(process.cwd(), 'src/components/tenants/tenants-content.tsx'), 'utf8');
const tenantDetailSourcePath = join(process.cwd(), 'src/components/tenants/tenant-detail-content.tsx');
const tenantEditSourcePath = join(process.cwd(), 'src/components/tenants/tenant-edit-content.tsx');

test('tenant center route-level pages exist for list, detail, and edit', () => {
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/tenants/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/tenants/[id]/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/tenants/[id]/edit/page.tsx')));
});

test('tenant list page keeps detail and edit workflows out of the list surface', () => {
  assert.match(tenantsListSource, /listTenants/);
  assert.doesNotMatch(tenantsListSource, /\bgetTenant\b/);
  assert.doesNotMatch(tenantsListSource, /\bupdateTenant\b/);
  assert.doesNotMatch(tenantsListSource, /selectedTenant/);
  assert.doesNotMatch(tenantsListSource, /editingTenant/);
  assert.doesNotMatch(tenantsListSource, /useForm/);
  assert.doesNotMatch(tenantsListSource, /zodResolver/);
});

test('tenant dedicated pages own detail and edit API workflows', () => {
  assert.ok(existsSync(tenantDetailSourcePath));
  assert.ok(existsSync(tenantEditSourcePath));

  const detailSource = readFileSync(tenantDetailSourcePath, 'utf8');
  const editSource = readFileSync(tenantEditSourcePath, 'utf8');

  assert.match(detailSource, /\bgetTenant\b/);
  assert.doesNotMatch(detailSource, /\bupdateTenant\b/);
  assert.match(editSource, /\bgetTenant\b/);
  assert.match(editSource, /\bupdateTenant\b/);
});
