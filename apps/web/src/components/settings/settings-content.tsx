'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  hasPermission,
  type AgentListItem,
  type DepartmentTreeItem,
  type SystemSettingCategory,
  type SystemSettingItem,
  type SystemSettingStatus,
  type SystemSettingValueType,
  type TenantApiKeyListItem,
  type TenantStatus,
  type UserListItem,
  type UserStatus,
} from '@aiaget/shared-types';
import { Copy, Edit, KeyRound, Plus, RefreshCw, Save, Search, SlidersHorizontal, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDateTime } from '@/components/agents/agent-status';
import {
  createTenantApiKey,
  createUser,
  deleteTenantApiKey,
  deleteUser,
  getDepartmentTree,
  getExternalAgentChatEndpoint,
  getSystemSettingsOverview,
  getTenant,
  listSystemSettings,
  listAgents,
  listRoles,
  listTenantApiKeys,
  listUsers,
  resetSystemSetting,
  updateSystemSetting,
  updateTenant,
  updateUser,
  type ApiClientError,
} from '@/lib/api-client';

const tenantStatusLabels: Record<TenantStatus, string> = {
  ACTIVE: '启用',
  DISABLED: '停用',
  DELETED: '已删除',
};

const userStatusLabels: Record<UserStatus, string> = {
  ACTIVE: '启用',
  DISABLED: '停用',
  DELETED: '已删除',
};

const settingCategoryLabels: Record<SystemSettingCategory, string> = {
  GENERAL: '基础',
  SECURITY: '安全',
  RUNTIME: '运行时',
  OBSERVABILITY: '观测',
  RETENTION: '数据保留',
  INTEGRATION: '外部集成',
};

const settingStatusLabels: Record<SystemSettingStatus, string> = {
  ACTIVE: '启用',
  DISABLED: '停用',
  DELETED: '已删除',
};

const settingValueTypeLabels: Record<SystemSettingValueType, string> = {
  STRING: '文本',
  NUMBER: '数字',
  BOOLEAN: '开关',
  JSON: 'JSON',
  SELECT: '选项',
};

const userFormSchema = z.object({
  email: z.email('请输入有效邮箱地址。'),
  name: z.string().min(2, '名称至少需要 2 个字符。'),
  password: z.string().optional(),
  status: z.enum(['ACTIVE', 'DISABLED']),
  department_id: z.string().optional(),
  roleCodes: z.array(z.string()).min(1, '至少选择一个角色。'),
});

const tenantFormSchema = z.object({
  name: z.string().min(2, '租户名称至少需要 2 个字符。'),
  status: z.enum(['ACTIVE', 'DISABLED']),
});

const apiKeyFormSchema = z.object({
  name: z.string().min(2, '密钥名称至少需要 2 个字符。'),
  scopes: z.array(z.string()).min(1, '至少选择一个调用范围。'),
  allowed_agent_ids: z.array(z.string()).optional(),
  ip_allowlist_text: z.string().optional(),
  rate_limit_per_minute: z
    .string()
    .refine((value) => {
      const numberValue = Number(value);
      return Number.isInteger(numberValue) && numberValue >= 1 && numberValue <= 10000;
    }, '分钟限流必须是 1 到 10000 之间的整数。'),
  daily_quota: z.string().optional(),
  allow_stream: z.boolean(),
  expires_at: z.string().optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;
type TenantFormValues = z.infer<typeof tenantFormSchema>;
type ApiKeyFormValues = z.infer<typeof apiKeyFormSchema>;

function statusTone(status: TenantStatus | UserStatus) {
  if (status === 'ACTIVE') return 'healthy';
  if (status === 'DISABLED') return 'degraded';
  return 'unavailable';
}

function tenantStatusLabel(status: TenantStatus) {
  return tenantStatusLabels[status] ?? status;
}

function userStatusLabel(status: UserStatus) {
  return userStatusLabels[status] ?? status;
}

export function SettingsContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenant.id ?? '';

  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isEditingTenant, setIsEditingTenant] = useState(false);
  const [deleteUserTarget, setDeleteUserTarget] = useState<UserListItem | null>(null);
  const [deleteKeyTarget, setDeleteKeyTarget] = useState<TenantApiKeyListItem | null>(null);
  const [userFormError, setUserFormError] = useState<string | null>(null);
  const [tenantFormError, setTenantFormError] = useState<string | null>(null);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [createdApiKey, setCreatedApiKey] = useState<string | null>(null);
  const [settingCategory, setSettingCategory] = useState<SystemSettingCategory | ''>('');
  const [settingStatus, setSettingStatus] = useState<string>('');
  const [settingDrafts, setSettingDrafts] = useState<Record<string, string>>({});
  const [settingStatuses, setSettingStatuses] = useState<Record<string, 'ACTIVE' | 'DISABLED'>>({});
  const [settingErrors, setSettingErrors] = useState<Record<string, string>>({});
  const [settingSuccessId, setSettingSuccessId] = useState<string | null>(null);
  const [resetSettingTarget, setResetSettingTarget] = useState<SystemSettingItem | null>(null);
  const canManageApiKeys = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'system:api_key:manage'),
  );
  const canManageSettings = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'system:settings:manage'),
  );

  const tenantQuery = useQuery({
    enabled: Boolean(tenantId),
    queryKey: ['tenant', tenantId],
    queryFn: () => getTenant(tenantId),
  });
  const usersQuery = useQuery({
    queryKey: ['users', keyword, status],
    queryFn: () =>
      listUsers({
        page: 1,
        page_size: 20,
        keyword,
        status,
      }),
  });
  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: () => listRoles({ page: 1, page_size: 200 }),
  });
  const departmentsQuery = useQuery({
    queryKey: ['department-tree'],
    queryFn: getDepartmentTree,
  });
  const apiKeysQuery = useQuery({
    queryKey: ['tenant-api-keys'],
    queryFn: listTenantApiKeys,
  });
  const agentsQuery = useQuery({
    queryKey: ['api-key-agents'],
    queryFn: () => listAgents({ page: 1, page_size: 100, status: 'PUBLISHED' }),
  });
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

  const tenant = tenantQuery.data ?? currentUser?.tenant ?? null;
  const users = usersQuery.data?.items ?? [];
  const roles = rolesQuery.data?.items ?? [];
  const departments = flattenDepartments(departmentsQuery.data ?? []);
  const apiKeys = apiKeysQuery.data ?? [];
  const agents = agentsQuery.data?.items ?? [];
  const settingsOverview = systemSettingsOverviewQuery.data;
  const systemSettings = systemSettingsQuery.data ?? [];

  const userForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: '',
      name: '',
      password: '',
      status: 'ACTIVE',
      department_id: '',
      roleCodes: ['tenant_viewer'],
    },
  });

  const tenantForm = useForm<TenantFormValues>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      name: tenant?.name ?? '',
      status: tenant?.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE',
    },
  });

  const apiKeyForm = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeyFormSchema),
    defaultValues: {
      name: '',
      scopes: ['external:agent:chat'],
      allowed_agent_ids: [],
      ip_allowlist_text: '',
      rate_limit_per_minute: '60',
      daily_quota: '',
      allow_stream: true,
      expires_at: '',
    },
  });

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: async (user) => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      setSelectedUser(user);
      closeUserForm();
    },
    onError: (error: ApiClientError) => setUserFormError(error.message),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: UserFormValues }) =>
      updateUser(id, {
        name: values.name,
        password: values.password || undefined,
        department_id: values.department_id || null,
        roleCodes: values.roleCodes,
        status: values.status,
      }),
    onSuccess: async (user) => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      setSelectedUser(user);
      closeUserForm();
    },
    onError: (error: ApiClientError) => setUserFormError(error.message),
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteUserTarget(null);
      setSelectedUser(null);
    },
    onError: (error: ApiClientError) => setUserFormError(error.message),
  });

  const updateTenantMutation = useMutation({
    mutationFn: (values: TenantFormValues) =>
      updateTenant(tenantId, {
        name: values.name,
        status: values.status,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
      setIsEditingTenant(false);
      setTenantFormError(null);
    },
    onError: (error: ApiClientError) => setTenantFormError(error.message),
  });

  const createApiKeyMutation = useMutation({
    mutationFn: (values: ApiKeyFormValues) =>
      createTenantApiKey({
        name: values.name,
        scopes: values.scopes,
        allowed_agent_ids: values.allowed_agent_ids ?? [],
        ip_allowlist: parseLines(values.ip_allowlist_text),
        rate_limit_per_minute: Number(values.rate_limit_per_minute),
        daily_quota: nullableNumber(values.daily_quota),
        allow_stream: values.allow_stream,
        expires_at: nullableText(values.expires_at),
      }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['tenant-api-keys'] });
      setCreatedApiKey(result.api_key);
      setApiKeyError(null);
      apiKeyForm.reset({
        name: '',
        scopes: ['external:agent:chat'],
        allowed_agent_ids: [],
        ip_allowlist_text: '',
        rate_limit_per_minute: '60',
        daily_quota: '',
        allow_stream: true,
        expires_at: '',
      });
    },
    onError: (error: ApiClientError) => setApiKeyError(error.message),
  });

  const deleteApiKeyMutation = useMutation({
    mutationFn: deleteTenantApiKey,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tenant-api-keys'] });
      setDeleteKeyTarget(null);
    },
    onError: (error: ApiClientError) => setApiKeyError(error.message),
  });

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

  function openCreateUserForm() {
    setUserFormError(null);
    setEditingUser(null);
    setIsCreatingUser(true);
    userForm.reset({
      email: '',
      name: '',
      password: '',
      status: 'ACTIVE',
      department_id: '',
      roleCodes: roles[0] ? [roles[0].code] : ['tenant_viewer'],
    });
  }

  function openEditUserForm(user: UserListItem) {
    setUserFormError(null);
    setIsCreatingUser(false);
    setEditingUser(user);
    userForm.reset({
      email: user.email,
      name: user.name,
      password: '',
      status: user.status === 'DELETED' ? 'DISABLED' : user.status,
      department_id: user.department_id ?? '',
      roleCodes: user.roles.map((role) => role.code),
    });
  }

  function closeUserForm() {
    setUserFormError(null);
    setIsCreatingUser(false);
    setEditingUser(null);
  }

  function openTenantForm() {
    if (!tenant) return;
    setTenantFormError(null);
    setIsEditingTenant(true);
    tenantForm.reset({
      name: tenant.name,
      status: tenant.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE',
    });
  }

  function submitUserForm(values: UserFormValues) {
    setUserFormError(null);

    if (isCreatingUser && !values.password) {
      setUserFormError('创建用户时必须填写密码。');
      return;
    }

    if (isCreatingUser) {
      createUserMutation.mutate({
        email: values.email,
        name: values.name,
        password: values.password ?? '',
        department_id: values.department_id || null,
        roleCodes: values.roleCodes,
        status: values.status,
      });
      return;
    }

    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, values });
    }
  }

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
          <div className="mb-2 flex items-center gap-2">
            <StatusBadge tone="ready">M45</StatusBadge>
            <StatusBadge tone="healthy">系统参数</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">设置中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            集中维护租户级系统参数、租户资料、用户、角色和机器接口密钥，保持运行配置与安全边界清晰。
          </p>
        </div>
        <Button disabled={roles.length === 0} onClick={openCreateUserForm}>
          <Plus className="size-4" />
          新建用户
        </Button>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
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
            系统参数变更受 `system:settings:manage` 控制。敏感值默认脱敏展示，恢复默认会写入当前用户作为更新人。
          </p>
          <div className="mt-4 grid gap-3 text-sm">
            <DetailRow label="权限状态" value={canManageSettings ? '当前用户可管理系统参数' : '当前用户仅可查看系统参数'} />
            <DetailRow label="最近更新" value={settingsOverview?.last_updated_at ? formatDateTime(settingsOverview.last_updated_at) : '暂无'} />
            <DetailRow label="分类数量" value={`${settingsOverview?.category_count ?? 0} 类`} />
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="grid gap-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">租户资料</h2>
              <p className="mt-1 text-sm text-muted-foreground">当前控制台绑定的租户基础信息。</p>
            </div>
            <Button disabled={!tenant} onClick={openTenantForm} size="sm" variant="outline">
              <Edit className="size-4" />
              编辑
            </Button>
          </div>
          <div className="grid gap-3 text-sm">
            <DetailRow label="租户名称" value={tenant?.name ?? '正在加载租户...'} />
            <DetailRow label="租户编码" value={tenant?.code ?? '-'} />
            <DetailRow label="租户状态" value={tenant ? tenantStatusLabel(tenant.status) : '-'} />
            <DetailRow label="当前用户" value={currentUser?.user.email ?? '-'} />
          </div>
        </Card>

        <Card className="grid gap-5 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">接口密钥</h2>
              <p className="mt-1 text-sm text-muted-foreground">为外部服务端、自动化任务和集成系统发放受限 Agent 调用密钥。</p>
            </div>
            <KeyRound className="size-4 text-muted-foreground" />
          </div>
          <div className="grid gap-3 rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
            <div className="font-medium text-foreground">外部调用地址</div>
            <div className="flex min-w-0 items-center gap-2 rounded-md border bg-background px-3 py-2 font-mono">
              <span className="min-w-0 flex-1 break-all">{getExternalAgentChatEndpoint()}</span>
              <Button onClick={() => void navigator.clipboard?.writeText(getExternalAgentChatEndpoint())} size="sm" type="button" variant="outline">
                <Copy className="size-4" />
              </Button>
            </div>
            <div>请求头支持 Authorization: Bearer ak_xxx 或 x-api-key: ak_xxx。</div>
          </div>
          <form className="grid gap-4" onSubmit={apiKeyForm.handleSubmit((values) => createApiKeyMutation.mutate(values))}>
            <div className="grid gap-3 md:grid-cols-[1fr_180px]">
              <Field label="密钥名称" message={apiKeyForm.formState.errors.name?.message}>
                <input
                  className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  disabled={!canManageApiKeys}
                  placeholder="例如：CRM 服务端调用"
                  {...apiKeyForm.register('name')}
                />
              </Field>
              <Field label="过期时间">
                <input
                  className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  disabled={!canManageApiKeys}
                  type="datetime-local"
                  {...apiKeyForm.register('expires_at')}
                />
              </Field>
            </div>
            <Field label="允许调用的 Agent">
              <select
                className="min-h-28 rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={!canManageApiKeys || agentsQuery.isLoading}
                multiple
                {...apiKeyForm.register('allowed_agent_ids')}
              >
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} / {agent.code}
                  </option>
                ))}
              </select>
              <span className="text-xs font-normal text-muted-foreground">不选择表示允许调用当前用户有权限使用的全部 Agent。</span>
            </Field>
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="分钟限流" message={apiKeyForm.formState.errors.rate_limit_per_minute?.message}>
                <input
                  className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  disabled={!canManageApiKeys}
                  min={1}
                  type="number"
                  {...apiKeyForm.register('rate_limit_per_minute')}
                />
              </Field>
              <Field label="每日额度">
                <input
                  className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  disabled={!canManageApiKeys}
                  min={1}
                  placeholder="留空不限"
                  type="number"
                  {...apiKeyForm.register('daily_quota')}
                />
              </Field>
              <Field label="调用范围" message={apiKeyForm.formState.errors.scopes?.message}>
                <label className="flex h-10 items-center gap-2 rounded-md border bg-background px-3 text-sm font-normal">
                  <input disabled={!canManageApiKeys} type="checkbox" value="external:agent:chat" {...apiKeyForm.register('scopes')} />
                  非流式 Agent 调用
                </label>
              </Field>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_180px]">
              <Field label="IP 白名单">
                <textarea
                  className="min-h-20 rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  disabled={!canManageApiKeys}
                  placeholder="每行一个 IP，留空表示不限"
                  {...apiKeyForm.register('ip_allowlist_text')}
                />
              </Field>
              <Field label="流式权限">
                <label className="flex h-10 items-center gap-2 rounded-md border bg-background px-3 text-sm font-normal">
                  <input disabled={!canManageApiKeys} type="checkbox" {...apiKeyForm.register('allow_stream')} />
                  允许流式扩展
                </label>
              </Field>
            </div>
            <div className="flex justify-end">
              <Button disabled={!canManageApiKeys || createApiKeyMutation.isPending} type="submit">
                创建密钥
              </Button>
            </div>
          </form>
          {apiKeyError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {apiKeyError}
            </div>
          ) : null}
          {createdApiKey ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
              <div className="font-medium">请立即保存新密钥</div>
              <div className="mt-2 break-all font-mono text-xs">{createdApiKey}</div>
            </div>
          ) : null}
          <div className="grid gap-3">
            {apiKeysQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">正在加载接口密钥...</p>
            ) : apiKeys.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无接口密钥。</p>
            ) : (
              apiKeys.map((apiKey) => (
                <div className="grid gap-3 rounded-md border bg-muted/20 px-3 py-3 lg:grid-cols-[1fr_auto]" key={apiKey.id}>
                  <div className="min-w-0 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span>{apiKey.name}</span>
                      <StatusBadge tone={statusTone(apiKey.status)}>{tenantStatusLabel(apiKey.status)}</StatusBadge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {apiKey.masked_key} · 最近使用 {apiKey.last_used_at ? formatDateTime(apiKey.last_used_at) : '从未'} · 过期 {apiKey.expires_at ? formatDateTime(apiKey.expires_at) : '不限'}
                    </div>
                    <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                      <span>范围：{apiKey.scopes.join('、') || '未配置'}</span>
                      <span>Agent：{formatAllowedAgents(apiKey.allowed_agent_ids, agents)}</span>
                      <span>限流：{apiKey.rate_limit_per_minute}/分钟</span>
                      <span>日额度：{apiKey.daily_quota ? `${apiKey.used_count_today}/${apiKey.daily_quota}` : '不限'}</span>
                      <span>IP：{apiKey.ip_allowlist.length > 0 ? apiKey.ip_allowlist.join('、') : '不限'}</span>
                      <span>流式：{apiKey.allow_stream ? '允许' : '关闭'}</span>
                    </div>
                  </div>
                  <Button disabled={!canManageApiKeys} onClick={() => setDeleteKeyTarget(apiKey)} size="sm" variant="outline">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="grid gap-4 p-5">
          <h2 className="text-sm font-semibold">角色目录</h2>
          {rolesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">正在加载角色...</p>
          ) : roles.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无角色数据。</p>
          ) : (
            <div className="grid gap-3">
              {roles.map((role) => (
                <div className="rounded-md border bg-muted/20 px-3 py-2" key={role.id}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium">{role.name}</div>
                    <div className="text-xs text-muted-foreground">{role.permission_count} 个权限</div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{role.code}</div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{role.description ?? '暂无描述。'}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="grid gap-4 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold">用户管理</h2>
              <p className="mt-1 text-sm text-muted-foreground">搜索、筛选、创建、编辑、软删除并查看租户用户。</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
                <Search className="size-4 text-muted-foreground" />
                <input
                  className="w-52 bg-transparent outline-none"
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="搜索名称或邮箱"
                  value={keyword}
                />
              </label>
              <select className="h-9 rounded-md border bg-background px-3 text-sm" onChange={(event) => setStatus(event.target.value)} value={status}>
                <option value="">全部状态</option>
                <option value="ACTIVE">启用</option>
                <option value="DISABLED">停用</option>
                <option value="DELETED">已删除</option>
              </select>
            </div>
          </div>
          {usersQuery.isError ? (
            <div className="p-6 text-sm text-destructive">用户加载失败。</div>
          ) : usersQuery.isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">正在加载用户...</div>
          ) : users.length === 0 ? (
            <EmptyState description="新建租户用户，或调整搜索和状态筛选。" title="暂无用户" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {['名称', '邮箱', '部门', '状态', '角色', '最近登录', '更新时间', '操作'].map((column) => (
                      <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const isCurrentUser = currentUser?.user.id === user.id;

                    return (
                      <tr className="border-b last:border-0" key={user.id}>
                        <td className="px-4 py-3 font-medium">{user.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                        <td className="px-4 py-3 text-muted-foreground">{user.department?.name ?? '未归属'}</td>
                        <td className="px-4 py-3"><StatusBadge tone={statusTone(user.status)}>{userStatusLabel(user.status)}</StatusBadge></td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {user.roles.map((role) => <span className="rounded-md border px-2 py-0.5 text-xs" key={role.id}>{role.name}</span>)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{user.last_login_at ?? '从未登录'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{user.updated_at}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button onClick={() => setSelectedUser(user)} size="sm" variant="outline">详情</Button>
                            <Button onClick={() => openEditUserForm(user)} size="sm" variant="outline"><Edit className="size-4" /></Button>
                            <Button disabled={isCurrentUser || user.status === 'DELETED'} onClick={() => setDeleteUserTarget(user)} size="sm" variant="outline"><Trash2 className="size-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card className="p-5">
          <h2 className="text-sm font-semibold">安全摘要</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            角色、用户、机器密钥与审计模块协同工作。当前页面负责资料与访问面配置，详细异常追踪请转到审计中心。
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">用户详情</h2>
            {selectedUser ? (
              <Button onClick={() => setSelectedUser(null)} size="icon" variant="ghost">
                <X className="size-4" />
              </Button>
            ) : null}
          </div>
          {selectedUser ? (
            <div className="mt-4 grid gap-3 text-sm">
              <DetailRow label="名称" value={selectedUser.name} />
              <DetailRow label="邮箱" value={selectedUser.email} />
              <DetailRow label="状态" value={userStatusLabel(selectedUser.status)} />
              <DetailRow label="部门" value={selectedUser.department?.name ?? '未归属'} />
              <DetailRow label="角色" value={selectedUser.roles.map((role) => role.name).join(', ')} />
              <DetailRow label="最近登录" value={selectedUser.last_login_at ?? '从未登录'} />
              <DetailRow label="创建时间" value={selectedUser.created_at} />
              <DetailRow label="更新时间" value={selectedUser.updated_at} />
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">选择用户后查看详情与角色分配情况。</p>
          )}
        </Card>
      </section>

      {isCreatingUser || editingUser ? (
        <section className="fixed inset-y-0 right-0 z-30 w-full max-w-md border-l bg-background p-6 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">{isCreatingUser ? '新建用户' : '编辑用户'}</h2>
              <p className="mt-1 text-sm text-muted-foreground">密码只发送一次，并由控制接口服务哈希存储。</p>
            </div>
            <Button onClick={closeUserForm} size="icon" variant="ghost">
              <X className="size-4" />
            </Button>
          </div>

          <form className="mt-6 grid gap-4" onSubmit={userForm.handleSubmit(submitUserForm)}>
            <Field label="邮箱" message={userForm.formState.errors.email?.message}>
              <input className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" disabled={!isCreatingUser} type="email" {...userForm.register('email')} />
            </Field>
            <Field label="名称" message={userForm.formState.errors.name?.message}>
              <input className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" {...userForm.register('name')} />
            </Field>
            <Field label="密码">
              <input className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder={isCreatingUser ? '必填' : '留空则保留当前密码'} type="password" {...userForm.register('password')} />
            </Field>
            <Field label="状态" message={userForm.formState.errors.status?.message}>
              <select className="h-10 rounded-md border bg-background px-3 text-sm" {...userForm.register('status')}>
                <option value="ACTIVE">启用</option>
                <option value="DISABLED">停用</option>
              </select>
            </Field>
            <Field label="所属部门" message={userForm.formState.errors.department_id?.message}>
              <select className="h-10 rounded-md border bg-background px-3 text-sm" {...userForm.register('department_id')}>
                <option value="">未归属</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {'　'.repeat(Math.max(0, department.level - 1))}
                    {department.name}
                  </option>
                ))}
              </select>
            </Field>
            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium">角色</legend>
              {roles.map((role) => (
                <label className="flex items-center gap-2 text-sm" key={role.id}>
                  <input type="checkbox" value={role.code} {...userForm.register('roleCodes')} />
                  {role.name}
                </label>
              ))}
              {userForm.formState.errors.roleCodes ? <span className="text-xs text-destructive">{userForm.formState.errors.roleCodes.message}</span> : null}
            </fieldset>
            {userFormError ? <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{userFormError}</div> : null}
            <Button disabled={createUserMutation.isPending || updateUserMutation.isPending} type="submit">
              {isCreatingUser ? '新建用户' : '保存修改'}
            </Button>
          </form>
        </section>
      ) : null}

      {isEditingTenant ? (
        <section className="fixed inset-y-0 right-0 z-30 w-full max-w-md border-l bg-background p-6 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">编辑租户资料</h2>
              <p className="mt-1 text-sm text-muted-foreground">租户名称和状态会影响当前控制台上下文。</p>
            </div>
            <Button onClick={() => setIsEditingTenant(false)} size="icon" variant="ghost">
              <X className="size-4" />
            </Button>
          </div>
          <form className="mt-6 grid gap-4" onSubmit={tenantForm.handleSubmit((values) => updateTenantMutation.mutate(values))}>
            <Field label="租户名称" message={tenantForm.formState.errors.name?.message}>
              <input className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" {...tenantForm.register('name')} />
            </Field>
            <Field label="租户状态" message={tenantForm.formState.errors.status?.message}>
              <select className="h-10 rounded-md border bg-background px-3 text-sm" {...tenantForm.register('status')}>
                <option value="ACTIVE">启用</option>
                <option value="DISABLED">停用</option>
              </select>
            </Field>
            {tenantFormError ? <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{tenantFormError}</div> : null}
            <Button disabled={updateTenantMutation.isPending} type="submit">保存修改</Button>
          </form>
        </section>
      ) : null}

      {deleteUserTarget ? (
        <ConfirmDialog
          body={`这会软删除 ${deleteUserTarget.email}，并保留审计历史。`}
          pending={deleteUserMutation.isPending}
          title="删除用户？"
          onCancel={() => setDeleteUserTarget(null)}
          onConfirm={() => deleteUserMutation.mutate(deleteUserTarget.id)}
        />
      ) : null}

      {deleteKeyTarget ? (
        <ConfirmDialog
          body={`这会删除接口密钥 ${deleteKeyTarget.name}，删除后无法恢复。`}
          pending={deleteApiKeyMutation.isPending}
          title="删除接口密钥？"
          onCancel={() => setDeleteKeyTarget(null)}
          onConfirm={() => deleteApiKeyMutation.mutate(deleteKeyTarget.id)}
        />
      ) : null}

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

function nullableText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function nullableNumber(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const numberValue = Number(trimmed);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
}

function parseLines(value?: string) {
  return Array.from(new Set((value ?? '').split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean)));
}

function formatAllowedAgents(agentIds: string[], agents: AgentListItem[]) {
  if (agentIds.length === 0) return '全部有权 Agent';
  const agentNameById = new Map(agents.map((agent) => [agent.id, agent.name]));
  return agentIds.map((id) => agentNameById.get(id) ?? id).join('、');
}

function defaultSettingCategorySummaries() {
  return (Object.entries(settingCategoryLabels) as Array<[SystemSettingCategory, string]>).map(([category, label]) => ({
    category,
    label,
    total: 0,
    active: 0,
    changed: 0,
  }));
}

function formatSettingDraftValue(setting: SystemSettingItem) {
  if (setting.is_secret && setting.value === '') return '';
  if (setting.value_type === 'JSON') return JSON.stringify(setting.value ?? {}, null, 2);
  if (setting.value_type === 'BOOLEAN') return setting.value === true ? 'true' : 'false';
  if (setting.value_type === 'SELECT') {
    if (typeof setting.value === 'string' || typeof setting.value === 'number' || typeof setting.value === 'boolean') {
      return serializeSelectOptionValue(setting.value);
    }

    return '';
  }
  if (setting.value === null || setting.value === undefined) return '';
  return String(setting.value);
}

function parseSettingDraftValue(setting: SystemSettingItem, value: string): { ok: true; value: unknown } | { ok: false; message: string } {
  if (setting.value_type === 'STRING' || setting.value_type === 'SELECT') {
    if (setting.value_type === 'SELECT') {
      const option = setting.options.find((item) => serializeSelectOptionValue(item.value) === value);
      return option ? { ok: true, value: option.value } : { ok: false, message: '请选择有效选项。' };
    }

    return { ok: true, value };
  }

  if (setting.value_type === 'NUMBER') {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) {
      return { ok: false, message: '请输入有效数字。' };
    }

    return { ok: true, value: numberValue };
  }

  if (setting.value_type === 'BOOLEAN') {
    return { ok: true, value: value === 'true' };
  }

  try {
    return { ok: true, value: JSON.parse(value) as unknown };
  } catch {
    return { ok: false, message: '请输入有效 JSON。' };
  }
}

function isSameSettingValue(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function settingStatusTone(status: SystemSettingStatus) {
  if (status === 'ACTIVE') return 'healthy';
  if (status === 'DISABLED') return 'degraded';
  return 'unavailable';
}

function CategoryButton({
  active,
  count,
  label,
  onClick,
}: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex h-9 items-center justify-between rounded-md border px-3 text-left text-sm transition-colors ${
        active ? 'border-primary bg-primary/5 text-primary' : 'bg-background hover:bg-muted/50'
      }`}
      onClick={onClick}
      type="button"
    >
      <span>{label}</span>
      <span className="text-xs text-muted-foreground">{count}</span>
    </button>
  );
}

function SystemSettingCard({
  canManage,
  draftValue,
  error,
  isPending,
  setting,
  statusValue,
  success,
  onDraftChange,
  onReset,
  onSave,
  onStatusChange,
}: {
  canManage: boolean;
  draftValue: string;
  error?: string;
  isPending: boolean;
  setting: SystemSettingItem;
  statusValue: 'ACTIVE' | 'DISABLED';
  success: boolean;
  onDraftChange: (value: string) => void;
  onReset: () => void;
  onSave: () => void;
  onStatusChange: (value: 'ACTIVE' | 'DISABLED') => void;
}) {
  const changed = draftValue !== formatSettingDraftValue(setting) || statusValue !== (setting.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE');
  const disabled = !canManage || isPending;

  return (
    <div className="grid gap-4 rounded-md border bg-background/90 p-4 shadow-sm transition-colors hover:bg-muted/10 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold">{setting.name}</h3>
          <StatusBadge tone={settingStatusTone(setting.status)}>{settingStatusLabels[setting.status]}</StatusBadge>
          <StatusBadge tone="planned">{settingCategoryLabels[setting.category]}</StatusBadge>
          {setting.is_secret ? <StatusBadge tone="degraded">敏感</StatusBadge> : null}
          {changed ? <StatusBadge tone="loading">未保存</StatusBadge> : null}
        </div>
        <div className="mt-2 font-mono text-xs text-muted-foreground">{setting.key}</div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{setting.description ?? '暂无说明。'}</p>
        <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
          <span>类型：{settingValueTypeLabels[setting.value_type]}</span>
          <span>默认：{formatSettingDisplayValue(setting.default_value, setting.value_type, setting.is_secret)}</span>
          <span>更新：{formatDateTime(setting.updated_at)}</span>
        </div>
      </div>

      <div className="grid gap-3">
        {renderSettingInput(setting, draftValue, disabled, onDraftChange)}
        <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            disabled={disabled}
            onChange={(event) => onStatusChange(event.target.value as 'ACTIVE' | 'DISABLED')}
            value={statusValue}
          >
            <option value="ACTIVE">启用</option>
            <option value="DISABLED">停用</option>
          </select>
          <Button disabled={disabled || !changed} onClick={onSave} size="sm" type="button">
            <Save className="size-4" />
            保存
          </Button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <Button disabled={disabled || isSameSettingValue(setting.value, setting.default_value)} onClick={onReset} size="sm" type="button" variant="outline">
            <RefreshCw className="size-4" />
            恢复默认
          </Button>
          <span className="text-xs text-muted-foreground">{setting.updated_by?.name ?? '系统'}</span>
        </div>
        {error ? <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</div> : null}
        {success ? <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">参数已保存。</div> : null}
        {!canManage ? <div className="text-xs text-muted-foreground">当前账号没有系统参数管理权限。</div> : null}
      </div>
    </div>
  );
}

function renderSettingInput(
  setting: SystemSettingItem,
  value: string,
  disabled: boolean,
  onChange: (value: string) => void,
) {
  const baseClass = 'rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring';

  if (setting.value_type === 'BOOLEAN') {
    return (
      <label className="flex h-10 items-center gap-2 rounded-md border bg-background px-3 text-sm">
        <input checked={value === 'true'} disabled={disabled} onChange={(event) => onChange(event.target.checked ? 'true' : 'false')} type="checkbox" />
        {value === 'true' ? '已开启' : '已关闭'}
      </label>
    );
  }

  if (setting.value_type === 'SELECT') {
    return (
      <select className={`h-10 ${baseClass}`} disabled={disabled} onChange={(event) => onChange(event.target.value)} value={value}>
        {setting.options.length === 0 ? <option value="">未配置选项</option> : null}
        {setting.options.map((option) => {
          const optionValue = serializeSelectOptionValue(option.value);

          return (
            <option key={optionValue} value={optionValue}>
              {option.label}
            </option>
          );
        })}
      </select>
    );
  }

  if (setting.value_type === 'JSON') {
    return (
      <textarea
        className={`min-h-24 py-2 font-mono ${baseClass}`}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    );
  }

  return (
    <input
      className={`h-10 ${baseClass}`}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      placeholder={setting.is_secret ? '敏感值为空时表示未配置' : undefined}
      type={setting.is_secret ? 'password' : setting.value_type === 'NUMBER' ? 'number' : 'text'}
      value={value}
    />
  );
}

function formatSettingDisplayValue(value: unknown, valueType: SystemSettingValueType, secret: boolean) {
  if (secret && value) return '已脱敏';
  if (valueType === 'JSON') return JSON.stringify(value);
  if (value === true) return '开启';
  if (value === false) return '关闭';
  if (value === null || value === undefined || value === '') return '空';
  return String(value);
}

function serializeSelectOptionValue(value: string | number | boolean) {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

function flattenDepartments(items: DepartmentTreeItem[]) {
  const output: DepartmentTreeItem[] = [];

  function visit(nodes: DepartmentTreeItem[]) {
    for (const node of nodes) {
      output.push(node);
      visit(node.children);
    }
  }

  visit(items);

  return output;
}

function Field({ children, label, message }: { children: React.ReactNode; label: string; message?: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      {children}
      {message ? <span className="text-xs text-destructive">{message}</span> : null}
    </label>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-md border bg-muted/30 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="break-words font-medium">{value}</div>
    </div>
  );
}

function ConfirmDialog({
  body,
  confirmLabel = '删除',
  pending,
  title,
  onCancel,
  onConfirm,
}: {
  body: string;
  confirmLabel?: string;
  pending: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <section className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-sm rounded-lg border bg-background p-6 shadow-xl">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={onCancel} variant="outline">取消</Button>
          <Button disabled={pending} onClick={onConfirm} variant="destructive">{confirmLabel}</Button>
        </div>
      </div>
    </section>
  );
}
