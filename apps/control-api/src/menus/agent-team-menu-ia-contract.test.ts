import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const seedText = readFileSync(join(process.cwd(), 'prisma/seed.ts'), 'utf8');

test('agent team route IA exposes list and report archives as menu-level routes', () => {
  assert.match(seedText, /code: 'agent_teams'[\s\S]*path: '\/agent-teams'/);
  assert.match(seedText, /code: 'agent_team_report_archives'[\s\S]*path: '\/agent-teams\/report-archives'/);
  assert.match(seedText, /code: 'agent_team_report_archives'[\s\S]*icon: 'FileArchive'/);
});

test('agent team dynamic create detail edit members and runs routes stay outside menu seed', () => {
  assert.doesNotMatch(seedText, /path: '\/agent-teams\/create'/);
  assert.doesNotMatch(seedText, /path: '\/agent-teams\/\[id\]'/);
  assert.doesNotMatch(seedText, /path: '\/agent-teams\/\[id\]\/edit'/);
  assert.doesNotMatch(seedText, /path: '\/agent-teams\/\[id\]\/members'/);
  assert.doesNotMatch(seedText, /path: '\/agent-teams\/\[id\]\/runs'/);
  assert.doesNotMatch(seedText, /component: 'agent-teams\/\[id\]/);
});
