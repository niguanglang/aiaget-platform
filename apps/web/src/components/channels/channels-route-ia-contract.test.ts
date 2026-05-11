import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const channelsRoot = join(root, 'src/components/channels');
const routesRoot = join(root, 'src/app/(console)/channels');
const senderDeliveryDetailRoutePath = join(routesRoot, 'sender/deliveries/[deliveryId]/page.tsx');
const senderDeliveryDetailComponentPath = join(channelsRoot, 'channel-sender-delivery-detail-content.tsx');
const publishJobDetailRoutePath = join(routesRoot, 'jobs/[jobId]/page.tsx');
const publishJobDetailComponentPath = join(channelsRoot, 'channel-job-detail-content.tsx');
const deliveryDetailRoutePath = join(routesRoot, 'deliveries/[deliveryId]/page.tsx');
const deliveryDetailComponentPath = join(channelsRoot, 'channel-delivery-detail-content.tsx');
const replyDetailRoutePath = join(routesRoot, 'replies/[replyId]/page.tsx');
const replyDetailComponentPath = join(channelsRoot, 'channel-reply-detail-content.tsx');
const operationsSharedComponentPath = join(channelsRoot, 'channel-operations-pages.tsx');
const releaseSharedComponentPath = join(channelsRoot, 'channel-release-shared.tsx');

const releaseFocusedPages = [
  {
    component: 'channel-release-control-content.tsx',
    route: 'release/control/page.tsx',
    api: [
      'getChannelPublishControl',
      'updateChannelPublishControl',
      'requestChannelPublishApproval',
      'approveChannelPublish',
      'rejectChannelPublish',
      'updateChannelRollout',
      'rollbackChannelPublish',
    ],
    keywords: ['发布控制', '申请审批', '审批通过', '审批拒绝', '更新灰度', '回滚发布'],
  },
  {
    component: 'channel-release-pipeline-content.tsx',
    route: 'release/pipeline/page.tsx',
    api: ['getChannelReleasePipeline'],
    keywords: ['发布流水线', '发布步骤', '最近批次'],
  },
  {
    component: 'channel-release-gate-content.tsx',
    route: 'release/gate/page.tsx',
    api: ['getChannelReleaseGate', 'evaluateChannelReleaseGate'],
    keywords: ['发布观测门禁', '门禁结论', '门禁策略'],
  },
  {
    component: 'channel-release-automation-content.tsx',
    route: 'release/automation/page.tsx',
    api: ['getChannelReleaseAutomation', 'runChannelReleaseAutomation'],
    keywords: ['自动推进', '最近决策', '运行自动推进'],
  },
  {
    component: 'channel-release-self-healing-content.tsx',
    route: 'release/self-healing/page.tsx',
    api: ['getChannelReleaseSelfHealing', 'runChannelReleaseSelfHealing'],
    keywords: ['发布自愈', '自愈结论', '运行自愈'],
  },
  {
    component: 'channel-release-scheduler-content.tsx',
    route: 'release/scheduler/page.tsx',
    api: ['getChannelReleaseSchedulerOverview', 'runChannelReleaseSchedulerOnce'],
    keywords: ['发布巡检调度', '调度状态', '运行发布巡检'],
  },
  {
    component: 'channel-release-reports-content.tsx',
    route: 'release/reports/page.tsx',
    api: [
      'getChannelReleaseReport',
      'listChannelReleaseReportSnapshots',
      'createChannelReleaseReportSnapshot',
      'getChannelReleaseReportSnapshot',
      'compareChannelReleaseReportSnapshots',
    ],
    keywords: ['发布复盘报告', '复盘快照', '创建快照', '查看快照', '设为基准', '设为对比', '报告版本对比', '严重差异'],
  },
];

const focusedPages = [
  {
    component: 'channel-providers-content.tsx',
    route: 'providers/page.tsx',
    api: ['listChannelProviders', 'enableChannelProvider', 'disableChannelProvider', 'deleteChannelProvider'],
    keywords: ['渠道提供方', '平台适配', '健康状态'],
  },
  {
    component: 'channel-publish-content.tsx',
    route: 'publish/page.tsx',
    api: ['getPublishChannelOverview', 'checkPublishChannel', 'enablePublishChannel', 'disablePublishChannel'],
    keywords: ['发布渠道', '渠道巡检', '健康状态'],
  },
  {
    component: 'channel-accounts-content.tsx',
    route: 'accounts/page.tsx',
    api: ['listChannelAccounts', 'listChannelProviders', 'enableChannelAccount', 'disableChannelAccount'],
    keywords: ['账号凭据', '渠道提供方', '凭据轮换'],
  },
  {
    component: 'channel-templates-content.tsx',
    route: 'templates/page.tsx',
    api: ['listChannelTemplates', 'enableChannelTemplate', 'disableChannelTemplate', 'deleteChannelTemplate'],
    keywords: ['消息模板', '模板编码', '模板类型'],
  },
  {
    component: 'channel-route-rules-content.tsx',
    route: 'route-rules/page.tsx',
    api: ['listChannelRouteRules', 'enableChannelRouteRule', 'disableChannelRouteRule', 'deleteChannelRouteRule'],
    keywords: ['路由规则', '匹配方式', '目标类型'],
  },
  {
    component: 'channel-jobs-content.tsx',
    route: 'jobs/page.tsx',
    api: ['listChannelPublishJobs'],
    keywords: ['发布任务', '任务进度', '重试任务'],
  },
  {
    component: 'channel-deliveries-content.tsx',
    route: 'deliveries/page.tsx',
    api: ['listChannelDeliveries'],
    keywords: ['投递记录', '响应状态', '投递耗时'],
  },
  {
    component: 'channel-replies-content.tsx',
    route: 'replies/page.tsx',
    api: ['listChannelReplies'],
    keywords: ['回复记录', '外部会话', 'Trace'],
  },
  {
    component: 'channel-sender-content.tsx',
    route: 'sender/page.tsx',
    api: [
      'listChannelSenderDeliveries',
      'retryChannelSenderDelivery',
      'getChannelSenderTaskOverview',
      'runChannelSenderAutoRetry',
      'runChannelSenderCleanup',
    ],
    keywords: ['Sender 投递', '主动回复', '失败重试'],
  },
  {
    component: 'channel-release-content.tsx',
    route: 'release/page.tsx',
    api: ['getPublishChannelOverview', 'getChannelReleaseSchedulerOverview'],
    keywords: ['发布治理', '发布治理总览', '治理模块'],
  },
];

test('channels route-level pages exist for overview and focused operations pages', () => {
  assert.ok(existsSync(join(routesRoot, 'page.tsx')));
  assert.ok(existsSync(join(channelsRoot, 'channel-overview-content.tsx')), 'channel-overview-content.tsx should exist');
  assert.ok(!existsSync(join(channelsRoot, 'channel-content.tsx')), 'legacy channel-content.tsx should be removed after route split');
  assert.ok(existsSync(senderDeliveryDetailRoutePath), 'sender delivery detail route should exist');
  assert.ok(existsSync(senderDeliveryDetailComponentPath), 'sender delivery detail component should exist');
  assert.ok(existsSync(publishJobDetailRoutePath), 'publish job detail route should exist');
  assert.ok(existsSync(publishJobDetailComponentPath), 'publish job detail component should exist');
  assert.ok(existsSync(deliveryDetailRoutePath), 'channel delivery detail route should exist');
  assert.ok(existsSync(deliveryDetailComponentPath), 'channel delivery detail component should exist');
  assert.ok(existsSync(replyDetailRoutePath), 'channel reply detail route should exist');
  assert.ok(existsSync(replyDetailComponentPath), 'channel reply detail component should exist');
  assert.ok(existsSync(releaseSharedComponentPath), 'channel release shared component should exist');
  assert.ok(existsSync(join(routesRoot, 'providers/create/page.tsx')), 'channel provider create route should exist');
  assert.ok(existsSync(join(routesRoot, 'providers/[providerId]/edit/page.tsx')), 'channel provider edit route should exist');
  assert.ok(existsSync(join(routesRoot, 'accounts/create/page.tsx')), 'channel account create route should exist');
  assert.ok(existsSync(join(routesRoot, 'accounts/[accountId]/edit/page.tsx')), 'channel account edit route should exist');
  assert.ok(existsSync(join(routesRoot, 'templates/create/page.tsx')), 'channel template create route should exist');
  assert.ok(existsSync(join(routesRoot, 'templates/[templateId]/edit/page.tsx')), 'channel template edit route should exist');
  assert.ok(existsSync(join(routesRoot, 'route-rules/create/page.tsx')), 'channel route rule create route should exist');
  assert.ok(existsSync(join(routesRoot, 'route-rules/[routeRuleId]/edit/page.tsx')), 'channel route rule edit route should exist');
  assert.ok(existsSync(join(channelsRoot, 'channel-provider-create-content.tsx')), 'channel provider create component should exist');
  assert.ok(existsSync(join(channelsRoot, 'channel-provider-edit-content.tsx')), 'channel provider edit component should exist');
  assert.ok(existsSync(join(channelsRoot, 'channel-account-create-content.tsx')), 'channel account create component should exist');
  assert.ok(existsSync(join(channelsRoot, 'channel-account-edit-content.tsx')), 'channel account edit component should exist');
  assert.ok(existsSync(join(channelsRoot, 'channel-template-create-content.tsx')), 'channel template create component should exist');
  assert.ok(existsSync(join(channelsRoot, 'channel-template-edit-content.tsx')), 'channel template edit component should exist');
  assert.ok(existsSync(join(channelsRoot, 'channel-route-rule-create-content.tsx')), 'channel route rule create component should exist');
  assert.ok(existsSync(join(channelsRoot, 'channel-route-rule-edit-content.tsx')), 'channel route rule edit component should exist');

  for (const page of focusedPages) {
    assert.ok(existsSync(join(channelsRoot, page.component)), `${page.component} should exist`);
    assert.ok(existsSync(join(routesRoot, page.route)), `${page.route} should exist`);
  }

  for (const page of releaseFocusedPages) {
    assert.ok(existsSync(join(channelsRoot, page.component)), `${page.component} should exist`);
    assert.ok(existsSync(join(routesRoot, page.route)), `${page.route} should exist`);
  }
});

test('focused channel navigation exposes providers, sender, replies, and release routes outside the overview page', () => {
  const operationsShellSource = readFileSync(join(channelsRoot, 'channel-operations-pages.tsx'), 'utf8');

  assert.match(operationsShellSource, /href: '\/channels\/providers'/);
  assert.match(operationsShellSource, /href: '\/channels\/replies'/);
  assert.match(operationsShellSource, /href: '\/channels\/sender'/);
  assert.match(operationsShellSource, /href: '\/channels\/release'/);
  assert.match(operationsShellSource, /route: 'providers'/);
  assert.match(operationsShellSource, /route: 'replies'/);
  assert.match(operationsShellSource, /route: 'sender'/);
  assert.match(operationsShellSource, /route: 'release'/);
});

test('/channels overview is a lightweight operations entry backed by ChannelOverviewContent', () => {
  const overviewRouteSource = readFileSync(join(routesRoot, 'page.tsx'), 'utf8');

  assert.match(overviewRouteSource, /ChannelOverviewContent/);
  assert.doesNotMatch(overviewRouteSource, /ChannelContent/);
  assert.doesNotMatch(overviewRouteSource, /initialOperationsModule/);
  assert.doesNotMatch(overviewRouteSource, /focusOperationsOnly/);
});

test('channel overview owns lightweight summary APIs and navigation vocabulary only', () => {
  const overviewSource = readFileSync(join(channelsRoot, 'channel-overview-content.tsx'), 'utf8');

  for (const apiName of [
    'getPublishChannelOverview',
    'listChannelProviders',
    'listChannelAccounts',
    'listChannelPublishJobs',
    'listChannelDeliveries',
  ]) {
    assert.match(overviewSource, new RegExp(`\\b${apiName}\\b`), `channel overview should query ${apiName}`);
  }

  for (const keyword of [
    '渠道运营总览',
    '发布渠道',
    '渠道提供方',
    '账号凭据',
    '消息模板',
    '路由规则',
    '发布任务',
    '投递记录',
    '回复记录',
    'Sender 投递',
    '发布治理',
  ]) {
    assert.match(overviewSource, new RegExp(keyword), `channel overview should expose ${keyword}`);
  }

  assert.doesNotMatch(overviewSource, /ChannelContent/);
  assert.doesNotMatch(overviewSource, /审批/);
  assert.doesNotMatch(overviewSource, /回滚/);
});

test('focused channel pages are no longer thin ChannelContent mode wrappers', () => {
  for (const page of focusedPages) {
    const source = readFileSync(join(channelsRoot, page.component), 'utf8');

    assert.doesNotMatch(source, /ChannelContent/, `${page.component} should not import or render ChannelContent`);
    assert.doesNotMatch(source, /initialOperationsModule/, `${page.component} should not pass initialOperationsModule`);
    assert.doesNotMatch(source, /focusOperationsOnly/, `${page.component} should not pass focusOperationsOnly`);
  }
});

test('focused channel pages own route-specific APIs, titles, and operational vocabulary', () => {
  for (const page of focusedPages) {
    const source = readFileSync(join(channelsRoot, page.component), 'utf8');

    for (const apiName of page.api) {
      assert.match(source, new RegExp(`\\b${apiName}\\b`), `${page.component} should own ${apiName}`);
    }

    for (const keyword of page.keywords) {
      assert.match(source, new RegExp(keyword), `${page.component} should include ${keyword}`);
    }
  }
});

test('provider list route keeps configuration forms out of the list surface', () => {
  const providerSource = readFileSync(join(channelsRoot, 'channel-providers-content.tsx'), 'utf8');
  const createSource = readFileSync(join(channelsRoot, 'channel-provider-create-content.tsx'), 'utf8');
  const editSource = readFileSync(join(channelsRoot, 'channel-provider-edit-content.tsx'), 'utf8');

  assert.match(providerSource, /渠道提供方列表/);
  assert.match(providerSource, /listChannelProviders/);
  assert.match(providerSource, /\/channels\/providers\/create/);
  assert.match(providerSource, /\/channels\/providers\/\$\{encodeURIComponent\(item\.id\)\}\/edit/);
  assert.doesNotMatch(providerSource, /\bselectedProviderId\b/);
  assert.doesNotMatch(providerSource, /\bformMode\b/);
  assert.doesNotMatch(providerSource, /\beditingProvider\b/);
  assert.doesNotMatch(providerSource, /ChannelProviderForm/);
  assert.doesNotMatch(providerSource, /createChannelProvider/);
  assert.doesNotMatch(providerSource, /updateChannelProvider/);

  assert.match(createSource, /新建渠道提供方/);
  assert.match(createSource, /ChannelProviderForm/);
  assert.match(createSource, /createChannelProvider/);
  assert.doesNotMatch(createSource, /listChannelProviders/);

  assert.match(editSource, /编辑渠道提供方/);
  assert.match(editSource, /ChannelProviderForm/);
  assert.match(editSource, /getChannelProvider/);
  assert.match(editSource, /updateChannelProvider/);
  assert.doesNotMatch(editSource, /listChannelProviders/);
});

test('channel account list route links to dedicated create and edit forms', () => {
  const accountSource = readFileSync(join(channelsRoot, 'channel-accounts-content.tsx'), 'utf8');
  const createSource = readFileSync(join(channelsRoot, 'channel-account-create-content.tsx'), 'utf8');
  const editSource = readFileSync(join(channelsRoot, 'channel-account-edit-content.tsx'), 'utf8');

  assert.match(accountSource, /账号凭据/);
  assert.match(accountSource, /listChannelAccounts/);
  assert.match(accountSource, /\/channels\/accounts\/create/);
  assert.match(accountSource, /\/channels\/accounts\/\$\{encodeURIComponent\(item\.id\)\}\/edit/);
  assert.doesNotMatch(accountSource, /ChannelAccountForm/);
  assert.doesNotMatch(accountSource, /createChannelAccount/);
  assert.doesNotMatch(accountSource, /updateChannelAccount/);

  assert.match(createSource, /新建账号凭据/);
  assert.match(createSource, /ChannelAccountForm/);
  assert.match(createSource, /createChannelAccount/);
  assert.match(createSource, /listChannelProviders/);

  assert.match(editSource, /编辑账号凭据/);
  assert.match(editSource, /ChannelAccountForm/);
  assert.match(editSource, /getChannelAccount/);
  assert.match(editSource, /updateChannelAccount/);
  assert.match(editSource, /listChannelProviders/);
});

test('channel template list route links to dedicated create and edit forms', () => {
  const templateSource = readFileSync(join(channelsRoot, 'channel-templates-content.tsx'), 'utf8');
  const createSource = readFileSync(join(channelsRoot, 'channel-template-create-content.tsx'), 'utf8');
  const editSource = readFileSync(join(channelsRoot, 'channel-template-edit-content.tsx'), 'utf8');

  assert.match(templateSource, /消息模板/);
  assert.match(templateSource, /listChannelTemplates/);
  assert.match(templateSource, /\/channels\/templates\/create/);
  assert.match(templateSource, /\/channels\/templates\/\$\{encodeURIComponent\(item\.id\)\}\/edit/);
  assert.doesNotMatch(templateSource, /ChannelTemplateForm/);
  assert.doesNotMatch(templateSource, /createChannelTemplate/);
  assert.doesNotMatch(templateSource, /updateChannelTemplate/);

  assert.match(createSource, /新建消息模板/);
  assert.match(createSource, /ChannelTemplateForm/);
  assert.match(createSource, /createChannelTemplate/);
  assert.match(createSource, /listChannelProviders/);

  assert.match(editSource, /编辑消息模板/);
  assert.match(editSource, /ChannelTemplateForm/);
  assert.match(editSource, /getChannelTemplate/);
  assert.match(editSource, /updateChannelTemplate/);
  assert.match(editSource, /listChannelProviders/);
});

test('channel route rule list route links to dedicated create and edit forms', () => {
  const routeRuleSource = readFileSync(join(channelsRoot, 'channel-route-rules-content.tsx'), 'utf8');
  const createSource = readFileSync(join(channelsRoot, 'channel-route-rule-create-content.tsx'), 'utf8');
  const editSource = readFileSync(join(channelsRoot, 'channel-route-rule-edit-content.tsx'), 'utf8');

  assert.match(routeRuleSource, /路由规则/);
  assert.match(routeRuleSource, /listChannelRouteRules/);
  assert.match(routeRuleSource, /\/channels\/route-rules\/create/);
  assert.match(routeRuleSource, /\/channels\/route-rules\/\$\{encodeURIComponent\(item\.id\)\}\/edit/);
  assert.doesNotMatch(routeRuleSource, /ChannelRouteRuleForm/);
  assert.doesNotMatch(routeRuleSource, /createChannelRouteRule/);
  assert.doesNotMatch(routeRuleSource, /updateChannelRouteRule/);

  assert.match(createSource, /新建路由规则/);
  assert.match(createSource, /ChannelRouteRuleForm/);
  assert.match(createSource, /createChannelRouteRule/);
  assert.match(createSource, /listChannelProviders/);

  assert.match(editSource, /编辑路由规则/);
  assert.match(editSource, /ChannelRouteRuleForm/);
  assert.match(editSource, /getChannelRouteRule/);
  assert.match(editSource, /updateChannelRouteRule/);
  assert.match(editSource, /listChannelProviders/);
});

test('sender list route links to delivery detail instead of embedding the detail panel', () => {
  const senderSource = readFileSync(join(channelsRoot, 'channel-sender-content.tsx'), 'utf8');
  const detailRouteSource = readFileSync(senderDeliveryDetailRoutePath, 'utf8');
  const detailSource = readFileSync(senderDeliveryDetailComponentPath, 'utf8');

  assert.match(senderSource, /Sender 投递/);
  assert.match(senderSource, /listChannelSenderDeliveries/);
  assert.match(senderSource, /\/channels\/sender\/deliveries\/\$\{encodeURIComponent\(item\.delivery_id\)\}/);
  assert.doesNotMatch(senderSource, /\bselectedDeliveryId\b/);
  assert.doesNotMatch(senderSource, /\bsetSelectedDeliveryId\b/);
  assert.doesNotMatch(senderSource, /\bdetailQuery\b/);
  assert.doesNotMatch(senderSource, /getChannelSenderDelivery/);
  assert.doesNotMatch(senderSource, /SenderDeliveryDetailPanel/);

  assert.match(detailRouteSource, /ChannelSenderDeliveryDetailContent/);
  assert.match(detailSource, /投递详情/);
  assert.match(detailSource, /getChannelSenderDelivery/);
  assert.match(detailSource, /retryChannelSenderDelivery/);
  assert.match(detailSource, /请求头/);
  assert.match(detailSource, /响应正文/);
  assert.doesNotMatch(detailSource, /listChannelSenderDeliveries/);
});

test('publish job list route links to job detail instead of owning action and trace panels', () => {
  const jobsSource = readFileSync(join(channelsRoot, 'channel-jobs-content.tsx'), 'utf8');
  const detailRouteSource = readFileSync(publishJobDetailRoutePath, 'utf8');
  const detailSource = readFileSync(publishJobDetailComponentPath, 'utf8');

  assert.match(jobsSource, /发布任务/);
  assert.match(jobsSource, /listChannelPublishJobs/);
  assert.match(jobsSource, /\/channels\/jobs\/\$\{encodeURIComponent\(item\.id\)\}/);
  assert.doesNotMatch(jobsSource, /cancelChannelPublishJob/);
  assert.doesNotMatch(jobsSource, /retryChannelPublishJob/);
  assert.doesNotMatch(jobsSource, /canCancelJob/);
  assert.doesNotMatch(jobsSource, /canRetryJob/);
  assert.doesNotMatch(jobsSource, /错误原因/);
  assert.doesNotMatch(jobsSource, /计划时间/);
  assert.doesNotMatch(jobsSource, /开始时间/);
  assert.doesNotMatch(jobsSource, /结束时间/);

  assert.match(detailRouteSource, /ChannelJobDetailContent/);
  assert.match(detailSource, /发布任务详情/);
  assert.match(detailSource, /getChannelPublishJob/);
  assert.match(detailSource, /cancelChannelPublishJob/);
  assert.match(detailSource, /retryChannelPublishJob/);
  assert.match(detailSource, /任务时间线/);
  assert.match(detailSource, /执行载荷/);
  assert.match(detailSource, /执行结果/);
  assert.doesNotMatch(detailSource, /listChannelPublishJobs/);
});

test('channel delivery list route links to delivery detail instead of embedding audit payloads', () => {
  const deliveriesSource = readFileSync(join(channelsRoot, 'channel-deliveries-content.tsx'), 'utf8');
  const detailRouteSource = readFileSync(deliveryDetailRoutePath, 'utf8');
  const detailSource = readFileSync(deliveryDetailComponentPath, 'utf8');

  assert.match(deliveriesSource, /投递记录/);
  assert.match(deliveriesSource, /listChannelDeliveries/);
  assert.match(deliveriesSource, /\/channels\/deliveries\/\$\{encodeURIComponent\(item\.id\)\}/);
  assert.doesNotMatch(deliveriesSource, /getChannelDelivery/);
  assert.doesNotMatch(deliveriesSource, /错误原因/);
  assert.doesNotMatch(deliveriesSource, /链路追踪/);
  assert.doesNotMatch(deliveriesSource, /投递时间/);
  assert.doesNotMatch(deliveriesSource, /创建时间/);
  assert.doesNotMatch(deliveriesSource, /request_body/);
  assert.doesNotMatch(deliveriesSource, /response_body/);

  assert.match(detailRouteSource, /ChannelDeliveryDetailContent/);
  assert.match(detailSource, /投递详情/);
  assert.match(detailSource, /getChannelDelivery/);
  assert.match(detailSource, /请求信息/);
  assert.match(detailSource, /响应信息/);
  assert.match(detailSource, /链路信息/);
  assert.doesNotMatch(detailSource, /listChannelDeliveries/);
});

test('channel reply list route links to reply detail instead of embedding message payloads', () => {
  const repliesSource = readFileSync(join(channelsRoot, 'channel-replies-content.tsx'), 'utf8');
  const detailRouteSource = readFileSync(replyDetailRoutePath, 'utf8');
  const detailSource = readFileSync(replyDetailComponentPath, 'utf8');

  assert.match(repliesSource, /回复记录/);
  assert.match(repliesSource, /listChannelReplies/);
  assert.match(repliesSource, /\/channels\/replies\/\$\{encodeURIComponent\(item\.id\)\}/);
  assert.doesNotMatch(repliesSource, /getChannelReply/);
  assert.doesNotMatch(repliesSource, /外部消息/);
  assert.doesNotMatch(repliesSource, /内部会话/);
  assert.doesNotMatch(repliesSource, /运行 ID/);
  assert.doesNotMatch(repliesSource, /错误原因/);
  assert.doesNotMatch(repliesSource, /内容预览/);

  assert.match(detailRouteSource, /ChannelReplyDetailContent/);
  assert.match(detailSource, /回复详情/);
  assert.match(detailSource, /getChannelReply/);
  assert.match(detailSource, /消息链路/);
  assert.match(detailSource, /消息内容/);
  assert.match(detailSource, /原始载荷/);
  assert.doesNotMatch(detailSource, /listChannelReplies/);
});

test('focused channel destructive actions use backend manage permission gates', () => {
  const providerSource = readFileSync(join(channelsRoot, 'channel-providers-content.tsx'), 'utf8');
  const accountSource = readFileSync(join(channelsRoot, 'channel-accounts-content.tsx'), 'utf8');
  const templateSource = readFileSync(join(channelsRoot, 'channel-templates-content.tsx'), 'utf8');
  const routeRuleSource = readFileSync(join(channelsRoot, 'channel-route-rules-content.tsx'), 'utf8');

  assert.match(providerSource, /删除提供方/);
  assert.match(providerSource, /disabled=\{!canManage \|\| deleting\}/);
  assert.doesNotMatch(providerSource, /删除提供方[\s\S]{0,160}!permissions\.canDisable/);

  assert.match(accountSource, /删除账号/);
  assert.match(accountSource, /disabled=\{!permissions\.canManage \|\| deleteMutation\.isPending\}/);
  assert.doesNotMatch(accountSource, /删除账号[\s\S]{0,160}!permissions\.canDisable/);

  assert.match(templateSource, /删除模板/);
  assert.match(templateSource, /disabled=\{!permissions\.canManage \|\| deleteMutation\.isPending\}/);
  assert.doesNotMatch(templateSource, /删除模板[\s\S]{0,160}!permissions\.canDisable/);

  assert.match(routeRuleSource, /删除规则/);
  assert.match(routeRuleSource, /disabled=\{!permissions\.canManage \|\| deleteMutation\.isPending\}/);
  assert.doesNotMatch(routeRuleSource, /删除规则[\s\S]{0,160}!permissions\.canDisable/);
});

test('publish channel health check uses backend view permission gate', () => {
  const publishSource = readFileSync(join(channelsRoot, 'channel-publish-content.tsx'), 'utf8');

  assert.match(publishSource, /渠道巡检/);
  assert.match(publishSource, /type: 'CHECK'/);
  assert.match(publishSource, /确认执行渠道巡检/);
  assert.match(publishSource, /setPublishActionTarget\(\{ channelId: item\.id, channelName: item\.name, type: 'CHECK' \}\)/);
  assert.match(publishSource, /disabled=\{!permissions\.canView \|\| checkMutation\.isPending\}/);
  assert.doesNotMatch(publishSource, /渠道巡检[\s\S]{0,160}!permissions\.canDeploy/);
  assert.doesNotMatch(publishSource, /onClick=\{\(\) => checkMutation\.mutate\(item\.id\)\}/);
});

test('publish job row actions match backend permission guards', () => {
  const jobsSource = readFileSync(publishJobDetailComponentPath, 'utf8');

  assert.match(jobsSource, /取消任务/);
  assert.match(jobsSource, /disabled=\{!permissions\.canDisable \|\| !canCancelJob\(item\) \|\| cancelMutation\.isPending\}/);
  assert.doesNotMatch(jobsSource, /取消任务[\s\S]{0,220}!permissions\.canDeploy/);

  assert.match(jobsSource, /重试任务/);
  assert.match(jobsSource, /disabled=\{!permissions\.canManage \|\| !canRetryJob\(item\) \|\| retryMutation\.isPending\}/);
  assert.doesNotMatch(jobsSource, /重试任务[\s\S]{0,220}!permissions\.canDeploy/);
});

test('release overview stays a governance entry instead of owning every release workflow', () => {
  const releaseSource = readFileSync(join(channelsRoot, 'channel-release-content.tsx'), 'utf8');
  const sharedSource = readFileSync(releaseSharedComponentPath, 'utf8');

  assert.match(releaseSource, /发布治理总览/);
  assert.match(releaseSource, /治理模块/);
  assert.match(releaseSource, /getPublishChannelOverview/);
  assert.match(releaseSource, /getChannelReleaseSchedulerOverview/);
  assert.doesNotMatch(releaseSource, /getChannelReleasePipeline/);
  assert.doesNotMatch(releaseSource, /getChannelReleaseGate/);
  assert.doesNotMatch(releaseSource, /getChannelReleaseAutomation/);
  assert.doesNotMatch(releaseSource, /getChannelReleaseSelfHealing/);
  assert.doesNotMatch(releaseSource, /getChannelReleaseReport/);
  assert.doesNotMatch(releaseSource, /runChannelReleaseSchedulerOnce/);
  assert.doesNotMatch(releaseSource, /selectedChannelId/);

  for (const href of [
    '/channels/release/control',
    '/channels/release/pipeline',
    '/channels/release/gate',
    '/channels/release/automation',
    '/channels/release/self-healing',
    '/channels/release/scheduler',
    '/channels/release/reports',
  ]) {
    assert.match(sharedSource, new RegExp(href.replaceAll('/', '\\/')), `release subnav should link ${href}`);
  }
});

test('release child routes own their focused workflow APIs and labels', () => {
  for (const page of releaseFocusedPages) {
    const routeSource = readFileSync(join(routesRoot, page.route), 'utf8');
    const source = readFileSync(join(channelsRoot, page.component), 'utf8');

    assert.match(routeSource, new RegExp(page.component.replace(/\.tsx$/, '').replace(/-/g, '[-]')), `${page.route} should render ${page.component}`);
    assert.doesNotMatch(source, /ChannelReleaseContent/, `${page.component} should not render the release overview component`);

    for (const apiName of page.api) {
      assert.match(source, new RegExp(`\\b${apiName}\\b`), `${page.component} should own ${apiName}`);
    }

    for (const keyword of page.keywords) {
      assert.match(source, new RegExp(keyword), `${page.component} should include ${keyword}`);
    }
  }
});

test('channel configuration status and delete actions require confirmation before mutation', () => {
  const sharedSource = readFileSync(operationsSharedComponentPath, 'utf8');
  const providerSource = readFileSync(join(channelsRoot, 'channel-providers-content.tsx'), 'utf8');
  const accountSource = readFileSync(join(channelsRoot, 'channel-accounts-content.tsx'), 'utf8');
  const templateSource = readFileSync(join(channelsRoot, 'channel-templates-content.tsx'), 'utf8');
  const routeRuleSource = readFileSync(join(channelsRoot, 'channel-route-rules-content.tsx'), 'utf8');

  assert.match(sharedSource, /ChannelActionConfirmDialog/);
  assert.match(providerSource, /providerActionTarget/);
  assert.match(accountSource, /accountActionTarget/);
  assert.match(templateSource, /templateActionTarget/);
  assert.match(routeRuleSource, /routeRuleActionTarget/);

  for (const source of [providerSource, accountSource, templateSource, routeRuleSource]) {
    assert.match(source, /ChannelActionConfirmDialog/);
    assert.match(source, /确认启用|确认停用|确认删除/);
  }

  assert.doesNotMatch(providerSource, /onDisable=\{\(\) => statusMutation\.mutate/);
  assert.doesNotMatch(providerSource, /onEnable=\{\(\) => statusMutation\.mutate/);
  assert.doesNotMatch(accountSource, /onClick=\{\(\) => accountStatusMutation\.mutate/);
  assert.doesNotMatch(accountSource, /onClick=\{\(\) => deleteMutation\.mutate\(item\.id\)/);
  assert.doesNotMatch(templateSource, /onClick=\{\(\) => templateStatusMutation\.mutate/);
  assert.doesNotMatch(templateSource, /onClick=\{\(\) => deleteMutation\.mutate\(item\.id\)/);
  assert.doesNotMatch(routeRuleSource, /onClick=\{\(\) => routeRuleStatusMutation\.mutate/);
  assert.doesNotMatch(routeRuleSource, /onClick=\{\(\) => deleteMutation\.mutate\(item\.id\)/);
});

test('publish job and sender operational mutations require confirmation before running', () => {
  const publishSource = readFileSync(join(channelsRoot, 'channel-publish-content.tsx'), 'utf8');
  const jobDetailSource = readFileSync(publishJobDetailComponentPath, 'utf8');
  const senderSource = readFileSync(join(channelsRoot, 'channel-sender-content.tsx'), 'utf8');
  const senderDetailSource = readFileSync(senderDeliveryDetailComponentPath, 'utf8');

  assert.match(publishSource, /publishActionTarget/);
  assert.match(jobDetailSource, /jobActionTarget/);
  assert.match(senderSource, /senderActionTarget/);
  assert.match(senderDetailSource, /senderDeliveryActionTarget/);

  for (const source of [publishSource, jobDetailSource, senderSource, senderDetailSource]) {
    assert.match(source, /ChannelActionConfirmDialog/);
    assert.match(source, /确认/);
  }

  assert.doesNotMatch(publishSource, /onClick=\{\(\) => statusMutation\.mutate/);
  assert.doesNotMatch(jobDetailSource, /onClick=\{\(\) => cancelMutation\.mutate/);
  assert.doesNotMatch(jobDetailSource, /onClick=\{\(\) => retryMutation\.mutate/);
  assert.doesNotMatch(senderSource, /onClick=\{\(\) => autoRetryMutation\.mutate/);
  assert.doesNotMatch(senderSource, /onClick=\{\(\) => cleanupMutation\.mutate/);
  assert.doesNotMatch(senderSource, /onRetry=\{\(\) => retryMutation\.mutate/);
  assert.doesNotMatch(senderDetailSource, /onRetry=\{\(\) => retryMutation\.mutate/);
});

test('release governance run and snapshot actions require confirmation before mutation', () => {
  const gateSource = readFileSync(join(channelsRoot, 'channel-release-gate-content.tsx'), 'utf8');
  const automationSource = readFileSync(join(channelsRoot, 'channel-release-automation-content.tsx'), 'utf8');
  const selfHealingSource = readFileSync(join(channelsRoot, 'channel-release-self-healing-content.tsx'), 'utf8');
  const schedulerSource = readFileSync(join(channelsRoot, 'channel-release-scheduler-content.tsx'), 'utf8');
  const reportsSource = readFileSync(join(channelsRoot, 'channel-release-reports-content.tsx'), 'utf8');

  assert.match(gateSource, /releaseGateActionTarget/);
  assert.match(automationSource, /releaseAutomationActionTarget/);
  assert.match(selfHealingSource, /releaseSelfHealingActionTarget/);
  assert.match(schedulerSource, /releaseSchedulerActionTarget/);
  assert.match(reportsSource, /releaseReportActionTarget/);

  for (const source of [gateSource, automationSource, selfHealingSource, schedulerSource, reportsSource]) {
    assert.match(source, /ChannelActionConfirmDialog/);
    assert.match(source, /确认/);
  }

  assert.doesNotMatch(gateSource, /onClick=\{\(\) => evaluateMutation\.mutate/);
  assert.doesNotMatch(automationSource, /onClick=\{\(\) => runMutation\.mutate/);
  assert.doesNotMatch(selfHealingSource, /onClick=\{\(\) => runMutation\.mutate/);
  assert.doesNotMatch(schedulerSource, /onClick=\{\(\) => runMutation\.mutate/);
  assert.doesNotMatch(reportsSource, /onClick=\{\(\) => snapshotMutation\.mutate/);
});

test('release gate, automation, and self-healing pages own policy configuration save workflows', () => {
  const gateSource = readFileSync(join(channelsRoot, 'channel-release-gate-content.tsx'), 'utf8');
  const automationSource = readFileSync(join(channelsRoot, 'channel-release-automation-content.tsx'), 'utf8');
  const selfHealingSource = readFileSync(join(channelsRoot, 'channel-release-self-healing-content.tsx'), 'utf8');

  assert.match(gateSource, /updateChannelReleaseGate/);
  assert.match(gateSource, /gatePolicyForm/);
  assert.match(gateSource, /releaseGatePolicyActionTarget/);
  assert.match(gateSource, /保存门禁策略/);
  assert.match(gateSource, /门禁策略配置/);
  assert.match(gateSource, /auto_promote_enabled/);
  assert.match(gateSource, /observation_window_hours/);
  assert.doesNotMatch(gateSource, /门禁策略配置在后续配置页承载/);
  assert.doesNotMatch(gateSource, /onClick=\{\(\) => policyMutation\.mutate/);

  assert.match(automationSource, /updateChannelReleaseAutomation/);
  assert.match(automationSource, /automationPolicyForm/);
  assert.match(automationSource, /releaseAutomationPolicyActionTarget/);
  assert.match(automationSource, /保存推进策略/);
  assert.match(automationSource, /推进策略配置/);
  assert.match(automationSource, /require_auto_promote_policy/);
  assert.match(automationSource, /min_interval_minutes/);
  assert.match(automationSource, /max_runs_per_day/);
  assert.match(automationSource, /dry_run/);
  assert.doesNotMatch(automationSource, /推进策略配置在后续配置页承载/);
  assert.doesNotMatch(automationSource, /onClick=\{\(\) => policyMutation\.mutate/);

  assert.match(selfHealingSource, /updateChannelReleaseSelfHealing/);
  assert.match(selfHealingSource, /selfHealingPolicyForm/);
  assert.match(selfHealingSource, /releaseSelfHealingPolicyActionTarget/);
  assert.match(selfHealingSource, /保存自愈策略/);
  assert.match(selfHealingSource, /自愈策略配置/);
  assert.match(selfHealingSource, /auto_rollback_enabled/);
  assert.match(selfHealingSource, /cooldown_minutes/);
  assert.doesNotMatch(selfHealingSource, /自愈策略配置在后续配置页承载/);
  assert.doesNotMatch(selfHealingSource, /onClick=\{\(\) => policyMutation\.mutate/);
});

test('release workflow pages expose runtime workflow identifiers without embedding full trace detail', () => {
  const automationSource = readFileSync(join(channelsRoot, 'channel-release-automation-content.tsx'), 'utf8');
  const selfHealingSource = readFileSync(join(channelsRoot, 'channel-release-self-healing-content.tsx'), 'utf8');
  const schedulerSource = readFileSync(join(channelsRoot, 'channel-release-scheduler-content.tsx'), 'utf8');

  for (const source of [automationSource, selfHealingSource, schedulerSource]) {
    assert.match(source, /工作流后端/);
    assert.match(source, /Workflow ID/);
    assert.match(source, /Workflow Run ID/);
    assert.match(source, /workflow_id/);
    assert.match(source, /workflow_run_id/);
    assert.doesNotMatch(source, /Trace 详情/);
    assert.doesNotMatch(source, /完整日志/);
  }

  assert.match(automationSource, /automation\.workflow_backend/);
  assert.match(automationSource, /automation\.workflow_id/);
  assert.match(automationSource, /automation\.workflow_run_id/);
  assert.match(automationSource, /automation\.last_run\.workflow_backend/);
  assert.match(automationSource, /automation\.last_run\.workflow_id/);
  assert.match(automationSource, /automation\.last_run\.workflow_run_id/);

  assert.match(selfHealingSource, /selfHealing\.workflow_backend/);
  assert.match(selfHealingSource, /selfHealing\.workflow_id/);
  assert.match(selfHealingSource, /selfHealing\.workflow_run_id/);
  assert.match(selfHealingSource, /selfHealing\.last_run\.workflow_backend/);
  assert.match(selfHealingSource, /selfHealing\.last_run\.workflow_id/);
  assert.match(selfHealingSource, /selfHealing\.last_run\.workflow_run_id/);

  assert.match(schedulerSource, /item\.workflow_backend/);
  assert.match(schedulerSource, /item\.workflow_id/);
  assert.match(schedulerSource, /item\.workflow_run_id/);
});

test('release control page owns approval, rollout, and rollback operations with confirmation and permission gates', () => {
  const controlSource = readFileSync(join(channelsRoot, 'channel-release-control-content.tsx'), 'utf8');
  const sharedSource = readFileSync(releaseSharedComponentPath, 'utf8');

  assert.match(sharedSource, /\/channels\/release\/control/);
  assert.match(controlSource, /getChannelPublishControl/);
  assert.match(controlSource, /updateChannelPublishControl/);
  assert.match(controlSource, /requestChannelPublishApproval/);
  assert.match(controlSource, /approveChannelPublish/);
  assert.match(controlSource, /rejectChannelPublish/);
  assert.match(controlSource, /updateChannelRollout/);
  assert.match(controlSource, /rollbackChannelPublish/);
  assert.match(controlSource, /ChannelActionConfirmDialog/);
  assert.match(controlSource, /releaseControlActionTarget/);
  assert.match(controlSource, /approvalForm/);
  assert.match(controlSource, /rolloutForm/);
  assert.match(controlSource, /发布控制/);
  assert.match(controlSource, /申请审批/);
  assert.match(controlSource, /审批通过/);
  assert.match(controlSource, /审批拒绝/);
  assert.match(controlSource, /更新灰度/);
  assert.match(controlSource, /回滚发布/);
  assert.match(controlSource, /permissions\.canManage/);
  assert.match(controlSource, /permissions\.canDeploy/);
  assert.match(controlSource, /permissions\.canDisable/);
  assert.doesNotMatch(controlSource, /onClick=\{\(\) => controlMutation\.mutate/);
  assert.doesNotMatch(controlSource, /onClick=\{\(\) => requestApprovalMutation\.mutate/);
  assert.doesNotMatch(controlSource, /onClick=\{\(\) => approveMutation\.mutate/);
  assert.doesNotMatch(controlSource, /onClick=\{\(\) => rejectMutation\.mutate/);
  assert.doesNotMatch(controlSource, /onClick=\{\(\) => rolloutMutation\.mutate/);
  assert.doesNotMatch(controlSource, /onClick=\{\(\) => rollbackMutation\.mutate/);
});

test('release governance mutations refresh concrete channel selector query keys', () => {
  const releaseMutationSources = [
    'channel-release-control-content.tsx',
    'channel-release-pipeline-content.tsx',
    'channel-release-gate-content.tsx',
    'channel-release-automation-content.tsx',
    'channel-release-self-healing-content.tsx',
  ].map((file) => readFileSync(join(channelsRoot, file), 'utf8'));

  for (const source of releaseMutationSources) {
    assert.doesNotMatch(source, /channel-release-channels/);
  }

  for (const key of [
    'channel-release-control-channels',
    'channel-release-pipeline-channels',
    'channel-release-gate-channels',
    'channel-release-automation-channels',
    'channel-release-self-healing-channels',
    'channel-release-reports-channels',
  ]) {
    assert.ok(releaseMutationSources.some((source) => source.includes(key)), `release mutations should invalidate ${key}`);
  }
});

test('release pipeline page owns batch operations with confirmation and permission gates', () => {
  const pipelineSource = readFileSync(join(channelsRoot, 'channel-release-pipeline-content.tsx'), 'utf8');

  assert.match(pipelineSource, /startChannelReleaseBatch/);
  assert.match(pipelineSource, /markChannelReleaseFull/);
  assert.match(pipelineSource, /abortChannelReleaseBatch/);
  assert.match(pipelineSource, /releasePipelineActionTarget/);
  assert.match(pipelineSource, /ChannelActionConfirmDialog/);
  assert.match(pipelineSource, /batchForm/);
  assert.match(pipelineSource, /新建发布批次/);
  assert.match(pipelineSource, /标记全量/);
  assert.match(pipelineSource, /终止批次/);
  assert.match(pipelineSource, /permissions\.canManage/);
  assert.match(pipelineSource, /permissions\.canDeploy/);
  assert.match(pipelineSource, /permissions\.canDisable/);
  assert.doesNotMatch(pipelineSource, /onClick=\{\(\) => startMutation\.mutate/);
  assert.doesNotMatch(pipelineSource, /onClick=\{\(\) => fullMutation\.mutate/);
  assert.doesNotMatch(pipelineSource, /onClick=\{\(\) => abortMutation\.mutate/);
});
