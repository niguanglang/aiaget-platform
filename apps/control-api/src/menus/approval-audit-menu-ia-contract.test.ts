import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const seedText = readFileSync(join(process.cwd(), 'prisma/seed.ts'), 'utf8');

test('approval audit menu seed exposes list and archive management as static pages', () => {
  assert.match(
    seedText,
    /code: 'approval_audits'[\s\S]*parentCode: 'security_center'[\s\S]*path: '\/approval-audits'[\s\S]*component: 'approval-audits\/page'/,
  );
  assert.match(
    seedText,
    /code: 'approval_audit_archives'[\s\S]*parentCode: 'approval_audits'[\s\S]*path: '\/approval-audits\/archives'[\s\S]*component: 'approval-audits\/archives\/page'/,
  );
});

test('approval audit dynamic detail and creation routes stay outside menu seed', () => {
  assert.doesNotMatch(seedText, /path: '\/approval-audits\/events\/\[eventId\]'/);
  assert.doesNotMatch(seedText, /path: '\/approval-audits\/events\/:eventId'/);
  assert.doesNotMatch(seedText, /path: '\/approval-audits\/archives\/create'/);
});

