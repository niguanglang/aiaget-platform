import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const knowledgeListSource = readFileSync(join(process.cwd(), 'src/components/knowledge/knowledge-content.tsx'), 'utf8');
const knowledgeDetailSource = readFileSync(join(process.cwd(), 'src/components/knowledge/knowledge-detail-content.tsx'), 'utf8');
const componentsRoot = join(process.cwd(), 'src/components/knowledge');

function source(fileName: string) {
  return readFileSync(join(componentsRoot, fileName), 'utf8');
}

test('knowledge create and edit are route-level pages', () => {
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/knowledge/create/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/knowledge/[id]/edit/page.tsx')));
});

test('knowledge operation pages are route-level pages with focused components', () => {
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/knowledge/activity/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/knowledge/health/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/knowledge/[id]/documents/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/knowledge/[id]/upload/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/knowledge/[id]/retrieval/page.tsx')));

  assert.ok(existsSync(join(componentsRoot, 'knowledge-shared.tsx')));
  assert.ok(existsSync(join(componentsRoot, 'knowledge-activity-content.tsx')));
  assert.ok(existsSync(join(componentsRoot, 'knowledge-health-content.tsx')));
  assert.ok(existsSync(join(componentsRoot, 'knowledge-documents-content.tsx')));
  assert.ok(existsSync(join(componentsRoot, 'knowledge-upload-content.tsx')));
  assert.ok(existsSync(join(componentsRoot, 'knowledge-retrieval-content.tsx')));
});

test('knowledge list page does not embed create or retrieval panels', () => {
  assert.doesNotMatch(knowledgeListSource, /KnowledgeDocumentFormPanel/);
  assert.doesNotMatch(knowledgeListSource, /KnowledgeFormPanel/);
  assert.doesNotMatch(knowledgeListSource, /RetrievalPanel/);
  assert.doesNotMatch(knowledgeListSource, /selected detail/i);
});

test('knowledge list page stays a directory list without activity logs or backend health implementation status', () => {
  assert.match(knowledgeListSource, /listKnowledgeBases/);
  assert.match(knowledgeListSource, /listUsers/);
  assert.doesNotMatch(knowledgeListSource, /getKnowledgeOverview/);
  assert.doesNotMatch(knowledgeListSource, /KnowledgeQueueCard/);
  assert.doesNotMatch(knowledgeListSource, /TimelineList/);
  assert.doesNotMatch(knowledgeListSource, /recent_documents/);
  assert.doesNotMatch(knowledgeListSource, /recent_tasks/);
  assert.doesNotMatch(knowledgeListSource, /recent_recall_logs/);
  assert.doesNotMatch(knowledgeListSource, /最近召回/);
  assert.doesNotMatch(knowledgeListSource, /召回日志/);
  assert.doesNotMatch(knowledgeListSource, /MinIO/);
  assert.doesNotMatch(knowledgeListSource, /Qdrant/);
  assert.doesNotMatch(knowledgeListSource, /OpenSearch/);
  assert.doesNotMatch(knowledgeListSource, /向量回退/);
});

test('knowledge activity and health pages own overview activity and backend capability surfaces', () => {
  const activitySource = source('knowledge-activity-content.tsx');
  const healthSource = source('knowledge-health-content.tsx');

  assert.match(activitySource, /getKnowledgeOverview/);
  assert.match(activitySource, /recent_documents/);
  assert.match(activitySource, /recent_tasks/);
  assert.match(activitySource, /recent_recall_logs/);
  assert.match(activitySource, /最近召回/);

  assert.match(healthSource, /getKnowledgeOverview/);
  assert.match(healthSource, /MinIO/);
  assert.match(healthSource, /Qdrant/);
  assert.match(healthSource, /OpenSearch/);
  assert.match(healthSource, /向量回退/);
});

test('knowledge detail page keeps edit as route navigation', () => {
  assert.doesNotMatch(knowledgeDetailSource, /setIsEditingBase\(true\)/);
  assert.doesNotMatch(knowledgeDetailSource, /KnowledgeFormPanel[\s\S]*mode="edit"/);
  assert.match(knowledgeDetailSource, /\/knowledge\/\$\{knowledgeId\}\/edit/);
});

test('knowledge detail page is a base summary and operation entry surface only', () => {
  assert.match(knowledgeDetailSource, /知识库详情/);
  assert.match(knowledgeDetailSource, /\/knowledge\/\$\{knowledgeId\}\/documents/);
  assert.match(knowledgeDetailSource, /\/knowledge\/\$\{knowledgeId\}\/upload/);
  assert.match(knowledgeDetailSource, /\/knowledge\/\$\{knowledgeId\}\/retrieval/);

  assert.doesNotMatch(knowledgeDetailSource, /KnowledgeDocumentFormPanel/);
  assert.doesNotMatch(knowledgeDetailSource, /uploadKnowledgeDocument/);
  assert.doesNotMatch(knowledgeDetailSource, /getKnowledgeDocument/);
  assert.doesNotMatch(knowledgeDetailSource, /runKnowledgeRetrievalTest/);
  assert.doesNotMatch(knowledgeDetailSource, /DocumentsCard/);
  assert.doesNotMatch(knowledgeDetailSource, /RetrievalCard/);
  assert.doesNotMatch(knowledgeDetailSource, /DocumentDetailCard/);
  assert.doesNotMatch(knowledgeDetailSource, /SegmentsCard/);
  assert.doesNotMatch(knowledgeDetailSource, /TasksCard/);
  assert.doesNotMatch(knowledgeDetailSource, /RecallLogsCard/);
});

test('knowledge documents page owns document table, document detail, segments, and processing actions', () => {
  const documentsSource = source('knowledge-documents-content.tsx');

  assert.match(documentsSource, /文档管理/);
  assert.match(documentsSource, /getKnowledgeBase/);
  assert.match(documentsSource, /getKnowledgeDocument/);
  assert.match(documentsSource, /reprocessKnowledgeDocument/);
  assert.match(documentsSource, /deleteKnowledgeDocument/);
  assert.match(documentsSource, /SegmentsCard/);
  assert.match(documentsSource, /TasksCard/);

  assert.doesNotMatch(documentsSource, /uploadKnowledgeDocument/);
  assert.doesNotMatch(documentsSource, /runKnowledgeRetrievalTest/);
});

test('knowledge upload page owns standalone document upload workflow', () => {
  const uploadSource = source('knowledge-upload-content.tsx');

  assert.match(uploadSource, /上传文档/);
  assert.match(uploadSource, /KnowledgeDocumentFormPanel/);
  assert.match(uploadSource, /uploadKnowledgeDocument/);
  assert.match(uploadSource, /\/knowledge\/\$\{knowledgeId\}\/documents/);

  assert.doesNotMatch(uploadSource, /getKnowledgeDocument/);
  assert.doesNotMatch(uploadSource, /runKnowledgeRetrievalTest/);
});

test('knowledge retrieval page owns retrieval test, recall logs, and rebuild index workflow', () => {
  const retrievalSource = source('knowledge-retrieval-content.tsx');
  const sharedSource = source('knowledge-shared.tsx');

  assert.match(retrievalSource, /检索测试/);
  assert.match(retrievalSource, /getKnowledgeBase/);
  assert.match(retrievalSource, /runKnowledgeRetrievalTest/);
  assert.match(retrievalSource, /rebuildKnowledgeIndex/);
  assert.match(retrievalSource, /召回日志/);
  assert.match(sharedSource, /function KnowledgeConfirmDialog/);
  assert.match(retrievalSource, /rebuildIndexTarget/);
  assert.match(retrievalSource, /function confirmRebuildIndex/);
  assert.match(retrievalSource, /确认重建知识库索引/);
  assert.match(retrievalSource, /onConfirm=\{confirmRebuildIndex\}/);
  assert.doesNotMatch(retrievalSource, /onClick=\{\(\) => rebuildMutation\.mutate\(knowledgeId\)\}/);

  assert.doesNotMatch(retrievalSource, /uploadKnowledgeDocument/);
  assert.doesNotMatch(retrievalSource, /getKnowledgeDocument/);
});
