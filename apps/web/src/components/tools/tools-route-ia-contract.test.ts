import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const toolsListSource = readFileSync(join(process.cwd(), 'src/components/tools/tool-content.tsx'), 'utf8');
const toolDetailSource = readFileSync(join(process.cwd(), 'src/components/tools/tool-detail-content.tsx'), 'utf8');
const toolsRoot = join(process.cwd(), 'src/components/tools');

function source(fileName: string) {
  return readFileSync(join(toolsRoot, fileName), 'utf8');
}

test('tool center route-level pages exist for list, create, detail, and edit', () => {
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/tools/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/tools/create/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/tools/[id]/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/tools/[id]/edit/page.tsx')));
});

test('tool list page keeps detail, forms, and test panels out of the list surface', () => {
  assert.doesNotMatch(toolsListSource, /ToolQuickPanel/);
  assert.doesNotMatch(toolsListSource, /ToolFormPanel/);
  assert.doesNotMatch(toolsListSource, /selectedToolId/);
  assert.doesNotMatch(toolsListSource, /getTool/);
  assert.doesNotMatch(toolsListSource, /createTool/);
  assert.doesNotMatch(toolsListSource, /updateTool/);
  assert.doesNotMatch(toolsListSource, /testTool/);
});

test('tool detail page keeps edit as route navigation', () => {
  const headerPath = join(toolsRoot, 'tool-detail-header.tsx');
  const detailAndHeaderSource = `${toolDetailSource}\n${existsSync(headerPath) ? source('tool-detail-header.tsx') : ''}`;

  assert.doesNotMatch(toolDetailSource, /setIsEditing\(true\)/);
  assert.doesNotMatch(toolDetailSource, /ToolFormPanel[\s\S]*mode="edit"/);
  assert.match(detailAndHeaderSource, /\/tools\/\$\{toolId\}\/edit/);
});

test('tool detail page is split into focused detail components', () => {
  assert.ok(existsSync(join(toolsRoot, 'tool-detail-header.tsx')));
  assert.ok(existsSync(join(toolsRoot, 'tool-detail-cards.tsx')));
  assert.ok(existsSync(join(toolsRoot, 'tool-test-panel.tsx')));
  assert.ok(existsSync(join(toolsRoot, 'tool-call-logs-card.tsx')));
  assert.ok(existsSync(join(toolsRoot, 'tool-confirm-dialog.tsx')));

  assert.match(toolDetailSource, /ToolDetailHeader/);
  assert.match(toolDetailSource, /ToolConfigCard/);
  assert.match(toolDetailSource, /ToolPolicyCard/);
  assert.match(toolDetailSource, /ToolSchemaCard/);
  assert.match(toolDetailSource, /ToolTestPanel/);
  assert.match(toolDetailSource, /ToolCallLogsCard/);
  assert.match(toolDetailSource, /ToolReferencesCard/);
  assert.match(toolDetailSource, /ToolUsageCard/);
  assert.match(toolDetailSource, /ToolConfirmDialog/);

  assert.doesNotMatch(toolDetailSource, /function ConfigCard/);
  assert.doesNotMatch(toolDetailSource, /function PolicyCard/);
  assert.doesNotMatch(toolDetailSource, /function SchemaCard/);
  assert.doesNotMatch(toolDetailSource, /function TestPanel/);
  assert.doesNotMatch(toolDetailSource, /function CallLogsCard/);
  assert.doesNotMatch(toolDetailSource, /function AgentReferencesCard/);
  assert.doesNotMatch(toolDetailSource, /function UsageCard/);
  assert.doesNotMatch(toolDetailSource, /function ConfirmDialog/);
});

test('tool focused components own the correct detail responsibilities and links', () => {
  const headerSource = source('tool-detail-header.tsx');
  const cardsSource = source('tool-detail-cards.tsx');
  const testPanelSource = source('tool-test-panel.tsx');
  const callLogsSource = source('tool-call-logs-card.tsx');
  const confirmSource = source('tool-confirm-dialog.tsx');

  assert.match(headerSource, /\/tools\/\$\{toolId\}\/edit/);
  assert.match(headerSource, /canWrite/);
  assert.match(headerSource, /onCopy/);
  assert.match(headerSource, /onToggleStatus/);
  assert.match(headerSource, /onDelete/);
  assert.doesNotMatch(headerSource, /getTool/);
  assert.doesNotMatch(headerSource, /testTool/);

  assert.match(cardsSource, /ToolConfigCard/);
  assert.match(cardsSource, /ToolPolicyCard/);
  assert.match(cardsSource, /ToolSchemaCard/);
  assert.match(cardsSource, /ToolReferencesCard/);
  assert.match(cardsSource, /ToolUsageCard/);
  assert.doesNotMatch(cardsSource, /useMutation/);

  assert.match(testPanelSource, /ToolTestPanel/);
  assert.match(testPanelSource, /disabled=\{!canExecute \|\| pending \|\| tool.status !== 'ACTIVE'\}/);
  assert.match(testPanelSource, /href=\{`\/approvals\?requestId=\$\{result.approval_request_id\}`\}/);
  assert.doesNotMatch(testPanelSource, /getTool/);

  assert.match(callLogsSource, /ToolCallLogsCard/);
  assert.match(callLogsSource, /href=\{`\/approvals\?requestId=\$\{log.approval_request_id\}`\}/);
  assert.match(callLogsSource, /EmptyState/);

  assert.match(confirmSource, /ToolConfirmDialog/);
  assert.match(confirmSource, /variant="destructive"/);
});
