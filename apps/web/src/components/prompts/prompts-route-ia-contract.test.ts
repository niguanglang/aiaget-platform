import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const promptsListSource = readFileSync(join(process.cwd(), 'src/components/prompts/prompts-content.tsx'), 'utf8');
const promptsRoot = join(process.cwd(), 'src/components/prompts');
const promptDetailSource = readFileSync(join(promptsRoot, 'prompt-detail-content.tsx'), 'utf8');
const promptEditSource = readFileSync(join(promptsRoot, 'prompt-edit-content.tsx'), 'utf8');
const productionFileNames = [
  'prompts-content.tsx',
  'prompt-detail-content.tsx',
  'prompt-detail-header.tsx',
  'prompt-create-content.tsx',
  'prompt-edit-content.tsx',
];

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
  assert.doesNotMatch(promptsListSource, /renderPromptTemplate/);
  assert.doesNotMatch(promptsListSource, /testPromptTemplate/);
});

test('prompt list page does not own version publishing actions', () => {
  const headerSource = source('prompt-detail-header.tsx');
  const versionsSource = source('prompt-versions-card.tsx');

  assert.doesNotMatch(promptsListSource, /publishPromptTemplate/);
  assert.doesNotMatch(promptsListSource, /从提示词中心列表发布/);
  assert.doesNotMatch(promptsListSource, /<Send\b/);
  assert.match(promptDetailSource, /publishPromptTemplate/);
  assert.match(headerSource, /onPublish/);
  assert.match(versionsSource, /onPublish/);
  assert.match(versionsSource, /onRollback/);
});

test('prompt list copy action requires confirmation before mutation', () => {
  assert.match(promptsListSource, /copyTarget/);
  assert.match(promptsListSource, /setCopyTarget\(/);
  assert.match(promptsListSource, /function confirmCopyPrompt/);
  assert.match(promptsListSource, /确认复制提示词/);
  assert.match(promptsListSource, /onConfirm=\{confirmCopyPrompt\}/);
  assert.doesNotMatch(promptsListSource, /onClick=\{\(\) => copyMutation\.mutate\(prompt\.id\)\}/);
});

test('prompt list follows reference prompt-center operations layout', () => {
  assert.match(promptsListSource, /总提示词/);
  assert.match(promptsListSource, /已停用/);
  assert.match(promptsListSource, /智能体引用/);
  assert.match(promptsListSource, /测试记录/);
  assert.match(promptsListSource, /筛选器/);
  assert.match(promptsListSource, /提示词列表/);
  assert.match(promptsListSource, /详情/);
  assert.match(promptsListSource, /测试结果/);
  assert.match(promptsListSource, /引用关系/);
  assert.match(promptsListSource, /审批记录/);
  assert.match(promptsListSource, /max-w-\[1680px\]/);
  assert.match(promptsListSource, /rounded-xl border border-slate-200\/80 bg-white\/\[0\.9\]/);
  assert.match(promptsListSource, /PromptPreviewPanel/);
  assert.match(promptsListSource, /RefreshCw/);
  assert.match(promptsListSource, /SlidersHorizontal/);
  assert.doesNotMatch(promptsListSource, /PromptCenterBackground/);
  assert.doesNotMatch(promptsListSource, /MetricCard/);
  assert.doesNotMatch(promptsListSource, /名称、类型、状态、版本、变量、测试记录和引用数量/);
  assert.doesNotMatch(promptsListSource, /content_preview[\s\S]*<td/);
  assert.doesNotMatch(promptsListSource, /提示词模板加载失败。/);
  assert.doesNotMatch(promptsListSource, /正在加载提示词模板/);
  assert.doesNotMatch(promptsListSource, /暂无提示词模板/);
});

test('prompt list preview panel uses real detail data instead of placeholders', () => {
  assert.match(promptsListSource, /getPromptTemplate/);
  assert.match(promptsListSource, /selectedPromptId/);
  assert.match(promptsListSource, /prompt-detail-preview/);
  assert.match(promptsListSource, /variables\.map/);
  assert.match(promptsListSource, /versions\.slice/);
  assert.match(promptsListSource, /test_records\.slice/);
  assert.match(promptsListSource, /agent_references\.slice/);
  assert.match(promptsListSource, /audit_records\.slice/);
  assert.doesNotMatch(promptsListSource, />导入</);
  assert.doesNotMatch(promptsListSource, /variable_\{index \+ 1\}/);
  assert.doesNotMatch(promptsListSource, /Math\.max\(1, prompt\.version - 1\)/);
  assert.doesNotMatch(promptsListSource, /Math\.max\(1, prompt\.version - 2\)/);
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

test('prompt detail high-impact actions require confirmation before mutation', () => {
  const variablesSource = source('prompt-variables-card.tsx');
  const versionsSource = source('prompt-versions-card.tsx');

  assert.match(promptDetailSource, /promptActionTarget/);
  assert.match(promptDetailSource, /function confirmPromptAction/);
  assert.match(promptDetailSource, /确认发布提示词/);
  assert.match(promptDetailSource, /确认回滚提示词版本/);
  assert.match(promptDetailSource, /确认删除提示词变量/);
  assert.match(promptDetailSource, /onConfirm=\{confirmPromptAction\}/);
  assert.match(variablesSource, /onDelete\(variable\)/);
  assert.doesNotMatch(variablesSource, /onDelete\(variable\.id\)/);
  assert.doesNotMatch(promptDetailSource, /onPublish=\{\(\) => publishMutation\.mutate\(\)\}/);
  assert.doesNotMatch(promptDetailSource, /onRollback=\{\(version\) => rollbackMutation\.mutate\(version\)\}/);
  assert.doesNotMatch(promptDetailSource, /onDelete=\{\(variableId\) => deleteVariableMutation\.mutate\(variableId\)\}/);
  assert.match(versionsSource, /onRollback\(version\)/);
});

test('prompt production components avoid legacy narrow shells and placeholder descriptions', () => {
  for (const fileName of productionFileNames) {
    const componentSource = source(fileName);

    assert.doesNotMatch(componentSource, /MetricCard/, fileName);
    assert.doesNotMatch(componentSource, /motion\/react/, fileName);
    assert.doesNotMatch(componentSource, /motion\./, fileName);
    assert.doesNotMatch(componentSource, /max-w-7xl/, fileName);
    assert.doesNotMatch(componentSource, /暂无描述/, fileName);
    assert.doesNotMatch(componentSource, /PromptCenterBackground/, fileName);
    assert.doesNotMatch(componentSource, /prompt-center-background/, fileName);
  }
});
