import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const conversationsListSource = readFileSync(join(process.cwd(), 'src/components/conversations/conversation-content.tsx'), 'utf8');
const conversationDetailSource = readFileSync(join(process.cwd(), 'src/components/conversations/conversation-detail-content.tsx'), 'utf8');
const conversationsRoot = join(process.cwd(), 'src/components/conversations');

function source(fileName: string) {
  return readFileSync(join(conversationsRoot, fileName), 'utf8');
}

function productionSources() {
  return readdirSync(conversationsRoot)
    .filter((fileName) => fileName.endsWith('.tsx') && !fileName.endsWith('.test.tsx'))
    .map((fileName) => [fileName, source(fileName)] as const);
}

test('conversation center route-level pages exist for list, create, and detail', () => {
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/conversations/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/conversations/create/page.tsx')));
  assert.ok(existsSync(join(process.cwd(), 'src/app/(console)/conversations/[id]/page.tsx')));
});

test('conversation list page keeps detail, forms, and chat panels out of the list surface', () => {
  assert.doesNotMatch(conversationsListSource, /ConversationQuickPanel/);
  assert.doesNotMatch(conversationsListSource, /ConversationFormPanel/);
  assert.doesNotMatch(conversationsListSource, /selectedConversationId/);
  assert.doesNotMatch(conversationsListSource, /getConversation/);
  assert.doesNotMatch(conversationsListSource, /createConversation/);
  assert.doesNotMatch(conversationsListSource, /sendConversationMessage/);
});

test('conversation production components use the unified wide white operations shell', () => {
  assert.equal(existsSync(join(conversationsRoot, 'conversation-center-background.tsx')), false);

  for (const [fileName, fileSource] of productionSources()) {
    assert.doesNotMatch(fileSource, /motion\/react/, `${fileName} must not import motion/react`);
    assert.doesNotMatch(fileSource, /motion\./, `${fileName} must not render motion components`);
    assert.doesNotMatch(fileSource, /MetricCard/, `${fileName} must not use the legacy MetricCard shell`);
    assert.doesNotMatch(fileSource, /max-w-7xl/, `${fileName} must not constrain the operations shell to max-w-7xl`);
    assert.doesNotMatch(fileSource, /ConversationCenterBackground/, `${fileName} must not use the legacy background shell`);
  }
});

test('conversation detail page owns message streaming and feedback workflow', () => {
  const streamPath = join(conversationsRoot, 'use-conversation-stream.ts');
  const detailAndStreamSource = `${conversationDetailSource}\n${existsSync(streamPath) ? source('use-conversation-stream.ts') : ''}`;

  assert.match(detailAndStreamSource, /streamConversationMessage/);
  assert.match(conversationDetailSource, /createConversationFeedback/);
});

test('conversation detail page is split into focused components and streaming hook', () => {
  assert.ok(existsSync(join(conversationsRoot, 'use-conversation-stream.ts')));
  assert.ok(existsSync(join(conversationsRoot, 'conversation-detail-header.tsx')));
  assert.ok(existsSync(join(conversationsRoot, 'conversation-message-stream-card.tsx')));
  assert.ok(existsSync(join(conversationsRoot, 'conversation-run-trace-card.tsx')));
  assert.ok(existsSync(join(conversationsRoot, 'conversation-feedback-card.tsx')));
  assert.ok(existsSync(join(conversationsRoot, 'conversation-reference-tools-card.tsx')));
  assert.ok(existsSync(join(conversationsRoot, 'conversation-confirm-dialog.tsx')));

  assert.match(conversationDetailSource, /useConversationStream/);
  assert.match(conversationDetailSource, /ConversationDetailHeader/);
  assert.match(conversationDetailSource, /ConversationMessageStreamCard/);
  assert.match(conversationDetailSource, /ConversationRunTraceCard/);
  assert.match(conversationDetailSource, /ConversationFeedbackCard/);
  assert.match(conversationDetailSource, /ConversationReferenceToolsCard/);
  assert.match(conversationDetailSource, /ConversationConfirmDialog/);

  assert.doesNotMatch(conversationDetailSource, /function MessageStreamCard/);
  assert.doesNotMatch(conversationDetailSource, /function RunTraceCard/);
  assert.doesNotMatch(conversationDetailSource, /function FeedbackCard/);
  assert.doesNotMatch(conversationDetailSource, /function ReferenceAndToolsCard/);
  assert.doesNotMatch(conversationDetailSource, /function ConfirmDialog/);
});

test('conversation focused files own stream events, disabled states, feedback, and approval links', () => {
  const streamHookSource = source('use-conversation-stream.ts');
  const messageSource = source('conversation-message-stream-card.tsx');
  const runTraceSource = source('conversation-run-trace-card.tsx');
  const feedbackSource = source('conversation-feedback-card.tsx');
  const referenceSource = source('conversation-reference-tools-card.tsx');
  const confirmSource = source('conversation-confirm-dialog.tsx');

  assert.match(streamHookSource, /streamConversationMessage/);
  assert.match(streamHookSource, /event.type === 'delta'/);
  assert.match(streamHookSource, /event.type === 'error'/);
  assert.match(streamHookSource, /setQueryData<ConversationDetail/);
  assert.match(streamHookSource, /temp-assistant-stream/);

  assert.match(messageSource, /ConversationMessageStreamCard/);
  assert.match(messageSource, /conversation.status === 'ARCHIVED'/);
  assert.match(messageSource, /disabled=\{!canWrite \|\| pending \|\| conversation.status === 'ARCHIVED'\}/);
  assert.doesNotMatch(messageSource, /streamConversationMessage/);

  assert.match(runTraceSource, /ConversationRunTraceCard/);
  assert.match(runTraceSource, /StepMetaRow/);
  assert.match(runTraceSource, /EmptyState/);

  assert.match(feedbackSource, /ConversationFeedbackCard/);
  assert.match(conversationDetailSource, /run_id: latestRun\?\.id \?\? null/);
  assert.match(conversationDetailSource, /createConversationFeedback/);
  assert.doesNotMatch(feedbackSource, /createConversationFeedback/);

  assert.match(referenceSource, /ConversationReferenceToolsCard/);
  assert.match(referenceSource, /href=\{`\/approvals\?requestId=\$\{toolCall.approval_request_id\}`\}/);
  assert.match(referenceSource, /conversationToolCallStatusLabel/);

  assert.match(confirmSource, /ConversationConfirmDialog/);
  assert.match(confirmSource, /variant="destructive"/);
});
