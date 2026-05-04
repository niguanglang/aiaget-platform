'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  hasPermission,
  type DepartmentTreeItem,
  type RoleListItem,
  type UserListItem,
  type UserStatus,
} from '@aiaget/shared-types';
import { motion } from 'motion/react';
import { Edit, Plus, RefreshCw, Search, Trash2, UserRound, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useAuth } from '@/components/auth/auth-provider';
import { formatDateTime } from '@/components/agents/agent-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  createUser,
  deleteUser,
  getDepartmentTree,
  listRoles,
  listUsers,
  updateUser,
  type ApiClientError,
} from '@/lib/api-client';

const userFormSchema = z.object({
  email: z.email('请输入有效邮箱地址。'),
  name: z.string().min(2, '名称至少需要 2 个字符。'),
  password: z.string().optional(),
  status: z.enum(['ACTIVE', 'DISABLED']),
  department_id: z.string().optional(),
  roleCodes: z.array(z.string()).min(1, '至少选择一个角色。'),
});

type UserFormValues = z.infer<typeof userFormSchema>;

const userStatusLabels: Record<UserStatus, string> = {
  ACTIVE: '启用',
  DISABLED: '停用',
  DELETED: '已删除',
};

export function UsersContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserListItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canManageUsers = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'system:user:manage'),
  );

  const usersQuery = useQuery({
    queryKey: ['users-center', keyword, status, departmentId],
    queryFn: () =>
      listUsers({
        page: 1,
        page_size: 50,
        keyword,
        status,
        department_id: departmentId,
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

  const users = usersQuery.data?.items ?? [];
  const roles = rolesQuery.data?.items ?? [];
  const departments = flattenDepartments(departmentsQuery.data ?? []);

  const form = useForm<UserFormValues>({
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

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: async (user) => {
      setNotice(`已创建用户 ${user.email}。`);
      setFormError(null);
      setSelectedUser(user);
      closeUserForm();
      await queryClient.invalidateQueries({ queryKey: ['users-center'] });
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setFormError(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: UserFormValues }) =>
      updateUser(id, {
        name: values.name,
        password: values.password || undefined,
        department_id: values.department_id || null,
        roleCodes: values.roleCodes,
        status: values.status,
      }),
    onSuccess: async (user) => {
      setNotice(`已更新用户 ${user.email}。`);
      setFormError(null);
      setSelectedUser(user);
      closeUserForm();
      await queryClient.invalidateQueries({ queryKey: ['users-center'] });
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setFormError(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: async () => {
      setNotice(deleteTarget ? `已删除用户 ${deleteTarget.email}。` : '用户已删除。');
      setFormError(null);
      setDeleteTarget(null);
      setSelectedUser(null);
      await queryClient.invalidateQueries({ queryKey: ['users-center'] });
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setFormError(error.message);
    },
  });

  const metrics = useMemo(() => {
    const activeUsers = users.filter((user) => user.status === 'ACTIVE');
    const disabledUsers = users.filter((user) => user.status === 'DISABLED');
    const assignedDepartments = users.filter((user) => user.department_id);
    const roleBindings = users.reduce((sum, user) => sum + user.roles.length, 0);

    return [
      { label: '用户总数', value: `${usersQuery.data?.total ?? users.length}`, helper: '当前租户账号' },
      { label: '启用用户', value: `${activeUsers.length}`, helper: '可登录控制台' },
      { label: '停用用户', value: `${disabledUsers.length}`, helper: '已限制登录' },
      { label: '部门归属', value: `${assignedDepartments.length}`, helper: '具备 ABAC 属性' },
      { label: '角色绑定', value: `${roleBindings}`, helper: 'RBAC 授权关系' },
      { label: '可用角色', value: `${roles.length}`, helper: '角色权限中心' },
    ];
  }, [roles.length, users, usersQuery.data?.total]);

  function openCreateUserForm() {
    setFormError(null);
    setEditingUser(null);
    setIsCreatingUser(true);
    form.reset({
      email: '',
      name: '',
      password: '',
      status: 'ACTIVE',
      department_id: '',
      roleCodes: defaultRoleCodes(roles),
    });
  }

  function openEditUserForm(user: UserListItem) {
    setFormError(null);
    setIsCreatingUser(false);
    setEditingUser(user);
    form.reset({
      email: user.email,
      name: user.name,
      password: '',
      status: user.status === 'DELETED' ? 'DISABLED' : user.status,
      department_id: user.department_id ?? '',
      roleCodes: user.roles.map((role) => role.code),
    });
  }

  function closeUserForm() {
    setIsCreatingUser(false);
    setEditingUser(null);
    setFormError(null);
  }

  function submitUserForm(values: UserFormValues) {
    if (!canManageUsers) return;

    if (isCreatingUser) {
      if (!values.password?.trim()) {
        setFormError('新建用户必须设置初始密码。');
        return;
      }

      createMutation.mutate({
        email: values.email,
        name: values.name,
        password: values.password,
        department_id: values.department_id || null,
        roleCodes: values.roleCodes,
        status: values.status,
      });
      return;
    }

    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, values });
    }
  }

  function refreshAll() {
    void Promise.all([
      usersQuery.refetch(),
      rolesQuery.refetch(),
      departmentsQuery.refetch(),
    ]);
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
      >
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M51</StatusBadge>
            <StatusBadge tone="healthy">用户主体</StatusBadge>
            <StatusBadge tone={canManageUsers ? 'mock' : 'planned'}>{canManageUsers ? '可管理' : '仅查看'}</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">用户管理中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            管理租户用户账号、登录状态、部门归属和角色绑定，为 RBAC、ABAC 与资源授权提供稳定的用户主体数据。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={!canManageUsers} onClick={openCreateUserForm} type="button">
            <Plus className="size-4" />
            新建用户
          </Button>
          <Button onClick={refreshAll} type="button" variant="outline">
            <RefreshCw className="size-4" />
            刷新
          </Button>
        </div>
      </motion.section>

      <section className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(circle_at_18%_20%,rgba(37,99,235,0.10),transparent_32%),radial-gradient(circle_at_82%_12%,rgba(20,184,166,0.08),transparent_30%)]" />

      {notice ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>
      ) : null}
      {formError || usersQuery.isError || rolesQuery.isError || departmentsQuery.isError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {formError ?? '用户管理数据加载失败，请检查接口权限。'}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {usersQuery.isLoading
          ? Array.from({ length: 6 }).map((_, index) => <div className="h-28 rounded-lg border bg-muted/30" key={index} />)
          : metrics.map((metric) => <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />)}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <Card className="grid gap-4 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold">用户清单</h2>
              <p className="mt-1 text-sm text-muted-foreground">搜索、筛选、创建、编辑、软删除并查看租户用户。</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm">
                <Search className="size-4 text-muted-foreground" />
                <input
                  className="w-48 bg-transparent outline-none"
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
              <select className="h-9 rounded-md border bg-background px-3 text-sm" onChange={(event) => setDepartmentId(event.target.value)} value={departmentId}>
                <option value="">全部部门</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {'　'.repeat(Math.max(0, department.level - 1))}
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {usersQuery.isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">正在加载用户...</div>
          ) : users.length === 0 ? (
            <EmptyState description="新建租户用户，或调整搜索、状态和部门筛选。" title="暂无用户" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[940px] border-collapse text-left text-sm">
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
                        <td className="px-4 py-3"><StatusBadge tone={userStatusTone(user.status)}>{userStatusLabel(user.status)}</StatusBadge></td>
                        <td className="px-4 py-3">
                          <div className="flex max-w-[260px] flex-wrap gap-1">
                            {user.roles.map((role) => <span className="rounded-md border px-2 py-0.5 text-xs" key={role.id}>{role.name}</span>)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{user.last_login_at ? formatDateTime(user.last_login_at) : '从未登录'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDateTime(user.updated_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button onClick={() => setSelectedUser(user)} size="sm" type="button" variant="outline">详情</Button>
                            <Button disabled={!canManageUsers || user.status === 'DELETED'} onClick={() => openEditUserForm(user)} size="sm" type="button" variant="outline">
                              <Edit className="size-4" />
                            </Button>
                            <Button disabled={!canManageUsers || isCurrentUser || user.status === 'DELETED'} onClick={() => setDeleteTarget(user)} size="sm" type="button" variant="outline">
                              <Trash2 className="size-4" />
                            </Button>
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

        <UserDetailCard selectedUser={selectedUser} onClear={() => setSelectedUser(null)} />
      </section>

      {isCreatingUser || editingUser ? (
        <UserFormDrawer
          canManage={canManageUsers}
          departments={departments}
          editingUser={editingUser}
          form={form}
          isCreating={isCreatingUser}
          pending={createMutation.isPending || updateMutation.isPending}
          roles={roles}
          onClose={closeUserForm}
          onSubmit={submitUserForm}
        />
      ) : null}

      {deleteTarget ? (
        <ConfirmDialog
          body={`这会软删除 ${deleteTarget.email}，用户无法继续登录，但审计历史会保留。`}
          pending={deleteMutation.isPending}
          title="删除用户？"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        />
      ) : null}
    </main>
  );
}

function UserDetailCard({ selectedUser, onClear }: { selectedUser: UserListItem | null; onClear: () => void }) {
  return (
    <Card className="h-fit p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <UserRound className="size-4 text-primary" />
          用户详情
        </div>
        {selectedUser ? (
          <Button onClick={onClear} size="icon" type="button" variant="ghost">
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
          <DetailRow label="角色" value={selectedUser.roles.map((role) => role.name).join('、') || '未绑定'} />
          <DetailRow label="最近登录" value={selectedUser.last_login_at ? formatDateTime(selectedUser.last_login_at) : '从未登录'} />
          <DetailRow label="创建时间" value={formatDateTime(selectedUser.created_at)} />
          <DetailRow label="更新时间" value={formatDateTime(selectedUser.updated_at)} />
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          选择用户后查看部门、角色、登录时间和更新时间。用户的部门归属会成为 ABAC 和资源授权的主体属性。
        </p>
      )}
    </Card>
  );
}

function UserFormDrawer({
  canManage,
  departments,
  editingUser,
  form,
  isCreating,
  pending,
  roles,
  onClose,
  onSubmit,
}: {
  canManage: boolean;
  departments: DepartmentTreeItem[];
  editingUser: UserListItem | null;
  form: ReturnType<typeof useForm<UserFormValues>>;
  isCreating: boolean;
  pending: boolean;
  roles: RoleListItem[];
  onClose: () => void;
  onSubmit: (values: UserFormValues) => void;
}) {
  return (
    <section className="fixed inset-y-0 right-0 z-30 w-full max-w-md overflow-y-auto border-l bg-background p-6 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{isCreating ? '新建用户' : '编辑用户'}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isCreating ? '密码只发送一次，并由控制接口服务哈希存储。' : `正在编辑 ${editingUser?.email ?? ''}`}
          </p>
        </div>
        <Button onClick={onClose} size="icon" type="button" variant="ghost">
          <X className="size-4" />
        </Button>
      </div>

      <form className="mt-6 grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="邮箱" message={form.formState.errors.email?.message}>
          <Input disabled={!isCreating || !canManage} type="email" {...form.register('email')} />
        </Field>
        <Field label="名称" message={form.formState.errors.name?.message}>
          <Input disabled={!canManage} {...form.register('name')} />
        </Field>
        <Field label="密码">
          <Input disabled={!canManage} placeholder={isCreating ? '必填' : '留空则保留当前密码'} type="password" {...form.register('password')} />
        </Field>
        <Field label="状态" message={form.formState.errors.status?.message}>
          <select className="h-10 rounded-md border bg-background px-3 text-sm disabled:bg-muted" disabled={!canManage} {...form.register('status')}>
            <option value="ACTIVE">启用</option>
            <option value="DISABLED">停用</option>
          </select>
        </Field>
        <Field label="所属部门" message={form.formState.errors.department_id?.message}>
          <select className="h-10 rounded-md border bg-background px-3 text-sm disabled:bg-muted" disabled={!canManage} {...form.register('department_id')}>
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
              <input disabled={!canManage} type="checkbox" value={role.code} {...form.register('roleCodes')} />
              {role.name}
              <span className="text-xs text-muted-foreground">{role.permission_count} 个权限</span>
            </label>
          ))}
          {form.formState.errors.roleCodes ? <span className="text-xs text-destructive">{form.formState.errors.roleCodes.message}</span> : null}
        </fieldset>
        <Button disabled={!canManage || pending} type="submit">
          {isCreating ? '新建用户' : '保存修改'}
        </Button>
      </form>
    </section>
  );
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
  pending,
  title,
  onCancel,
  onConfirm,
}: {
  body: string;
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
          <Button onClick={onCancel} type="button" variant="outline">取消</Button>
          <Button disabled={pending} onClick={onConfirm} type="button" variant="destructive">删除</Button>
        </div>
      </div>
    </section>
  );
}

function defaultRoleCodes(roles: RoleListItem[]) {
  const viewer = roles.find((role) => role.code === 'tenant_viewer');
  if (viewer) return [viewer.code];
  return roles[0] ? [roles[0].code] : ['tenant_viewer'];
}

function flattenDepartments(items: DepartmentTreeItem[]) {
  const output: DepartmentTreeItem[] = [];
  const visit = (nodes: DepartmentTreeItem[]) => {
    for (const node of nodes) {
      output.push(node);
      visit(node.children);
    }
  };

  visit(items);
  return output;
}

function userStatusLabel(status: UserStatus) {
  return userStatusLabels[status] ?? status;
}

function userStatusTone(status: UserStatus) {
  if (status === 'ACTIVE') return 'healthy';
  if (status === 'DISABLED') return 'degraded';
  return 'unavailable';
}
