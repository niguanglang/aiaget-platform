import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const knowledgeListSource = readFileSync(join(process.cwd(), 'src/components/knowledge/knowledge-content.tsx'), 'utf8');
const knowledgeDetailSource = readFileSync(join(process.cwd(), 'src/components/knowledge/knowledge-detail-content.tsx'), 'utf8');

test('knowledge create and edit are route-level pages', () => {
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/knowledge/create/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/knowledge/[id]/edit/page.tsx')));
});

test('knowledge list page does not embed create or retrieval panels', () => {
  assert.doesNotMatch(knowledgeListSource, /KnowledgeDocumentFormPanel/);
  assert.doesNotMatch(knowledgeListSource, /KnowledgeFormPanel/);
  assert.doesNotMatch(knowledgeListSource, /RetrievalPanel/);
  assert.doesNotMatch(knowledgeListSource, /selected detail/i);
});

test('knowledge detail page keeps edit as route navigation', () => {
  assert.doesNotMatch(knowledgeDetailSource, /setIsEditingBase\(true\)/);
  assert.doesNotMatch(knowledgeDetailSource, /KnowledgeFormPanel[\s\S]*mode="edit"/);
  assert.match(knowledgeDetailSource, /\/knowledge\/\$\{knowledgeId\}\/edit/);
});
