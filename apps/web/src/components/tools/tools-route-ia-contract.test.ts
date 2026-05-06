import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const toolsListSource = readFileSync(join(process.cwd(), 'src/components/tools/tool-content.tsx'), 'utf8');
const toolDetailSource = readFileSync(join(process.cwd(), 'src/components/tools/tool-detail-content.tsx'), 'utf8');

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
  assert.doesNotMatch(toolDetailSource, /setIsEditing\(true\)/);
  assert.doesNotMatch(toolDetailSource, /ToolFormPanel[\s\S]*mode="edit"/);
  assert.match(toolDetailSource, /\/tools\/\$\{toolId\}\/edit/);
});
