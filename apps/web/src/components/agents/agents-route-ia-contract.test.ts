import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const agentsRoot = join(process.cwd(), 'src/components/agents');
const agentsListSource = readFileSync(join(agentsRoot, 'agents-content.tsx'), 'utf8');
const agentDetailSource = readFileSync(join(agentsRoot, 'agent-detail-content.tsx'), 'utf8');
const agentBindingSource = readFileSync(join(agentsRoot, 'agent-binding-manager.tsx'), 'utf8');

function source(fileName: string) {
  return readFileSync(join(agentsRoot, fileName), 'utf8');
}

test('agent center route-level pages exist for list, create, detail, and edit', () => {
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/agents/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/agents/create/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/agents/[id]/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/agents/[id]/edit/page.tsx')));
});

test('agent list page keeps lifecycle, versions, bindings, and debug panels out of the list surface', () => {
  assert.doesNotMatch(agentsListSource, /getAgent/);
  assert.doesNotMatch(agentsListSource, /createAgentVersion/);
  assert.doesNotMatch(agentsListSource, /publishAgent/);
  assert.doesNotMatch(agentsListSource, /rollbackAgent/);
  assert.doesNotMatch(agentsListSource, /disableAgent/);
  assert.doesNotMatch(agentsListSource, /archiveAgent/);
  assert.doesNotMatch(agentsListSource, /AgentBindingManager/);
  assert.doesNotMatch(agentsListSource, /AgentConversationTestPanel/);
  assert.doesNotMatch(agentsListSource, /selectedAgentId/);
});

test('agent detail owns lifecycle, version, binding, and debug responsibilities', () => {
  assert.match(agentDetailSource, /getAgent/);
  assert.match(agentDetailSource, /createAgentVersion/);
  assert.match(agentDetailSource, /publishAgent/);
  assert.match(agentDetailSource, /rollbackAgent/);
  assert.match(agentDetailSource, /disableAgent/);
  assert.match(agentDetailSource, /archiveAgent/);
  assert.match(agentDetailSource, /AgentBindingManager/);
  assert.match(agentDetailSource, /AgentConversationTestPanel/);
});

test('agent lifecycle and rollback actions require confirmation before mutation', () => {
  const confirmSource = source('agent-confirm-dialog.tsx');

  assert.match(agentDetailSource, /versionCreateTarget/);
  assert.match(agentDetailSource, /setVersionCreateTarget\(/);
  assert.match(agentDetailSource, /function confirmVersionCreate/);
  assert.match(agentDetailSource, /创建 Agent 版本快照/);
  assert.match(agentDetailSource, /onConfirm=\{confirmVersionCreate\}/);
  assert.match(agentDetailSource, /lifecycleTarget/);
  assert.match(agentDetailSource, /setLifecycleTarget\(/);
  assert.match(agentDetailSource, /rollbackTarget/);
  assert.match(agentDetailSource, /setRollbackTarget\(/);
  assert.doesNotMatch(agentDetailSource, /onClick=\{\(\) => createVersionMutation\.mutate\(agent\.id\)\}/);
  assert.doesNotMatch(agentDetailSource, /onClick=\{\(\) => publishMutation\.mutate\(agent\.id\)\}/);
  assert.doesNotMatch(agentDetailSource, /onClick=\{\(\) => disableMutation\.mutate\(agent\.id\)\}/);
  assert.doesNotMatch(agentDetailSource, /onClick=\{\(\) => archiveMutation\.mutate\(agent\.id\)\}/);
  assert.doesNotMatch(agentDetailSource, /onClick=\{\(\) => rollbackMutation\.mutate\(\{ id: agent\.id, version: version\.version \}\)\}/);
  assert.match(confirmSource, /AgentConfirmDialog/);
  assert.match(confirmSource, /confirmLabel/);
  assert.match(confirmSource, /variant="destructive"/);
});

test('agent list deletion uses the shared agent confirmation dialog before mutation', () => {
  assert.match(agentsListSource, /AgentConfirmDialog/);
  assert.match(agentsListSource, /deleteTarget/);
  assert.match(agentsListSource, /onConfirm=\{\(\) => deleteMutation\.mutate\(deleteTarget\.id\)\}/);
  assert.doesNotMatch(agentsListSource, /fixed inset-0 z-40 flex items-center justify-center bg-black\/30/);
  assert.doesNotMatch(agentsListSource, /<section className="fixed inset-0 z-40/);
});

test('agent resource binding removals require confirmation before mutation', () => {
  assert.match(agentBindingSource, /bindingDeleteTarget/);
  assert.match(agentBindingSource, /setBindingDeleteTarget\(/);
  assert.match(agentBindingSource, /AgentConfirmDialog/);
  assert.doesNotMatch(agentBindingSource, /onDelete=\{\(bindingId\) => deleteModelBindingMutation\.mutate/);
  assert.doesNotMatch(agentBindingSource, /onDelete=\{\(bindingId\) => deletePromptBindingMutation\.mutate/);
  assert.doesNotMatch(agentBindingSource, /onDelete=\{\(bindingId\) => deleteKnowledgeBindingMutation\.mutate/);
  assert.doesNotMatch(agentBindingSource, /onDelete=\{\(bindingId\) => deleteToolBindingMutation\.mutate/);
});

test('agent resource binding create and update actions require confirmation before mutation', () => {
  assert.match(agentBindingSource, /bindingSaveTarget/);
  assert.match(agentBindingSource, /setBindingSaveTarget\(/);
  assert.match(agentBindingSource, /function confirmBindingSave/);
  assert.match(agentBindingSource, /确认更新 Agent 资源绑定/);
  assert.match(agentBindingSource, /onConfirm=\{confirmBindingSave\}/);
  assert.doesNotMatch(agentBindingSource, /onClick=\{\(\) => createModelBindingMutation\.mutate/);
  assert.doesNotMatch(agentBindingSource, /onClick=\{\(\) => createPromptBindingMutation\.mutate/);
  assert.doesNotMatch(agentBindingSource, /onClick=\{\(\) => createKnowledgeBindingMutation\.mutate/);
  assert.doesNotMatch(agentBindingSource, /onClick=\{\(\) => updateKnowledgeBindingMutation\.mutate/);
  assert.doesNotMatch(agentBindingSource, /onClick=\{\(\) => createToolBindingMutation\.mutate/);
  assert.doesNotMatch(agentBindingSource, /onClick=\{\(\) => updateToolBindingMutation\.mutate/);
});
