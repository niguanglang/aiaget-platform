import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const seedText = readFileSync(join(process.cwd(), 'prisma/seed.ts'), 'utf8');

test('approval center menu seed exposes overview and focused approval child pages', () => {
  assert.match(seedText, /code: 'approvals'[\s\S]*name: '审批中心'[\s\S]*path: '\/approvals'/);
  assert.match(seedText, /code: 'approval_tools'[\s\S]*parentCode: 'approvals'[\s\S]*path: '\/approvals\/tools'/);
  assert.match(
    seedText,
    /code: 'approval_notification_policy'[\s\S]*parentCode: 'approvals'[\s\S]*path: '\/approvals\/notification-policy'/,
  );
  assert.match(
    seedText,
    /code: 'approval_archive_deletions'[\s\S]*parentCode: 'approvals'[\s\S]*path: '\/approvals\/archive-deletions'/,
  );
});

test('approval audit menu stays intact outside approval center split', () => {
  assert.match(seedText, /code: 'approval_audits'[\s\S]*path: '\/approval-audits'/);
  assert.doesNotMatch(seedText, /path: '\/approval-audits\/tools'/);
});
