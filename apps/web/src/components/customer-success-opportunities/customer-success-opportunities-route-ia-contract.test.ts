import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const opportunitiesRoot = join(root, 'src/components/customer-success-opportunities');

function source(fileName: string) {
  return readFileSync(join(opportunitiesRoot, fileName), 'utf8');
}

test('customer success opportunity center has separate list, create, detail, and edit routes', () => {
  assert.ok(existsSync(join(root, 'src/app/(console)/customer-success-opportunities/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/customer-success-opportunities/analytics/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/customer-success-opportunities/create/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/customer-success-opportunities/[id]/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/customer-success-opportunities/[id]/edit/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/customer-success-opportunities/[id]/close-won-report/page.tsx')));
});

test('customer success opportunity list stays compact and does not embed full commercial details', () => {
  const listSource = source('customer-success-opportunities-content.tsx');

  assert.match(listSource, /续约机会/);
  assert.match(listSource, /listCustomerSuccessOpportunities/);
  assert.match(listSource, /新建机会/);
  assert.match(listSource, /\/customer-success-opportunities\/analytics/);
  assert.match(listSource, /opportunity_score/);
  assert.doesNotMatch(listSource, /stage_funnel/);
  assert.doesNotMatch(listSource, /top_opportunities/);
  assert.doesNotMatch(listSource, /customer_value[\s\S]*<td/);
  assert.doesNotMatch(listSource, /commercial_strategy[\s\S]*<td/);
  assert.doesNotMatch(listSource, /decision_path[\s\S]*<td/);
  assert.doesNotMatch(listSource, /risk_summary[\s\S]*<td/);
  assert.doesNotMatch(listSource, /CustomerSuccessOpportunityFormPanel[\s\S]*mode="edit"/);
});

test('customer success opportunity detail owns value, strategy, decision path, risks and resources', () => {
  const detailSource = source('customer-success-opportunity-detail-content.tsx');

  assert.match(detailSource, /getCustomerSuccessOpportunity/);
  assert.match(detailSource, /客户价值/);
  assert.match(detailSource, /商务策略/);
  assert.match(detailSource, /决策路径/);
  assert.match(detailSource, /风险摘要/);
  assert.match(detailSource, /下一步动作/);
  assert.match(detailSource, /客户成功计划/);
  assert.match(detailSource, /成功行动/);
  assert.match(detailSource, /来源复盘/);
  assert.match(detailSource, /成果资产/);
  assert.match(detailSource, /跟进行动闭环/);
  assert.match(detailSource, /createCustomerSuccessOpportunityFollowUpAction/);
  assert.match(detailSource, /customer:success_action:manage/);
  assert.match(detailSource, /确认生成/);
  assert.match(detailSource, /成交入账闭环/);
  assert.match(detailSource, /closeWonCustomerSuccessOpportunity/);
  assert.match(detailSource, /billing:adjustment:manage/);
  assert.match(detailSource, /确认成交入账/);
  assert.match(detailSource, /billing_adjustments/);
  assert.match(detailSource, /OpportunityAdjustmentTraceRow/);
  assert.match(detailSource, /已关联调账/);
  assert.match(detailSource, /审计追踪/);
});

test('customer success opportunity create and edit pages use the shared form panel', () => {
  const createSource = source('customer-success-opportunity-create-content.tsx');
  const editSource = source('customer-success-opportunity-edit-content.tsx');
  const formSource = source('customer-success-opportunity-form-panel.tsx');

  assert.match(createSource, /CustomerSuccessOpportunityFormPanel/);
  assert.match(createSource, /mode="create"/);
  assert.match(editSource, /CustomerSuccessOpportunityFormPanel/);
  assert.match(editSource, /mode="edit"/);
  assert.match(formSource, /customer_success_plan_id/);
  assert.match(formSource, /customer_success_action_id/);
  assert.match(formSource, /commercial_strategy/);
  assert.match(formSource, /decision_path/);
});

test('customer success opportunity analytics owns funnel and dashboard data outside CRUD list', () => {
  const analyticsSource = source('customer-success-opportunity-analytics-content.tsx');

  assert.match(analyticsSource, /getCustomerSuccessOpportunityAnalytics/);
  assert.match(analyticsSource, /续约机会分析/);
  assert.match(analyticsSource, /阶段漏斗/);
  assert.match(analyticsSource, /类型分布/);
  assert.match(analyticsSource, /风险分布/);
  assert.match(analyticsSource, /高价值机会 Top 5/);
  assert.match(analyticsSource, /近期关闭机会/);
  assert.match(analyticsSource, /customer:success_opportunity:view/);
  assert.doesNotMatch(analyticsSource, /createCustomerSuccessOpportunity/);
  assert.doesNotMatch(analyticsSource, /createCustomerSuccessOpportunityFollowUpAction/);
  assert.doesNotMatch(analyticsSource, /closeWonCustomerSuccessOpportunity/);
  assert.doesNotMatch(analyticsSource, /updateCustomerSuccessOpportunity/);
  assert.doesNotMatch(analyticsSource, /deleteCustomerSuccessOpportunity/);
});

test('customer success opportunity follow-up action workflow stays on detail page and out of list analytics', () => {
  const listSource = source('customer-success-opportunities-content.tsx');
  const detailSource = source('customer-success-opportunity-detail-content.tsx');
  const analyticsSource = source('customer-success-opportunity-analytics-content.tsx');

  assert.match(detailSource, /生成跟进行动/);
  assert.match(detailSource, /查看行动/);
  assert.match(detailSource, /customer-success-actions/);
  assert.doesNotMatch(listSource, /createCustomerSuccessOpportunityFollowUpAction/);
  assert.doesNotMatch(analyticsSource, /生成跟进行动/);
});

test('customer success opportunity close won billing workflow stays on detail page and out of list analytics', () => {
  const listSource = source('customer-success-opportunities-content.tsx');
  const detailSource = source('customer-success-opportunity-detail-content.tsx');
  const analyticsSource = source('customer-success-opportunity-analytics-content.tsx');

  assert.match(detailSource, /成交入账闭环/);
  assert.match(detailSource, /确认成交入账/);
  assert.match(detailSource, /\/billing\/adjustments/);
  assert.match(detailSource, /\/audit\?keyword=/);
  assert.match(detailSource, /closeWonCustomerSuccessOpportunity/);
  assert.match(detailSource, /billing_adjustments/);
  assert.doesNotMatch(listSource, /closeWonCustomerSuccessOpportunity/);
  assert.doesNotMatch(listSource, /确认成交入账/);
  assert.doesNotMatch(listSource, /billing_adjustments/);
  assert.doesNotMatch(analyticsSource, /closeWonCustomerSuccessOpportunity/);
  assert.doesNotMatch(analyticsSource, /确认成交入账/);
  assert.doesNotMatch(analyticsSource, /billing_adjustments/);
});

test('customer success opportunity close won report owns read-only post-sale review route', () => {
  const detailSource = source('customer-success-opportunity-detail-content.tsx');
  const reportSource = source('customer-success-opportunity-close-won-report-content.tsx');
  const listSource = source('customer-success-opportunities-content.tsx');
  const analyticsSource = source('customer-success-opportunity-analytics-content.tsx');

  assert.match(detailSource, /close-won-report/);
  assert.match(reportSource, /getCustomerSuccessOpportunityCloseWonReport/);
  assert.match(reportSource, /exportCustomerSuccessOpportunityCloseWonReport/);
  assert.match(reportSource, /成交复盘报告/);
  assert.match(reportSource, /导出报告/);
  assert.match(reportSource, /客户价值复盘/);
  assert.match(reportSource, /来源链路/);
  assert.match(reportSource, /入账追踪/);
  assert.match(reportSource, /复盘要点/);
  assert.match(reportSource, /下一步动作/);
  assert.match(reportSource, /\/billing\/adjustments/);
  assert.match(reportSource, /\/audit\?keyword=/);
  assert.match(reportSource, /\.md/);
  assert.doesNotMatch(reportSource, /closeWonCustomerSuccessOpportunity/);
  assert.doesNotMatch(reportSource, /createCustomerSuccessOpportunityFollowUpAction/);
  assert.doesNotMatch(reportSource, /updateCustomerSuccessOpportunity/);
  assert.doesNotMatch(listSource, /getCustomerSuccessOpportunityCloseWonReport/);
  assert.doesNotMatch(listSource, /exportCustomerSuccessOpportunityCloseWonReport/);
  assert.doesNotMatch(analyticsSource, /getCustomerSuccessOpportunityCloseWonReport/);
  assert.doesNotMatch(analyticsSource, /exportCustomerSuccessOpportunityCloseWonReport/);
});
