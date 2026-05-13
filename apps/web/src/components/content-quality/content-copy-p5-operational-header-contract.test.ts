import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const operationalListPages = [
  'src/components/role-scenarios/role-scenarios-content.tsx',
  'src/components/role-scenarios/role-scenario-create-content.tsx',
  'src/components/role-scenarios/role-scenario-form-panel.tsx',
  'src/components/solution-packages/solution-packages-content.tsx',
  'src/components/solution-packages/solution-package-form-panel.tsx',
  'src/components/delivery-assets/delivery-assets-content.tsx',
  'src/components/delivery-assets/delivery-asset-form-panel.tsx',
  'src/components/skills/skills-content.tsx',
  'src/components/customer-assessments/customer-assessments-content.tsx',
  'src/components/customer-success-plans/customer-success-plans-content.tsx',
  'src/components/customer-success-plans/customer-success-plan-form-panel.tsx',
  'src/components/customer-success-actions/customer-success-actions-content.tsx',
  'src/components/customer-success-actions/customer-success-action-create-content.tsx',
  'src/components/customer-success-opportunities/customer-success-opportunities-content.tsx',
  'src/components/customer-success-opportunities/customer-success-opportunity-create-content.tsx',
  'src/components/customer-success-opportunities/customer-success-opportunity-form-panel.tsx',
  'src/components/agents/agent-create-content.tsx',
  'src/components/tools/tool-edit-content.tsx',
  'src/components/models/model-provider-create-content.tsx',
  'src/components/menus/menu-create-content.tsx',
  'src/components/channels/channel-overview-content.tsx',
  'src/components/channels/channel-templates-content.tsx',
  'src/components/billing/billing-usage-content.tsx',
  'src/components/monitor/monitor-content.tsx',
  'src/components/settings/production-readiness-content.tsx',
  'src/components/platform-event-usage/platform-event-usage-panel.tsx',
  'src/components/platform-event-usage/platform-usage-overview-content.tsx',
  'src/components/channels/channel-operations-pages.tsx',
];

const marketingHeaderPatterns = [
  /将岗位目标、业务流程/,
  /组合为可复用/,
  /可复用的 AI/,
  /AI 落地场景包/,
  /业务资产组合/,
  /交付成果验收/,
  /客户评估 \+ 岗位场景/,
  /绑定落地方案包/,
  /改进行动 \+ 扩展计划/,
  /复用指引 \+ 风险说明/,
  /把客户分层/,
  /把验收复盘/,
  /把客户成功计划/,
  /从客户成功计划拆解/,
  /把.*转成/,
  /承接落地方案包/,
  /管理可复用/,
  /查询可复用/,
  /轻量售前资格/,
  /成果资产复用/,
  /计划拆解/,
  /续约机会 \+ 商务推进/,
  /按岗位、部门、状态/,
  /核心识别字段/,
  /录入基础资料/,
  /保存后可继续/,
  /配置 HTTP 请求/,
  /当前使用文本域/,
  /知识笔记/,
  /按窗口查看 Token/,
  /帮助运营/,
  /汇总发布渠道/,
  /管理渠道消息模板/,
  /聚合控制服务/,
  /应用内轻量任务调度/,
  /平台事件、用量账本/,
  /独立表单维护/,
];

test('p5 operational list pages avoid marketing-style header copy', () => {
  for (const file of operationalListPages) {
    const source = readFileSync(join(process.cwd(), file), 'utf8');

    for (const pattern of marketingHeaderPatterns) {
      assert.doesNotMatch(source, pattern, `${file} still exposes marketing-style header copy: ${pattern}`);
    }
  }
});
