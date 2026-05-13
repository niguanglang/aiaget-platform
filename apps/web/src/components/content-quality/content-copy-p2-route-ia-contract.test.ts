import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const p2ContentFiles = [
  'src/components/customer-assessments/customer-assessments-content.tsx',
  'src/components/customer-assessments/customer-assessment-create-content.tsx',
  'src/components/customer-assessments/customer-assessment-detail-content.tsx',
  'src/components/delivery-assets/delivery-assets-content.tsx',
  'src/components/delivery-assets/delivery-asset-create-content.tsx',
  'src/components/delivery-assets/delivery-asset-form-panel.tsx',
  'src/components/customer-success-actions/customer-success-actions-content.tsx',
  'src/components/customer-success-actions/customer-success-action-create-content.tsx',
  'src/components/customer-success-actions/customer-success-action-status.ts',
  'src/components/customer-success-plans/customer-success-plans-content.tsx',
  'src/components/customer-success-plans/customer-success-plan-create-content.tsx',
  'src/components/customer-success-opportunities/customer-success-opportunities-content.tsx',
  'src/components/customer-success-opportunities/customer-success-opportunity-detail-content.tsx',
  'src/components/delivery-reviews/delivery-reviews-content.tsx',
  'src/components/solution-packages/solution-packages-content.tsx',
  'src/components/skills/skills-content.tsx',
  'src/components/skills/skill-create-content.tsx',
  'src/components/skills/skill-edit-content.tsx',
  'src/components/skills/skill-detail-content.tsx',
  'src/components/plugins/plugin-content.tsx',
  'src/components/plugins/plugin-detail-content.tsx',
];

const p2NoisyCopyPatterns = [
  /\bM\d{1,3}(?:-\d+)?\b/,
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
  /完整列表/,
  /完整表单/,
  /完整请求/,
  /完整处理/,
  /不在本页/,
  /不嵌入/,
  /进入独立/,
  /闭环/,
  /沉淀/,
  /赋能/,
  /打造/,
  /避免在列表页/,
  /商业化/,
  /产品化/,
  /一站式/,
  /全链路/,
  /拉通/,
];

test('p2 customer delivery plugin skill and solution pages avoid internal IA and marketing copy', () => {
  for (const file of p2ContentFiles) {
    const source = readFileSync(join(process.cwd(), file), 'utf8');

    for (const pattern of p2NoisyCopyPatterns) {
      assert.doesNotMatch(source, pattern, `${file} still exposes noisy copy: ${pattern}`);
    }
  }
});

test('p2 customer delivery plugin skill and solution pages hide unavailable navigation actions', () => {
  const filesWithPermissionActions = [
    'src/components/customer-assessments/customer-assessments-content.tsx',
    'src/components/customer-assessments/customer-assessment-detail-content.tsx',
    'src/components/delivery-assets/delivery-assets-content.tsx',
    'src/components/customer-success-actions/customer-success-actions-content.tsx',
    'src/components/customer-success-opportunities/customer-success-opportunities-content.tsx',
    'src/components/customer-success-plans/customer-success-plans-content.tsx',
    'src/components/delivery-reviews/delivery-reviews-content.tsx',
    'src/components/solution-packages/solution-packages-content.tsx',
    'src/components/skills/skills-content.tsx',
    'src/components/skills/skill-detail-content.tsx',
  ];

  for (const file of filesWithPermissionActions) {
    const source = readFileSync(join(process.cwd(), file), 'utf8');

    assert.doesNotMatch(source, /<Button\s+asChild\s+disabled/, `${file} still renders a disabled navigation placeholder`);
    assert.doesNotMatch(source, /<Button[^>]*disabled[^>]*>\s*[\s\S]{0,180}<Plus/, `${file} still renders a disabled create placeholder`);
  }
});
