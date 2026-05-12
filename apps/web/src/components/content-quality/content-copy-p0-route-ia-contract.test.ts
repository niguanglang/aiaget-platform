import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const p0ContentFiles = [
  'src/components/data-scopes/data-scope-content.tsx',
  'src/components/agent-teams/agent-teams-content.tsx',
  'src/components/models/models-content.tsx',
  'src/components/tools/tool-content.tsx',
  'src/components/prompts/prompts-content.tsx',
  'src/components/knowledge/knowledge-content.tsx',
  'src/components/conversations/conversation-content.tsx',
  'src/components/monitor/monitor-content.tsx',
  'src/components/billing/billing-content.tsx',
  'src/components/api-keys/api-key-content.tsx',
  'src/components/menus/menu-content.tsx',
];

const p0NoisyCopyPatterns = [
  /\bM\d{1,3}\b/,
  /IA 拆分/,
  /列表页用于/,
  /列表页只负责/,
  /列表只负责/,
  /只保留/,
  /已拆到/,
  /已拆分/,
  /独立页面/,
  /独立页/,
  /详情页维护/,
  /进入详情页/,
  /完整配置/,
  /完整内容/,
  /完整运行证据/,
  /避免在列表页/,
  /增删改查契约/,
];

test('p0 console pages do not expose milestone or IA explainer copy', () => {
  for (const file of p0ContentFiles) {
    const source = readFileSync(join(process.cwd(), file), 'utf8');

    for (const pattern of p0NoisyCopyPatterns) {
      assert.doesNotMatch(source, pattern, `${file} still exposes internal copy: ${pattern}`);
    }
  }
});

test('p0 list headers hide create actions when users cannot write instead of rendering disabled placeholders', () => {
  const filesWithCreateActions = [
    'src/components/menus/menu-content.tsx',
    'src/components/models/models-content.tsx',
    'src/components/tools/tool-content.tsx',
    'src/components/prompts/prompts-content.tsx',
    'src/components/knowledge/knowledge-content.tsx',
    'src/components/conversations/conversation-content.tsx',
  ];

  for (const file of filesWithCreateActions) {
    const source = readFileSync(join(process.cwd(), file), 'utf8');
    assert.doesNotMatch(source, /<Button[^>]*disabled[^>]*>\s*[\s\S]{0,160}<Plus/, `${file} still renders a disabled create placeholder`);
  }
});

