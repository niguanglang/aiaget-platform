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

test('agent team route-level pages exist for list, create, detail, edit, members, runs, run detail, run step detail, and report archives', () => {
  assert.ok(existsSync(join(routeRoot, 'page.tsx')));
  assert.ok(existsSync(join(routeRoot, 'create/page.tsx')));
  assert.ok(existsSync(join(routeRoot, '[id]/page.tsx')));
  assert.ok(existsSync(join(routeRoot, '[id]/edit/page.tsx')));
  assert.ok(existsSync(join(routeRoot, '[id]/members/page.tsx')));
  assert.ok(existsSync(join(routeRoot, '[id]/runs/page.tsx')));
  assert.ok(existsSync(join(routeRoot, '[id]/runs/[runId]/page.tsx')));
  assert.ok(existsSync(join(routeRoot, '[id]/runs/[runId]/steps/[stepId]/page.tsx')));
  assert.ok(existsSync(join(routeRoot, 'report-archives/page.tsx')));
});

test('agent team dedicated page components exist for each IA boundary', () => {
  [
    'agent-team-create-content.tsx',
    'agent-team-detail-content.tsx',
    'agent-team-edit-content.tsx',
    'agent-team-members-content.tsx',
    'agent-team-run-detail-content.tsx',
    'agent-team-run-trace-graph.tsx',
    'agent-team-run-step-detail-content.tsx',
    'agent-team-runs-content.tsx',
    'agent-team-report-archives-content.tsx',
    'agent-team-form-panel.tsx',
    'agent-teams-shared.tsx',
    'agent-team-confirm-dialog.tsx',
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
  assert.match(detailSource, /Trace 关联/);
  assert.match(detailSource, /资源授权提示/);
  assert.match(detailSource, /\/monitor\/traces\/\$\{encodeURIComponent\(latestRun\.trace_id\)\}/);
  assert.match(detailSource, /pathname: '\/resource-acls\/check'/);
  assert.match(detailSource, /resource_type: 'AGENT_TEAM'/);
  assert.match(detailSource, /permission_code: 'agent:team:run'/);
  assert.match(detailSource, /\/agent-teams\/\$\{teamId\}\/edit/);
  assert.match(detailSource, /\/agent-teams\/\$\{teamId\}\/members/);
  assert.match(detailSource, /\/agent-teams\/\$\{teamId\}\/runs/);
});

test('agent team list and detail pages expose M66 strategy summary fields without overloading list IA', () => {
  const listSource = readComponent('agent-teams-content.tsx');
  const detailSource = readComponent('agent-team-detail-content.tsx');

  assert.match(listSource, /策略摘要/);
  assert.match(listSource, /主管模型/);
  assert.match(listSource, /质检门禁/);
  assert.match(listSource, /预算概要/);
  assert.match(listSource, /team\.supervisor_model_name/);
  assert.match(listSource, /team\.quality_gate_enabled/);
  assert.match(listSource, /team\.quality_threshold/);
  assert.match(listSource, /team\.budget_token_limit/);
  assert.match(listSource, /team\.budget_cost_limit/);
  assert.doesNotMatch(listSource, /主管提示词/);

  assert.match(detailSource, /策略摘要/);
  assert.match(detailSource, /主管模型/);
  assert.match(detailSource, /质检门禁/);
  assert.match(detailSource, /质量阈值/);
  assert.match(detailSource, /Token 预算上限/);
  assert.match(detailSource, /成本预算上限/);
  assert.match(detailSource, /主管提示词/);
  assert.match(detailSource, /team\.supervisor_model_name/);
  assert.match(detailSource, /team\.quality_gate_enabled/);
  assert.match(detailSource, /team\.quality_threshold/);
  assert.match(detailSource, /team\.budget_token_limit/);
  assert.match(detailSource, /team\.budget_cost_limit/);
  assert.match(detailSource, /team\.supervisor_prompt/);
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
  assert.match(runsSource, /\/agent-teams\/\$\{teamId\}\/runs\/\$\{run\.id\}/);

  assert.match(archivesSource, /listAgentTeamRunReportArchives/);
  assert.match(archivesSource, /listAgentTeamRunReportArchiveApprovals/);
  assert.match(archivesSource, /getAgentTeamRunReportArchiveDownloadUrl/);
  assert.match(archivesSource, /deleteAgentTeamRunReportArchive/);
  assert.match(archivesSource, /approveAgentTeamRunReportArchiveApproval/);
  assert.match(archivesSource, /rejectAgentTeamRunReportArchiveApproval/);
  assert.match(archivesSource, /报告归档/);
});

test('agent team run detail page owns run timeline, handoffs, feedback, and report actions', () => {
  const detailSource = readComponent('agent-team-run-detail-content.tsx');

  assert.match(detailSource, /getAgentTeam/);
  assert.match(detailSource, /运行详情/);
  assert.match(detailSource, /步骤时间线/);
  assert.match(detailSource, /接力记录/);
  assert.match(detailSource, /反馈记录/);
  assert.match(detailSource, /Trace/);
  assert.match(detailSource, /exportAgentTeamRunReport/);
  assert.match(detailSource, /createAgentTeamRunReportArchive/);
  assert.match(detailSource, /AgentTeamRunTraceGraph/);
  assert.doesNotMatch(detailSource, /\bstartAgentTeamRun\b/);
});

test('agent team run detail page exposes replay, previous-run compare, member diff, and audit export panels', () => {
  const detailSource = readComponent('agent-team-run-detail-content.tsx');

  assert.match(detailSource, /当前运行回放/);
  assert.match(detailSource, /上一轮运行对比/);
  assert.match(detailSource, /成员差异/);
  assert.match(detailSource, /暂无上一轮可对比/);
  assert.match(detailSource, /审计报告导出/);
  assert.match(detailSource, /报告覆盖范围/);
  assert.match(detailSource, /运行摘要/);
  assert.match(detailSource, /知识引用/);
  assert.match(detailSource, /工具调用/);
  assert.match(detailSource, /模型调用/);
  assert.match(detailSource, /filterRunSteps/);
  assert.match(detailSource, /step\.run_id === run\.id/);
  assert.match(detailSource, /step\.trace_id === run\.trace_id/);
  assert.match(detailSource, /buildRunReplayMetrics/);
  assert.match(detailSource, /buildMemberReplayRows/);
});

test('agent team run trace graph derives span relations from run, steps, child steps and model calls', () => {
  const graphSource = readComponent('agent-team-run-trace-graph.tsx');

  assert.match(graphSource, /运行内 Trace 图谱/);
  assert.match(graphSource, /trace_id/);
  assert.match(graphSource, /span_id/);
  assert.match(graphSource, /parent_span_id/);
  assert.match(graphSource, /child_steps/);
  assert.match(graphSource, /model_call/);
  assert.match(graphSource, /\/monitor\/traces\/\$\{encodeURIComponent\(node\.traceId\)\}/);
  assert.match(graphSource, /孤立节点/);
  assert.match(graphSource, /根节点/);
});

test('agent team run detail page exposes member internal RAG, tool and model drilldowns', () => {
  const detailSource = readComponent('agent-team-run-detail-content.tsx');

  assert.match(detailSource, /成员内部事件/);
  assert.match(detailSource, /知识引用/);
  assert.match(detailSource, /工具调用/);
  assert.match(detailSource, /模型调用/);
  assert.match(detailSource, /child_steps/);
  assert.match(detailSource, /references/);
  assert.match(detailSource, /tool_calls/);
  assert.match(detailSource, /model_call/);
  assert.match(detailSource, /子事件详情/);
  assert.match(detailSource, /\/agent-teams\/\$\{teamId\}\/runs\/\$\{runId\}\/steps\/\$\{step\.id\}/);
  assert.match(detailSource, /eventType=child_steps/);
  assert.match(detailSource, /eventType=references/);
  assert.match(detailSource, /eventType=tool_calls/);
  assert.match(detailSource, /eventType=model_call/);
});

test('agent team run step detail page owns single step and sub-event drilldown deep link', () => {
  const stepDetailSource = readComponent('agent-team-run-step-detail-content.tsx');

  assert.match(stepDetailSource, /getAgentTeam/);
  assert.match(stepDetailSource, /步骤详情/);
  assert.match(stepDetailSource, /成员内部事件/);
  assert.match(stepDetailSource, /知识引用/);
  assert.match(stepDetailSource, /工具调用/);
  assert.match(stepDetailSource, /模型调用/);
  assert.match(stepDetailSource, /child_steps/);
  assert.match(stepDetailSource, /references/);
  assert.match(stepDetailSource, /tool_calls/);
  assert.match(stepDetailSource, /model_call/);
  assert.match(stepDetailSource, /selectedEventType/);
  assert.match(stepDetailSource, /selectedEventId/);
  assert.match(stepDetailSource, /eventType/);
  assert.match(stepDetailSource, /eventId/);
  assert.match(stepDetailSource, /\/agent-teams\/\$\{teamId\}\/runs\/\$\{runId\}/);
});

test('agent team run actions are gated by run permission', () => {
  const runsSource = readComponent('agent-team-runs-content.tsx');

  assert.match(runsSource, /hasPermission\(permissions, 'agent:team:run'\)/);
  assert.match(runsSource, /disabled=\{!canRun \|\| !objective\.trim\(\) \|\| startRunMutation\.isPending\}/);
  assert.match(runsSource, /disabled=\{!canRun \|\| !handoffReason\.trim\(\) \|\| handoffMutation\.isPending\}/);
  assert.match(runsSource, /disabled=\{!canRun \|\| feedbackMutation\.isPending\}/);
});

test('agent team high-impact actions require confirmation before mutation', () => {
  const listSource = readComponent('agent-teams-content.tsx');
  const membersSource = readComponent('agent-team-members-content.tsx');
  const runsSource = readComponent('agent-team-runs-content.tsx');
  const archivesSource = readComponent('agent-team-report-archives-content.tsx');
  const confirmSource = readComponent('agent-team-confirm-dialog.tsx');

  assert.match(listSource, /AgentTeamConfirmDialog/);
  assert.match(listSource, /deleteTarget/);
  assert.doesNotMatch(listSource, /onClick=\{\(\) => deleteMutation\.mutate\(deleteTarget\.id\)\}/);

  assert.match(membersSource, /memberDeleteTarget/);
  assert.match(membersSource, /setMemberDeleteTarget\(/);
  assert.match(membersSource, /AgentTeamConfirmDialog/);
  assert.doesNotMatch(membersSource, /onClick=\{\(\) => deleteMutation\.mutate\(\{ id: teamId, memberId: member\.id \}\)\}/);

  assert.match(runsSource, /runActionTarget/);
  assert.match(runsSource, /setRunActionTarget\(/);
  assert.match(runsSource, /AgentTeamConfirmDialog/);
  assert.match(runsSource, /type: 'FEEDBACK'/);
  assert.match(runsSource, /确认保存反馈/);
  assert.doesNotMatch(runsSource, /onClick=\{\(\) => startRunMutation\.mutate\(\{ id: teamId, runObjective: objective \}\)\}/);
  assert.doesNotMatch(runsSource, /onClick=\{\(\) => handoffMutation\.mutate\(\{ runId: selectedRun\.id, reason: handoffReason \}\)\}/);
  assert.doesNotMatch(runsSource, /onClick=\{\(\) => archiveMutation\.mutate\(selectedRun\.id\)\}/);
  assert.doesNotMatch(runsSource, /onClick=\{\(\) => feedbackMutation\.mutate\(\{ runId: selectedRun\.id, rating: feedbackRating, comment: feedbackComment \}\)\}/);

  assert.match(archivesSource, /archiveDeleteTarget/);
  assert.match(archivesSource, /approvalDecisionTarget/);
  assert.match(archivesSource, /setArchiveDeleteTarget\(/);
  assert.match(archivesSource, /setApprovalDecisionTarget\(/);
  assert.match(archivesSource, /AgentTeamConfirmDialog/);
  assert.doesNotMatch(archivesSource, /onClick=\{\(\) => deleteMutation\.mutate\(archive\.id\)\}/);
  assert.doesNotMatch(archivesSource, /onClick=\{\(\) => approveMutation\.mutate\(approval\.id\)\}/);
  assert.doesNotMatch(archivesSource, /onClick=\{\(\) => rejectMutation\.mutate\(approval\.id\)\}/);

  assert.match(confirmSource, /confirmLabel/);
  assert.match(confirmSource, /variant="destructive"/);
});

test('agent team report archive menu icon is mapped in frontend navigation', () => {
  const source = readFileSync(menuNavigationSourcePath, 'utf8');

  assert.match(source, /FileArchive/);
  assert.match(source, /agent_team_report_archives: FileArchive/);
});
