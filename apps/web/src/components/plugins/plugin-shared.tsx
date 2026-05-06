'use client';

import { hasPermission, type CreatePluginInstallationInput, type PluginMarketItem, type PluginRiskLevel } from '@aiaget/shared-types';
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
  onCancel,
  onConfirm,
  pending,
  title,
}: {
  body: string;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
  title: string;
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
          <Button disabled={pending} onClick={onConfirm} type="button" variant="destructive">
            确认
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
}: {
  canInstall: boolean;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (input: CreatePluginInstallationInput) => void;
}) {
  const [manifestText, setManifestText] = useState(defaultCustomPluginManifestText);
  const parsed = parsePluginManifestText(manifestText);
  const blockedReasons = [];
  if (!canInstall) blockedReasons.push('当前账号没有 plugin:center:install 权限。');
  if (parsed.ok && (parsed.preview.risk_level === 'HIGH' || parsed.preview.risk_level === 'CRITICAL')) {
    blockedReasons.push('当前 Manifest 风险等级较高，建议先完成安全中心审核。');
  }
  const canSubmit = canInstall && parsed.ok && blockedReasons.length === 0;

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
              <Button onClick={() => setManifestText(defaultCustomPluginManifestText)} type="button" variant="outline">
                使用示例
              </Button>
            </div>
            <textarea
              className="min-h-[520px] resize-y rounded-md border bg-slate-950 px-3 py-3 font-mono text-xs leading-6 text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => setManifestText(event.target.value)}
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
            disabled={!canSubmit || isPending}
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

export function buildManifestDiffRows(before: Record<string, unknown> | null, after: Record<string, unknown> | null) {
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

const defaultCustomPluginManifestText = `{
  "code": "customer_ticket_plugin",
  "name": "工单助手插件",
  "provider": "内部插件",
  "version": "1.0.0",
  "description": "将 Agent 会话中的工单创建、状态查询和通知能力声明为受控插件。",
  "risk_level": "MEDIUM",
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
