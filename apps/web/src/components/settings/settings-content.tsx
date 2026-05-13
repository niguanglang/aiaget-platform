'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission, type SystemSettingCategory, type SystemSettingItem } from '@aiaget/shared-types';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  BellRing,
  Database,
  KeyRound,
  Network,
  Rocket,
  ServerCog,
  ShieldCheck,
  SlidersHorizontal,
  UsersRound,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { formatDateTime } from '@/components/agents/agent-status';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  CategoryButton,
  ConfirmDialog,
  DetailRow,
  SystemSettingCard,
  defaultSettingCategorySummaries,
  formatSettingDraftValue,
  isSameSettingValue,
  normalizeSettingCategory,
  parseSettingDraftValue,
} from '@/components/settings/settings-shared';
import {
  getSystemSettingsOverview,
  listSystemSettings,
  resetSystemSetting,
  updateSystemSetting,
  type ApiClientError,
} from '@/lib/api-client';

const configurationEntries: ConfigurationEntry[] = [
  {
    title: '租户资料',
    description: '租户资料、启停状态与数据隔离边界。',
    href: '/tenants',
    permission: 'system:tenant:view',
    permissionLabel: 'system:tenant:view',
    icon: Network,
  },
  {
    title: '通知策略',
    description: '配置告警通知自动首发、自动重试和策略变更审计。',
    href: '/settings/notification-policy',
    permission: 'system:settings:view',
    permissionLabel: 'system:settings:view',
    icon: BellRing,
  },
  {
    title: '生产落地中心',
    description: '汇总生产环境、外部服务、第三方联调、发布验收和风险项。',
    href: '/settings/production-readiness',
    permission: 'system:settings:view',
    permissionLabel: 'system:settings:view',
    icon: Rocket,
  },
  {
    title: '用户管理',
    description: '管理租户账号、部门归属、角色绑定和用户启停状态。',
    href: '/users',
    permission: 'system:user:view',
    permissionLabel: 'system:user:view',
    icon: UsersRound,
  },
  {
    title: '角色权限',
    description: '角色、权限编码、菜单授权和用户引用关系。',
    href: '/roles',
    permission: 'system:role:view',
    permissionLabel: 'system:role:view',
    icon: ShieldCheck,
  },
  {
    title: 'API Key',
    description: '管理外部系统调用 Agent 的机器密钥、限流和白名单。',
    href: '/api-keys',
    permission: 'system:api_key:view',
    permissionLabel: 'system:api_key:view',
    icon: KeyRound,
  },
  {
    title: '安全策略',
    description: '进入安全策略、资源授权、高危审批和运行时安全治理。',
    href: '/security/policies',
    permission: 'security:rule:view',
    permissionLabel: 'security:rule:view',
    icon: ShieldCheck,
  },
  {
    title: '文件存储',
    description: '配置 MinIO 存储、桶初始化和租户文件对象管理。',
    href: '/storage',
    permission: 'storage:object:view',
    permissionLabel: 'storage:object:view',
    icon: Database,
  },
];

export function SettingsContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();
  const initialSettingCategory = normalizeSettingCategory(searchParams.get('category'));

  const [settingCategory, setSettingCategory] = useState<SystemSettingCategory | ''>(initialSettingCategory);
  const [settingStatus, setSettingStatus] = useState<string>('');
  const [settingDrafts, setSettingDrafts] = useState<Record<string, string>>({});
  const [settingStatuses, setSettingStatuses] = useState<Record<string, 'ACTIVE' | 'DISABLED'>>({});
  const [settingErrors, setSettingErrors] = useState<Record<string, string>>({});
  const [settingSuccessId, setSettingSuccessId] = useState<string | null>(null);
  const [resetSettingTarget, setResetSettingTarget] = useState<SystemSettingItem | null>(null);

  const permissions = currentUser?.user.permissions ?? [];
  const isTenantAdmin = Boolean(currentUser?.user.roles.some((role) => role.code === 'tenant_admin'));
  const canManageSettings = Boolean(isTenantAdmin || hasPermission(permissions, 'system:settings:manage'));

  const systemSettingsOverviewQuery = useQuery({
    queryKey: ['system-settings-overview'],
    queryFn: getSystemSettingsOverview,
  });
  const systemSettingsQuery = useQuery({
    queryKey: ['system-settings', settingCategory, settingStatus],
    queryFn: () =>
      listSystemSettings({
        category: settingCategory,
        status: settingStatus,
      }),
  });

  const settingsOverview = systemSettingsOverviewQuery.data;
  const systemSettings = systemSettingsQuery.data ?? [];

  const updateSettingMutation = useMutation({
    mutationFn: ({ setting, value, status }: { setting: SystemSettingItem; value: unknown; status: 'ACTIVE' | 'DISABLED' }) =>
      updateSystemSetting(setting.id, {
        value,
        status,
      }),
    onSuccess: async (setting) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['system-settings'] }),
        queryClient.invalidateQueries({ queryKey: ['system-settings-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['security-center-overview'] }),
      ]);
      setSettingErrors((current) => ({ ...current, [setting.id]: '' }));
      setSettingSuccessId(setting.id);
    },
    onError: (error: ApiClientError, variables) => {
      setSettingSuccessId(null);
      setSettingErrors((current) => ({ ...current, [variables.setting.id]: error.message }));
    },
  });

  const resetSettingMutation = useMutation({
    mutationFn: resetSystemSetting,
    onSuccess: async (setting) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['system-settings'] }),
        queryClient.invalidateQueries({ queryKey: ['system-settings-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['security-center-overview'] }),
      ]);
      setSettingDrafts((current) => ({ ...current, [setting.id]: formatSettingDraftValue(setting) }));
      setSettingStatuses((current) => ({ ...current, [setting.id]: setting.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE' }));
      setSettingErrors((current) => ({ ...current, [setting.id]: '' }));
      setSettingSuccessId(setting.id);
      setResetSettingTarget(null);
    },
    onError: (error: ApiClientError) => {
      if (!resetSettingTarget) return;
      setSettingErrors((current) => ({ ...current, [resetSettingTarget.id]: error.message }));
    },
  });

  const metrics = useMemo(
    () => [
      { label: '系统参数', value: `${settingsOverview?.total ?? systemSettings.length}`, helper: '租户级配置' },
      { label: '启用参数', value: `${settingsOverview?.active ?? systemSettings.filter((setting) => setting.status === 'ACTIVE').length}`, helper: '当前有效' },
      { label: '敏感参数', value: `${settingsOverview?.secret ?? systemSettings.filter((setting) => setting.is_secret).length}`, helper: '脱敏展示' },
      { label: '偏离默认', value: `${settingsOverview?.changed_from_default ?? systemSettings.filter((setting) => !isSameSettingValue(setting.value, setting.default_value)).length}`, helper: '需要关注' },
    ],
    [settingsOverview, systemSettings],
  );

  function submitSetting(setting: SystemSettingItem) {
    const parsed = parseSettingDraftValue(setting, settingDrafts[setting.id] ?? formatSettingDraftValue(setting));
    if (!parsed.ok) {
      setSettingSuccessId(null);
      setSettingErrors((current) => ({ ...current, [setting.id]: parsed.message }));
      return;
    }

    setSettingErrors((current) => ({ ...current, [setting.id]: '' }));
    updateSettingMutation.mutate({
      setting,
      value: parsed.value,
      status: settingStatuses[setting.id] ?? (setting.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE'),
    });
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">P0-5</StatusBadge>
            <StatusBadge tone={canManageSettings ? 'healthy' : 'planned'}>{canManageSettings ? '可编辑' : '只读'}</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">系统设置</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            系统参数、租户配置、账号权限、API Key、安全策略与文件存储。
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/settings/notification-policy">
            <ServerCog className="size-4" />
            通知策略配置
          </Link>
        </Button>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {configurationEntries.map((entry) => (
          <ConfigurationEntryCard
            allowed={isTenantAdmin || hasPermission(permissions, entry.permission)}
            entry={entry}
            key={entry.href}
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[260px_1fr_320px]">
        <Card className="h-fit p-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">参数分类</h2>
          </div>
          <div className="mt-4 grid gap-2">
            <CategoryButton
              active={settingCategory === ''}
              count={settingsOverview?.total ?? systemSettings.length}
              label="全部参数"
              onClick={() => setSettingCategory('')}
            />
            {(settingsOverview?.categories ?? defaultSettingCategorySummaries()).map((category) => (
              <CategoryButton
                active={settingCategory === category.category}
                count={category.total}
                key={category.category}
                label={category.label}
                onClick={() => setSettingCategory(category.category)}
              />
            ))}
          </div>
          <label className="mt-4 grid gap-2 text-sm font-medium">
            状态筛选
            <select
              className="h-9 rounded-md border bg-background px-3 text-sm"
              onChange={(event) => setSettingStatus(event.target.value)}
              value={settingStatus}
            >
              <option value="">全部状态</option>
              <option value="ACTIVE">启用</option>
              <option value="DISABLED">停用</option>
              <option value="DELETED">已删除</option>
            </select>
          </label>
        </Card>

        <Card className="grid gap-4 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold">系统参数</h2>
              <p className="mt-1 text-sm text-muted-foreground">按租户隔离的运行配置，保存后由后端记录操作审计。</p>
            </div>
            <StatusBadge tone={canManageSettings ? 'healthy' : 'planned'}>
              {canManageSettings ? '可编辑' : '只读'}
            </StatusBadge>
          </div>
          {systemSettingsQuery.isError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              系统参数加载失败。
            </div>
          ) : systemSettingsQuery.isLoading ? (
            <div className="grid gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="h-36 rounded-md border bg-muted/30" key={index} />
              ))}
            </div>
          ) : systemSettings.length === 0 ? (
            <EmptyState description="当前筛选条件下没有系统参数，调整分类或状态后重试。" title="暂无系统参数" />
          ) : (
            <div className="grid gap-3">
              {systemSettings.map((setting) => (
                <SystemSettingCard
                  canManage={canManageSettings}
                  draftValue={settingDrafts[setting.id] ?? formatSettingDraftValue(setting)}
                  error={settingErrors[setting.id]}
                  isPending={updateSettingMutation.isPending && updateSettingMutation.variables?.setting.id === setting.id}
                  key={setting.id}
                  setting={setting}
                  statusValue={settingStatuses[setting.id] ?? (setting.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE')}
                  success={settingSuccessId === setting.id}
                  onDraftChange={(value) => setSettingDrafts((current) => ({ ...current, [setting.id]: value }))}
                  onReset={() => setResetSettingTarget(setting)}
                  onSave={() => submitSetting(setting)}
                  onStatusChange={(value) => setSettingStatuses((current) => ({ ...current, [setting.id]: value }))}
                />
              ))}
            </div>
          )}
        </Card>

        <Card className="h-fit p-5">
          <h2 className="text-sm font-semibold">配置治理</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            系统参数变更受 system:settings:manage 控制。敏感值默认脱敏展示，恢复默认会写入当前用户作为更新人。
          </p>
          <div className="mt-4 grid gap-3 text-sm">
            <DetailRow label="权限状态" value={canManageSettings ? '当前用户可管理系统参数' : '当前用户仅可查看系统参数'} />
            <DetailRow label="最近更新" value={settingsOverview?.last_updated_at ? formatDateTime(settingsOverview.last_updated_at) : '暂无'} />
            <DetailRow label="分类数量" value={`${settingsOverview?.category_count ?? 0} 类`} />
            <DetailRow label="通知策略" value="可配置告警首发、重试和审计" />
          </div>
          <Button asChild className="mt-4 w-full" variant="outline">
            <Link href="/settings/notification-policy">
              打开通知策略
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </Card>
      </section>

      {resetSettingTarget ? (
        <ConfirmDialog
          body={`这会把 ${resetSettingTarget.name} 恢复为默认值，并重新启用该参数。`}
          confirmLabel="恢复默认"
          pending={resetSettingMutation.isPending}
          title="恢复默认参数？"
          onCancel={() => setResetSettingTarget(null)}
          onConfirm={() => resetSettingMutation.mutate(resetSettingTarget.id)}
        />
      ) : null}
    </main>
  );
}

interface ConfigurationEntry {
  title: string;
  description: string;
  href: string;
  permission: string;
  permissionLabel: string;
  icon: LucideIcon;
}

function ConfigurationEntryCard({ allowed, entry }: { allowed: boolean; entry: ConfigurationEntry }) {
  const Icon = entry.icon;

  return (
    <Card className="flex min-h-44 flex-col justify-between gap-4 p-5">
      <div className="grid gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex size-10 items-center justify-center rounded-md border bg-muted/30">
            <Icon className="size-5 text-muted-foreground" />
          </div>
          <StatusBadge tone={allowed ? 'healthy' : 'degraded'}>{allowed ? '可访问' : '无权限'}</StatusBadge>
        </div>
        <div>
          <h2 className="text-base font-semibold">{entry.title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{entry.description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs text-muted-foreground">{entry.permissionLabel}</span>
        {allowed ? (
          <Button asChild size="sm" variant="outline">
            <Link href={entry.href}>
              打开
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
