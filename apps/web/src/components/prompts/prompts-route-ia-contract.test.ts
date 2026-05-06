import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const promptsListSource = readFileSync(join(process.cwd(), 'src/components/prompts/prompts-content.tsx'), 'utf8');
const promptsRoot = join(process.cwd(), 'src/components/prompts');
const promptDetailSource = readFileSync(join(promptsRoot, 'prompt-detail-content.tsx'), 'utf8');
const promptEditSource = readFileSync(join(promptsRoot, 'prompt-edit-content.tsx'), 'utf8');

function source(fileName: string) {
  return readFileSync(join(promptsRoot, fileName), 'utf8');
}

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

test('prompt detail page keeps basic edit form out and uses edit route navigation', () => {
  assert.doesNotMatch(promptDetailSource, /setIsEditingTemplate/);
  assert.doesNotMatch(promptDetailSource, /PromptFormPanel[\s\S]*mode="edit"/);
  assert.doesNotMatch(promptDetailSource, /listUsers/);
  assert.match(`${promptDetailSource}\n${source('prompt-detail-header.tsx')}`, /\/prompts\/\$\{promptId\}\/edit/);
  assert.match(promptEditSource, /PromptFormPanel[\s\S]*mode="edit"/);
  assert.match(promptEditSource, /listUsers/);
});

test('prompt detail page is split into focused detail components', () => {
  assert.ok(existsSync(join(promptsRoot, 'prompt-detail-header.tsx')));
  assert.ok(existsSync(join(promptsRoot, 'prompt-content-editor-card.tsx')));
  assert.ok(existsSync(join(promptsRoot, 'prompt-variables-card.tsx')));
  assert.ok(existsSync(join(promptsRoot, 'prompt-versions-card.tsx')));
  assert.ok(existsSync(join(promptsRoot, 'prompt-render-test-card.tsx')));
  assert.ok(existsSync(join(promptsRoot, 'prompt-history-cards.tsx')));
  assert.ok(existsSync(join(promptsRoot, 'prompt-confirm-dialog.tsx')));
  assert.ok(existsSync(join(promptsRoot, 'prompt-detail-utils.ts')));

  assert.match(promptDetailSource, /PromptDetailHeader/);
  assert.match(promptDetailSource, /PromptContentEditorCard/);
  assert.match(promptDetailSource, /PromptVariablesCard/);
  assert.match(promptDetailSource, /PromptVersionsCard/);
  assert.match(promptDetailSource, /PromptMetadataCard/);
  assert.match(promptDetailSource, /PromptRenderTestCard/);
  assert.match(promptDetailSource, /PromptRecentTestsCard/);
  assert.match(promptDetailSource, /PromptAgentReferencesCard/);
  assert.match(promptDetailSource, /PromptActivityCard/);
  assert.match(promptDetailSource, /PromptConfirmDialog/);

  assert.doesNotMatch(promptDetailSource, /function DetailRow/);
  assert.doesNotMatch(promptDetailSource, /function toUpdateInput/);
  assert.doesNotMatch(promptDetailSource, /function parseJsonObject/);
  assert.doesNotMatch(promptDetailSource, /function createInputDefaults/);
});

test('prompt focused components own workflow boundaries and model test fields', () => {
  const headerSource = source('prompt-detail-header.tsx');
  const contentSource = source('prompt-content-editor-card.tsx');
  const variablesSource = source('prompt-variables-card.tsx');
  const versionsSource = source('prompt-versions-card.tsx');
  const renderTestSource = source('prompt-render-test-card.tsx');
  const historySource = source('prompt-history-cards.tsx');
  const confirmSource = source('prompt-confirm-dialog.tsx');

  assert.match(headerSource, /\/prompts\/\$\{promptId\}\/edit/);
  assert.match(headerSource, /onCopy/);
  assert.match(headerSource, /onPublish/);
  assert.match(headerSource, /onDelete/);
  assert.doesNotMatch(headerSource, /PromptFormPanel/);

  assert.match(contentSource, /PromptContentEditorCard/);
  assert.match(contentSource, /保存内容/);

  assert.match(variablesSource, /PromptVariablesCard/);
  assert.match(variablesSource, /promptVariableTypeLabel/);
  assert.match(variablesSource, /onCreate/);
  assert.match(variablesSource, /onEdit/);
  assert.match(variablesSource, /onDelete/);

  assert.match(versionsSource, /PromptVersionsCard/);
  assert.match(versionsSource, /onPublish/);
  assert.match(versionsSource, /onRollback/);

  assert.match(renderTestSource, /PromptRenderTestCard/);
  assert.match(renderTestSource, /model_provider_name/);
  assert.match(renderTestSource, /request_model/);
  assert.match(renderTestSource, /onRender/);
  assert.match(renderTestSource, /onTest/);

  assert.match(historySource, /PromptRecentTestsCard/);
  assert.match(historySource, /PromptAgentReferencesCard/);
  assert.match(historySource, /PromptActivityCard/);

  assert.match(confirmSource, /PromptConfirmDialog/);
  assert.match(confirmSource, /variant="destructive"/);
});
