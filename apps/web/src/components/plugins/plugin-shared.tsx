'use client';

import {
  hasPermission,
  type CreatePluginInstallationInput,
  type PluginManifestValidationIssue,
  type PluginManifestValidationResult,
  type PluginMarketItem,
  type PluginPackageIntegrityResult,
  type PluginToolBindingPreview,
  type PluginRiskLevel,
} from '@aiaget/shared-types';
import { SlidersHorizontal, X } from 'lucide-react';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { pluginRiskLabel, pluginRiskTone, pluginStatusLabel, pluginStatusTone } from '@/components/plugins/plugin-status';
import { parseJsonObjectText, stringifyJson } from '@/components/tools/tool-json';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { cn } from '@/lib/utils';

export type PluginSection = 'detail' | 'installations' | 'security' | 'bindings';

export function usePluginPermissions() {
  const { currentUser } = useAuth();
  const permissions = currentUser?.user.permissions ?? [];
  const isTenantAdmin = Boolean(currentUser?.user.roles.some((role) => role.code === 'tenant_admin'));

  return {
    canAudit: isTenantAdmin || hasPermission(permissions, 'plugin:center:audit'),
    canDisable: isTenantAdmin || hasPermission(permissions, 'plugin:center:disable'),
    canEnable: isTenantAdmin || hasPermission(permissions, 'plugin:center:enable'),
    canInstall: isTenantAdmin || hasPermission(permissions, 'plugin:center:install'),
    canManage: isTenantAdmin || hasPermission(permissions, 'plugin:center:manage'),
    canUninstall: isTenantAdmin || hasPermission(permissions, 'plugin:center:uninstall'),
    canUpgrade: isTenantAdmin || hasPermission(permissions, 'plugin:center:upgrade'),
    canView: isTenantAdmin || hasPermission(permissions, 'plugin:center:view'),
    isTenantAdmin,
  };
}

export function PluginSectionNav({ active, pluginId }: { active: PluginSection; pluginId: string }) {
  const items = [
    { key: 'detail', href: `/plugins/${pluginId}`, label: '插件详情' },
    { key: 'installations', href: `/plugins/${pluginId}/installations`, label: '安装配置' },
    { key: 'security', href: `/plugins/${pluginId}/security`, label: '安全审核' },
    { key: 'bindings', href: `/plugins/${pluginId}/bindings`, label: '绑定配置' },
  ] as const;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Button asChild key={item.key} size="sm" variant={active === item.key ? 'default' : 'outline'}>
          <Link href={item.href}>{item.label}</Link>
        </Button>
      ))}
    </div>
  );
}

export function Message({ tone, value }: { tone: 'success' | 'error'; value: string }) {
  return (
    <div
      className={cn(
        'rounded-md border px-4 py-3 text-sm',
        tone === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-destructive/30 bg-destructive/5 text-destructive',
      )}
    >
      {value}
    </div>
  );
}

export function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-sm font-medium">{value}</div>
    </div>
  );
}

export function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-sm font-medium">{value}</div>
    </div>
  );
}

export function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      {children}
    </label>
  );
}

export function DetailList({ children, subtitle, title }: { children: ReactNode; subtitle: string; title: string }) {
  return (
    <section className="rounded-lg border bg-muted/20 p-4">
      <div className="mb-3 flex items-start gap-2">
        <SlidersHorizontal className="mt-0.5 size-4 text-muted-foreground" />
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

export function ConfirmDialog({
  body,
  confirmLabel = '确认',
  onCancel,
  onConfirm,
  pending,
  title,
  variant = 'destructive',
}: {
  body: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
  title: string;
  variant?: 'default' | 'destructive';
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 px-4 backdrop-blur-sm">
      <Card className="w-full max-w-md p-5 shadow-lg">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={onCancel} type="button" variant="outline">
            取消
          </Button>
          <Button disabled={pending} onClick={onConfirm} type="button" variant={variant}>
            {confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function InstallGuideDialog({
  canInstall,
  isPending,
  onClose,
  onConfirm,
  plugin,
}: {
  canInstall: boolean;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
  plugin: PluginMarketItem;
}) {
  const blockedReasons = [];
  if (!canInstall) blockedReasons.push('当前账号没有 plugin:center:install 权限。');
  if (plugin.risk_level === 'HIGH' || plugin.risk_level === 'CRITICAL') blockedReasons.push('当前插件风险等级较高，建议先完成安全中心审核。');
  if (plugin.permission_codes.length === 0) blockedReasons.push('当前插件未声明额外权限。');

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm">
      <Card className="max-h-[92vh] w-full max-w-2xl overflow-y-auto p-5 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={pluginRiskTone(plugin.risk_level)}>{pluginRiskLabel(plugin.risk_level)}</StatusBadge>
              <StatusBadge tone={plugin.install_status ? pluginStatusTone(plugin.install_status) : 'planned'}>{pluginStatusLabel(plugin.install_status)}</StatusBadge>
            </div>
            <h2 className="mt-3 text-lg font-semibold">安装插件向导</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              安装前确认插件来源、风险等级、权限声明和当前租户可见性。安装后会生成插件安装实例和版本快照。
            </p>
          </div>
          <Button onClick={onClose} size="icon" type="button" variant="ghost">
            <X className="size-4" />
          </Button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <InfoBlock label="插件名称" value={plugin.name} />
          <InfoBlock label="最新版本" value={plugin.latest_version} />
          <InfoBlock label="提供方" value={plugin.provider} />
          <InfoBlock label="权限声明" value={`${plugin.permission_codes.length} 项`} />
        </div>

        <section className="mt-5 rounded-lg border bg-muted/20 p-4">
          <h3 className="text-sm font-semibold">安装影响</h3>
          <div className="mt-3 grid gap-2">
            <SummaryItem label="菜单" value={`${plugin.menu_count} 个受控入口`} />
            <SummaryItem label="Hook" value={`${plugin.hook_count} 个扩展点`} />
            <SummaryItem label="风险" value={pluginRiskLabel(plugin.risk_level)} />
          </div>
        </section>

        <section className="mt-4 rounded-lg border bg-muted/20 p-4">
          <h3 className="text-sm font-semibold">权限预览</h3>
          {plugin.permission_codes.length === 0 ? (
            <EmptyState className="py-6" description="当前插件没有额外权限声明。" title="暂无权限声明" />
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {plugin.permission_codes.map((permission) => (
                <span className="rounded-md border bg-background px-2.5 py-1 text-xs text-muted-foreground" key={permission}>
                  {permission}
                </span>
              ))}
            </div>
          )}
        </section>

        {blockedReasons.length > 0 ? (
          <div className="mt-4 grid gap-2">
            {blockedReasons.map((reason) => (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800" key={reason}>
                {reason}
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button onClick={onClose} type="button" variant="outline">
            取消
          </Button>
          <Button disabled={!canInstall || isPending} onClick={onConfirm} type="button">
            {isPending ? '安装中...' : '确认安装'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function CustomPluginDialog({
  canInstall,
  isPending,
  onClose,
  onConfirm,
  onValidate,
  validationError,
  validationPending,
  validationResult,
}: {
  canInstall: boolean;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (input: CreatePluginInstallationInput) => void;
  onValidate: (input: CreatePluginInstallationInput) => Promise<PluginManifestValidationResult>;
  validationError: string | null;
  validationPending: boolean;
  validationResult: PluginManifestValidationResult | null;
}) {
  const [manifestText, setManifestText] = useState(defaultCustomPluginManifestText);
  const [validatedInputKey, setValidatedInputKey] = useState<string | null>(null);
  const parsed = parsePluginManifestText(manifestText);
  const inputKey = parsed.ok ? stableStringify(parsed.input) : null;
  const validationMatchesManifest = Boolean(validationResult && validatedInputKey === inputKey);
  const activeValidation = validationMatchesManifest ? validationResult : null;
  const blockedReasons = [];
  if (!canInstall) blockedReasons.push('当前账号没有 plugin:center:install 权限。');
  if (parsed.ok && (parsed.preview.risk_level === 'HIGH' || parsed.preview.risk_level === 'CRITICAL')) {
    blockedReasons.push('当前 Manifest 风险等级较高，建议先完成安全中心审核。');
  }
  if (parsed.ok && !activeValidation) {
    blockedReasons.push('请先执行后端完整性预检，确认 Manifest、签名声明和安装包 sha256 通过后再安装。');
  }
  if (activeValidation && !activeValidation.can_install) {
    blockedReasons.push(activeValidation.summary || '后端完整性预检未通过，禁止安装。');
  }
  const canSubmit = canInstall && parsed.ok && Boolean(activeValidation?.can_install) && blockedReasons.length === 0;

  async function submitValidation() {
    if (!parsed.ok) return;
    const result = await onValidate(parsed.input);
    setValidatedInputKey(inputKey);
    return result;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm">
      <Card className="max-h-[92vh] w-full max-w-6xl overflow-hidden shadow-lg">
        <div className="flex items-start justify-between gap-4 border-b p-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone="ready">自定义插件</StatusBadge>
              <StatusBadge tone={parsed.ok ? pluginRiskTone(parsed.preview.risk_level) : 'degraded'}>
                {parsed.ok ? pluginRiskLabel(parsed.preview.risk_level) : '待校验'}
              </StatusBadge>
            </div>
            <h2 className="mt-3 text-lg font-semibold">自定义插件 Manifest 安装</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              粘贴插件声明清单，平台会解析基础信息、权限、菜单、Hook、工具能力和配置快照。这里只注册控制面声明，不执行第三方任意代码。
            </p>
          </div>
          <Button onClick={onClose} size="icon" type="button" variant="ghost">
            <X className="size-4" />
          </Button>
        </div>

        <div className="grid max-h-[calc(92vh-156px)] gap-4 overflow-y-auto p-5 lg:grid-cols-[1fr_0.92fr]">
          <section className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Manifest JSON</h3>
                <p className="mt-1 text-xs text-muted-foreground">必填字段：code、name。建议声明 version、provider、permissions、menus、hooks、tools。</p>
              </div>
              <Button
                onClick={() => {
                  setValidatedInputKey(null);
                  setManifestText(defaultCustomPluginManifestText);
                }}
                type="button"
                variant="outline"
              >
                使用示例
              </Button>
            </div>
            <textarea
              className="min-h-[520px] resize-y rounded-md border bg-slate-950 px-3 py-3 font-mono text-xs leading-6 text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => {
                setValidatedInputKey(null);
                setManifestText(event.target.value);
              }}
              spellCheck={false}
              value={manifestText}
            />
          </section>

          <section className="grid content-start gap-4">
            {parsed.ok ? (
              <PluginManifestPreview preview={parsed.preview} />
            ) : (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {parsed.message}
              </div>
            )}

            <BackendManifestValidationPanel
              error={validationError}
              onValidate={submitValidation}
              pending={validationPending}
              result={activeValidation}
              stale={Boolean(validationResult && !validationMatchesManifest)}
              validManifest={parsed.ok}
            />

            {blockedReasons.length > 0 ? (
              <div className="grid gap-2">
                {blockedReasons.map((reason) => (
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800" key={reason}>
                    {reason}
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t bg-background px-5 py-4 sm:flex-row sm:justify-end">
          <Button disabled={isPending} onClick={onClose} type="button" variant="outline">
            取消
          </Button>
          <Button
            disabled={!canSubmit || isPending || validationPending}
            onClick={() => {
              if (parsed.ok) onConfirm(parsed.input);
            }}
            type="button"
          >
            {isPending ? '安装中...' : '确认安装'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function ManifestSummary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background px-3 py-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-1 break-words text-xs font-medium text-foreground">{value}</div>
    </div>
  );
}

export function buildManifestDiffRows({
  after,
  before,
}: {
  after: Record<string, unknown> | null;
  before: Record<string, unknown> | null;
}) {
  const keys = new Set<string>();
  for (const key of extractManifestKeys(before)) keys.add(key);
  for (const key of extractManifestKeys(after)) keys.add(key);

  return [...keys]
    .map((key) => {
      const beforeValue = extractManifestValue(before, key);
      const afterValue = extractManifestValue(after, key);
      return {
        after: afterValue ?? '未配置',
        before: beforeValue ?? '未配置',
        key,
        label: manifestKeyLabel(key),
      };
    })
    .filter((row) => row.before !== row.after);
}

export function formatManifestValue(manifest: Record<string, unknown> | null, keys: string[]) {
  if (!manifest) return '未配置';
  for (const key of keys) {
    const value = extractManifestValue(manifest, key);
    if (value) return value;
  }
  return '未配置';
}

export function formatPluginReviewStatus(value: string | null) {
  if (!value) return '未提交';

  const labels: Record<string, string> = {
    APPROVED: '已通过',
    PENDING: '审核中',
    REJECTED: '已拒绝',
    WAIVED: '已豁免',
  };

  return labels[value] ?? value;
}

export function pluginReviewStatusTone(value: string | null) {
  if (value === 'APPROVED' || value === 'WAIVED') return 'healthy' as const;
  if (value === 'PENDING') return 'degraded' as const;
  if (value === 'REJECTED') return 'unavailable' as const;

  return 'planned' as const;
}

function PluginManifestPreview({ preview }: { preview: PluginManifestPreviewModel }) {
  return (
    <div className="grid gap-4">
      <section className="rounded-lg border bg-muted/20 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">{preview.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {preview.code} · {preview.provider} · v{preview.version}
            </p>
          </div>
          <StatusBadge tone={pluginRiskTone(preview.risk_level)}>{pluginRiskLabel(preview.risk_level)}</StatusBadge>
        </div>
        {preview.description ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{preview.description}</p> : null}
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <SummaryItem label="权限声明" value={`${preview.permissions.length} 项`} />
        <SummaryItem label="菜单入口" value={`${preview.menus.length} 个`} />
        <SummaryItem label="Hook 绑定" value={`${preview.hooks.length} 个`} />
        <SummaryItem label="工具能力" value={`${preview.tools.length} 个`} />
      </div>

      <ManifestPreviewList emptyText="当前 Manifest 没有声明权限。" items={preview.permissions} title="权限预览" />
      <ManifestPreviewList emptyText="当前 Manifest 没有声明菜单入口。" items={preview.menus.map((item) => `${item.name}（${item.code}）`)} title="菜单入口" />
      <ManifestPreviewList emptyText="当前 Manifest 没有声明 Hook。" items={preview.hooks.map((item) => `${item.name} · ${item.type}`)} title="Hook 绑定" />
      <ManifestPreviewList emptyText="当前 Manifest 没有声明工具能力。" items={preview.tools.map((item) => `${item.name} · ${item.method}`)} title="工具能力" />

      <section className="rounded-lg border bg-muted/20 p-4">
        <h3 className="text-sm font-semibold">配置快照</h3>
        <pre className="mt-3 max-h-44 overflow-auto rounded-md border bg-slate-950 px-3 py-3 text-xs leading-6 text-slate-100">
          {stringifyJson(preview.config, '{}')}
        </pre>
      </section>
    </div>
  );
}

function BackendManifestValidationPanel({
  error,
  onValidate,
  pending,
  result,
  stale,
  validManifest,
}: {
  error: string | null;
  onValidate: () => Promise<PluginManifestValidationResult | undefined>;
  pending: boolean;
  result: PluginManifestValidationResult | null;
  stale: boolean;
  validManifest: boolean;
}) {
  const integrity = result?.package_integrity ?? null;

  return (
    <section className="rounded-lg border bg-muted/20 p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">后端完整性预检</h3>
            <StatusBadge tone={manifestValidationTone(result, pending, stale)}>
              {manifestValidationLabel(result, pending, stale)}
            </StatusBadge>
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            调用控制面校验 Manifest、签名声明、安装包来源和 sha256。自定义插件必须通过此预检后才能安装。
          </p>
        </div>
        <Button disabled={!validManifest || pending} onClick={() => void onValidate()} size="sm" type="button" variant="outline">
          {pending ? '预检中...' : '执行预检'}
        </Button>
      </div>

      {stale ? (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Manifest 已修改，当前完整性预检结果已失效，请重新执行预检。
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="mt-4 grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <ManifestSummary label="Manifest 状态" value={result.can_install ? '允许安装' : '禁止安装'} />
            <ManifestSummary label="风险等级" value={pluginRiskLabel(result.risk_level)} />
            <ManifestSummary label="安装包来源" value={result.package_source ?? '未声明'} />
            <ManifestSummary label="声明 sha256" value={result.package_sha256 ?? '未声明'} />
          </div>
          <PackageIntegritySummary integrity={integrity} />
          <PluginSandboxPolicySummary required={result.sandbox_required} sandboxPolicy={result.sandbox_policy} />
          <ToolGatewayBindingPreview bindings={result.tool_bindings} />
          <ManifestValidationIssueList items={result.errors} title="错误" tone="error" />
          <ManifestValidationIssueList items={result.warnings} title="警告" tone="warn" />
          <p className="rounded-md border bg-background px-3 py-2 text-xs leading-5 text-muted-foreground">
            {result.summary}
          </p>
        </div>
      ) : (
        <p className="mt-3 rounded-md border bg-background px-3 py-2 text-xs leading-5 text-muted-foreground">
          本地 JSON 解析只用于快速预览，安装门禁以后端预检结果为准。
        </p>
      )}
    </section>
  );
}

function PluginSandboxPolicySummary({
  required,
  sandboxPolicy,
}: {
  required: boolean;
  sandboxPolicy: PluginManifestValidationResult['sandbox_policy'];
}) {
  return (
    <section className="rounded-md border bg-background p-3">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h4 className="text-xs font-semibold">沙箱策略预检</h4>
        <StatusBadge tone={sandboxPolicyTone(sandboxPolicy)}>
          {sandboxPolicyLabel(sandboxPolicy)}
        </StatusBadge>
        {required ? <StatusBadge tone="degraded">需要沙箱</StatusBadge> : <StatusBadge tone="ready">无需沙箱</StatusBadge>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <ManifestSummary label="代码入口" value={sandboxPolicy.entry ?? '未声明'} />
        <ManifestSummary label="隔离方式" value={sandboxPolicy.isolation ?? '未声明'} />
        <ManifestSummary label="网络策略" value={sandboxPolicy.network ?? '未声明'} />
        <ManifestSummary label="文件系统" value={sandboxPolicy.filesystem ?? '未声明'} />
        <ManifestSummary label="timeout_ms" value={sandboxPolicy.timeout_ms ? String(sandboxPolicy.timeout_ms) : '未声明'} />
        <ManifestSummary label="memory_mb" value={sandboxPolicy.memory_mb ? String(sandboxPolicy.memory_mb) : '未声明'} />
      </div>
      <p className="mt-3 rounded-md border bg-muted/20 px-3 py-2 text-xs leading-5 text-muted-foreground">
        {sandboxPolicy.reason ?? '当前插件未声明自定义代码入口，安装后只通过 Tool Gateway 生成工具边界执行。'}
      </p>
    </section>
  );
}

function ToolGatewayBindingPreview({ bindings }: { bindings: PluginToolBindingPreview[] }) {
  return (
    <section className="rounded-md border bg-background p-3">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h4 className="text-xs font-semibold">Tool Gateway 工具绑定预览</h4>
        <StatusBadge tone={bindings.length > 0 ? 'ready' : 'planned'}>{bindings.length} 个工具</StatusBadge>
      </div>
      {bindings.length === 0 ? (
        <p className="text-xs leading-5 text-muted-foreground">后端预检没有生成插件工具绑定。安装后不会新增 Tool Gateway 工具能力。</p>
      ) : (
        <div className="grid gap-2">
          {bindings.map((binding) => (
            <div className="grid gap-3 rounded-md border bg-muted/20 p-3 md:grid-cols-[1.1fr_1fr_auto]" key={binding.generated_tool_code}>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{binding.name}</div>
                <div className="mt-1 break-words text-xs text-muted-foreground">{binding.generated_tool_code}</div>
              </div>
              <div className="grid gap-1 text-xs text-muted-foreground">
                <span>{binding.method} · {binding.url ?? '未配置 URL'}</span>
                <span>{binding.gateway} · {binding.code}</span>
              </div>
              <div className="flex flex-wrap items-start justify-end gap-2">
                <StatusBadge tone={pluginRiskTone(binding.risk_level)}>{pluginRiskLabel(binding.risk_level)}</StatusBadge>
                <StatusBadge tone={binding.require_approval ? 'degraded' : 'healthy'}>
                  {binding.require_approval ? '需要审批' : '无需审批'}
                </StatusBadge>
                <StatusBadge tone={binding.status === 'ACTIVE' ? 'healthy' : 'planned'}>{binding.status === 'ACTIVE' ? '启用' : '停用'}</StatusBadge>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function PackageIntegritySummary({ integrity }: { integrity: PluginPackageIntegrityResult | null }) {
  if (!integrity) {
    return (
      <div className="rounded-md border bg-background px-3 py-2 text-xs text-muted-foreground">
        暂无 package_integrity 结果。Manifest 未通过静态校验时不会下载插件包。
      </div>
    );
  }

  return (
    <section className="rounded-md border bg-background p-3">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h4 className="text-xs font-semibold">安装包完整性</h4>
        <StatusBadge tone={packageIntegrityTone(integrity)}>{packageIntegrityLabel(integrity)}</StatusBadge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <ManifestSummary label="expected_sha256" value={integrity.expected_sha256 ?? '未声明'} />
        <ManifestSummary label="actual_sha256" value={integrity.actual_sha256 ?? '未计算'} />
        <ManifestSummary label="package_size_bytes" value={formatBytes(integrity.package_size_bytes)} />
        <ManifestSummary label="content_type" value={integrity.content_type ?? '未识别'} />
        <ManifestSummary label="source_url" value={integrity.source_url ?? '未声明'} />
        <ManifestSummary label="final_url" value={integrity.final_url ?? '未返回'} />
        <ManifestSummary label="signature_status" value={integrity.signature ? packageSignatureLabel(integrity.signature) : '未返回'} />
        <ManifestSummary label="signature_type" value={integrity.signature?.signature_type ?? '未声明'} />
      </div>
      {integrity.signature ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <ManifestSummary label="signature_subject" value={integrity.signature.subject ?? '未返回'} />
          <ManifestSummary label="signature_issuer" value={integrity.signature.issuer ?? '未返回'} />
          <ManifestSummary label="verification_url" value={integrity.signature.verification_url ?? '未配置'} />
          <ManifestSummary label="signature_error" value={integrity.signature.error_message ?? '无'} />
        </div>
      ) : null}
      {integrity.error_message ? (
        <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {integrity.error_code ? `${integrity.error_code}：` : null}
          {integrity.error_message}
        </div>
      ) : null}
    </section>
  );
}

function ManifestValidationIssueList({
  items,
  title,
  tone,
}: {
  items: PluginManifestValidationIssue[];
  title: string;
  tone: 'error' | 'warn';
}) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-md border bg-background p-3">
      <h4 className="text-xs font-semibold">{title}</h4>
      <div className="mt-2 grid gap-2">
        {items.map((item) => (
          <div
            className={cn(
              'rounded-md border px-3 py-2 text-xs leading-5',
              tone === 'error'
                ? 'border-destructive/30 bg-destructive/5 text-destructive'
                : 'border-amber-200 bg-amber-50 text-amber-800',
            )}
            key={`${item.code}-${item.path}-${item.message}`}
          >
            <span className="font-medium">{item.code}</span>
            <span className="text-muted-foreground"> · {item.path}</span>
            <div>{item.message}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function manifestValidationTone(result: PluginManifestValidationResult | null, pending: boolean, stale: boolean) {
  if (pending) return 'loading' as const;
  if (stale) return 'degraded' as const;
  if (!result) return 'planned' as const;
  return result.can_install ? 'healthy' as const : 'unavailable' as const;
}

function manifestValidationLabel(result: PluginManifestValidationResult | null, pending: boolean, stale: boolean) {
  if (pending) return '预检中';
  if (stale) return '已失效';
  if (!result) return '未预检';
  return result.can_install ? '预检通过' : '预检失败';
}

function packageIntegrityTone(integrity: PluginPackageIntegrityResult) {
  if (integrity.status === 'PASSED') return 'healthy' as const;
  if (integrity.status === 'FAILED') return 'unavailable' as const;
  return 'degraded' as const;
}

function packageIntegrityLabel(integrity: PluginPackageIntegrityResult) {
  if (integrity.status === 'PASSED') return 'sha256 已验证';
  if (integrity.status === 'FAILED') return 'sha256 未通过';
  return '已跳过';
}

function packageSignatureLabel(signature: NonNullable<PluginPackageIntegrityResult['signature']>) {
  if (signature.status === 'PASSED') return '签名已验证';
  if (signature.status === 'FAILED') return '签名未通过';
  return signature.signature_present ? '签名已记录' : '未提供签名';
}

function sandboxPolicyTone(policy: PluginManifestValidationResult['sandbox_policy']) {
  if (policy.status === 'DECLARED') return 'healthy' as const;
  if (policy.status === 'MISSING') return 'unavailable' as const;
  return 'ready' as const;
}

function sandboxPolicyLabel(policy: PluginManifestValidationResult['sandbox_policy']) {
  if (policy.status === 'DECLARED') return '已声明';
  if (policy.status === 'MISSING') return '缺少策略';
  return '不需要';
}

function formatBytes(value: number | null) {
  if (typeof value !== 'number') return '未返回';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function ManifestPreviewList({
  emptyText,
  items,
  title,
}: {
  emptyText: string;
  items: string[];
  title: string;
}) {
  return (
    <section className="rounded-lg border bg-muted/20 p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <span className="rounded-md border bg-background px-2.5 py-1 text-xs text-muted-foreground" key={item}>
              {item}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

interface PluginManifestPreviewModel {
  code: string;
  config: Record<string, unknown> | null;
  description: string | null;
  hooks: Array<{ name: string; type: string }>;
  menus: Array<{ code: string; name: string }>;
  name: string;
  permissions: string[];
  provider: string;
  risk_level: PluginRiskLevel;
  tools: Array<{ method: string; name: string }>;
  version: string;
}

function parsePluginManifestText(value: string):
  | { input: CreatePluginInstallationInput; ok: true; preview: PluginManifestPreviewModel }
  | { message: string; ok: false } {
  const parsed = parseJsonObjectText(value, 'Manifest JSON', { allowEmpty: false });
  if (!parsed.ok) return { ok: false, message: parsed.message };
  if (!parsed.value) return { ok: false, message: 'Manifest JSON 不能为空。' };

  const manifest = parsed.value;
  const code = getManifestString(manifest, 'code') ?? '';
  const name = getManifestString(manifest, 'name') ?? '';
  if (!isValidPluginCode(code)) return { ok: false, message: 'Manifest code 需为 3-120 位小写字母开头，可包含数字、下划线或连字符。' };
  if (!name.trim()) return { ok: false, message: 'Manifest name 不能为空。' };

  const permissions = getManifestStringArray(manifest, ['permissions', 'permission_codes', 'permission_preview']);
  const menus = getManifestObjectArray(manifest, ['menus', 'menu_bindings', 'menu_entries']).map((item) => ({
    code: getManifestString(item, 'code') ?? getManifestString(item, 'menu_code') ?? '未命名菜单',
    name: getManifestString(item, 'name') ?? getManifestString(item, 'menu_name') ?? getManifestString(item, 'code') ?? '未命名菜单',
  }));
  const hooks = getManifestObjectArray(manifest, ['hooks']).map((item) => ({
    name: getManifestString(item, 'name') ?? getManifestString(item, 'code') ?? '未命名 Hook',
    type: getManifestString(item, 'hook_type') ?? getManifestString(item, 'type') ?? 'EVENT',
  }));
  const tools = getManifestObjectArray(manifest, ['tools', 'actions', 'capabilities']).map((item) => ({
    method: getManifestString(item, 'method') ?? 'POST',
    name: getManifestString(item, 'name') ?? getManifestString(item, 'code') ?? '未命名工具',
  }));
  const riskLevel = normalizePluginRiskLevel(getManifestString(manifest, 'risk_level') ?? getManifestString(manifest, 'risk'));
  const config = getManifestRecord(manifest, 'config') ?? getManifestRecord(manifest, 'config_json');
  const preview = {
    code,
    config,
    description: getManifestString(manifest, 'description'),
    hooks,
    menus,
    name,
    permissions,
    provider: getManifestString(manifest, 'provider') ?? '自定义插件',
    risk_level: riskLevel,
    tools,
    version: getManifestString(manifest, 'version') ?? getManifestString(manifest, 'latest_version') ?? '1.0.0',
  };

  return {
    input: {
      code: preview.code,
      config_json: preview.config,
      description: preview.description,
      latest_version: preview.version,
      manifest_json: manifest,
      name: preview.name,
      permission_preview: preview.permissions,
      provider: preview.provider,
      risk_level: preview.risk_level,
      source_type: 'CUSTOM',
    },
    ok: true,
    preview,
  };
}

function extractManifestKeys(manifest: Record<string, unknown> | null) {
  if (!manifest) return [];
  return ['entry', 'entry_point', 'main', 'main_entry', 'capabilities', 'features', 'actions', 'hooks', 'menus', 'menu_bindings', 'menu_entries'];
}

function extractManifestValue(manifest: Record<string, unknown> | null, key: string) {
  if (!manifest) return null;
  const value = manifest[key];
  if (value === undefined || value === null) return null;
  if (Array.isArray(value)) return value.length > 0 ? value.map((item) => String(item)).join('，') : '空列表';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function manifestKeyLabel(key: string) {
  const labels: Record<string, string> = {
    actions: '能力',
    capabilities: '能力',
    entry: '入口',
    entry_point: '入口',
    features: '能力',
    hooks: 'Hook',
    main: '入口',
    main_entry: '入口',
    menu_bindings: '菜单',
    menu_entries: '菜单',
    menus: '菜单',
  };

  return labels[key] ?? key;
}

function getManifestString(manifest: Record<string, unknown>, key: string) {
  const value = manifest[key];

  return typeof value === 'string' ? value.trim() : null;
}

function getManifestRecord(manifest: Record<string, unknown>, key: string) {
  const value = manifest[key];

  return isPlainRecord(value) ? value : null;
}

function getManifestStringArray(manifest: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = manifest[key];
    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === 'string' ? item.trim() : null))
        .filter((item): item is string => Boolean(item));
    }
  }

  return [];
}

function getManifestObjectArray(manifest: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = manifest[key];
    if (Array.isArray(value)) {
      return value.filter(isPlainRecord);
    }
  }

  return [];
}

function normalizePluginRiskLevel(value: string | null): PluginRiskLevel {
  if (value === 'LOW' || value === 'MEDIUM' || value === 'HIGH' || value === 'CRITICAL') return value;

  return 'MEDIUM';
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidPluginCode(value: string) {
  return /^[a-z][a-z0-9_-]{2,119}$/.test(value.trim());
}

function stableStringify(value: unknown) {
  return JSON.stringify(sortJsonValue(value));
}

function sortJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJsonValue);
  if (!isPlainRecord(value)) return value;

  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, sortJsonValue(entry)]),
  );
}

const defaultCustomPluginManifestText = `{
  "code": "customer_ticket_plugin",
  "name": "工单助手插件",
  "provider": "内部插件",
  "version": "1.0.0",
  "description": "将 Agent 会话中的工单创建、状态查询和通知能力声明为受控插件。",
  "risk_level": "MEDIUM",
  "package": {
    "source_url": "https://example.internal/plugins/customer-ticket-plugin-1.0.0.tgz",
    "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "signature": "sigstore-bundle-placeholder"
  },
  "permissions": [
    "plugin:ticket:create",
    "plugin:ticket:view"
  ],
  "menus": [
    {
      "code": "plugin_ticket_center",
      "name": "工单插件中心",
      "path": "/plugins/ticket"
    }
  ],
  "hooks": [
    {
      "code": "ticket_created_event",
      "name": "工单创建事件",
      "type": "EVENT",
      "target": "ticket.created",
      "method": "ASYNC"
    }
  ],
  "tools": [
    {
      "code": "create_ticket",
      "name": "创建工单",
      "method": "POST",
      "url": "https://example.internal/api/tickets",
      "risk_level": "MEDIUM"
    }
  ],
  "config": {
    "enabled": true,
    "timeout_ms": 10000
  }
}`;
