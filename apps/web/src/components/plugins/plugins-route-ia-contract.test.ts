import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const pluginsListSource = readFileSync(join(root, 'src/components/plugins/plugin-content.tsx'), 'utf8');

const detailPath = join(root, 'src/components/plugins/plugin-detail-content.tsx');
const installationsPath = join(root, 'src/components/plugins/plugin-installations-content.tsx');
const securityPath = join(root, 'src/components/plugins/plugin-security-content.tsx');
const bindingsPath = join(root, 'src/components/plugins/plugin-bindings-content.tsx');

function source(path: string) {
  return readFileSync(path, 'utf8');
}

test('plugin ecosystem route-level pages and split components exist', () => {
  assert.ok(existsSync(join(root, 'src/app/(console)/plugins/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/plugins/[pluginId]/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/plugins/[pluginId]/installations/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/plugins/[pluginId]/security/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/(console)/plugins/[pluginId]/bindings/page.tsx')));

  assert.ok(existsSync(join(root, 'src/components/plugins/plugin-shared.tsx')));
  assert.ok(existsSync(detailPath));
  assert.ok(existsSync(installationsPath));
  assert.ok(existsSync(securityPath));
  assert.ok(existsSync(bindingsPath));
});

test('plugins list page keeps deep manifest, security, hook, and menu binding editing out of the list surface', () => {
  assert.doesNotMatch(pluginsListSource, /selectedPluginId/);
  assert.doesNotMatch(pluginsListSource, /getPluginInstallation/);
  assert.doesNotMatch(pluginsListSource, /PluginDetailPanel/);
  assert.doesNotMatch(pluginsListSource, /PluginManifestPreview/);
  assert.doesNotMatch(pluginsListSource, /SecurityReviewPanel/);
  assert.doesNotMatch(pluginsListSource, /updatePluginHook/);
  assert.doesNotMatch(pluginsListSource, /updatePluginMenuBinding/);
  assert.doesNotMatch(pluginsListSource, /onToggleHook/);
  assert.doesNotMatch(pluginsListSource, /onToggleMenuBinding/);
  assert.doesNotMatch(pluginsListSource, /menu_bindings\.map/);
  assert.doesNotMatch(pluginsListSource, /hooks\.map/);
});

test('plugin detail page owns manifest, installation status, permission, hook, and menu summaries', () => {
  const detailSource = source(detailPath);

  assert.match(detailSource, /getPluginInstallation/);
  assert.match(detailSource, /插件详情/);
  assert.match(detailSource, /Manifest|manifest_json/);
  assert.match(detailSource, /安装状态|pluginStatusLabel/);
  assert.match(detailSource, /权限/);
  assert.match(detailSource, /Hook/);
  assert.match(detailSource, /菜单/);
});

test('plugin installations page owns installation configuration APIs and Chinese page labels', () => {
  const installationsSource = source(installationsPath);

  assert.match(installationsSource, /getPluginInstallation/);
  assert.match(installationsSource, /updatePluginInstallation/);
  assert.match(installationsSource, /enablePlugin/);
  assert.match(installationsSource, /disablePlugin/);
  assert.match(installationsSource, /安装配置|租户安装/);
  assert.match(installationsSource, /配置 JSON|运行状态|风险等级/);
});

test('plugin security page owns security review APIs and Chinese page labels', () => {
  const securitySource = source(securityPath);

  assert.match(securitySource, /getPluginInstallation/);
  assert.match(securitySource, /security_preview/);
  assert.match(securitySource, /安全审核|安全审查/);
  assert.match(securitySource, /风险/);
  assert.match(securitySource, /策略|准入|审核/);
});

test('plugin bindings page owns hook and menu binding APIs and Chinese page labels', () => {
  const bindingsSource = source(bindingsPath);

  assert.match(bindingsSource, /getPluginInstallation/);
  assert.match(bindingsSource, /updatePluginHook/);
  assert.match(bindingsSource, /updatePluginMenuBinding/);
  assert.match(bindingsSource, /菜单绑定|菜单注入/);
  assert.match(bindingsSource, /Hook 绑定|Hook 配置/);
});
