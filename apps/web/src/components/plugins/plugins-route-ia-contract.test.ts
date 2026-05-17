import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const pluginsListSource = readFileSync(join(root, 'src/components/plugins/plugin-content.tsx'), 'utf8');

const detailPath = join(root, 'src/components/plugins/plugin-detail-content.tsx');
const installationsPath = join(root, 'src/components/plugins/plugin-installations-content.tsx');
const securityPath = join(root, 'src/components/plugins/plugin-security-content.tsx');
const bindingsPath = join(root, 'src/components/plugins/plugin-bindings-content.tsx');
const sharedPath = join(root, 'src/components/plugins/plugin-shared.tsx');
const productionComponentPaths = [
  join(root, 'src/components/plugins/plugin-content.tsx'),
  detailPath,
  installationsPath,
  securityPath,
  bindingsPath,
];

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
  assert.match(installationsSource, /rollbackPlugin/);
  assert.match(installationsSource, /安装配置|租户安装/);
  assert.match(installationsSource, /配置 JSON|运行状态|风险等级/);
});

test('plugin installations page exposes version compare before rollback decisions', () => {
  const installationsSource = source(installationsPath);

  assert.match(installationsSource, /版本对比/);
  assert.match(installationsSource, /当前版本/);
  assert.match(installationsSource, /对比版本/);
  assert.match(installationsSource, /Manifest 差异/);
  assert.match(installationsSource, /buildManifestDiffRows/);
  assert.match(installationsSource, /versionCompareTargetId/);
  assert.match(installationsSource, /selectedCompareVersion/);
  assert.match(installationsSource, /selectedRollbackVersion/);
  assert.match(installationsSource, /before: selectedCompareVersion\.manifest_json/);
  assert.match(installationsSource, /after: detail\.manifest_json/);
  assert.match(installationsSource, /无 Manifest 差异/);
  assert.doesNotMatch(pluginsListSource, /版本对比/);
  assert.doesNotMatch(pluginsListSource, /Manifest 差异/);
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
  assert.match(bindingsSource, /queuePluginHookExecution/);
  assert.match(bindingsSource, /updatePluginMenuBinding/);
  assert.match(bindingsSource, /菜单绑定|菜单注入/);
  assert.match(bindingsSource, /Hook 绑定|Hook 配置/);
  assert.match(bindingsSource, /受控异步执行队列/);
  assert.match(bindingsSource, /不会在控制台直接执行第三方代码/);
});

test('plugin high-impact installation actions require an explicit confirmation target', () => {
  const installationsSource = source(installationsPath);
  const sharedSource = source(sharedPath);

  assert.match(sharedSource, /confirmLabel/);
  assert.match(installationsSource, /InstallationActionTarget/);
  assert.match(installationsSource, /InstallationSaveTarget/);
  assert.match(installationsSource, /installationActionTarget/);
  assert.match(installationsSource, /setInstallationActionTarget/);
  assert.match(installationsSource, /installationSaveTarget/);
  assert.match(installationsSource, /confirmInstallationSave/);
  assert.match(installationsSource, /ConfirmDialog/);
  assert.match(installationsSource, /确认启用|确认停用|确认升级/);
  assert.match(installationsSource, /确认保存高影响安装配置/);
  assert.match(installationsSource, /uninstallTarget/);
  assert.match(installationsSource, /RollbackActionTarget/);
  assert.match(installationsSource, /rollbackActionTarget/);
  assert.match(installationsSource, /setRollbackActionTarget/);
  assert.match(installationsSource, /version: selectedRollbackVersion/);
  assert.match(installationsSource, /确认回滚插件/);
  assert.match(installationsSource, /确认回滚/);
  assert.doesNotMatch(installationsSource, /onClick=\{\(\) => runtimeMutation\.mutate/);
  assert.doesNotMatch(installationsSource, /onClick=\{\(\) => upgradeMutation\.mutate\(pluginId\)/);
  assert.doesNotMatch(installationsSource, /onClick=\{\(\) => rollbackMutation\.mutate/);

  const submitFormSource = installationsSource.slice(
    installationsSource.indexOf('function submitForm()'),
    installationsSource.indexOf('function confirmInstallationSave()'),
  );
  const highImpactIndex = submitFormSource.indexOf('setInstallationSaveTarget');
  const directSaveIndex = submitFormSource.indexOf('updateMutation.mutate({ values: form })');
  assert.match(submitFormSource, /hasHighImpactInstallationChanges\(detail, form\)/);
  assert.match(submitFormSource, /setInstallationSaveTarget\(\{ reason: 'HIGH_IMPACT', values: form \}\)/);
  assert.ok(highImpactIndex > -1);
  assert.ok(directSaveIndex > -1);
  assert.ok(highImpactIndex < directSaveIndex);
});

test('custom plugin install requires backend manifest and package integrity precheck', () => {
  const apiClientSource = source(join(root, 'src/lib/api-client.ts'));
  const sharedSource = source(sharedPath);

  assert.match(apiClientSource, /validatePluginManifest/);
  assert.match(apiClientSource, /PluginManifestValidationResult/);
  assert.match(apiClientSource, /\/plugins\/manifest\/validate/);
  assert.match(pluginsListSource, /validatePluginManifest/);
  assert.match(pluginsListSource, /validationResult/);

  assert.match(sharedSource, /PluginManifestValidationResult/);
  assert.match(sharedSource, /package_integrity/);
  assert.match(sharedSource, /后端完整性预检/);
  assert.match(sharedSource, /sha256/);
  assert.match(sharedSource, /actual_sha256/);
  assert.match(sharedSource, /expected_sha256/);
  assert.match(sharedSource, /package_size_bytes/);
  assert.match(sharedSource, /activeValidation\?\.[\s\S]*can_install/);
  assert.match(sharedSource, /validatedInputKey === inputKey/);
});

test('custom plugin backend precheck exposes Tool Gateway binding preview before install', () => {
  const sharedSource = source(sharedPath);

  assert.match(sharedSource, /Tool Gateway 工具绑定预览/);
  assert.match(sharedSource, /PluginToolBindingPreview/);
  assert.match(sharedSource, /result\.tool_bindings/);
  assert.match(sharedSource, /generated_tool_code/);
  assert.match(sharedSource, /require_approval/);
  assert.match(sharedSource, /需要审批|无需审批/);
  assert.match(sharedSource, /gateway/);
});

test('custom plugin backend precheck exposes sandbox policy gate before install', () => {
  const sharedTypesSource = source(resolve(root, '../../packages/shared-types/src/index.ts'));
  const sharedSource = source(sharedPath);

  assert.match(sharedTypesSource, /PluginSandboxPolicyPreview/);
  assert.match(sharedTypesSource, /sandbox_required/);
  assert.match(sharedTypesSource, /sandbox_policy/);
  assert.match(sharedSource, /沙箱策略预检/);
  assert.match(sharedSource, /result\.sandbox_required/);
  assert.match(sharedSource, /result\.sandbox_policy/);
  assert.match(sharedSource, /PLUGIN_SANDBOX_POLICY_REQUIRED|沙箱策略/);
});

test('plugin hook and menu binding mutations require confirmation before updating', () => {
  const bindingsSource = source(bindingsPath);
  const apiClientSource = source(join(root, 'src/lib/api-client.ts'));

  assert.match(bindingsSource, /BindingActionTarget/);
  assert.match(bindingsSource, /bindingActionTarget/);
  assert.match(bindingsSource, /setBindingActionTarget/);
  assert.match(bindingsSource, /ConfirmDialog/);
  assert.match(bindingsSource, /确认启用 Hook|确认停用 Hook|确认受控入队 Hook|确认显示菜单|确认隐藏菜单|确认启用菜单绑定|确认停用菜单绑定/);
  assert.match(apiClientSource, /queuePluginHookExecution/);
  assert.match(apiClientSource, /\/plugins\/\$\{pluginId\}\/hooks\/\$\{hookId\}\/execute/);
  assert.doesNotMatch(bindingsSource, /onClick=\{\(\) => hookMutation\.mutate/);
  assert.doesNotMatch(bindingsSource, /onClick=\{\(\) => hookExecutionMutation\.mutate/);
  assert.doesNotMatch(bindingsSource, /onClick=\{\(\) => menuBindingMutation\.mutate/);
});

test('plugin hook execution queue success exposes a monitor event deep link', () => {
  const bindingsSource = source(bindingsPath);

  assert.match(bindingsSource, /事件详情/);
  assert.match(bindingsSource, /\/monitor\/events\/\$\{queuedEventId\}/);
  assert.match(bindingsSource, /queuedEventId/);
});

test('production plugin pages use the operations shell and do not depend on legacy chrome', () => {
  const sharedSource = source(sharedPath);

  assert.match(sharedSource, /max-w-\[1680px\]/);
  assert.match(sharedSource, /rounded-xl/);
  assert.match(sharedSource, /border-slate-200\/80/);
  assert.match(sharedSource, /bg-white\/\[0\.9\]/);

  for (const componentPath of productionComponentPaths) {
    const componentSource = source(componentPath);

    assert.doesNotMatch(componentSource, /MetricCard/);
    assert.doesNotMatch(componentSource, /motion\/react|<motion\./);
    assert.doesNotMatch(componentSource, /max-w-7xl/);
    assert.doesNotMatch(componentSource, /PluginCenterBackground/);
    assert.match(componentSource, /PluginPageShell/);
  }
});
