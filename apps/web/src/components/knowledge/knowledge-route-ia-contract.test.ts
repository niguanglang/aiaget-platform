import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const knowledgeListSource = readFileSync(join(process.cwd(), 'src/components/knowledge/knowledge-content.tsx'), 'utf8');
const knowledgeDetailSource = readFileSync(join(process.cwd(), 'src/components/knowledge/knowledge-detail-content.tsx'), 'utf8');
const knowledgeCreateSource = readFileSync(join(process.cwd(), 'src/components/knowledge/knowledge-create-content.tsx'), 'utf8');
const knowledgeEditSource = readFileSync(join(process.cwd(), 'src/components/knowledge/knowledge-edit-content.tsx'), 'utf8');
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
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/knowledge/tasks/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/knowledge/recalls/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/knowledge/health/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/knowledge/[id]/documents/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/knowledge/[id]/upload/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/knowledge/[id]/retrieval/page.tsx')));

  assert.ok(existsSync(join(componentsRoot, 'knowledge-shared.tsx')));
  assert.ok(existsSync(join(componentsRoot, 'knowledge-activity-content.tsx')));
  assert.ok(existsSync(join(componentsRoot, 'knowledge-tasks-content.tsx')));
  assert.ok(existsSync(join(componentsRoot, 'knowledge-recalls-content.tsx')));
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

test('knowledge list page follows operational directory layout without old visual shell', () => {
  assert.match(knowledgeListSource, /知识库中心/);
  assert.match(knowledgeListSource, /知识库列表/);
  assert.match(knowledgeListSource, /max-w-\[1680px\]/);
  assert.match(knowledgeListSource, /rounded-xl border border-slate-200\/80 bg-white\/\[0\.9\]/);
  assert.match(knowledgeListSource, /KnowledgeListMetricTile/);
  assert.doesNotMatch(knowledgeListSource, /KnowledgeCenterBackground/);
  assert.doesNotMatch(knowledgeListSource, /MetricCard/);
  assert.doesNotMatch(knowledgeListSource, /motion/);
  assert.doesNotMatch(knowledgeListSource, /搜索名称、编码、描述/);
  assert.doesNotMatch(knowledgeListSource, /base\.description/);
});

test('knowledge activity and health pages own overview activity and backend capability surfaces', () => {
  const activitySource = source('knowledge-activity-content.tsx');
  const tasksSource = source('knowledge-tasks-content.tsx');
  const recallsSource = source('knowledge-recalls-content.tsx');
  const healthSource = source('knowledge-health-content.tsx');

  assert.match(activitySource, /getKnowledgeOverview/);
  assert.match(activitySource, /recent_documents/);
  assert.match(activitySource, /\/knowledge\/tasks/);
  assert.match(activitySource, /\/knowledge\/recalls/);
  assert.match(activitySource, /recent_tasks/);
  assert.match(activitySource, /recent_recall_logs/);
  assert.match(activitySource, /KnowledgeProcessingQueueTable/);
  assert.match(activitySource, /KnowledgeRecallQualityOverview/);
  assert.doesNotMatch(activitySource, /KnowledgeTaskDetailPanel/);
  assert.doesNotMatch(activitySource, /KnowledgeRecallQualityPanel/);
  assert.doesNotMatch(activitySource, /selectedTaskId/);

  assert.match(tasksSource, /getKnowledgeOverview/);
  assert.match(tasksSource, /KnowledgeTaskListTable/);
  assert.match(tasksSource, /KnowledgeTaskDetailPanel/);
  assert.match(tasksSource, /文档处理任务/);

  assert.match(recallsSource, /getKnowledgeOverview/);
  assert.match(recallsSource, /KnowledgeRecallTable/);
  assert.match(recallsSource, /召回记录/);

  assert.match(healthSource, /getKnowledgeOverview/);
  assert.match(healthSource, /MinIO/);
  assert.match(healthSource, /Qdrant/);
  assert.match(healthSource, /OpenSearch/);
  assert.match(healthSource, /向量回退/);
});

test('knowledge recalls page follows operational recall table layout', () => {
  const recallsSource = source('knowledge-recalls-content.tsx');

  assert.match(recallsSource, /召回记录/);
  assert.match(recallsSource, /召回列表/);
  assert.match(recallsSource, /KnowledgeRecallTable/);
  assert.match(recallsSource, /KnowledgeRecallQualitySummary/);
  assert.match(recallsSource, /selectedRecallId/);
  assert.match(recallsSource, /KnowledgeRecallFilterBar/);
  assert.match(recallsSource, /KnowledgeRecallDetailPanel/);
  assert.match(recallsSource, /KnowledgeRecallResultList/);
  assert.match(recallsSource, /KnowledgeRecallExecutionLogList/);
  assert.match(recallsSource, /任务名称/);
  assert.match(recallsSource, /平均命中率/);
  assert.match(recallsSource, /TopK/);
  assert.match(recallsSource, /Score 阈值/);
  assert.match(recallsSource, /Embedding 模型/);
  assert.match(recallsSource, /Rerank 模型/);
  assert.match(recallsSource, /max-w-\[1680px\]/);
  assert.match(recallsSource, /rounded-xl border border-slate-200\/80 bg-white\/\[0\.9\]/);
  assert.doesNotMatch(recallsSource, /新建召回任务/);
  assert.doesNotMatch(recallsSource, /重跑/);
  assert.doesNotMatch(recallsSource, /导出/);
  assert.doesNotMatch(recallsSource, /演示/);
  assert.doesNotMatch(recallsSource, /示例/);
  assert.doesNotMatch(recallsSource, /描述/);
  assert.doesNotMatch(recallsSource, /KnowledgeCenterBackground/);
  assert.doesNotMatch(recallsSource, /MetricCard/);
  assert.doesNotMatch(recallsSource, /motion/);
  assert.doesNotMatch(recallsSource, /KnowledgeActivityTimeline/);
});

test('knowledge health page follows operational capability layout without old visual shell', () => {
  const healthSource = source('knowledge-health-content.tsx');

  assert.match(healthSource, /知识库能力健康/);
  assert.match(healthSource, /能力概览/);
  assert.match(healthSource, /KnowledgeCapabilityStatusGrid/);
  assert.match(healthSource, /KnowledgeStorageReadinessPanel/);
  assert.match(healthSource, /KnowledgeHealthScoreStrip/);
  assert.match(healthSource, /KnowledgeHealthDimensionList/);
  assert.match(healthSource, /KnowledgeHealthIssueTable/);
  assert.match(healthSource, /KnowledgeHealthDetailPanel/);
  assert.match(healthSource, /综合健康度/);
  assert.match(healthSource, /索引成功率/);
  assert.match(healthSource, /文档新鲜度/);
  assert.match(healthSource, /召回命中率/);
  assert.match(healthSource, /权限风险/);
  assert.match(healthSource, /整改建议/);
  assert.match(healthSource, /max-w-\[1680px\]/);
  assert.match(healthSource, /rounded-xl border border-slate-200\/80 bg-white\/\[0\.9\]/);
  assert.doesNotMatch(healthSource, /演示/);
  assert.doesNotMatch(healthSource, /示例/);
  assert.doesNotMatch(healthSource, /描述/);
  assert.doesNotMatch(healthSource, /KnowledgeCenterBackground/);
  assert.doesNotMatch(healthSource, /motion/);
  assert.doesNotMatch(healthSource, /KnowledgeCapabilityCard/);
});

test('knowledge activity overview follows operational reference layout without placeholder cards', () => {
  const activitySource = source('knowledge-activity-content.tsx');
  const sharedSource = source('knowledge-overview-shared.tsx');

  assert.match(activitySource, /知识库活动总览/);
  assert.match(activitySource, /刷新活动/);
  assert.match(activitySource, /处理任务/);
  assert.match(activitySource, /召回记录/);
  assert.match(activitySource, /KnowledgeMetricTile/);
  assert.match(activitySource, /KnowledgeProcessingQueueTable/);
  assert.match(activitySource, /KnowledgeRecallQualityOverview/);
  assert.match(activitySource, /KnowledgeTopQueriesTable/);
  assert.match(activitySource, /knowledgeSourceTypeLabel/);
  assert.match(activitySource, /healthScore/);
  assert.match(activitySource, /CircularScore/);
  assert.doesNotMatch(activitySource, /KnowledgeTaskQueueTable/);
  assert.doesNotMatch(activitySource, /KnowledgeRecallQualityPanel/);
  assert.doesNotMatch(activitySource, /KnowledgeActivityEntryPanel/);
  assert.doesNotMatch(activitySource, /KnowledgeRetrievalEntryPanel/);
  assert.doesNotMatch(activitySource, /selectedTaskId/);
  assert.doesNotMatch(activitySource, /暂停/);
  assert.doesNotMatch(activitySource, /演示/);
  assert.doesNotMatch(activitySource, /示例/);
  assert.doesNotMatch(activitySource, /描述/);
  assert.match(activitySource, /max-w-\[1680px\]/);
  assert.match(activitySource, /rounded-xl border border-slate-200\/80 bg-white\/\[0\.9\]/);
  assert.doesNotMatch(activitySource, /KnowledgeCenterBackground/);
  assert.doesNotMatch(activitySource, /MetricCard/);
  assert.doesNotMatch(activitySource, /motion/);
  assert.doesNotMatch(sharedSource, /title="空"/);
  assert.doesNotMatch(sharedSource, /没有活动数据/);
});

test('knowledge processing task page provides task list and focused task detail panel', () => {
  const tasksSource = source('knowledge-tasks-content.tsx');

  assert.match(tasksSource, /文档处理任务/);
  assert.match(tasksSource, /任务列表/);
  assert.match(tasksSource, /任务详情/);
  assert.match(tasksSource, /selectedTaskId/);
  assert.match(tasksSource, /KnowledgeTaskDetailPanel/);
  assert.match(tasksSource, /KnowledgeTaskListTable/);
  assert.match(tasksSource, /KnowledgeTaskStatusTabs/);
  assert.match(tasksSource, /KnowledgeTaskMetricTile/);
  assert.match(tasksSource, /KnowledgeTaskStageList/);
  assert.match(tasksSource, /KnowledgeTaskLogList/);
  assert.match(tasksSource, /任务名称 \/ ID/);
  assert.match(tasksSource, /创建时间/);
  assert.match(tasksSource, /耗时/);
  assert.match(tasksSource, /max-w-\[1680px\]/);
  assert.match(tasksSource, /rounded-xl border border-slate-200\/80 bg-white\/\[0\.9\]/);
  assert.match(tasksSource, /processed_items/);
  assert.doesNotMatch(tasksSource, /新建处理任务/);
  assert.doesNotMatch(tasksSource, /暂停任务/);
  assert.doesNotMatch(tasksSource, /取消任务/);
  assert.doesNotMatch(tasksSource, /重试任务/);
  assert.doesNotMatch(tasksSource, /演示/);
  assert.doesNotMatch(tasksSource, /示例/);
  assert.doesNotMatch(tasksSource, /描述/);
  assert.doesNotMatch(tasksSource, /KnowledgeCenterBackground/);
  assert.doesNotMatch(tasksSource, /MetricCard/);
  assert.doesNotMatch(tasksSource, /motion/);
});

test('knowledge detail page keeps edit as route navigation', () => {
  assert.doesNotMatch(knowledgeDetailSource, /setIsEditingBase\(true\)/);
  assert.doesNotMatch(knowledgeDetailSource, /KnowledgeFormPanel[\s\S]*mode="edit"/);
  assert.match(knowledgeDetailSource, /\/knowledge\/\$\{knowledgeId\}\/edit/);
});

test('knowledge create, edit, detail, document, upload, and retrieval pages use the operational shell', () => {
  const operationSources = [
    knowledgeCreateSource,
    knowledgeEditSource,
    knowledgeDetailSource,
    source('knowledge-documents-content.tsx'),
    source('knowledge-upload-content.tsx'),
    source('knowledge-retrieval-content.tsx'),
  ];

  for (const operationSource of operationSources) {
    assert.match(operationSource, /max-w-\[1680px\]/);
    assert.match(operationSource, /rounded-xl border border-slate-200\/80 bg-white\/\[0\.9\]/);
    assert.doesNotMatch(operationSource, /KnowledgeCenterBackground/);
    assert.doesNotMatch(operationSource, /MetricCard/);
    assert.doesNotMatch(operationSource, /motion/);
  }
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
  assert.match(retrievalSource, /useState\(''\)/);
  assert.doesNotMatch(retrievalSource, /认证部署指南/);

  assert.doesNotMatch(retrievalSource, /uploadKnowledgeDocument/);
  assert.doesNotMatch(retrievalSource, /getKnowledgeDocument/);
});
