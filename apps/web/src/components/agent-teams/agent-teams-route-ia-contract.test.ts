import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const routeRoot = join(root, 'src/app/(console)/agent-teams');
const componentRoot = join(root, 'src/components/agent-teams');
const menuNavigationSourcePath = join(root, 'src/components/layout/menu-navigation.ts');

const listSourcePath = join(componentRoot, 'agent-teams-content.tsx');

function readComponent(fileName: string) {
  return readFileSync(join(componentRoot, fileName), 'utf8');
}

test('agent team route-level pages exist for list, create, detail, edit, members, runs, and report archives', () => {
  assert.ok(existsSync(join(routeRoot, 'page.tsx')));
  assert.ok(existsSync(join(routeRoot, 'create/page.tsx')));
  assert.ok(existsSync(join(routeRoot, '[id]/page.tsx')));
  assert.ok(existsSync(join(routeRoot, '[id]/edit/page.tsx')));
  assert.ok(existsSync(join(routeRoot, '[id]/members/page.tsx')));
  assert.ok(existsSync(join(routeRoot, '[id]/runs/page.tsx')));
  assert.ok(existsSync(join(routeRoot, 'report-archives/page.tsx')));
});

test('agent team dedicated page components exist for each IA boundary', () => {
  [
    'agent-team-create-content.tsx',
    'agent-team-detail-content.tsx',
    'agent-team-edit-content.tsx',
    'agent-team-members-content.tsx',
    'agent-team-runs-content.tsx',
    'agent-team-report-archives-content.tsx',
    'agent-team-form-panel.tsx',
    'agent-teams-shared.tsx',
  ].forEach((fileName) => assert.ok(existsSync(join(componentRoot, fileName)), fileName));
});

test('agent team list page owns only overview, filters, list, and route entry actions', () => {
  const source = readFileSync(listSourcePath, 'utf8');

  assert.match(source, /getAgentTeamOverview/);
  assert.match(source, /listAgentTeams/);
  assert.match(source, /\/agent-teams\/create/);
  assert.match(source, /\/agent-teams\/report-archives/);

  assert.doesNotMatch(source, /\bselectedTeamId\b/);
  assert.doesNotMatch(source, /\bmemberForm\b/);
  assert.doesNotMatch(source, /\beditingMemberId\b/);
  assert.doesNotMatch(source, /\brunObjective\b/);
  assert.doesNotMatch(source, /\bhandoffReason\b/);
  assert.doesNotMatch(source, /\bfeedbackComment\b/);
  assert.doesNotMatch(source, /\barchiveDecisionNote\b/);
  assert.doesNotMatch(source, /\bselectedRunId\b/);
  assert.doesNotMatch(source, /\bselectedStepId\b/);
  assert.doesNotMatch(source, /\bcreateAgentTeamMember\b/);
  assert.doesNotMatch(source, /\bupdateAgentTeamMember\b/);
  assert.doesNotMatch(source, /\bdeleteAgentTeamMember\b/);
  assert.doesNotMatch(source, /\bstartAgentTeamRun\b/);
  assert.doesNotMatch(source, /\bcreateAgentTeamHandoff\b/);
  assert.doesNotMatch(source, /\bcreateAgentTeamFeedback\b/);
  assert.doesNotMatch(source, /\blistAgentTeamRunReportArchives\b/);
  assert.doesNotMatch(source, /\bRunReportArchivePanel\b/);
});

test('agent team create and edit pages own team mutation APIs and Chinese titles', () => {
  const createSource = readComponent('agent-team-create-content.tsx');
  const editSource = readComponent('agent-team-edit-content.tsx');

  assert.match(createSource, /createAgentTeam/);
  assert.match(createSource, /新建协作团队|新建 Agent 团队/);
  assert.doesNotMatch(createSource, /updateAgentTeam/);

  assert.match(editSource, /getAgentTeam/);
  assert.match(editSource, /updateAgentTeam/);
  assert.match(editSource, /编辑协作团队|编辑 Agent 团队/);
});

test('agent team detail page owns detail summary, member summary, run summary, and route entries', () => {
  const detailSource = readComponent('agent-team-detail-content.tsx');

  assert.match(detailSource, /getAgentTeam/);
  assert.match(detailSource, /基础信息/);
  assert.match(detailSource, /成员摘要/);
  assert.match(detailSource, /运行摘要/);
  assert.match(detailSource, /接力/);
  assert.match(detailSource, /反馈/);
  assert.match(detailSource, /\/agent-teams\/\$\{teamId\}\/edit/);
  assert.match(detailSource, /\/agent-teams\/\$\{teamId\}\/members/);
  assert.match(detailSource, /\/agent-teams\/\$\{teamId\}\/runs/);
});

test('agent team members, runs, and report archive pages own their dedicated API surfaces', () => {
  const membersSource = readComponent('agent-team-members-content.tsx');
  const runsSource = readComponent('agent-team-runs-content.tsx');
  const archivesSource = readComponent('agent-team-report-archives-content.tsx');

  assert.match(membersSource, /getAgentTeam/);
  assert.match(membersSource, /listAgents/);
  assert.match(membersSource, /createAgentTeamMember/);
  assert.match(membersSource, /updateAgentTeamMember/);
  assert.match(membersSource, /deleteAgentTeamMember/);
  assert.match(membersSource, /成员管理/);

  assert.match(runsSource, /getAgentTeam/);
  assert.match(runsSource, /startAgentTeamRun/);
  assert.match(runsSource, /createAgentTeamHandoff/);
  assert.match(runsSource, /createAgentTeamFeedback/);
  assert.match(runsSource, /exportAgentTeamRunReport/);
  assert.match(runsSource, /createAgentTeamRunReportArchive/);
  assert.match(runsSource, /运行记录/);

  assert.match(archivesSource, /listAgentTeamRunReportArchives/);
  assert.match(archivesSource, /listAgentTeamRunReportArchiveApprovals/);
  assert.match(archivesSource, /getAgentTeamRunReportArchiveDownloadUrl/);
  assert.match(archivesSource, /deleteAgentTeamRunReportArchive/);
  assert.match(archivesSource, /approveAgentTeamRunReportArchiveApproval/);
  assert.match(archivesSource, /rejectAgentTeamRunReportArchiveApproval/);
  assert.match(archivesSource, /报告归档/);
});

test('agent team run actions are gated by run permission', () => {
  const runsSource = readComponent('agent-team-runs-content.tsx');

  assert.match(runsSource, /hasPermission\(permissions, 'agent:team:run'\)/);
  assert.match(runsSource, /disabled=\{!canRun \|\| !objective\.trim\(\) \|\| startRunMutation\.isPending\}/);
  assert.match(runsSource, /disabled=\{!canRun \|\| !handoffReason\.trim\(\) \|\| handoffMutation\.isPending\}/);
  assert.match(runsSource, /disabled=\{!canRun \|\| feedbackMutation\.isPending\}/);
});

test('agent team report archive menu icon is mapped in frontend navigation', () => {
  const source = readFileSync(menuNavigationSourcePath, 'utf8');

  assert.match(source, /FileArchive/);
  assert.match(source, /agent_team_report_archives: FileArchive/);
});
