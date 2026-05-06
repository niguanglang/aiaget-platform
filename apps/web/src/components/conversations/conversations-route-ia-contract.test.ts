import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const conversationsListSource = readFileSync(join(process.cwd(), 'src/components/conversations/conversation-content.tsx'), 'utf8');
const conversationDetailSource = readFileSync(join(process.cwd(), 'src/components/conversations/conversation-detail-content.tsx'), 'utf8');

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

test('conversation detail page owns message streaming and feedback workflow', () => {
  assert.match(conversationDetailSource, /streamConversationMessage/);
  assert.match(conversationDetailSource, /createConversationFeedback/);
});
