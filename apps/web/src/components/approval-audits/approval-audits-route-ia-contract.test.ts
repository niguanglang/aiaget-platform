import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const componentRoot = join(root, 'src/components/approval-audits');

function source(fileName: string) {
  return readFileSync(join(componentRoot, fileName), 'utf8');
}

test('approval audit route-level pages and focused components exist', () => {
  assert.ok(existsSync(join(root, 'src/app/(console)/approval-audits/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/approval-audits/events/[eventId]/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/approval-audits/archives/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/approval-audits/archives/create/page.tsx')));

  assert.ok(existsSync(join(componentRoot, 'approval-audit-shared.tsx')));
  assert.ok(existsSync(join(componentRoot, 'approval-audit-event-detail-content.tsx')));
  assert.ok(existsSync(join(componentRoot, 'approval-audit-archives-content.tsx')));
  assert.ok(existsSync(join(componentRoot, 'approval-audit-archive-create-content.tsx')));
});

test('approval audit list page owns overview, filters, and event table only', () => {
  const listSource = source('approval-audit-content.tsx');

  assert.match(listSource, /审批审计/);
  assert.match(listSource, /getApprovalAuditOverview/);
  assert.match(listSource, /listApprovalAuditEvents/);
  assert.match(listSource, /\/approval-audits\/events\/\$\{event\.id\}/);
  assert.match(listSource, /\/approval-audits\/archives/);
  assert.match(listSource, /\/approval-audits\/archives\/create/);

  assert.doesNotMatch(listSource, /selectedEventId/);
  assert.doesNotMatch(listSource, /activeEventId/);
  assert.doesNotMatch(listSource, /getApprovalAuditEvent/);
  assert.doesNotMatch(listSource, /listApprovalAuditArchives/);
  assert.doesNotMatch(listSource, /createApprovalAuditArchive/);
  assert.doesNotMatch(listSource, /getApprovalAuditArchiveDownloadUrl/);
  assert.doesNotMatch(listSource, /deleteApprovalAuditArchive/);
  assert.doesNotMatch(listSource, /ApprovalAuditDetailPanel/);
  assert.doesNotMatch(listSource, /ApprovalAuditArchivePanel/);
});

test('approval audit event detail page owns event detail lookup and related links', () => {
  const detailSource = source('approval-audit-event-detail-content.tsx');

  assert.match(detailSource, /审批审计事件详情/);
  assert.match(detailSource, /getApprovalAuditEvent/);
  assert.match(detailSource, /事件元数据/);
  assert.match(detailSource, /\/approvals/);
  assert.match(detailSource, /\/monitor/);

  assert.doesNotMatch(detailSource, /listApprovalAuditEvents/);
  assert.doesNotMatch(detailSource, /listApprovalAuditArchives/);
  assert.doesNotMatch(detailSource, /createApprovalAuditArchive/);
  assert.doesNotMatch(detailSource, /deleteApprovalAuditArchive/);
});

test('approval audit archives page owns archive list, download, and delete request workflow', () => {
  const archivesSource = source('approval-audit-archives-content.tsx');

  assert.match(archivesSource, /审批审计归档/);
  assert.match(archivesSource, /listApprovalAuditArchives/);
  assert.match(archivesSource, /getApprovalAuditArchiveDownloadUrl/);
  assert.match(archivesSource, /deleteApprovalAuditArchive/);
  assert.match(archivesSource, /window\.confirm/);

  assert.doesNotMatch(archivesSource, /getApprovalAuditEvent/);
  assert.doesNotMatch(archivesSource, /listApprovalAuditEvents/);
  assert.doesNotMatch(archivesSource, /createApprovalAuditArchive/);
  assert.doesNotMatch(archivesSource, /exportApprovalAuditEvents/);
});

test('approval audit archive create page owns export and archive generation workflow', () => {
  const createSource = source('approval-audit-archive-create-content.tsx');

  assert.match(createSource, /生成审批审计归档/);
  assert.match(createSource, /createApprovalAuditArchive/);
  assert.match(createSource, /exportApprovalAuditEvents/);
  assert.match(createSource, /traceOnly/);

  assert.doesNotMatch(createSource, /getApprovalAuditEvent/);
  assert.doesNotMatch(createSource, /listApprovalAuditArchives/);
  assert.doesNotMatch(createSource, /getApprovalAuditArchiveDownloadUrl/);
  assert.doesNotMatch(createSource, /deleteApprovalAuditArchive/);
});
