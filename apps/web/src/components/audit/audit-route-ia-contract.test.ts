import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const auditComponentsRoot = join(process.cwd(), 'src/components/audit');
const auditListSource = readFileSync(join(process.cwd(), 'src/components/audit/audit-content.tsx'), 'utf8');
const auditDetailSourcePath = join(process.cwd(), 'src/components/audit/audit-event-detail-content.tsx');
const auditDetailSource = existsSync(auditDetailSourcePath) ? readFileSync(auditDetailSourcePath, 'utf8') : '';

function readComponentSources(root: string) {
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.tsx') && !entry.name.endsWith('.test.tsx'))
    .map((entry) => [entry.name, readFileSync(join(root, entry.name), 'utf8')] as const);
}

test('audit center route-level pages exist for list and event detail', () => {
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/audit/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/audit/events/[id]/page.tsx')));
});

test('audit list page keeps event detail query and panel out of the list surface', () => {
  assert.doesNotMatch(auditListSource, /AuditDetailPanel/);
  assert.doesNotMatch(auditListSource, /activeEventId/);
  assert.doesNotMatch(auditListSource, /getAuditEvent/);
  assert.match(auditListSource, /listAuditEvents/);
  assert.match(auditListSource, /\/audit\/events\/\$\{event\.event_id\}/);
});

test('audit list page exposes billing audit source and close-won search vocabulary', () => {
  assert.match(auditListSource, /billing/);
  assert.match(auditListSource, /调账单号/);
  assert.match(auditListSource, /机会名/);
  assert.match(auditListSource, /客户名/);
});

test('audit event detail page owns getAuditEvent query', () => {
  assert.match(auditDetailSource, /getAuditEvent/);
  assert.match(auditDetailSource, /request_summary/);
});

test('audit components do not depend on the legacy console shell', () => {
  for (const [fileName, componentSource] of readComponentSources(auditComponentsRoot)) {
    assert.doesNotMatch(componentSource, /MetricCard/, fileName);
    assert.doesNotMatch(componentSource, /motion\/react/, fileName);
    assert.doesNotMatch(componentSource, /max-w-7xl/, fileName);
    assert.doesNotMatch(componentSource, /AuditCenterBackground|bg-\[radial-gradient|\[background-image:linear-gradient/, fileName);
  }
});
