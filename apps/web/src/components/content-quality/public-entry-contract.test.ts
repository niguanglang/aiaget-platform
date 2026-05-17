import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

test('home page no longer exposes the console marketing entry copy', () => {
  const homePageSource = readFileSync(join(process.cwd(), 'src/app/page.tsx'), 'utf8');

  assert.doesNotMatch(homePageSource, /控制台/);
  assert.doesNotMatch(homePageSource, /权限/);
  assert.doesNotMatch(homePageSource, /监控/);
  assert.doesNotMatch(homePageSource, /接口/);
  assert.doesNotMatch(homePageSource, /企业智能体平台/);
  assert.doesNotMatch(homePageSource, /登录/);
  assert.doesNotMatch(homePageSource, /打开仪表盘/);
  assert.match(homePageSource, /getStoredSession|redirect/);
});

test('control api base url resolves to a same-origin proxy path for browser traffic', () => {
  const helperSource = readFileSync(join(process.cwd(), 'src/lib/control-api-base-url.ts'), 'utf8');

  assert.match(helperSource, /resolveControlApiBaseUrl/);
  assert.match(helperSource, /localhost/);
  assert.match(helperSource, /127\.0\.0\.1/);
  assert.match(helperSource, /\/api\/v1/);
});

test('client api helpers use the shared control api base url resolver', () => {
  const apiClientSource = readFileSync(join(process.cwd(), 'src/lib/api-client.ts'), 'utf8');
  const runtimeWorkflowsSource = readFileSync(join(process.cwd(), 'src/components/monitor/runtime-workflows-content.tsx'), 'utf8');
  const apiReferenceSource = readFileSync(join(process.cwd(), 'src/app/(console)/api-reference/page.tsx'), 'utf8');

  assert.match(apiClientSource, /resolveControlApiBaseUrl/);
  assert.match(runtimeWorkflowsSource, /resolveControlApiBaseUrl/);
  assert.match(apiReferenceSource, /resolveControlApiBaseUrl/);
  assert.doesNotMatch(apiClientSource, /localhost:3001\/api\/v1/);
  assert.doesNotMatch(runtimeWorkflowsSource, /localhost:3001\/api\/v1/);
  assert.doesNotMatch(apiReferenceSource, /localhost:3001\/api\/v1/);
});
