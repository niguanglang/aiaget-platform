import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const promptsListSource = readFileSync(join(process.cwd(), 'src/components/prompts/prompts-content.tsx'), 'utf8');

test('prompt center route-level pages exist for list, create, detail, and edit', () => {
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/prompts/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/prompts/create/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/prompts/[id]/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/prompts/[id]/edit/page.tsx')));
});

test('prompt list page keeps detail, editor, forms, and test panels out of the list surface', () => {
  assert.doesNotMatch(promptsListSource, /PromptSummaryPanel/);
  assert.doesNotMatch(promptsListSource, /PromptFormPanel/);
  assert.doesNotMatch(promptsListSource, /selectedPromptId/);
  assert.doesNotMatch(promptsListSource, /getPromptTemplate/);
  assert.doesNotMatch(promptsListSource, /renderPromptTemplate/);
  assert.doesNotMatch(promptsListSource, /testPromptTemplate/);
});
