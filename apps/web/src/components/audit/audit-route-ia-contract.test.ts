import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const auditListSource = readFileSync(join(process.cwd(), 'src/components/audit/audit-content.tsx'), 'utf8');
const auditDetailSourcePath = join(process.cwd(), 'src/components/audit/audit-event-detail-content.tsx');
const auditDetailSource = existsSync(auditDetailSourcePath) ? readFileSync(auditDetailSourcePath, 'utf8') : '';

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
