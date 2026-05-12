import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const p1ContentFiles = [
  'src/components/channels/channel-overview-content.tsx',
  'src/components/channels/channel-providers-content.tsx',
  'src/components/channels/channel-provider-edit-content.tsx',
  'src/components/channels/channel-accounts-content.tsx',
  'src/components/channels/channel-account-edit-content.tsx',
  'src/components/channels/channel-templates-content.tsx',
  'src/components/channels/channel-template-edit-content.tsx',
  'src/components/channels/channel-route-rule-edit-content.tsx',
  'src/components/channels/channel-operations-pages.tsx',
  'src/components/channels/channel-route-rules-content.tsx',
  'src/components/channels/channel-jobs-content.tsx',
  'src/components/channels/channel-deliveries-content.tsx',
  'src/components/channels/channel-replies-content.tsx',
  'src/components/channels/channel-delivery-detail-content.tsx',
  'src/components/channels/channel-sender-content.tsx',
  'src/components/channels/channel-release-content.tsx',
  'src/components/security/security-policies-content.tsx',
  'src/components/security/security-events-content.tsx',
  'src/components/security/security-archives-content.tsx',
  'src/components/security/security-alerts-content.tsx',
  'src/components/security/security-recovery-content.tsx',
  'src/components/platform-event-usage/platform-event-usage-panel.tsx',
  'src/components/platform-event-usage/platform-usage-overview-content.tsx',
  'src/components/platform-event-usage/platform-usage-shared.tsx',
  'src/components/settings/settings-content.tsx',
];

const p1NoisyCopyPatterns = [
  /\bM\d{1,3}\b/,
  /列表页用于/,
  /列表页只负责/,
  /列表只负责/,
  /只保留/,
  /已拆到/,
  /已拆分/,
  /独立页面/,
  /独立页/,
  /完整配置/,
  /完整内容/,
  /完整列表/,
  /完整表单/,
  /完整请求/,
  /完整处理/,
  /不在本页/,
  /不嵌入/,
  /进入独立/,
  /进入详情页/,
  /闭环/,
  /沉淀/,
  /赋能/,
  /打造/,
  /避免在列表页/,
];

test('p1 channel security usage and settings pages avoid internal IA and marketing copy', () => {
  for (const file of p1ContentFiles) {
    const source = readFileSync(join(process.cwd(), file), 'utf8');

    for (const pattern of p1NoisyCopyPatterns) {
      assert.doesNotMatch(source, pattern, `${file} still exposes noisy copy: ${pattern}`);
    }
  }
});

test('p1 channel and security pages hide unavailable navigation actions instead of showing disabled placeholders', () => {
  const filesWithPermissionActions = [
    'src/components/channels/channel-providers-content.tsx',
    'src/components/channels/channel-accounts-content.tsx',
    'src/components/channels/channel-templates-content.tsx',
    'src/components/channels/channel-route-rules-content.tsx',
    'src/components/channels/channel-jobs-content.tsx',
    'src/components/channels/channel-deliveries-content.tsx',
    'src/components/channels/channel-replies-content.tsx',
    'src/components/security/security-policies-content.tsx',
    'src/components/platform-event-usage/platform-usage-shared.tsx',
    'src/components/settings/settings-content.tsx',
  ];

  for (const file of filesWithPermissionActions) {
    const source = readFileSync(join(process.cwd(), file), 'utf8');

    assert.doesNotMatch(source, /<Button\s+asChild\s+disabled/, `${file} still renders a disabled navigation placeholder`);
    assert.doesNotMatch(source, /<Button[^>]*disabled[^>]*>\s*[\s\S]{0,160}<Plus/, `${file} still renders a disabled create placeholder`);
  }
});
