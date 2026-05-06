import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const channelsRoot = join(root, 'src/components/channels');
const routesRoot = join(root, 'src/app/(console)/channels');

const focusedPages = [
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
    api: ['listChannelPublishJobs', 'cancelChannelPublishJob', 'retryChannelPublishJob'],
    keywords: ['发布任务', '任务进度', '重试任务'],
  },
  {
    component: 'channel-deliveries-content.tsx',
    route: 'deliveries/page.tsx',
    api: ['listChannelDeliveries'],
    keywords: ['投递记录', '响应状态', '链路追踪'],
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
      'getChannelSenderDelivery',
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
    api: [
      'getPublishChannelOverview',
      'getChannelReleaseSchedulerOverview',
      'getChannelReleasePipeline',
      'getChannelReleaseGate',
      'getChannelReleaseAutomation',
      'getChannelReleaseSelfHealing',
      'getChannelReleaseReport',
    ],
    keywords: ['发布治理', '发布流水线', '自动推进', '自愈'],
  },
];

test('channels route-level pages exist for overview and focused operations pages', () => {
  assert.ok(existsSync(join(routesRoot, 'page.tsx')));

  for (const page of focusedPages) {
    assert.ok(existsSync(join(channelsRoot, page.component)), `${page.component} should exist`);
    assert.ok(existsSync(join(routesRoot, page.route)), `${page.route} should exist`);
  }
});

test('focused channel navigation exposes sender, replies, and release routes outside the overview page', () => {
  const operationsShellSource = readFileSync(join(channelsRoot, 'channel-operations-pages.tsx'), 'utf8');

  assert.match(operationsShellSource, /href: '\/channels\/replies'/);
  assert.match(operationsShellSource, /href: '\/channels\/sender'/);
  assert.match(operationsShellSource, /href: '\/channels\/release'/);
  assert.match(operationsShellSource, /route: 'replies'/);
  assert.match(operationsShellSource, /route: 'sender'/);
  assert.match(operationsShellSource, /route: 'release'/);
});

test('/channels overview remains the compatibility surface backed by ChannelContent', () => {
  const overviewRouteSource = readFileSync(join(routesRoot, 'page.tsx'), 'utf8');

  assert.match(overviewRouteSource, /ChannelContent/);
  assert.doesNotMatch(overviewRouteSource, /initialOperationsModule/);
  assert.doesNotMatch(overviewRouteSource, /focusOperationsOnly/);
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

test('focused channel destructive actions use backend manage permission gates', () => {
  const accountSource = readFileSync(join(channelsRoot, 'channel-accounts-content.tsx'), 'utf8');
  const templateSource = readFileSync(join(channelsRoot, 'channel-templates-content.tsx'), 'utf8');
  const routeRuleSource = readFileSync(join(channelsRoot, 'channel-route-rules-content.tsx'), 'utf8');

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
  assert.match(publishSource, /disabled=\{!permissions\.canView \|\| checkMutation\.isPending\}/);
  assert.doesNotMatch(publishSource, /渠道巡检[\s\S]{0,160}!permissions\.canDeploy/);
});
