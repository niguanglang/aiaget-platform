import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const p3ContentFiles = [
  'src/app/(console)/api-reference/page.tsx',
  'src/components/agent-teams/agent-team-create-content.tsx',
  'src/components/agent-teams/agent-team-detail-content.tsx',
  'src/components/agents/agent-create-content.tsx',
  'src/components/agents/agents-content.tsx',
  'src/components/api-keys/api-key-create-content.tsx',
  'src/components/api-keys/api-key-edit-content.tsx',
  'src/components/api-keys/api-key-observability-content.tsx',
  'src/components/api-keys/api-key-shared.tsx',
  'src/components/api-keys/webhook-deliveries-content.tsx',
  'src/components/api-keys/webhook-delivery-detail-content.tsx',
  'src/components/approval-audits/approval-audit-archives-content.tsx',
  'src/components/approval-audits/approval-audit-content.tsx',
  'src/components/audit/audit-content.tsx',
  'src/components/billing/billing-invoices-content.tsx',
  'src/components/channels/channel-accounts-content.tsx',
  'src/components/departments/department-content.tsx',
  'src/components/knowledge/knowledge-create-content.tsx',
  'src/components/models/model-provider-create-content.tsx',
  'src/components/plugins/plugin-content.tsx',
  'src/components/prompts/prompt-create-content.tsx',
  'src/components/prompts/prompt-detail-header.tsx',
  'src/components/resource-acls/resource-acl-check-content.tsx',
  'src/components/resource-acls/resource-acl-content.tsx',
  'src/components/resource-acls/resource-acl-shared.tsx',
  'src/components/roles/role-create-content.tsx',
  'src/components/role-scenarios/role-scenario-status.ts',
  'src/components/role-scenarios/role-scenarios-content.tsx',
  'src/components/storage/storage-content.tsx',
  'src/components/tenants/tenants-content.tsx',
  'src/components/tools/tool-create-content.tsx',
  'src/components/tools/tool-detail-header.tsx',
  'src/components/tools/tool-edit-content.tsx',
];

const p3NoisyCopyPatterns = [
  /\bM\d{1,3}(?:-\d+)?\b/,
  /列表页用于/,
  /列表页只负责/,
  /列表只负责/,
  /列表只展示/,
  /列表只保留/,
  /只保留/,
  /已拆到/,
  /已拆分/,
  /独立事件详情页/,
  /详情页维护/,
  /进入详情页/,
  /进入独立/,
  /完整上下文/,
  /完整交付细节/,
  /完整账单项/,
  /沉淀/,
  /赋能/,
  /打造/,
  /示例插件/,
  /执行 seed/,
  /模拟检查/,
  /模拟资源/,
  /模拟命中/,
  /点击模拟/,
];

test('p3 remaining console pages avoid internal milestone, IA explainer, and placeholder copy', () => {
  for (const file of p3ContentFiles) {
    const source = readFileSync(join(process.cwd(), file), 'utf8');

    for (const pattern of p3NoisyCopyPatterns) {
      assert.doesNotMatch(source, pattern, `${file} still exposes noisy copy: ${pattern}`);
    }
  }
});
