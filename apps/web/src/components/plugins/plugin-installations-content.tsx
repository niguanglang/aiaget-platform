'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type PluginInstallationDetail, type PluginInstallationStatus, type PluginRiskLevel, type PluginRuntimeStatus, type PluginVersionItem } from '@aiaget/shared-types';
import { Archive, ArrowLeft, History, Power, Save, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { PluginCenterBackground } from '@/components/plugins/plugin-center-background';
import {
  formatPluginDateTime,
  pluginInstallationStatuses,
  pluginRiskLabel,
  pluginRiskLevels,
  pluginRiskTone,
  pluginRuntimeLabel,
  pluginRuntimeStatuses,
  pluginRuntimeTone,
  pluginStatusLabel,
  pluginStatusTone,
} from '@/components/plugins/plugin-status';
import {
  ConfirmDialog,
  Field,
  buildManifestDiffRows,
  InfoBlock,
  ManifestSummary,
  Message,
  PluginSectionNav,
  SummaryItem,
  usePluginPermissions,
} from '@/components/plugins/plugin-shared';
import { parseJsonObjectText, stringifyJson } from '@/components/tools/tool-json';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  disablePlugin,
  enablePlugin,
  getPluginInstallation,
  rollbackPlugin,
  uninstallPlugin,
  updatePluginInstallation,
  upgradePlugin,
  type ApiClientError,
} from '@/lib/api-client';

interface EditPluginForm {
  config_text: string;
  description: string;
  latest_version: string;
  name: string;
  risk_level: PluginRiskLevel;
  runtime_status: PluginRuntimeStatus;
  status: PluginInstallationStatus;
}

type InstallationActionTarget =
  | {
      plugin: PluginInstallationDetail;
      type: 'ENABLE' | 'DISABLE';
    }
  | {
      plugin: PluginInstallationDetail;
      type: 'UPGRADE';
    };

type RollbackActionTarget = {
  plugin: PluginInstallationDetail;
  version: PluginVersionItem;
};

type InstallationSaveTarget = {
  reason: 'HIGH_IMPACT' | 'NORMAL';
  values: EditPluginForm;
};

export function PluginInstallationsContent({ pluginId }: { pluginId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { canDisable, canEnable, canManage, canUninstall, canUpgrade, canView } = usePluginPermissions();
  const [form, setForm] = useState<EditPluginForm | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [installationActionTarget, setInstallationActionTarget] = useState<InstallationActionTarget | null>(null);
  const [installationSaveTarget, setInstallationSaveTarget] = useState<InstallationSaveTarget | null>(null);
  const [rollbackActionTarget, setRollbackActionTarget] = useState<RollbackActionTarget | null>(null);
  const [uninstallTarget, setUninstallTarget] = useState<PluginInstallationDetail | null>(null);
  const [versionCompareTargetId, setVersionCompareTargetId] = useState<string>('');

  const detailQuery = useQuery({
    enabled: canView,
    queryKey: ['plugin-installation', pluginId],
    queryFn: () => getPluginInstallation(pluginId),
  });
  const detail = detailQuery.data ?? null;

  useEffect(() => {
    if (!detail) return;
    setForm({
      config_text: stringifyJson(detail.config_json, ''),
      description: detail.description ?? '',
      latest_version: detail.latest_version,
      name: detail.name,
      risk_level: detail.risk_level,
      runtime_status: detail.runtime_status,
      status: detail.status,
    });
    setVersionCompareTargetId((current) => {
      if (current && detail.versions.some((version) => version.id === current)) return current;
      return detail.versions.find((version) => version.version !== detail.installed_version)?.id ?? '';
    });
    setFormError(null);
  }, [detail]);

  const updateMutation = useMutation({
    mutationFn: ({ values }: { values: EditPluginForm }) => {
      const parsedConfig = parseJsonObjectText(values.config_text, '配置 JSON', { allowEmpty: true });
      if (!parsedConfig.ok) throw new Error(parsedConfig.message);

      return updatePluginInstallation(pluginId, {
        config_json: parsedConfig.value,
        description: values.description.trim() || null,
        latest_version: values.latest_version,
        name: values.name,
        risk_level: values.risk_level,
        runtime_status: values.runtime_status,
        status: values.status,
      });
    },
    onSuccess: async (result) => {
      setNotice(`安装配置 ${result.name} 已保存。`);
      setFormError(null);
      setInstallationSaveTarget(null);
      await refreshPlugin(result);
    },
    onError: (error: Error) => {
      setNotice(null);
      setFormError(error.message);
    },
  });

  const runtimeMutation = useMutation({
    mutationFn: (action: 'enable' | 'disable') => (action === 'enable' ? enablePlugin(pluginId) : disablePlugin(pluginId)),
    onSuccess: async (result) => {
      setNotice(`${result.name} 已${result.status === 'ACTIVE' ? '启用' : '停用'}。`);
      setActionError(null);
      setInstallationActionTarget(null);
      await refreshPlugin(result);
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setActionError(error.message);
    },
  });

  const upgradeMutation = useMutation({
    mutationFn: upgradePlugin,
    onSuccess: async (result) => {
      setNotice(`${result.name} 已进入升级流程。`);
      setActionError(null);
      setInstallationActionTarget(null);
      await refreshPlugin(result);
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setActionError(error.message);
    },
  });

  const rollbackMutation = useMutation({
    mutationFn: ({ version }: { version: PluginVersionItem }) =>
      rollbackPlugin(pluginId, {
        change_note: `控制台回滚至 ${version.version}`,
        version_id: version.id,
      }),
    onSuccess: async (result) => {
      setNotice(`${result.name} 已回滚至 ${result.installed_version}。`);
      setActionError(null);
      setRollbackActionTarget(null);
      await refreshPlugin(result);
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setActionError(error.message);
    },
  });

  const uninstallMutation = useMutation({
    mutationFn: uninstallPlugin,
    onSuccess: async (result) => {
      setNotice(`${result.message} 清理菜单 ${result.cleanup.menus} 个、Hook ${result.cleanup.hooks} 个、工具 ${result.cleanup.tools} 个。`);
      setActionError(null);
      setUninstallTarget(null);
      await queryClient.invalidateQueries({ queryKey: ['plugin-overview'] });
      await queryClient.invalidateQueries({ queryKey: ['plugin-market'] });
      await queryClient.invalidateQueries({ queryKey: ['plugin-installations'] });
      router.push('/plugins');
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setActionError(error.message);
    },
  });

  async function refreshPlugin(result: PluginInstallationDetail) {
    queryClient.setQueryData(['plugin-installation', result.plugin_id], result);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['plugin-overview'] }),
      queryClient.invalidateQueries({ queryKey: ['plugin-market'] }),
      queryClient.invalidateQueries({ queryKey: ['plugin-installations'] }),
    ]);
  }

  function submitForm() {
    if (!form || !canManage || !detail) return;
    setFormError(null);

    if (hasHighImpactInstallationChanges(detail, form)) {
      setInstallationSaveTarget({ reason: 'HIGH_IMPACT', values: form });
      return;
    }

    updateMutation.mutate({ values: form });
  }

  function confirmInstallationSave() {
    if (!installationSaveTarget) return;
    updateMutation.mutate({ values: installationSaveTarget.values });
  }

  function confirmInstallationAction() {
    if (!installationActionTarget) return;

    if (installationActionTarget.type === 'UPGRADE') {
      upgradeMutation.mutate(installationActionTarget.plugin.plugin_id);
      return;
    }

    runtimeMutation.mutate(installationActionTarget.type === 'ENABLE' ? 'enable' : 'disable');
  }

  if (!canView) return <InstallStatePanel description="当前账号没有 plugin:center:view 权限。" title="无权限访问安装配置" />;
  if (detailQuery.isLoading) return <InstallStatePanel description="正在加载租户安装实例和配置 JSON。" title="正在加载安装配置" />;
  if (detailQuery.isError || !detail || !form) return <InstallStatePanel description="安装配置加载失败，可能是资源不存在或权限不足。" title="安装配置加载失败" />;

  const rollbackCandidate = detail.versions.find((version) => version.version !== detail.installed_version) ?? null;
  const selectedCompareVersion = detail.versions.find((version) => version.id === versionCompareTargetId) ?? rollbackCandidate;
  const versionCompareRows = selectedCompareVersion
    ? buildManifestDiffRows({
        after: detail.manifest_json,
        before: selectedCompareVersion.manifest_json,
      })
    : [];
  const isMutating =
    updateMutation.isPending
    || runtimeMutation.isPending
    || upgradeMutation.isPending
    || rollbackMutation.isPending
    || uninstallMutation.isPending;

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <PluginCenterBackground />
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4" size="sm" variant="outline">
            <Link href={`/plugins/${pluginId}`}>
              <ArrowLeft className="size-4" />
              插件详情
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">安装配置</StatusBadge>
            <StatusBadge tone={pluginStatusTone(detail.status)}>{pluginStatusLabel(detail.status)}</StatusBadge>
            <StatusBadge tone={pluginRuntimeTone(detail.runtime_status)}>{pluginRuntimeLabel(detail.runtime_status)}</StatusBadge>
            <StatusBadge tone={pluginRiskTone(detail.risk_level)}>{pluginRiskLabel(detail.risk_level)}</StatusBadge>
          </div>
          <h1 className="break-words text-2xl font-semibold">{detail.name} · 租户安装</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">维护插件安装状态、运行状态、风险等级和配置 JSON；启停、升级、卸载在此页面完成。</p>
        </div>
        <PluginSectionNav active="installations" pluginId={pluginId} />
      </section>

      {notice ? <Message tone="success" value={notice} /> : null}
      {actionError ? <Message tone="error" value={actionError} /> : null}

      <section className="grid gap-3 md:grid-cols-4">
        <InfoBlock label="插件编码" value={detail.code} />
        <InfoBlock label="已安装版本" value={detail.installed_version} />
        <InfoBlock label="最新版本" value={detail.latest_version} />
        <InfoBlock label="安装时间" value={formatPluginDateTime(detail.installed_at)} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="p-5">
          <div className="border-b pb-4">
            <h2 className="text-sm font-semibold">安装配置表单</h2>
            <p className="mt-1 text-sm text-muted-foreground">修改基础信息、状态和配置 JSON。保存会调用当前插件安装配置 API。</p>
          </div>
          <div className="mt-5 grid gap-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="名称">
                <input className="h-10 rounded-md border bg-background/80 px-3 text-sm" disabled={!canManage} onChange={(event) => setForm({ ...form, name: event.target.value })} value={form.name} />
              </Field>
              <Field label="最新版本">
                <input className="h-10 rounded-md border bg-background/80 px-3 text-sm" disabled={!canManage} onChange={(event) => setForm({ ...form, latest_version: event.target.value })} value={form.latest_version} />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="安装状态">
                <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" disabled={!canManage} onChange={(event) => setForm({ ...form, status: event.target.value as PluginInstallationStatus })} value={form.status}>
                  {pluginInstallationStatuses.map((status) => (
                    <option key={status} value={status}>{pluginStatusLabel(status)}</option>
                  ))}
                </select>
              </Field>
              <Field label="运行状态">
                <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" disabled={!canManage} onChange={(event) => setForm({ ...form, runtime_status: event.target.value as PluginRuntimeStatus })} value={form.runtime_status}>
                  {pluginRuntimeStatuses.map((status) => (
                    <option key={status} value={status}>{pluginRuntimeLabel(status)}</option>
                  ))}
                </select>
              </Field>
              <Field label="风险等级">
                <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" disabled={!canManage} onChange={(event) => setForm({ ...form, risk_level: event.target.value as PluginRiskLevel })} value={form.risk_level}>
                  {pluginRiskLevels.map((risk) => (
                    <option key={risk} value={risk}>{pluginRiskLabel(risk)}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="描述">
              <textarea className="min-h-24 resize-y rounded-md border bg-background/80 px-3 py-2 text-sm outline-none" disabled={!canManage} onChange={(event) => setForm({ ...form, description: event.target.value })} value={form.description} />
            </Field>
            <Field label="配置 JSON">
              <textarea className="min-h-56 resize-y rounded-md border bg-background/80 px-3 py-2 font-mono text-xs outline-none" disabled={!canManage} onChange={(event) => setForm({ ...form, config_text: event.target.value })} placeholder='{"enabled": true}' value={form.config_text} />
            </Field>
            {formError ? <Message tone="error" value={formError} /> : null}
            <div className="flex justify-end">
              <Button disabled={!canManage || updateMutation.isPending} onClick={submitForm} type="button">
                <Save className="size-4" />
                保存安装配置
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold">运行态操作</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">启停、升级和卸载会影响当前租户插件安装实例。</p>
          <div className="mt-4 grid gap-3">
            <SummaryItem label="运行状态" value={pluginRuntimeLabel(detail.runtime_status)} />
            <SummaryItem label="风险等级" value={pluginRiskLabel(detail.risk_level)} />
            <Button disabled={detail.status === 'ACTIVE' ? !canDisable || isMutating : !canEnable || isMutating || detail.security_preview.can_enable === false} onClick={() => setInstallationActionTarget({ plugin: detail, type: detail.status === 'ACTIVE' ? 'DISABLE' : 'ENABLE' })} type="button" variant="outline">
              <Power className="size-4" />
              {detail.status === 'ACTIVE' ? '停用插件' : '启用插件'}
            </Button>
            <Button disabled={!canUpgrade || isMutating} onClick={() => setInstallationActionTarget({ plugin: detail, type: 'UPGRADE' })} type="button" variant="outline">
              <UploadCloud className="size-4" />
              升级插件
            </Button>
            <Button disabled={!canUpgrade || isMutating || !rollbackCandidate} onClick={() => rollbackCandidate && setRollbackActionTarget({ plugin: detail, version: rollbackCandidate })} type="button" variant="outline">
              <History className="size-4" />
              {rollbackCandidate ? `回滚至 ${rollbackCandidate.version}` : '暂无可回滚版本'}
            </Button>
            <Button disabled={!canUninstall || isMutating || detail.status === 'ARCHIVED'} onClick={() => setUninstallTarget(detail)} type="button" variant="destructive">
              <Archive className="size-4" />
              {detail.status === 'ARCHIVED' ? '已卸载' : '卸载插件'}
            </Button>
          </div>
        </Card>
      </section>

      <Card className="p-5">
        <div className="flex flex-col justify-between gap-3 border-b pb-4 lg:flex-row lg:items-start">
          <div>
            <h2 className="text-sm font-semibold">版本对比</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              在执行回滚前对比当前版本与历史版本的 Manifest 差异，便于确认菜单、Hook、权限和工具声明变化。
            </p>
          </div>
          <StatusBadge tone={versionCompareRows.length > 0 ? 'degraded' : 'ready'}>
            {versionCompareRows.length > 0 ? `${versionCompareRows.length} 项差异` : '无 Manifest 差异'}
          </StatusBadge>
        </div>
        <div className="mt-5 grid gap-4">
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_220px]">
            <ManifestSummary label="当前版本" value={detail.installed_version} />
            <ManifestSummary label="对比版本" value={selectedCompareVersion?.version ?? '暂无历史版本'} />
            <Field label="选择历史版本">
              <select
                className="h-10 rounded-md border bg-background/80 px-3 text-sm"
                disabled={detail.versions.length === 0}
                onChange={(event) => setVersionCompareTargetId(event.target.value)}
                value={selectedCompareVersion?.id ?? ''}
              >
                {detail.versions.length === 0 ? <option value="">暂无历史版本</option> : null}
                {detail.versions.map((version) => (
                  <option key={version.id} value={version.id}>
                    {version.version}
                    {version.version === detail.installed_version ? '（当前）' : ''}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-semibold">Manifest 差异</div>
            {!selectedCompareVersion ? (
              <EmptyState className="rounded-md border bg-muted/20 p-6" description="当前插件没有可用于对比的版本快照。" title="暂无版本快照" />
            ) : versionCompareRows.length === 0 ? (
              <EmptyState className="rounded-md border bg-muted/20 p-6" description="当前版本与对比版本的 Manifest 摘要字段一致。" title="无 Manifest 差异" />
            ) : (
              <div className="grid gap-2">
                {versionCompareRows.map((row) => (
                  <div className="grid gap-3 rounded-md border bg-muted/20 p-3 md:grid-cols-[160px_1fr_1fr]" key={row.key}>
                    <div>
                      <div className="text-xs text-muted-foreground">字段</div>
                      <div className="mt-1 break-words text-sm font-medium">{row.label}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">变更前</div>
                      <div className="mt-1 break-words text-sm">{row.before}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">变更后</div>
                      <div className="mt-1 break-words text-sm">{row.after}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {installationActionTarget ? (
        <ConfirmDialog
          body={installationActionBody(installationActionTarget)}
          confirmLabel={installationActionConfirmLabel(installationActionTarget.type)}
          onCancel={() => setInstallationActionTarget(null)}
          onConfirm={confirmInstallationAction}
          pending={runtimeMutation.isPending || upgradeMutation.isPending}
          title={installationActionTitle(installationActionTarget.type)}
          variant={installationActionTarget.type === 'DISABLE' ? 'destructive' : 'default'}
        />
      ) : null}

      {installationSaveTarget ? (
        <ConfirmDialog
          body={installationSaveBody(detail, installationSaveTarget.values)}
          confirmLabel="确认保存"
          onCancel={() => setInstallationSaveTarget(null)}
          onConfirm={confirmInstallationSave}
          pending={updateMutation.isPending}
          title="确认保存高影响安装配置"
          variant="destructive"
        />
      ) : null}

      {rollbackActionTarget ? (
        <ConfirmDialog
          body={`确认将插件「${rollbackActionTarget.plugin.name}」从 ${rollbackActionTarget.plugin.installed_version} 回滚至 ${rollbackActionTarget.version.version}？回滚会恢复历史 Manifest、配置快照，并重新同步菜单、Hook 和工具声明。`}
          confirmLabel="确认回滚"
          onCancel={() => setRollbackActionTarget(null)}
          onConfirm={() => rollbackMutation.mutate({ version: rollbackActionTarget.version })}
          pending={rollbackMutation.isPending}
          title="确认回滚插件"
          variant="destructive"
        />
      ) : null}

      {uninstallTarget ? (
        <ConfirmDialog
          body={`确认卸载插件「${uninstallTarget.name}」？卸载会停止运行态，并软删除该插件生成的菜单绑定、Hook 和工具，审计与版本记录会保留。`}
          confirmLabel="确认卸载"
          onCancel={() => setUninstallTarget(null)}
          onConfirm={() => uninstallMutation.mutate(uninstallTarget.plugin_id)}
          pending={uninstallMutation.isPending}
          title="卸载插件"
        />
      ) : null}
    </main>
  );
}

function hasHighImpactInstallationChanges(detail: PluginInstallationDetail, values: EditPluginForm) {
  return detail.status !== values.status || detail.runtime_status !== values.runtime_status || detail.risk_level !== values.risk_level;
}

function installationSaveBody(detail: PluginInstallationDetail, values: EditPluginForm) {
  const changes = [
    detail.status !== values.status
      ? `安装状态：${pluginStatusLabel(detail.status)} -> ${pluginStatusLabel(values.status)}`
      : null,
    detail.runtime_status !== values.runtime_status
      ? `运行状态：${pluginRuntimeLabel(detail.runtime_status)} -> ${pluginRuntimeLabel(values.runtime_status)}`
      : null,
    detail.risk_level !== values.risk_level
      ? `风险等级：${pluginRiskLabel(detail.risk_level)} -> ${pluginRiskLabel(values.risk_level)}`
      : null,
  ].filter(Boolean);

  return `本次保存会变更插件「${detail.name}」的高影响字段：${changes.join('；')}。这些字段会影响插件菜单入口、Hook、工具能力或安全准入，请确认后再保存。`;
}

function installationActionTitle(type: InstallationActionTarget['type']) {
  const titles = {
    DISABLE: '确认停用插件',
    ENABLE: '确认启用插件',
    UPGRADE: '确认升级插件',
  } satisfies Record<InstallationActionTarget['type'], string>;

  return titles[type];
}

function installationActionConfirmLabel(type: InstallationActionTarget['type']) {
  const labels = {
    DISABLE: '确认停用',
    ENABLE: '确认启用',
    UPGRADE: '确认升级',
  } satisfies Record<InstallationActionTarget['type'], string>;

  return labels[type];
}

function installationActionBody(target: InstallationActionTarget) {
  if (target.type === 'ENABLE') {
    return `确认启用插件「${target.plugin.name}」？启用后该插件声明的菜单入口、Hook 和工具能力会按绑定配置参与运行，请确认安全审核和权限声明已经完成。`;
  }

  if (target.type === 'DISABLE') {
    return `确认停用插件「${target.plugin.name}」？停用后当前租户将无法继续使用该插件提供的菜单入口、Hook 和工具能力，历史审计记录会保留。`;
  }

  return `确认升级插件「${target.plugin.name}」？升级会进入版本更新流程，可能刷新 Manifest、菜单绑定、Hook 配置和工具声明。`;
}

function InstallStatePanel({ description, title }: { description: string; title: string }) {
  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <PluginCenterBackground />
      <Button asChild className="w-fit" variant="outline">
        <Link href="/plugins">
          <ArrowLeft className="size-4" />
          插件生态中心
        </Link>
      </Button>
      <Card className="p-6">
        <EmptyState description={description} title={title} />
      </Card>
    </main>
  );
}
