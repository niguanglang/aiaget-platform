import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const componentRoot = join(root, 'src/components/approval-audits');

function source(fileName: string) {
  return readFileSync(join(componentRoot, fileName), 'utf8');
}

const productionFileNames = [
  'approval-audit-content.tsx',
  'approval-audit-event-detail-content.tsx',
  'approval-audit-archives-content.tsx',
  'approval-audit-archive-create-content.tsx',
  'approval-audit-shared.tsx',
];

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
  const sharedSource = source('approval-audit-shared.tsx');

  assert.match(archivesSource, /审批审计归档/);
  assert.match(archivesSource, /listApprovalAuditArchives/);
  assert.match(archivesSource, /getApprovalAuditArchiveDownloadUrl/);
  assert.match(archivesSource, /deleteApprovalAuditArchive/);
  assert.match(sharedSource, /function ApprovalAuditConfirmDialog/);
  assert.match(archivesSource, /archiveDeleteTarget/);
  assert.match(archivesSource, /function confirmArchiveDeleteRequest/);
  assert.match(archivesSource, /确认申请删除审批审计归档/);
  assert.match(archivesSource, /onConfirm=\{confirmArchiveDeleteRequest\}/);
  assert.doesNotMatch(archivesSource, /window\.confirm/);

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

test('approval audit archive generation requires confirmation before mutation', () => {
  const createSource = source('approval-audit-archive-create-content.tsx');

  assert.match(createSource, /archiveCreateTarget/);
  assert.match(createSource, /function confirmArchiveCreate/);
  assert.match(createSource, /确认生成审批审计归档/);
  assert.match(createSource, /ApprovalAuditConfirmDialog/);
  assert.match(createSource, /onConfirm=\{confirmArchiveCreate\}/);
  assert.doesNotMatch(createSource, /onClick=\{\(\) => createArchiveMutation\.mutate\(\)\}/);
});

test('approval audit production components use the wide white page shell without legacy metric cards', () => {
  for (const fileName of productionFileNames) {
    const componentSource = source(fileName);
    assert.doesNotMatch(componentSource, /MetricCard/, fileName);
    assert.doesNotMatch(componentSource, /motion\/react/, fileName);
    assert.doesNotMatch(componentSource, /motion\./, fileName);
    assert.doesNotMatch(componentSource, /max-w-7xl/, fileName);
    assert.doesNotMatch(componentSource, /max-w-5xl/, fileName);
  }

  const sharedSource = source('approval-audit-shared.tsx');
  assert.match(sharedSource, /max-w-\[1680px\]/);
  assert.match(sharedSource, /rounded-xl border border-slate-200\/80 bg-white\/\[0\.9\]/);
});
